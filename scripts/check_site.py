from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
PUBLIC_PAGES = [
    ROOT / "index.html",
    ROOT / "historia-sprawy.html",
    ROOT / "dane.html",
    ROOT / "inwestycje.html",
    ROOT / "aktualnosci.html",
    ROOT / "zrodla.html",
    ROOT / "media.html",
]
HTML_FILES = PUBLIC_PAGES + [ROOT / "404.html"]
REQUIRED_FILES = [
    ROOT / "assets/css/style.css",
    ROOT / "assets/js/app.js",
    ROOT / "assets/img/WIDOK NA OSIEDLE W KLINIE.jpeg",
    ROOT / "assets/img/WIDOK NA BRAK PANELI.jpeg",
    ROOT / "assets/img/MAPA MIASTA I OSIEDLA.png",
    ROOT / "assets/img/wizualizacja-parku-handlowego-lwowska-redkom.jpg",
    ROOT / "documents/petycja-osiedle-nauczycielskie-wersja-publiczna.pdf",
    ROOT / "assets/icons/favicon.svg",
    ROOT / "assets/icons/apple-touch-icon.png",
    ROOT / "manifest.webmanifest",
    ROOT / "sitemap.xml",
]
REQUIRED_HOME_IDS = {
    "top",
    "o-co-chodzi",
    "co-wiemy",
    "czego-chcemy",
    "status",
    "odpowiedz-miasta",
    "historia",
    "aktualnosci",
    "dane",
    "inwestycje",
    "dokumenty",
    "kontakt",
}
REQUIRED_HOME_FRAGMENTS = [
    'class="human-hero"',
    'class="human-statement"',
    'class="human-fact-list"',
    'class="human-ask-list"',
    'class="wrap human-place-grid"',
    'class="human-progress-list"',
    'class="human-link-grid"',
    'href="dane.html"',
    'href="inwestycje.html"',
    'href="aktualnosci.html"',
    'href="zrodla.html"',
    'href="media.html"',
]
FORBIDDEN_HOME_FRAGMENTS = [
    'class="process-grid"',
    'class="status-badge"',
    'class="milestone-grid"',
    'class="context-teaser-grid"',
    'class="resource-grid"',
    'class="news-card',
]
FORBIDDEN_TEXT = [
    "counterapi.dev",
    "nadałem listy",
    "złożyliśmy petycję",
    "mieszancom-osiedla-nauczycielskiego",
]


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.h1_count = 0
        self.ids: list[str] = []
        self.refs: list[str] = []
        self.images: list[dict[str, str | None]] = []
        self.blank_links: list[dict[str, str | None]] = []
        self.buttons: list[dict[str, str | None]] = []
        self._button_depth = 0
        self._button_text: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "h1":
            self.h1_count += 1
        if values.get("id"):
            self.ids.append(values["id"] or "")
        for attr in ("href", "src"):
            value = values.get(attr)
            if value:
                self.refs.append(value)
        if values.get("srcset"):
            for item in (values["srcset"] or "").split(","):
                ref = item.strip().split(" ", 1)[0]
                if ref:
                    self.refs.append(ref)
        if tag == "img":
            self.images.append(values)
        if tag == "a" and values.get("target") == "_blank":
            self.blank_links.append(values)
        if tag == "button":
            self.buttons.append(values)
            self._button_depth = 1
            self._button_text = []
        elif self._button_depth:
            self._button_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if self._button_depth:
            self._button_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._button_depth:
            self._button_text.append(data.strip())


def is_local_reference(value: str) -> bool:
    if value.startswith(("mailto:", "tel:", "data:", "javascript:")):
        return False
    parsed = urlparse(value)
    return not parsed.scheme and not parsed.netloc


def split_reference(page: Path, value: str) -> tuple[Path, str | None] | None:
    if not is_local_reference(value):
        return None

    if value.startswith("#"):
        return page, value[1:] or None

    raw_path, _, fragment = value.partition("#")
    raw_path = raw_path.split("?", 1)[0]

    if raw_path in ("", "./"):
        target = ROOT / "index.html" if raw_path == "./" else page
    else:
        decoded = unquote(raw_path)
        target = (page.parent / decoded).resolve()
        if target.is_dir():
            target = target / "index.html"

    return target, fragment or None


def page_ids(page: Path) -> set[str]:
    content = page.read_text(encoding="utf-8")
    parser = PageParser()
    parser.feed(content)
    return set(parser.ids)


def check_page(page: Path) -> list[str]:
    errors: list[str] = []
    content = page.read_text(encoding="utf-8")
    parser = PageParser()
    parser.feed(content)

    if parser.h1_count != 1:
        errors.append(f"{page.name}: oczekiwano jednego H1, znaleziono {parser.h1_count}")

    duplicate_ids = sorted({x for x in parser.ids if parser.ids.count(x) > 1})
    if duplicate_ids:
        errors.append(f"{page.name}: zduplikowane id: {', '.join(duplicate_ids)}")

    if page in PUBLIC_PAGES:
        if '<html lang="pl">' not in content:
            errors.append(f"{page.name}: brak lang=pl")
        if '<meta name="viewport"' not in content:
            errors.append(f"{page.name}: brak meta viewport")
        if '<meta name="description"' not in content:
            errors.append(f"{page.name}: brak meta description")
        if '<link rel="canonical"' not in content:
            errors.append(f"{page.name}: brak canonical")
        if 'class="skip"' not in content:
            errors.append(f"{page.name}: brak linku pomijającego nawigację")
        if 'id="menu"' not in content or 'id="nav"' not in content:
            errors.append(f"{page.name}: brak spójnej nawigacji mobilnej")
        if 'assets/css/style.css?v=80' not in content:
            errors.append(f"{page.name}: nieaktualna wersja arkusza CSS")
        if 'assets/js/app.js?v=43' not in content:
            errors.append(f"{page.name}: brak aktualnego skryptu wspólnej nawigacji")

    if page.name == "index.html":
        missing_ids = REQUIRED_HOME_IDS - set(parser.ids)
        if missing_ids:
            errors.append(f"{page.name}: brakuje sekcji: {', '.join(sorted(missing_ids))}")

        for fragment in REQUIRED_HOME_FRAGMENTS:
            if fragment not in content:
                errors.append(f"{page.name}: brakuje wymaganego elementu: {fragment}")

        for fragment in FORBIDDEN_HOME_FRAGMENTS:
            if fragment in content:
                errors.append(f"{page.name}: strona główna zawiera stary, niepożądany element: {fragment}")

        if content.count("<h1") != 1:
            errors.append(f"{page.name}: strona główna powinna mieć jeden H1")

        # Testujemy istnienie istotnego faktu, nie brzmienie redakcyjnego nagłówka.
        if "159" not in content or "petycj" not in content.lower():
            errors.append(f"{page.name}: brak podstawowej informacji o petycji 159 mieszkańców")

    if page.name == "index.html":
        for fragment in ('id="share-button"', 'id="share-status"', 'zrodla.html#dokumentacja-2011'):
            if fragment not in content:
                errors.append(f"{page.name}: brak kontroli źródeł lub udostępniania: {fragment}")

    if page.name == "dane.html":
        for fragment in ("<strong>Gdzie?</strong>", "<strong>Co to znaczy?</strong>", "Pomiar", "Prognoza"):
            if fragment not in content:
                errors.append(f"{page.name}: brak objaśnienia danych: {fragment}")

    if page.name == "zrodla.html":
        for fragment in ("Kopia nieopublikowana", "Dokument dostępny z linku", "Dokument posiadany"):
            if fragment not in content:
                errors.append(f"{page.name}: brak informacji o dostępie do źródeł: {fragment}")

    if page.name == "dane.html":
        for fragment in ('class="road-schematic"', 'class="road-steps"', 'class="method-plain"'):
            if fragment not in content:
                errors.append(f"{page.name}: brak schematu lub objaśnienia metod: {fragment}")

    if page.name == "zrodla.html" and 'id="miasto-ruch-2016"' not in content:
        errors.append(f"{page.name}: brak oficjalnego źródła danych o ruchu z 2016 r.")

    if page.name == "zrodla.html" and 'id="rdn-zapowiedz-2026"' not in content:
        errors.append(f"{page.name}: brak weryfikowalnego źródła zapowiedzi ZDiK")

    if page.name == "index.html" and content.count('class="fact-source"') < 3:
        errors.append(f"{page.name}: brakuje odnośników do źródeł przy liczbach")

    if page.name == "media.html":
        for required_media_text in (
            "TVP3 Kraków",
            "RDN Małopolska",
            "Gazeta Krakowska",
            "Tarnów Nasze Miasto",
            "14.09.2026",
            "25.09.2026",
        ):
            if required_media_text not in content:
                errors.append(f"{page.name}: niepełne archiwum mediów — brak: {required_media_text}")
        if "press-card" in content or "<style>" in content:
            errors.append(f"{page.name}: pozostał stary, niespójny layout mediów")

    lowered = content.lower()
    for phrase in FORBIDDEN_TEXT:
        if phrase in lowered:
            errors.append(f"{page.name}: znaleziono niepożądane sformułowanie: {phrase}")

    for img in parser.images:
        if img.get("alt") is None:
            errors.append(f"{page.name}: obraz bez atrybutu alt")
        if not img.get("width") or not img.get("height"):
            errors.append(f"{page.name}: obraz bez jawnych width/height")

    for link in parser.blank_links:
        rel = (link.get("rel") or "").split()
        if "noopener" not in rel or "noreferrer" not in rel:
            errors.append(f"{page.name}: target=_blank bez rel=noopener noreferrer")

    for button in parser.buttons:
        if not button.get("type"):
            errors.append(f"{page.name}: przycisk bez jawnego type")

    for value in parser.refs:
        split = split_reference(page, value)
        if split is None:
            continue
        target, fragment = split
        if not target.exists():
            errors.append(f"{page.name}: brak lokalnego pliku dla odnośnika {value}")
            continue
        if fragment and target.suffix.lower() == ".html":
            ids = page_ids(target)
            if fragment not in ids:
                errors.append(f"{page.name}: brak kotwicy #{fragment} w {target.name}")

    return errors


def check_css() -> list[str]:
    errors: list[str] = []
    css = (ROOT / "assets/css/style.css").read_text(encoding="utf-8")
    if css.count("{") != css.count("}"):
        errors.append("assets/css/style.css: niezbilansowane nawiasy klamrowe")
    for required in (
        "@media(max-width:980px)",
        "@media(max-width:700px)",
        ".home-human .human-hero",
        ".human-statement",
        ".human-fact-list",
        ".human-ask-list",
        ".human-place-grid",
        ".human-progress-list",
        ".human-link-grid",
        ".road-schematic",
        ".method-plain",
    ):
        if required not in css:
            errors.append(f"assets/css/style.css: brakuje reguły {required}")
    return errors


def check_sitemap() -> list[str]:
    errors: list[str] = []
    content = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    for page in PUBLIC_PAGES:
        url = "https://ciszejnaosiedlunauczycielskim.pl/" if page.name == "index.html" else f"https://ciszejnaosiedlunauczycielskim.pl/{page.name}"
        if url not in content:
            errors.append(f"sitemap.xml: brakuje {url}")
    return errors



def check_fact_consistency() -> list[str]:
    """Stałe fakty ze źródeł, a nie sztywne brzmienie artykułów."""
    errors: list[str] = []
    required_values = {
        "dane.html": ("20 142", "11 530", "2274,5", "1339",
                      "62,8", "55,9", "57,8", "50,9",
                      "63,5", "56,8", "58,5", "51,8",
                      "Szpital", "Karpacka", "D07", "D09"),
        "aktualnosci.html": ("20 142", "11 530", "2274,5", "1339",
                             "63,5", "58,5", "2027", "D20",
                             "status-wystapien"),
        "zrodla.html": ("D07", "D09", "D13", "D14", "D20",
                        "efektar-2016", "rdos-2025"),
        "inwestycje.html": ("DK73", "DK94", "RDOŚ", "PPIS",
                             "24-metrowy"),
    }
    for relative_path, values in required_values.items():
        content = (ROOT / relative_path).read_text(encoding="utf-8")
        for value in values:
            if value not in content:
                errors.append(f"{relative_path}: brakuje kluczowego faktu lub oznaczenia źródła: {value}")

    data = (ROOT / "dane.html").read_text(encoding="utf-8")
    if "Dane o ruchu z 2016 r. opisują dwa pierwsze odcinki" in data:
        errors.append("dane.html: powrócił stary, błędny opis przekrojów EFEKTAR")

    # Krytyczna korekta mieszkańców: EFEKTAR przekrój III i SWECO
    # odcinek D opisują TEN SAM odcinek Szpital–Karpacka.
    # Test wyłapuje powrót wcześniej wielokrotnie prostowanego błędu.
    forbidden_geography = (
        "na pobliskim odcinku",
        "nie są dwa pomiary w tym samym miejscu i czasie",
        "niejednoznacznie identycznych przekrojów",
        "to podobnie opisany rejon",
        "To powiązany rejon",
        "nieco inaczej opisane odcinki",
        "granice porównywanych odcinków nie zostały",
        "należy sprawdzić granice odcinków",
    )
    for page_name in ("index.html", "dane.html", "aktualnosci.html",
                      "zrodla.html", "historia-sprawy.html"):
        page_content = (ROOT / page_name).read_text(encoding="utf-8")
        for error_phrase in forbidden_geography:
            if error_phrase.lower() in page_content.lower():
                errors.append(f"{page_name}: wrócił błędny opis lokalizacji EFEKTAR/SWECO: {error_phrase}")
    for page_name in ("index.html", "dane.html", "aktualnosci.html",
                      "zrodla.html", "historia-sprawy.html"):
        page_content = (ROOT / page_name).read_text(encoding="utf-8")
        if "tego samego odcinka" not in page_content.lower():
            errors.append(f"{page_name}: brak jasnego stwierdzenia, że EFEKTAR i SWECO dotyczą tego samego odcinka")

    news = (ROOT / "aktualnosci.html").read_text(encoding="utf-8")
    if "2027" in news and "projekcie budżetu" not in news:
        errors.append("aktualnosci.html: zapowiedź 2027 bez rozróżnienia projektu budżetu")
    if "Rozpoczęła się kontrola NIK" in news:
        errors.append("aktualnosci.html: niepotwierdzone rozpoczęcie kontroli")

    # Odrębne instytucje wymagają własnych wpisów w rejestrze.
    for name in ("Najwyższa Izba Kontroli", "Rzecznik Praw Obywatelskich",
                 "GDDKiA, Oddział Kraków", "Marszałek Województwa Małopolskiego",
                 "Główny Inspektor Ochrony Środowiska"):
        if name not in news:
            errors.append(f"aktualnosci.html: brak indywidualnego wpisu — {name}")
    return errors


def main() -> None:
    errors: list[str] = []

    for required in REQUIRED_FILES:
        if not required.exists() or required.stat().st_size == 0:
            errors.append(f"Brak wymaganego pliku: {required.relative_to(ROOT)}")

    for page in HTML_FILES:
        if not page.exists():
            errors.append(f"Brak strony: {page.relative_to(ROOT)}")
            continue
        errors.extend(check_page(page))

    errors.extend(check_css())
    errors.extend(check_sitemap())
    errors.extend(check_fact_consistency())

    app_js = (ROOT / "assets/js/app.js").read_text(encoding="utf-8")
    if "editorial.css" in app_js:
        errors.append("assets/js/app.js: nadal ładuje stary arkusz editorial.css")
    if "mapScroll" in app_js or "map-scroll" in app_js:
        errors.append("assets/js/app.js: nadal zawiera obsługę przewijanej mapy")

    if errors:
        print("Kontrola strony zakończona błędami:")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    print("Kontrola strony zakończona poprawnie.")


if __name__ == "__main__":
    main()
