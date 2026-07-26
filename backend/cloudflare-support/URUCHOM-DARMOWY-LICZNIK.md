# Uruchomienie darmowego licznika Cloudflare

Kod, migracja danych i automatyczne testy są już przygotowane. Do uruchomienia potrzebne są dwa sekrety Cloudflare zapisane bezpośrednio w GitHubie.

## 1. Konto Cloudflare

Utwórz lub otwórz bezpłatne konto Cloudflare. Nie trzeba przenosić domeny ani zmieniać DNS — backend może działać pod bezpłatnym adresem `workers.dev`.

## 2. Token API

W Cloudflare utwórz token API z szablonu **Edit Cloudflare Workers** i ogranicz go do wybranego konta. Token musi pozwalać na wdrożenie Workers oraz utworzenie i obsługę D1.

Skopiuj również **Account ID** konta Cloudflare.

## 3. Sekrety GitHub Actions

W repozytorium przejdź do:

`Settings → Secrets and variables → Actions → New repository secret`

Dodaj:

- `CLOUDFLARE_API_TOKEN` — utworzony token,
- `CLOUDFLARE_ACCOUNT_ID` — identyfikator konta.

Nie zapisuj tokenu w plikach repozytorium i nie przesyłaj go w wiadomości.

## 4. Uruchomienie

Przejdź do:

`Actions → Wdróż darmowy licznik Cloudflare → Run workflow`

Workflow automatycznie:

1. utworzy bezpłatną bazę D1 w regionie Europy Wschodniej, jeżeli jeszcze nie istnieje,
2. odczyta bieżącą wartość starego licznika bez używania `/up`,
3. przeniesie wartość początkową do D1 bez zerowania istniejących danych,
4. wdroży Cloudflare Worker,
5. sprawdzi CORS i zgodność wartości,
6. podłączy nowy backend do strony,
7. zmieni wersję `app.js`, aby ominąć stare cache,
8. opublikuje zmiany na `main`,
9. poczeka na GitHub Pages,
10. porówna produkcyjny JavaScript z repozytorium i sprawdzi odczyt licznika.

Workflow nie wykonuje testowego głosu na produkcji.

## Wynik

Po powodzeniu powstanie plik:

`backend/cloudflare-support/deployment-status.json`

Zawiera on adres Workera, wartość przed migracją, wartość po migracji i potwierdzenie testu produkcyjnego — bez tokenów ani innych sekretów.
