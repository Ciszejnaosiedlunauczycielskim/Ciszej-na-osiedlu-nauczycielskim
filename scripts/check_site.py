from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = [ROOT / "index.html", ROOT / "historia-sprawy.html"]
REQUIRED_FILES = [
    ROOT / "assets/img/osiedle-miedzy-drogami-4k.webp",
    ROOT / "assets/img/brak-panelu-przy-osiedlu-4k.webp",
    ROOT / "assets/img/mapa-osiedle-park-lwowska-4k.webp",
    ROOT / "documents/petycja-osiedle-nauczycielskie-wersja-publiczna.pdf",
]
FORBIDDEN_TEXT = [
    "chcemy znaleźć pieniądze",
    "planowanego panelu o długości około 296 metrów nie ma na tym odcinku",
    "maksymalnymi normami obowiązującymi wtedy",
    "counterapi.dev",
]


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.h1_count = 0
        self.local_refs: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag == "h1":
            self.h1_count += 1
        values = dict(attrs)
        for attr in ("href", "src"):
            value = values.get(attr)
            if value:
                self.local_refs.append(value)


def is_local_reference(value: str) -> bool:
    if value.startswith(("#", "mailto:", "tel:", "data:")):
        return False
    parsed = urlparse(value)
    return not parsed.scheme and not parsed.netloc


def resolve_local_reference(page: Path, value: str) -> Path:
    path = value.split("#", 1)[0].split("?", 1)[0]
    return (page.parent / path).resolve()


def check_page(page: Path) -> list[str]:
    errors: list[str] = []
    content = page.read_text(encoding="utf-8")
    parser = PageParser()
    parser.feed(content)

    if parser.h1_count != 1:
        errors.append(f"{page.name}: oczekiwano jednego H1, znaleziono {parser.h1_count}")

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

    if errors:
        print("Kontrola strony zakończona błędami:")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    print("Kontrola strony zakończona poprawnie.")


if __name__ == "__main__":
    main()
