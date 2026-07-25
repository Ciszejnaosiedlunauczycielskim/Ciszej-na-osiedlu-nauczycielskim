from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = [ROOT / "index.html", ROOT / "historia-sprawy.html"]
REQUIRED_FILES = [
    ROOT / "assets/img/osiedle-miedzy-drogami-4k.webp",
    ROOT / "assets/img/osiedle-miedzy-drogami-4k.jpg",
    ROOT / "assets/img/brak-panelu-przy-osiedlu-4k.webp",
    ROOT / "assets/img/brak-panelu-przy-osiedlu-4k.jpg",
    ROOT / "assets/img/mapa-osiedla-nauczycielskiego-tarnow-nowa.avif",
    ROOT / "assets/img/mapa-osiedle-park-lwowska-4k.webp",
    ROOT / "assets/img/mapa-osiedle-park-lwowska-4k.jpg",
    ROOT / "assets/img/wizualizacja-parku-handlowego-lwowska-redkom.jpg",
    ROOT / "documents/petycja-osiedle-nauczycielskie-wersja-publiczna.pdf",
]
REQUIRED_HOME_IDS = {"top", "miejsce", "mapa", "historia", "teraz", "dalej", "dokumenty"}
FORBIDDEN_TEXT = [
    "chcemy znaleźć pieniądze",
    "planowanego panelu o długości około 296 metrów nie ma na tym odcinku",
    "maksymalnymi normami obowiązującymi wtedy",
    "counterapi.dev",
    "brakuje tylko jednego elementu",
    "standard tej sprawy",
    "nie brakuje dokumentów",
    "zebrane dokumenty pozwalają odtworzyć historię",
    "nie zaczyna się od petycji",
]
FORBIDDEN_HOME_FRAGMENTS = [
    "snapshot-grid",
    "journey-step",
    "editorialStyles",
    'id="map-scroll"',
]
REQUIRED_HOME_FRAGMENTS = [
    "map-layout",
    "map-detail-crop",
    "Planowana jednostka wojskowa w Tarnowie",
]


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.h1_count = 0
        self.ids: set[str] = set()
        self.local_refs: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "h1":
            self.h1_count += 1
        if values.get("id"):
            self.ids.add(values["id"] or "")
        for attr in ("href", "src", "srcset"):
            value = values.get(attr)
            if value:
                self.local_refs.append(value)


def is_local_reference(value: str) -> bool:
    if value.startswith(("#", "mailto:", "tel:", "data:")):
        return False
    parsed = urlparse(value)
    return not parsed.scheme and not parsed.netloc


def resolve_local_reference(page: Path, value: str) -> Path:
    path = value.split(",", 1)[0].strip().split(" ", 1)[0]
    path = path.split("#", 1)[0].split("?", 1)[0]
    return (page.parent / path).resolve()


def check_page(page: Path) -> list[str]:
    errors: list[str] = []
    content = page.read_text(encoding="utf-8")
    parser = PageParser()
    parser.feed(content)

    if parser.h1_count != 1:
        errors.append(f"{page.name}: oczekiwano jednego H1, znaleziono {parser.h1_count}")

    if page.name == "index.html":
        missing_ids = REQUIRED_HOME_IDS - parser.ids
        if missing_ids:
            errors.append(f"{page.name}: brakuje sekcji: {', '.join(sorted(missing_ids))}")
        for fragment in FORBIDDEN_HOME_FRAGMENTS:
            if fragment in content:
                errors.append(f"{page.name}: znaleziono niepożądany element: {fragment}")
        for fragment in REQUIRED_HOME_FRAGMENTS:
            if fragment not in content:
                errors.append(f"{page.name}: brakuje wymaganego elementu: {fragment}")

    lowered = content.lower()
    for phrase in FORBIDDEN_TEXT:
        if phrase in lowered:
            errors.append(f"{page.name}: znaleziono zabronione lub nieaktualne sformułowanie: {phrase}")

    for value in parser.local_refs:
        if not is_local_reference(value):
            continue
        target = resolve_local_reference(page, value)
        if not target.exists():
            errors.append(f"{page.name}: brak lokalnego pliku dla odnośnika {value}")

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
