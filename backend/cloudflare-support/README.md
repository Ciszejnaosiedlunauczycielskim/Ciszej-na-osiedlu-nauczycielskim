# Idempotentny backend licznika poparcia

Ten katalog zawiera gotowy backend Cloudflare Worker + D1, który zastępuje publiczny CounterAPI V1.

Backend nie jest jeszcze podłączony do strony produkcyjnej. Nie wolno zmieniać `assets/js/app.js` na adres Workera, dopóki Worker, D1, CORS i migracja wartości nie zostaną sprawdzone.

## Dlaczego ta zmiana jest potrzebna

Obecny CounterAPI V1:

- jest publiczny i nie wymaga uwierzytelnienia,
- pozwala każdemu znającemu adres zwiększać licznik,
- ma wspólny niski limit żądań,
- buforuje odczyt licznika,
- nie obsługuje kluczy idempotencji.

Nowy backend zapewnia:

- `GET /support/count`,
- `POST /support`,
- idempotencję przez `requestId`,
- jeden głos na losowy identyfikator instalacji przeglądarki,
- trwały zapis w D1,
- CORS tylko dla wskazanych domen,
- ograniczenie częstotliwości,
- brak automatycznego podwajania głosu po timeoutach.

## Pliki

- `src/index.js` — Worker,
- `migrations/0001_init.sql` — struktura D1 i wartość początkowa,
- `wrangler.toml.example` — konfiguracja wdrożenia,
- `client-example.js` — przykład bezpiecznej integracji frontendu,
- `package.json` — polecenia Wrangler.

## Wdrożenie

### 1. Przygotuj Cloudflare

W katalogu `backend/cloudflare-support` wykonaj:

```bash
npm install
npx wrangler login
cp wrangler.toml.example wrangler.toml
npx wrangler d1 create ciszej-support
```

Wstaw zwrócony `database_id` do `wrangler.toml`.

Dla `namespace_id` limitera użyj niepowtarzalnej dodatniej liczby w obrębie konta Cloudflare.

### 2. Odczytaj wartość starego licznika

Bezpośrednio przed migracją wykonaj wyłącznie odczyt:

```bash
curl -fsSL \
  'https://api.counterapi.dev/v1/ciszejnaosiedlunauczycielskim-2026-7c9f1e/wsparcie/'
```

Nie wywołuj `/up`.

Zapisz otrzymaną wartość jako `LEGACY_VALUE_A`.

### 3. Ustaw wartość początkową

W `migrations/0001_init.sql` zastąp oba wystąpienia:

```text
__MIGRATED_COUNTER_VALUE__
```

wartością `LEGACY_VALUE_A`.

Przykład dla wartości 123:

```sql
VALUES (
  1,
  123,
  123,
  CURRENT_TIMESTAMP
);
```

### 4. Utwórz bazę i wdróż Worker

```bash
npx wrangler d1 migrations apply ciszej-support --remote
npx wrangler deploy
```

Zapisz adres Workera.

### 5. Test przed przełączeniem produkcji

Odczyt licznika:

```bash
curl -fsSL 'https://ADRES-WORKERA/support/count'
```

Wartość musi być identyczna z `LEGACY_VALUE_A`.

Test zapisu wykonuj wyłącznie na osobnej testowej bazie D1 albo osobnym Workerze testowym. Nie wykonuj próbnego `POST /support` na liczniku produkcyjnym.

### 6. Podłącz frontend

Na podstawie `client-example.js` zmień frontend tak, aby:

- odczytywał `GET /support/count`,
- wysyłał `POST /support`,
- przed wysłaniem zapisywał trwały `requestId`,
- po timeoutie ponawiał dokładnie ten sam `requestId`,
- zachował dotychczasowy klucz potwierdzenia `ciszej-wsparcie-zapisane-v1`, aby osoby już policzone przez stary licznik nie mogły zagłosować ponownie na tym samym urządzeniu,
- po zmianie zwiększył wersję `app.js` w `index.html`.

Po wdrożeniu pobierz produkcyjny `index.html` i `app.js`, a następnie porównaj ich sumy SHA-256 z repozytorium.

### 7. Rozlicz głosy wysłane przez stare, zapisane w cache wersje strony

Po przełączeniu część urządzeń może przez pewien czas używać starego skryptu i wysłać głos do CounterAPI. Odczytaj ponownie stary licznik jako `LEGACY_VALUE_B`.

Następnie wykonaj:

```bash
npx wrangler d1 execute ciszej-support --remote --command \
  "UPDATE support_state
   SET base_count = base_count + (LEGACY_VALUE_B - legacy_counter_last),
       legacy_counter_last = LEGACY_VALUE_B
   WHERE id = 1;"
```

W poleceniu zastąp `LEGACY_VALUE_B` rzeczywistą liczbą.

To polecenie można bezpiecznie powtórzyć z późniejszym odczytem. Dodaje wyłącznie różnicę względem ostatniej rozliczonej wartości starego licznika.

Zalecane odczyty starego licznika:

- bezpośrednio po publikacji nowego frontendu,
- po 1 godzinie,
- po 24 godzinach,
- po 7 dniach.

Po każdym rozliczeniu `GET /support/count` musi zwrócić:

```text
początkowa wartość starego licznika
+ późne głosy ze starego skryptu
+ głosy zapisane w D1
```

## Kontrakt API

### GET `/support/count`

Odpowiedź:

```json
{
  "value": 123
}
```

### POST `/support`

Nagłówki:

```text
Content-Type: application/json
X-Support-Device: UUID instalacji przeglądarki
```

Treść:

```json
{
  "requestId": "UUID",
  "createdAt": "2026-07-26T20:00:00.000Z"
}
```

Backend używa czasu serwera. `createdAt` klienta nie służy do rozliczania głosu.

Pierwszy zapis zwraca HTTP 201:

```json
{
  "accepted": true,
  "duplicate": false,
  "requestId": "UUID",
  "createdAt": "ISO-8601",
  "value": 124
}
```

Powtórzenie tego samego `requestId` lub ponowny głos z tego samego `deviceId` zwraca HTTP 200 bez zwiększenia licznika:

```json
{
  "accepted": false,
  "duplicate": true,
  "requestId": "UUID",
  "createdAt": "ISO-8601",
  "value": 124
}
```

## Ograniczenia

Bez logowania lub weryfikacji tożsamości nie istnieje techniczna gwarancja „jedna osoba na całe życie”. Użytkownik może wyczyścić pamięć przeglądarki albo użyć innego urządzenia. Rozwiązanie chroni jednak przed:

- przypadkowym podwójnym kliknięciem,
- ponowieniem po timeoutie,
- wieloma kartami tej samej przeglądarki,
- tym samym `requestId` wysłanym wielokrotnie,
- prostym nabijaniem publicznego endpointu `/up`.

Nie należy przechowywać adresów IP ani innych zbędnych danych osobowych w D1.
