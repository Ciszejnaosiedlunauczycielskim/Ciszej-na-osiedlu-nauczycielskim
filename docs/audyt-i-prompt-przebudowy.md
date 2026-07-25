# 1. AUDYT ZMIANY OSI TEMATYCZNEJ

## Wniosek redakcyjny

Dotychczasowa strona buduje opowieść przede wszystkim wokół „pełnego obrazu hałasu z dwóch dróg”, historycznego przekroczenia, wysokich wyników przy DK94, prognoz ruchu Parku Lwowska i czterech ogólnych postulatów. Nowa petycja przesuwa punkt ciężkości: najważniejszym ustaleniem nie jest dowiedzione aktualne przekroczenie ani gotowa technologia ochrony, lecz **brak zidentyfikowanego po 2011 r. aktualnego, reprezentatywnego, bezpośredniego pomiaru w zabudowie Osiedla Nauczycielskiego oraz pomiaru kontrolnego w historycznym punkcie przy ul. Sudeckiej 24**.

Nowa narracja powinna prowadzić mieszkańca przez łańcuch decyzji:

1. ustalić, jakie dane istnieją i czego nie wykonano;
2. przeprowadzić wizję lokalną i zaprojektować profesjonalny program badań;
3. zmierzyć hałas i ruch w reprezentatywnych miejscach, w dzień i w nocy;
4. rozdzielić oraz połączyć oddziaływanie DK94 i ul. Lwowskiej/DK73;
5. jasno opublikować wyniki;
6. porównać technologie, koszty, wykonalność i odpowiedzialność zarządców;
7. wybrać, sfinansować i wdrożyć rozwiązanie;
8. potwierdzić efekt pomiarem „przed–po”.

Zdanie porządkujące całą stronę brzmi: **„Pomiar nie jest celem samym w sobie. Ma prowadzić do decyzji i skutecznych działań.”** Dzięki temu serwis nie może kończyć opowieści na postulacie kolejnego opracowania.

## Rozróżnienie typów twierdzeń

Każdy komunikat powinien być możliwy do zakwalifikowania jako:

- **potwierdzony fakt** — np. wykonanie pomiaru w 2011 r. albo liczba punktów kampanii;
- **wniosek z przeanalizowanych materiałów** — np. brak zidentyfikowanego reprezentatywnego punktu na osiedlu w kampaniach 2019 i 2022;
- **brak danych / kwestia nierozstrzygnięta** — np. obecny poziom hałasu lub status badań zapowiadanych w 2021 r.;
- **scenariusz warunkowy** — np. przyszła zmiana rozkładu ruchu po uruchomieniu inwestycji;
- **oczekiwanie mieszkańców** — np. wykonanie pomiaru „przed–po” i wskazanie jednostki odpowiedzialnej.

## Uwaga o dostępności materiałów

W bieżącym drzewie repozytorium nie ma plików o nazwach `03_WERSJA_PUBLICZNA_ANONIMOWA_FINAL(7).pdf`, `01_PETYCJA_DO_ZLOZENIA_FINAL(7).pdf`, `02_DOWODY_DO_ZLOZENIA_FINAL(7).pdf`, `39479BE3-A698-4C40-8411-0ED0495CDB8E.jpeg` ani `72517736-63F1-43D8-BF70-8ACB07444EB5.jpeg`. Jest natomiast jeden starszy, 45-stronicowy plik `documents/zestaw-publiczny-osiedle-nauczycielskie.pdf` oraz trzy starsze fotografie/mapy. Nie wolno utożsamiać starego PDF z nową wersją publiczną tylko na podstawie nazwy lub tematyki. Z tego powodu niniejszy audyt opiera rozdzielenie faktów, postulatów, ograniczeń i scenariuszy na wymaganiach przekazanych w zadaniu, a finalny prompt zawiera twardą bramkę: implementacja może ruszyć dopiero po odnalezieniu i porównaniu wszystkich trzech nowych PDF-ów.

Nowy materiał publiczny ma być jedynym źródłem cytatów, chronologii, argumentów i żądań publikowanych na stronie. Dwa pozostałe PDF-y mają służyć wyłącznie kontroli zgodności. Ich prywatnej zawartości nie wolno kopiować do serwisu, repozytorium publikacyjnego, komentarzy, metadanych ani raportu.

# 2. AUDYT OBECNEJ STRONY

## Stos, architektura i wdrożenie

- To ręcznie zbudowana, wielostronicowa strona statyczna bez frameworka, bundlera, menedżera zależności i test runnera. Punktem wejścia jest `index.html`, a jedyną podstroną treściową jest `historia-sprawy.html`; istnieje też statyczne `404.html`.
- Routing jest plikowy. Nawigacja strony głównej korzysta z kotwic, a historia ma własny adres HTML.
- Warstwa prezentacji jest skupiona w jednym pliku `assets/css/style.css`, a zachowania w `assets/js/app.js`.
- Hosting jest przygotowany pod GitHub Pages: `.nojekyll`, `CNAME` z domeną `ciszejnaosiedlunauczycielskim.pl`, `robots.txt` i `sitemap.xml`. W repozytorium nie ma workflow GitHub Actions, konfiguracji innego hostingu ani skryptów build/deploy.
- Nie ma `package.json`, lockfile, komend lint/build/test ani frameworka do aktualizacji. Zachowanie obecnego stosu jest najbezpieczniejsze; do tej przebudowy nie ma technicznej przesłanki, aby wprowadzać React, Vue, Next, Astro albo proces kompilacji.
- Manifest PWA istnieje, lecz jest bardzo prosty. SEO obejmuje podstawowe `title` i `description`, favicon i manifest. Brakuje co najmniej Open Graph, canonical na dokumentach HTML i pełniejszej spójności metadanych; `historia-sprawy.html` nie odwołuje się do manifestu.

## Elementy wartościowe do zachowania

1. **Lekki model statyczny** — szybki, możliwy do hostowania bez backendu i zgodny z obecnym wdrożeniem.
2. **Semantyczna baza** — `header`, `nav`, `main`, `section`, `article`, `figure`, `details`, `footer`, poprawny język `pl`, link pomijający nawigację oraz przycisk menu z `aria-expanded` i `aria-controls`.
3. **Responsywna baza CSS** — elastyczne kontenery, breakpointy, obrazy bez stałej wysokości oraz podstawowe uwzględnienie `prefers-reduced-motion`.
4. **Menu mobilne** — proste i zrozumiałe, choć wymaga uzupełnienia zarządzania focusem, zamykania klawiszem Escape i stanu przy zmianie szerokości.
5. **Osobna historia sprawy** — może pozostać osobną stroną, ale musi zostać gruntownie rozbudowana zgodnie z nową chronologią i połączona z główną narracją.
6. **Łatwe wdrożenie na GitHub Pages** — należy zachować `CNAME`, `.nojekyll`, ścieżki względne, sitemapę i brak wymogu działania serwera.
7. **Publiczny adres inicjatywy** — `ciszejnaosiedlunauczycielskim@gmail.com` jest już jawnie opublikowany na stronie. Można go zachować wyłącznie jako wcześniej zaakceptowany kontakt inicjatywy, po ponownym potwierdzeniu z właścicielem; nie wolno zastąpić go adresem z petycji urzędowej.

## Elementy do przebudowy

- **Hero i CTA:** obecne hasło „Dwie ruchliwe drogi. Jedno osiedle” oraz CTA „Zobacz najważniejsze dowody” wzmacniają starą oś. Hero powinien od razu wyjaśniać lukę pomiarową i dalszy proces decyzyjny.
- **Nawigacja:** obecne etykiety „Dowody”, „Co się zmienia”, „Postulaty” i „Poparcie” nie odwzorowują nowej kolejności. Menu powinno skracać drogę do sedna, chronologii, żądań, zastrzeżeń i publicznego PDF.
- **Sekcja dowodowa:** karta „przekroczenie” jest wizualnie i językowo dominująca, a liczby przy DK94 i ruchu mogą sugerować aktualny lokalny wynik. Należy zastąpić ją równoważnym zestawieniem „Wiemy / Nadal nie wiemy”, bez twierdzenia o dzisiejszym przekroczeniu.
- **Park Lwowska:** obecna karta eksponuje wielkości ruchu i powierzchni, ale nie używa wymaganej wizualizacji inwestora ani podpisu źródłowego. Nowa sekcja musi pokazać lokalny, niezmodyfikowany locked asset i jasno oddzielić wizualizację od dowodu wpływu na hałas.
- **Zmiany otoczenia:** obecna sekcja może pozostać koncepcyjnie, lecz potrzebuje języka pomiaru bazowego i oceny po ustabilizowaniu ruchu. Scenariusze wojskowe i drogowe muszą pozostać wyraźnie warunkowe.
- **Żądania:** cztery skrótowe punkty są zbyt ogólne. Nowe żądania trzeba modelować centralnie w pięciu grupach, zachowując pełny sens publicznej petycji.
- **Chronologia:** obecna podstrona ma tylko cztery krótkie zdarzenia. Każde nowe zdarzenie powinno zawierać trzy pola: wydarzenie, potwierdzone znaczenie i nierozstrzygnięta kwestia.
- **FAQ:** obecne cztery odpowiedzi dotyczą głównie natury inicjatywy i licznika. Należy je zastąpić lub rozszerzyć o osiem pytań merytorycznych z zadania.
- **Dokumenty:** obecny przycisk udostępnia starszy „zestaw publiczny”. Po kontroli prywatności jedynym plikiem ma być nowa anonimowa wersja, pod semantyczną nazwą publikacyjną.
- **SEO i metadane:** trzeba przepisać tytuły/opisy pod lukę pomiarową, dodać OG/canonical i sprawdzić sitemapę, favicon oraz manifest.
- **Organizacja treści:** większość treści jest obecnie zapisana w długich, jednoliniowych fragmentach HTML. Chronologia, FAQ, żądania, źródła i aktualności powinny mieć pojedyncze źródła danych, bez duplikacji. W lekkim projekcie mogą to być centralne obiekty/tabllice w jednym pliku JS renderowane progresywnie albo czytelnie wydzielone dane w HTML/JS; nie należy dla samego modelu treści wprowadzać frameworka.

## Elementy do usunięcia lub wycofania

1. **Stary PDF z katalogu publicznego** — `documents/zestaw-publiczny-osiedle-nauczycielskie.pdf` należy usunąć z publikowanego drzewa i wszystkich odwołań, jeżeli nie jest bitowo oraz merytorycznie zatwierdzoną nową wersją publiczną. Nie wolno zgadywać równoważności.
2. **Stare mapy i obrazy zastępowane przez locked assets** — `assets/img/mapa_tarnowa_4K.png` nie odpowiada wymaganej nazwie nowej mapy; `IMG_5375.jpeg` to fotografia dronowa, której nowa architektura nie wymaga. Można zachować ją tylko wtedy, gdy właściciel potwierdzi wartość i prawa publikacji, ale nie może konkurować z obowiązkową mapą. `B6C2324B-8741-4318-ADFC-5D60F61E9604.png` jest nieużywanym zasobem i wymaga ręcznej identyfikacji oraz decyzji prywatności.
3. **Dominujący język o przekroczeniu:** tytuł „2011 r. — przekroczenie…” oraz czerwone wyróżnienia wartości powinny ustąpić neutralnemu opisowi historycznego pomiaru i jego ograniczeń.
4. **Aktualne szczegółowe liczby Parku jako główny „dowód”:** mogą pojawić się tylko wtedy, gdy publiczny dokument potwierdza ich znaczenie i źródło, zawsze z zastrzeżeniem. Nie powinny budować alarmistycznej prognozy.
5. **Sekcja norm jako sugestia rozstrzygnięcia:** wartości prawne i WHO można zachować wyłącznie jako starannie zweryfikowany kontekst; nie mogą sugerować, że obecne przekroczenie zostało wykazane. Jeżeli publiczny PDF nie opiera na nich osi argumentacji, należy ją skrócić albo przenieść do FAQ/źródeł.
6. **Licznik poparcia jako niezweryfikowana integracja:** skrypt łączy się z `api.counterapi.dev`, zapisuje stan w `localStorage` i nie ma polityki prywatności ani informacji o zewnętrznym odbiorcy żądania. Nie zbiera pól formularza, ale przesyła techniczne dane żądania do strony trzeciej. Należy go usunąć, dopóki właściciel świadomie nie zatwierdzi integracji po ocenie prywatności, albo opisać dostawcę, cel i podstawę. Licznik nie jest podpisem pod petycją i nie może być mylony z listą poparcia.
7. **Niepotwierdzone wpisy aktualności:** nie wolno tworzyć dat złożenia petycji, odpowiedzi lub kolejnych działań. Placeholder może brzmieć „oczekuje na aktualizację”, lecz pustą aktualność lepiej pominąć.

## Audyt prywatności i publikacji

- W tekstowych plikach repozytorium nie znaleziono imienia i nazwiska wnoszącego, prywatnego adresu ani prywatnego e-maila. Widoczny adres Gmail należy traktować jako publiczny adres inicjatywy wymagający potwierdzenia, nie jako automatycznie bezpieczne dane z petycji.
- Jedyny PDF ma 45 stron, ale bez trzech wskazanych plików źródłowych nie można potwierdzić jego zgodności z nową wersją ani kompletności anonimizacji. Powinien być traktowany jako potencjalnie nieaktualny/potencjalnie wrażliwy do czasu ręcznego audytu każdej strony, metadanych, adnotacji, załączników i warstw OCR.
- Publiczne drzewo nie zawiera plików `01_...` i `02_...`, co jest prawidłowe. Nie wolno ich kopiować do `documents`, `assets`, generatora strony ani artefaktów wdrożenia.
- Samo usunięcie pliku z bieżącej wersji nie usuwa go z historii Git. Prompt wymaga usunięcia go z publikowanego drzewa i historii odwołań aplikacji; przepisywanie historii Git należy wykonać tylko po potwierdzeniu faktycznego wycieku i uzgodnieniu z właścicielem, bo jest operacją destrukcyjną dla współpracowników.

# 3. PROPONOWANA ARCHITEKTURA STRONY

1. **Nagłówek i nawigacja** — krótka marka, dostępne menu oraz kotwice: Sedno, Dane, Chronologia, Petycja, Dokumenty, FAQ.
2. **Hero: „Najpierw rzetelne pomiary. Potem decyzje i realne działania.”** — w pierwszym ekranie ustanawia lukę informacyjną, nie obiecuje wyniku i daje dwa CTA.
3. **Sedno sprawy** — cztery łatwe do przeskanowania kroki: ustalenie danych, pomiary, wybór działań, kontrola skuteczności. To skrót całej opowieści.
4. **Gdzie znajduje się osiedle** — mapa daje kontekst przestrzenny przed szczegółami dokumentów, z jednoznacznym zastrzeżeniem, że nie jest mapą hałasu.
5. **Co wiemy, a czego nadal nie wiemy** — symetryczne zestawienie chroni przed mieszaniem faktów z brakami danych.
6. **Chronologia** — pokazuje, dlaczego luka pomiarowa jest wnioskiem z ciągu dokumentów, a nie oskarżeniem. Na telefonie powinna działać jako lista, na szerszym ekranie jako spokojna oś czasu.
7. **Dlaczego sprawa jest ważna teraz** — dopiero po dowodach wprowadza zmieniające się otoczenie jako przesłankę pomiaru bazowego, nie jako dowód wzrostu hałasu.
8. **Park Handlowy Lwowska** — osobna sekcja z lokalną wizualizacją, źródłem i neutralnym wyjaśnieniem ograniczeń materiału.
9. **Czego domaga się petycja** — pięć grup żądań buduje kompletną drogę od audytu do kontroli efektu.
10. **Możliwe rozwiązania** — katalog równorzędnych przykładów, prezentowany dopiero po metodzie oceny, aby ekrany nie wyglądały na przesądzone.
11. **Czego petycja nie przesądza** — widoczna sekcja wiarygodności, która porządkuje wszystkie ograniczenia merytoryczne bez tonu defensywnego.
12. **Dokumenty i źródła** — jeden anonimowy PDF oraz uporządkowane publiczne źródła; żadnego pakietu prywatnego.
13. **Aktualności i stan sprawy** — mały, centralnie zarządzany moduł wyłącznie z potwierdzonymi wpisami. Jeśli nie ma wpisów, można pokazać sam stan „oczekuje na aktualizację” albo pominąć moduł.
14. **FAQ** — krótkie odpowiedzi na osiem kluczowych nieporozumień, przydatne także dla wyszukiwarek i czytników ekranu.
15. **Kontakt i stopka** — tylko potwierdzony kanał publiczny, informacja o obywatelskim charakterze strony i podstawowe linki.

# 4. MAPA TREŚCI I MATERIAŁÓW

| Sekcja | Cel i najważniejszy komunikat | CTA | Źródło merytoryczne | Grafika |
|---|---|---|---|---|
| Nagłówek | Szybka orientacja i dostęp do głównych części | Kotwice sekcji | Struktura serwisu | Favicon istniejący po weryfikacji |
| Hero | Luka po 2011 r.; pomiar ma prowadzić do decyzji i działania | „Poznaj sedno sprawy”, „Pobierz publiczną wersję petycji” | Przede wszystkim `03_WERSJA_PUBLICZNA_ANONIMOWA_FINAL(7).pdf` | Bez hero-fotografii; spokojne tło CSS |
| Sedno sprawy | Ustalenie danych → pomiary → wybór działań → kontrola | „Zobacz pełny plan działań” do żądań | Publiczny PDF, postulaty | Proste numery/kroki CSS, bez dekoracyjnego natłoku ikon |
| Gdzie znajduje się osiedle | Kontekst między Lwowską/DK73, DK94 i planowanym parkiem; materiał nie jest mapą hałasu | „Powiększ mapę” | Opis lokalizacji z publicznego PDF | Locked asset `39479BE3-A698-4C40-8411-0ED0495CDB8E.jpeg`, bez zmian treści |
| Wiemy / Nadal nie wiemy | Rozdzielenie potwierdzonych zdarzeń od braków danych | „Przejdź do chronologii” | Publiczny PDF; `01_...` i `02_...` wyłącznie kontrolnie | Brak koniecznej grafiki; dwie spokojne kolumny/karty |
| Chronologia | Udokumentowanie sekwencji 2011–2026 i ograniczeń każdego zdarzenia | „Otwórz publiczny dokument” | Publiczny PDF; urzędowe PDF wyłącznie do kontroli dat | Bez fotografii; struktura danych i semantyczne `time` |
| Dlaczego teraz | Zmiany otoczenia uzasadniają bazę i późniejsze porównanie, lecz nie dowodzą wzrostu | „Zobacz, czego oczekuje petycja” | Publiczny PDF i jawne źródła w nim wskazane | Opcjonalnie brak; nie używać alarmistycznych zdjęć ruchu |
| Park Handlowy Lwowska | Planowana inwestycja, wizualizacja nie jest dowodem wpływu, kierunki ruchu wymagają oceny po otwarciu | Link „Redkom Development” w nowej karcie | Publiczny PDF + oficjalna strona `https://redkomdevelopment.com/retail/tarnow/` | Locked asset `72517736-63F1-43D8-BF70-8ACB07444EB5.jpeg`, lokalnie, bez modyfikacji |
| Czego domaga się petycja | Pełna droga od inwentaryzacji do kontroli efektu, pogrupowana w 5 obszarów | „Pobierz publiczną wersję petycji” | Wyłącznie sens postulatów publicznego PDF; kontrola z `01_...` | Brak wymaganej grafiki |
| Możliwe rozwiązania | Równorzędne przykłady do porównania po wynikach | Brak albo kotwica do żądań | Publiczny PDF | Bez ilustracji sugerującej preferowaną technologię |
| Czego petycja nie przesądza | Zapobieganie nadinterpretacjom, wzmocnienie wiarygodności | Brak | Ograniczenia publicznego PDF | Spokojny blok informacyjny, nie czerwony alarm |
| Dokumenty i źródła | Bezpieczny dostęp tylko do anonimowego PDF oraz jawnych źródeł | „Otwórz PDF” / „Pobierz PDF” | `03_...`; lista źródeł z tego dokumentu | Ikona PDF może być CSS/SVG z istniejącego systemu, bez skanów prywatnych pism |
| Aktualności | Łatwa aktualizacja wyłącznie potwierdzonego stanu | Zależne od potwierdzonego wpisu | Nowe, zweryfikowane komunikaty właściciela | Brak |
| FAQ | Krótkie odpowiedzi o normach, mapie, punktach, technologiach, parku, porach pomiaru, działaniach po wynikach i dokumentach | Link do PDF w ostatniej odpowiedzi | Publiczny PDF | Brak |
| Kontakt / stopka | Bezpieczny kontakt i charakter inicjatywy | „Napisz” tylko po potwierdzeniu adresu | Już opublikowany kanał inicjatywy, nie dane z PDF urzędowego | Favicon/marka bez danych osobowych |

# 5. FINALNY PROMPT DLA CODEXA

```text
Pracujesz w repozytorium statycznej strony „Ciszej na Osiedlu Nauczycielskim”. Masz gruntownie przebudować serwis zgodnie z nową petycją. Nie wykonuj kosmetycznej podmiany akapitów. Przeprojektuj architekturę informacji, treść, nawigację, CTA, układ i sposób prezentacji dokumentów, zachowując lekki stos oraz działające wdrożenie GitHub Pages.

WAŻNA BRAMKA STARTOWA — NIE ZGADUJ I NIE IMPLEMENTUJ BEZ ŹRÓDEŁ

1. Najpierw odczytaj wszystkie AGENTS.md mające zastosowanie.
2. Zlokalizuj i przeczytaj w całości:
   - 03_WERSJA_PUBLICZNA_ANONIMOWA_FINAL(7).pdf,
   - 01_PETYCJA_DO_ZLOZENIA_FINAL(7).pdf,
   - 02_DOWODY_DO_ZLOZENIA_FINAL(7).pdf,
   - 39479BE3-A698-4C40-8411-0ED0495CDB8E.jpeg,
   - 72517736-63F1-43D8-BF70-8ACB07444EB5.jpeg.
3. W znanym stanie repozytorium tych pięciu plików nie było. Nie uznawaj automatycznie istniejącego `documents/zestaw-publiczny-osiedle-nauczycielskie.pdf` ani `assets/img/mapa_tarnowa_4K.png` za ich odpowiedniki. Porównaj pliki, sumy kontrolne, liczbę stron, treść i status zatwierdzenia.
4. Jeżeli któregokolwiek z trzech PDF-ów lub dwóch locked assets nadal brakuje, przerwij implementację bez wymyślania treści i zgłoś dokładną listę braków. Nie zastępuj ich materiałami podobnymi ani treścią starej strony.
5. Po odnalezieniu źródeł przygotuj prywatny roboczy podział: fakty, wnioski z dokumentów, braki danych, postulaty, ograniczenia, scenariusze warunkowe oraz treści prywatne. Nie kopiuj treści prywatnych do raportu, logów, komentarzy ani kodu.

HIERARCHIA ŹRÓDEŁ

- `03_WERSJA_PUBLICZNA_ANONIMOWA_FINAL(7).pdf` jest jedynym podstawowym źródłem publicznej treści, cytatów, chronologii, argumentów, żądań i pliku do pobrania.
- `01_PETYCJA_DO_ZLOZENIA_FINAL(7).pdf` i `02_DOWODY_DO_ZLOZENIA_FINAL(7).pdf` służą wyłącznie do kontroli zgodności i zrozumienia sprawy. Nie publikuj ich, nie linkuj ich i nie kopiuj prywatnych fragmentów.
- Nie uzupełniaj braków pamięcią, starą stroną ani domysłem. Jeśli szczegół nie jest potwierdzony w wersji publicznej, pomiń go lub oznacz jako brak danych/scenariusz warunkowy.

BEZWZGLĘDNE ZASADY PRYWATNOŚCI

Nie publikuj nigdzie — także w HTML, JS, JSON, komentarzach, commitach, metadanych plików, sitemapie, danych OG, nazwach zasobów i alternatywnych tekstach — imienia i nazwiska wnoszącego petycję, prywatnego adresu, prywatnego e-maila, podpisu, list poparcia, danych mieszkańców, numerów działek, informacji katastralnych, pełnych zrzutów korespondencji ZDiK, stron oznaczonych jako prywatne/nieprzeznaczone do publikacji, urzędowej petycji z danymi ani urzędowego pakietu dowodowego.

Wykonaj audyt obecnego publicznego drzewa i odwołań. W szczególności:
- ręcznie sprawdź każdą stronę istniejącego 45-stronicowego `documents/zestaw-publiczny-osiedle-nauczycielskie.pdf`, jego metadane, adnotacje, warstwy OCR i osadzone załączniki;
- usuń go z katalogu publikowanego i wszystkich linków, jeśli nie jest zatwierdzoną, anonimową nową wersją;
- sprawdź `assets/img/B6C2324B-8741-4318-ADFC-5D60F61E9604.png`, `assets/img/IMG_5375.jpeg` i `assets/img/mapa_tarnowa_4K.png` pod kątem prywatności, praw publikacji, aktualności i dalszej potrzeby;
- nie przepisuj historii Git samodzielnie. Jeżeli wykryjesz faktyczny wyciek danych w historii, usuń odwołanie z bieżącej wersji, nie powtarzaj danych w raporcie i zgłoś właścicielowi konieczność uzgodnionego czyszczenia historii oraz unieważnienia danych/linków.

STOS I PLIKI, KTÓRE MASZ PRZEBUDOWAĆ

Obecny projekt jest ręcznie pisaną stroną statyczną bez frameworka i bez procesu build:
- `index.html` — strona główna,
- `historia-sprawy.html` — podstrona chronologii,
- `assets/css/style.css` — cały styl,
- `assets/js/app.js` — menu, licznik i rok,
- `404.html`, `manifest.webmanifest`, `robots.txt`, `sitemap.xml`, `.nojekyll`, `CNAME`,
- `docs/section-inventory.md` i `docs/ux-principles.md` — dokumentacja struktury i UX.

Zachowaj ten lekki stos. Nie wprowadzaj Reacta, Vue, Next, Astro, bundlera ani frameworka CSS. Nie ma uzasadnienia do migracji. Zachowaj względne URL-e, `.nojekyll`, domenę z `CNAME`, routing plikowy i kompatybilność z GitHub Pages. Zaktualizuj dokumentację w `docs/` po zmianie sekcji.

NOWA OŚ KOMUNIKACYJNA

Hero i cała strona mają wyjaśniać:
„Po 2011 roku w przeanalizowanych materiałach nie zidentyfikowano aktualnego, reprezentatywnego, bezpośredniego pomiaru hałasu wykonanego na obszarze zabudowy Osiedla Nauczycielskiego ani pomiaru kontrolnego w historycznym punkcie przy ul. Sudeckiej 24.”

Miasto prowadziło późniejsze kampanie: 48 punktów w 2019 r. i 35 drogowych punktów terenowych wykorzystanych w 2022 r., lecz — zgodnie z publicznym dokumentem — żadna nie objęła reprezentatywnego punktu na osiedlu.

Główna sekwencja to:
1) inwentaryzacja danych i wyjaśnienie zaniechań,
2) wizja lokalna i profesjonalny program pomiarowy,
3) reprezentatywne pomiary hałasu i ruchu w dzień i w nocy,
4) oddzielna i łączna ocena DK94 oraz Lwowskiej/DK73,
5) zrozumiałe przedstawienie wyników,
6) porównanie sposobów ograniczenia hałasu,
7) wybór, finansowanie i realizacja,
8) kontrolny pomiar „przed–po”.

Wyróżnij zdanie: „Pomiar nie jest celem samym w sobie. Ma prowadzić do decyzji i skutecznych działań.” Nie sugeruj, że kolejne opracowanie kończy sprawę.

TON I ZASADY TWIERDZEŃ

Pisz spokojnie, rzeczowo, profesjonalnie, obywatelsko i prostym językiem. Strona nie jest kampanią polityczną, protestem przeciw inwestycji ani portalem reklamowym. Oznaczaj znaczeniowo: potwierdzony fakt, wniosek z dokumentów, brak danych, scenariusz warunkowy, oczekiwanie mieszkańców.

Nie używaj: „walka z galerią”, „katastrofa komunikacyjna”, „trucie mieszkańców”, „miasto ignoruje wszystko”, „żądamy ekranów natychmiast”, „normy są na pewno przekroczone”, „park zaleje osiedle samochodami”, „władze ukrywają pomiary”. Nie stosuj także bliskich sensacyjnych parafraz.

DOCELOWA STRUKTURA STRONY GŁÓWNEJ

1. Nagłówek/nawigacja: marka i kotwice Sedno, Dane, Chronologia, Petycja, Dokumenty, FAQ. Menu mobilne musi obsługiwać klawiaturę, Escape, focus i aktualizację `aria-expanded`.

2. Hero:
- H1: „Najpierw rzetelne pomiary. Potem decyzje i realne działania.”
- prosty podtytuł o braku zidentyfikowanego po 2011 r. aktualnego reprezentatywnego pomiaru kontrolnego na osiedlu;
- CTA „Poznaj sedno sprawy” do następnej sekcji;
- CTA „Pobierz publiczną wersję petycji” do anonimowego PDF;
- usuń stare CTA sugerujące „dowody” na gotowy wynik lub ekrany.

3. Sedno sprawy: cztery skanowalne etapy — Ustalenie danych, Pomiary, Wybór działań, Kontrola skuteczności. Całość ma być zrozumiała w kilkanaście sekund.

4. Gdzie znajduje się osiedle:
- użyj lokalnie locked asset `39479BE3-A698-4C40-8411-0ED0495CDB8E.jpeg`, opcjonalnie pod semantyczną nazwą;
- pokaż całą mapę bez agresywnego kadrowania, uciętych podpisów i oznaczeń;
- alt ma opisywać lokalizację osiedla między Lwowską/DK73 a DK94 oraz oznaczenie planowanego Parku Handlowego Lwowska, bez interpretowania poziomu hałasu;
- podpis: materiał poglądowy, nie mapa hałasu, wynik pomiaru, mapa geodezyjna ani dowód wpływu;
- dodaj dostępne klawiaturą powiększenie/lightbox z zamykaniem Escape, przywróceniem focusu i zablokowaniem focusu poza otwartym dialogiem;
- nie regeneruj i nie zmieniaj zawartości mapy.

5. Co wiemy, a czego nadal nie wiemy:
WIEMY:
- w 2011 wykonano pomiar przy ul. Sudeckiej 24;
- dokumentacja analizowała wariant E.6;
- w 2019 miasto wykonywało pomiary w 48 punktach;
- 23 listopada 2021 wskazano potrzebę szczegółowych badań;
- w 2022 wykorzystano 35 drogowych punktów terenowych;
- w odpowiedziach z 2025 i 2026 nie przedstawiono nowego lokalnego pomiaru na osiedlu.
NADAL NIE WIEMY:
- czy po 2011 wykonano reprezentatywny pomiar kontrolny na osiedlu;
- jaki jest aktualny poziom w różnych częściach osiedla;
- jaki jest osobny i łączny udział DK94 oraz Lwowskiej;
- jaki był pełny status wariantu E.6;
- czy szczegółowe badania zapowiadane w 2021 wykonano;
- jakie rozwiązanie jest obecnie najskuteczniejsze i proporcjonalne.
Zweryfikuj każde sformułowanie z publicznym PDF; jeśli dokument wymaga precyzyjniejszego zastrzeżenia, zastosuj je.

6. Chronologia: umieść dane w jednej centralnej strukturze. Każdy wpis ma `date/datetime`, `title`, `whatHappened`, `whatItConfirms`, `whatItDoesNotResolve`, opcjonalne publiczne źródło. Uwzględnij:
- wrzesień 2011 — pomiar Sudecka 24;
- październik 2011 — analiza E.1–E.6;
- 2019 — 48 punktów, bez reprezentatywnego punktu na osiedlu;
- 23 listopada 2021 — potrzeba szczegółowych badań;
- 2022 — 35 drogowych punktów strategicznej mapy, bez punktu na osiedlu;
- 25 lipca 2025 — odpowiedź GDDKiA bez nowego lokalnego pomiaru;
- kwiecień–maj 2026 — stanowisko ZDiK bez protokołu aktualnych badań;
- 28 maja 2026 — rozpoczęcie robót na Lwowskiej;
- 2025–2026 — przygotowanie Parku Handlowego Lwowska;
- 2026 — warunkowe scenariusze przyszłych zmian układu komunikacyjnego.
Nie dodawaj dokładniejszej daty, jeśli publiczny PDF jej nie potwierdza. Zaktualizuj `historia-sprawy.html` albo scal chronologię ze stroną główną i pozostaw podstronę jako pełniejszą wersję bez duplikowania danych; w obu przypadkach jedno źródło danych ma zapobiegać rozjazdom.

7. Dlaczego sprawa jest ważna teraz: opisz rozbudowę Lwowskiej, przygotowanie Parku, możliwe przyszłe zmiany drogowe oraz inne inwestycje wyłącznie warunkowo. Główny komunikat: zmieniające się otoczenie nie dowodzi automatycznie wzrostu hałasu, lecz zwiększa potrzebę pomiaru bazowego i późniejszego porównania po ustabilizowaniu ruchu.

8. Park Handlowy Lwowska:
- użyj lokalnie locked asset `72517736-63F1-43D8-BF70-8ACB07444EB5.jpeg`;
- oznacz go jednoznacznie jako wizualizację, nie fotografię istniejącego obiektu;
- figcaption dokładnie: „Wizualizacja Parku Handlowego w Tarnowie. Źródło: Redkom Development — materiał pobrany ze strony inwestora.”;
- „Redkom Development” linkuje do `https://redkomdevelopment.com/retail/tarnow/`, ma `target="_blank"`, `rel="noopener noreferrer"`, widoczny focus i tekst dla czytnika o otwarciu nowej karty;
- nie hotlinkuj grafiki;
- obok napisz neutralnie: planowana inwestycja w bezpośrednim otoczeniu Lwowskiej; wizualizacja nie dowodzi wpływu na hałas; rzeczywiste kierunki ruchu należy ocenić po uruchomieniu i ustabilizowaniu ruchu.

9. Czego domaga się petycja: dane trzymaj w jednej uporządkowanej strukturze pięciu grup, nie w dwunastu długich akapitach:
A Ustalenie stanu — inwentaryzacja pomiarów; potwierdzenie istnienia/nieistnienia pomiarów po 2011; wyjaśnienie pominięcia osiedla; status badań z 2021.
B Profesjonalne badania — wizja lokalna; reprezentatywny program; dzień i noc; równoległe dane o ruchu, prędkości, ciężkich pojazdach, pogodzie i nawierzchni; punkty dobiera specjalista.
C Pełna ocena — rozdzielenie DK94 i Lwowskiej/DK73; łączne oddziaływanie; stan po rozbudowie i uruchomieniu parku; zrozumiałe wyniki.
D Działania po wynikach — porównanie rozwiązań; efekt, koszt, wykonalność i zarządca; wybór i finansowanie wariantu; jednostka odpowiedzialna i terminy.
E Kontrola i jawność — pomiar „przed–po”; krótka informacja po etapie; mieszkańcy przy wizji; dalsze działanie, jeśli pierwszy wariant nie wystarczy.
Zachowaj pełny sens publicznego PDF i skontroluj go z urzędową petycją bez ujawniania danych.

10. Możliwe rozwiązania: równorzędne przykłady do porównania po pomiarach — nawierzchnia o obniżonej emisji, zarządzanie prędkością, organizacja ruchu, zarządzanie ruchem ciężkim, ekrany, wały, rozwiązania hybrydowe, działania uzupełniające. Nie wyróżniaj ekranów kolorem, pozycją, ikoną ani tekstem jako rozwiązania przesądzonego.

11. Czego petycja nie przesądza: widoczna, spokojna sekcja wiarygodności. Wymień, że petycja:
- nie twierdzi, że obecne normy są na pewno przekroczone;
- nie twierdzi, że strategiczna mapa hałasu jest błędna;
- nie przesądza punktów pomiarowych ani technologii;
- nie żąda automatycznej budowy ekranów;
- nie sprzeciwia się rozbudowie Lwowskiej ani Parkowi Handlowemu;
- nie twierdzi, że cały ruch parku przejedzie przy osiedlu;
- nie twierdzi, że jednostka wojskowa powstanie w konkretnej lokalizacji;
- nie twierdzi, że każda przyszła inwestycja zwiększy ruch przy osiedlu.
Przyszłe inwestycje nazywaj możliwymi scenariuszami wymagającymi weryfikacji.

12. Dokumenty i źródła:
- skopiuj wyłącznie `03_WERSJA_PUBLICZNA_ANONIMOWA_FINAL(7).pdf` do `documents/petycja-osiedle-nauczycielskie-wersja-publiczna.pdf` po audycie anonimizacji;
- pokaż nazwę, krótki opis, PDF, informację „wersja publiczna i anonimowa” oraz przycisk otwarcia/pobrania;
- nie kopiuj i nie linkuj `01_...` ani `02_...`;
- dodaj uporządkowaną, centralnie zarządzaną listę jawnych źródeł z publicznego PDF. Nie publikuj pełnych zrzutów prywatnej korespondencji.

13. Aktualności i stan: centralna tablica danych łatwa do dopisania. Nie wymyślaj dat złożenia, odpowiedzi, pomiaru ani działania. Publikuj tylko potwierdzone wpisy. Niepotwierdzony stan oznacz „oczekuje na aktualizację” lub pomiń sekcję.

14. FAQ: centralna tablica ośmiu pytań i krótkich, prostych odpowiedzi:
- Czy petycja twierdzi, że normy są przekroczone?
- Dlaczego mapa strategiczna nie wystarcza?
- Dlaczego pomiary w kilku częściach osiedla?
- Czy mieszkańcy żądają tylko ekranów?
- Czy petycja sprzeciwia się Parkowi Handlowemu Lwowska?
- Dlaczego dzień i noc?
- Co po pomiarach?
- Jakie dokumenty są publiczne?
Nie pisz, że mapa strategiczna jest błędna; wyjaśnij różnicę celu i skali wobec reprezentatywnego pomiaru lokalnego.

15. Kontakt i stopka: nie pobieraj kontaktu z urzędowego PDF. Obecny `ciszejnaosiedlunauczycielskim@gmail.com` można zachować tylko po potwierdzeniu, że nadal jest zatwierdzonym publicznym adresem inicjatywy. Jeżeli nie ma potwierdzenia, usuń widoczny mail, zostaw jeden łatwy do uzupełnienia parametr w kodzie bez fikcyjnej wartości i zgłoś to w raporcie.

DECYZJA O LICZNIKU POPARCIA

Obecny `assets/js/app.js` wysyła żądania do `api.counterapi.dev` i zapisuje znacznik w `localStorage`. To zewnętrzna integracja, której nie należy zachowywać automatycznie. Usuń licznik i sekcję symbolicznego poparcia, chyba że właściciel jawnie potwierdzi ich zachowanie i dostarczy zatwierdzoną informację prywatności opisującą dostawcę, cel oraz dane techniczne. Nigdy nie przedstawiaj licznika jako podpisów petycji.

LOCKED ASSETS — ZAKAZY

Dla obu nowych JPEG-ów możesz: skopiować, semantycznie nazwać, zachować oryginał, utworzyć wierny WebP/AVIF bez utraty czytelności, ustawić CSS, dodać dostępny lightbox, podpis i alt. Nie możesz: regenerować AI, retuszować, usuwać/dodawać obiektów, zmieniać dróg, zabudowy, kolorów, napisów/oznaczeń, nakładać filtrów zmieniających sens ani ucinać ważnych elementów. Warianty optymalizowane porównaj wizualnie z oryginałem. Oryginały zachowaj jako źródła, ale tylko w katalogu, który jest zgodny z polityką publikacji projektu.

WYGLĄD

Zaprojektuj profesjonalną inicjatywę mieszkańców: dużo przestrzeni, granat/ciemny niebieski jako kolor zaufania, biel i bardzo jasne tła, czerwono-pomarańczowy akcent zgodny z mapą. Użyj stonowanych kart, konsekwentnych obramowań i czytelnej typografii. Bez przypadkowych gradientów, ciężkich cieni, natłoku ikon, alarmistycznej czerwieni i efektów udających aplikację. Czerwony/pomarańczowy rezerwuj dla ważnej lokalizacji, ostrzeżenia lub pojedynczego kluczowego akcentu.

DOSTĘPNOŚĆ, RESPONSYWNOŚĆ I WYDAJNOŚĆ

- Mobile-first: sprawdź co najmniej 320, 375, 390, 768, 1024 i 1440 px; iPhone, Android, tablet i desktop; brak poziomego scrolla.
- Semantyczny HTML, jeden H1, logiczne H2/H3, landmarks, `time`, `figure/figcaption`, listy tam, gdzie są listy.
- Pełna klawiatura, wyraźny focus o kontraście, skip link, brak pułapek focusu; cele dotykowe ok. 44×44 CSS px.
- Kontrast WCAG 2.2 AA, zrozumiałe etykiety, linki rozpoznawalne nie tylko kolorem.
- `prefers-reduced-motion`; bez ciężkich animacji i automatycznego ruchu.
- Obrazy poza pierwszym ekranem: `loading="lazy"`, `decoding="async"`; prawidłowe `width`/`height`, `srcset`/`sizes` i brak CLS. Nie lazy-loaduj elementu wpływającego na LCP, jeśli znajdzie się nad foldem.
- WebP/AVIF tylko gdy tekst mapy pozostaje w pełni czytelny; zachowaj bezstratny lub wysokiej jakości fallback. Nie optymalizuj kosztem oznaczeń.
- Poprawne polskie znaki i wygodne 16 px+ tekstu podstawowego na telefonie; rozsądna długość wiersza.
- Zero niepotrzebnych bibliotek i requestów. Nie hotlinkuj obrazów.

SEO I METADANE

- Zaktualizuj unikalne `title` i `description` strony głównej, historii i 404 pod nową narrację bez twierdzenia o przekroczeniu.
- Dodaj canonical zgodny z istniejącą domeną `https://ciszejnaosiedlunauczycielskim.pl/` i poprawne canonical podstron.
- Dodaj Open Graph (`og:type`, `og:locale=pl_PL`, tytuł, opis, URL i zatwierdzony lokalny obraz społecznościowy). Nie używaj prywatnego dokumentu ani niezoptymalizowanego skanu jako OG.
- Zachowaj favicon i manifest po kontroli; zaktualizuj theme color do nowej palety.
- Zaktualizuj `sitemap.xml`, `robots.txt` tylko jeśli potrzeba, i sprawdź wszystkie URL-e.
- Nie dodawaj danych strukturalnych zawierających niepotwierdzone daty, autora prywatnego albo statusy.

ORGANIZACJA TREŚCI

Chronologia, FAQ, pięć grup żądań, źródła/linki oraz aktualności mają po jednym źródle danych. Nie powielaj tekstów w kilku komponentach/plikach. W obecnym lekkim stosie zastosuj prosty, czytelny model danych w JS lub inną bez-buildową metodę z progresywnym fallbackiem; nie wprowadzaj frameworka. Jeśli JS renderuje ważną treść, zadbaj, aby treść pozostała dostępna i indeksowalna przy awarii skryptu (np. statyczny HTML generowany ze wspólnego źródła prostym skryptem narzędziowym commitowany jako wynik albo dobrze udokumentowana pojedyncza warstwa danych). Nie przechowuj wrażliwych danych w żadnej strukturze.

WALIDACJA

1. Sprawdź `git diff` i wyszukaj stare hasła, stare linki PDF, nazwy prywatnych PDF-ów, dane osobowe, numery działek, maile i nieużywane assety. Nie umieszczaj znalezionych prywatnych wartości w raporcie.
2. Uruchom istniejące testy/skrypty, jeśli pojawią się w repo. Ponieważ obecnie nie ma package.json/builda, nie twórz fikcyjnego wyniku „build passed”.
3. Uruchom lokalny serwer statyczny, przejdź wszystkie strony i kotwice oraz wykonaj automatyczną kontrolę linków wewnętrznych i zewnętrznych (zewnętrzne ograniczenia sieciowe oznacz jako ostrzeżenie, nie jako sukces).
4. Waliduj HTML i manifest dostępnymi narzędziami; uruchom Lighthouse lub równoważny audyt accessibility/SEO/performance, jeżeli środowisko pozwala.
5. Sprawdź konsolę w desktop i mobile viewport: brak błędów i ostrzeżeń aplikacji, brak 404 zasobów.
6. Sprawdź klawiaturą menu, wszystkie linki, FAQ/details, lightbox i pobranie PDF.
7. Wykonaj wizualną kontrolę locked assets przy 320/375 px i desktopie: pełne oznaczenia, brak kadrowania, zgodność z oryginałem.
8. Ponieważ zmiana jest zauważalna, wykonaj screenshot strony głównej w widoku mobilnym i desktopowym i dołącz ścieżki/artefakty do raportu.
9. Zachowaj wdrożenie GitHub Pages i nie zmieniaj CNAME.

CHECKLISTA ODBIORU — KAŻDY PUNKT MUSI BYĆ JAWNIE POTWIERDZONY

[ ] 1. Narracja opiera się na luce pomiarowej po 2011 r.
[ ] 2. Nie ma starego przekazu przesądzającego ekrany.
[ ] 3. Treść jest zgodna z pełną publiczną wersją dokumentu.
[ ] 4. Brak danych osobowych i prywatnych metadanych.
[ ] 5. Publicznie dostępny jest wyłącznie anonimowy PDF pod semantyczną nazwą.
[ ] 6. Nowa mapa jest lokalna, kompletna, dostępna i opisana jako poglądowa.
[ ] 7. Wizualizacja Redkom jest lokalna i niezmodyfikowana.
[ ] 8. Widocznie nazwano ją wizualizacją, nie fotografią/dowodem.
[ ] 9. Jest wymagany podpis i aktywny link Redkom z `noopener noreferrer`.
[ ] 10. Przyszła inwestycja jest opisana neutralnie i warunkowo.
[ ] 11. Chronologia jest czytelna, responsywna i rozdziela trzy poziomy informacji.
[ ] 12. Żądania są kompletne i pogrupowane w pięć obszarów.
[ ] 13. Istnieje pełna sekcja „Czego petycja nie przesądza”.
[ ] 14. Layout działa w wymaganych szerokościach bez poziomego scrolla.
[ ] 15. Klawiatura, focus, kontrast, nagłówki, alt, reduced motion i lightbox spełniają WCAG AA.
[ ] 16. Wszystkie istniejące testy/lint/build przeszły; jeśli projektu nadal nie buduje się, stan opisano uczciwie jako statyczny.
[ ] 17. Brak niedziałających linków wewnętrznych; wynik linków zewnętrznych jest udokumentowany.
[ ] 18. Brak błędów i ostrzeżeń aplikacji w konsoli.
[ ] 19. Działa obecne wdrożenie GitHub Pages, CNAME i routing.
[ ] 20. Raport końcowy wymienia zmienione/usunięte pliki, komendy z wynikami, decyzje prywatności i screenshoty.

Na końcu przedstaw zwięzły raport: lista plików zmienionych/usuniętych/dodanych; co zachowano; wynik audytu prywatności bez ujawniania wartości; dokładne komendy i ich wyniki; ograniczenia środowiska; ścieżki screenshotów. Nie deklaruj sukcesu dla kontroli, której nie uruchomiono.
```
