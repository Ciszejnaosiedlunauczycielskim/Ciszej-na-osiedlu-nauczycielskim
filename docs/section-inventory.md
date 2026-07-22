# Inwentarz sekcji strony

Ten plik służy do kontroli zmian w strukturze strony. Żadna istniejąca sekcja nie może zostać usunięta, ukryta ani zastąpiona bez wyraźnego wskazania tego w zadaniu i podsumowaniu pull requesta.

## Zasada pracy

Przed każdą większą zmianą należy:

1. wypisać aktualne sekcje strony głównej,
2. wskazać sekcje dodawane, przenoszone, zmieniane i usuwane,
3. nie usuwać elementów niewymienionych w zadaniu,
4. po wykonaniu zmian zaktualizować ten plik.

## Stan po realizacji issue #13

### Strona główna (`index.html`)

| Kolejność | Sekcja / element | Status w issue #13 |
|---:|---|---|
| 1 | Nawigacja główna | Zmieniona — dodano odsyłacz do „Co już wiemy?”, a odsyłacz do uzasadnienia prowadzi do sekcji ponownej oceny; zachowano pozostałe pozycje i działanie menu mobilnego. |
| 2 | Hero | Zmieniony — głównym przekazem jest potrzeba pełnego obrazu skumulowanego hałasu z dwóch dróg oddziałującego na jedno osiedle; przyciski prowadzą do schematu i dokumentów. |
| 3 | Osiedle z lotu ptaka | Zachowana — główna sekcja z zatwierdzonym zdjęciem dronowym. |
| 4 | Lokalizacja | Zmieniona — występuje bezpośrednio po zdjęciu, zachowuje zatwierdzoną grafikę, tytuł „Schemat orientacyjny położenia osiedla” i pełne zastrzeżenie dotyczące ograniczeń schematu. |
| 5 | „Co już wiemy?” | Dodana — cztery karty przedstawiają zakresy ruchu na DK94 i ul. Lwowskiej z 2022 r., parametry punktów drogowych oraz historyczny wynik z ul. Sudeckiej; pod kartami zaznaczono, że dane są punktem wyjścia. |
| 6 | „Dlaczego sytuację trzeba ocenić ponownie?” | Zmieniona — opisuje położenie między drogami, rozbudowę Lwowskiej, prognozy ruchu Parku Lwowska i rozwój zabudowy; fakty są wyraźnie oddzielone od warunkowych scenariuszy jednostki wojskowej i zmian układu drogowego. Zastrzeżenie wskazuje, że petycja nie sprzeciwia się Parkowi ani nie kwestionuje decyzji środowiskowej. |
| 7 | Najważniejsze informacje | Zachowana bez zmian funkcjonalnych i przeniesiona za blok wyjaśniający potrzebę ponownej oceny. |
| 8 | „Co chcemy sprawdzić?” | Zachowana bez zmian funkcjonalnych. |
| 9 | „Dlaczego obecne dane nie wystarczają?” | Zachowana bez zmian; nadal prowadzi do historii sprawy. |
| 10 | Wyróżniony główny przekaz | Dodany przed dokumentami — podsumowuje, że przedmiotem sprawy jest łączny hałas, a nie jedna droga lub inwestycja. |
| 11 | Publiczny zestaw dokumentów (PDF) | Zachowana bez zmian funkcjonalnych. |
| 12 | Symboliczne poparcie i licznik | Zachowane bez zmian funkcjonalnych. |
| 13 | FAQ | Zachowane bez zmian funkcjonalnych. |
| 14 | Kontakt | Zachowany bez zmian funkcjonalnych. |
| 15 | Stopka | Zachowana bez zmian funkcjonalnych. |

### Podstrona (`historia-sprawy.html`)

| Sekcja / element | Status w issue #9 |
|---|---|
| Nagłówek podstrony i powrót na stronę główną | Dodane. |
| Chronologia „Najważniejsze działania” | Przeniesiona w całości ze strony głównej; zachowano wszystkie cztery wydarzenia i ich opisy. |
| Stopka z odsyłaczem do kontaktu | Dodana. |

### Elementy usunięte lub przeniesione

Nie usunięto ani nie przeniesiono żadnej funkcji lub sekcji w ramach issue #13. Chronologia pozostaje wyłącznie na osobnej podstronie i nie została przywrócona na stronie głównej. Zachowano zdjęcie, PDF, licznik poparcia, FAQ, kontakt, menu mobilne i podstronę historii.

## Stan po realizacji issue #15

### Strona główna (`index.html`)

| Kolejność | Sekcja / element | Status w issue #15 |
|---:|---|---|
| 1 | Nawigacja główna | Zmieniona — dodano odsyłacz „Dlaczego hałas?”, zachowano wszystkie wcześniejsze pozycje i menu mobilne. |
| 2 | Hero | Zmieniony — zastosowano krótszy, przyjazny mieszkańcom lead wskazujący na potrzebę aktualnych pomiarów przy domach. |
| 3 | Osiedle z lotu ptaka | Zachowana bez zmiany zdjęcia dronowego. |
| 4 | Lokalizacja | Zachowana bez zmiany grafiki poglądowej i jej zastrzeżenia. |
| 5 | „Co już wiemy?” | Zmieniona — pokazuje PDH jako oznaczenia czterech punktów, a ruch w pojazdach na dobę; wartości nie są uśredniane ani sumowane. |
| 6 | „Dlaczego hałas ma znaczenie?” | Dodana — trzy krótkie karty opisują sen, dobrostan oraz dom i otoczenie; pod nimi podano zalecenia WHO, źródło i zastrzeżenie, że nie są to polskie normy prawne. |
| 7 | „Dlaczego sytuację trzeba ocenić ponownie?” | Zmieniona — zachowuje rozdzielenie faktów i scenariuszy; dodano źródła dotyczące jednostki wojskowej i Wschodniej Obwodnicy Tarnowa. Zapowiedź możliwego finansowania do 90% opisano wyłącznie przy obwodnicy, jako warunkową i niegwarantowaną; usunięto błędną kartę o finansowaniu ochrony akustycznej. |
| 8 | Najważniejsze informacje | Zachowana bez zmian funkcjonalnych. |
| 9 | „Co chcemy sprawdzić?” | Zachowana bez zmian funkcjonalnych. |
| 10 | „Dlaczego obecne dane nie wystarczają?” | Zachowana wraz z odsyłaczem do historii sprawy. |
| 11 | Wyróżniony główny przekaz | Zachowany bez zmian funkcjonalnych. |
| 12 | „Spokojnie, rzeczowo, na podstawie dokumentów” | Dodana — wyjaśnia przyjaznym językiem sposób działania mieszkańców. |
| 13 | Publiczny zestaw dokumentów (PDF) | Zachowana bez zmian funkcjonalnych. |
| 14 | Symboliczne poparcie i licznik | Zachowane bez zmian funkcjonalnych. |
| 15 | FAQ | Zachowane bez zmian funkcjonalnych. |
| 16 | Kontakt | Zachowany bez zmian funkcjonalnych. |
| 17 | Stopka | Zachowana bez zmian funkcjonalnych. |

### Podstrona (`historia-sprawy.html`)

Podstrona historii sprawy, jej chronologia, nagłówek, powrót i stopka zostały zachowane bez zmian.

### Elementy usunięte lub przeniesione

Nie usunięto ani nie przeniesiono żadnej istniejącej sekcji lub funkcji. Zachowano zdjęcie z drona, grafikę poglądową, PDF, licznik poparcia, FAQ, kontakt, menu mobilne i historię sprawy.
