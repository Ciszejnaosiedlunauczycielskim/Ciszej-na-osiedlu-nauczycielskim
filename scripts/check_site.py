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

        for required_text in (
            "Chcemy wiedzieć, jaki hałas naprawdę dociera do naszych domów.",
            "I na tej podstawie zdecydować, jak je chronić.",
            "Problem jest prosty: brakuje aktualnego pomiaru przy domach.",
            "Nie chcemy zgadywać. Chcemy zmierzyć.",
            "Trzech rzeczy. W tej kolejności.",
            "159 mieszkańców",
            "Sprawa ruszyła. Teraz trzeba dopilnować badań.",
            "Nie trzeba wierzyć opisowi tej strony.",
        ):
            if required_text not in content:
                errors.append(f"{page.name}: brakuje wymaganego tekstu strony głównej: {required_text}")

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
