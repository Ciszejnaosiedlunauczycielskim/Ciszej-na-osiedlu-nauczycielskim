const events = [
  ['2025–2026', 'Zbieranie materiałów', 'Porządkowanie odpowiedzi instytucji i danych dotyczących hałasu oraz ruchu.'],
  ['2026', 'Petycja mieszkańców', 'Przygotowanie publicznej petycji i pakietu argumentów.'],
  ['Obecnie', 'Informowanie i dalsze działania', 'Publikacja dokumentów i aktualizowanie mieszkańców.']
];

const documents = [
  ['Petycja mieszkańców', 'Petycja', 'Publiczna wersja petycji bez danych osób popierających.'],
  ['Pakiet dowodowy', 'Materiały dowodowe', 'Zestaw argumentów i dokumentów źródłowych.'],
  ['Odpowiedzi instytucji', 'Odpowiedzi', 'Korespondencja i stanowiska instytucji.']
];

const counterUrl = 'https://api.counterapi.dev/v1/ciszejnaosiedlunauczycielskim-pl/poparcie';
const supportKey = 'ciszej-poparcie-v1';
const timeline = document.querySelector('#timeline');
const docs = document.querySelector('#docs');
const menu = document.querySelector('#menu');
const nav = document.querySelector('#nav');
const supportButton = document.querySelector('#support-button');
const supportCount = document.querySelector('#support-count');
const supportNote = document.querySelector('#support-note');

timeline.innerHTML = events.map(event => `
  <article class="event">
    <time>${event[0]}</time>
    <div><h3>${event[1]}</h3><p>${event[2]}</p></div>
  </article>
`).join('');

docs.innerHTML = documents.map(document => `
  <article class="doc">
    <span class="tag">${document[1]}</span>
    <h3>${document[0]}</h3>
    <p>${document[2]}</p>
    <span class="disabled">Plik zostanie dodany w kolejnym etapie</span>
  </article>
`).join('');

function supportLabel(value) {
  const lastTwo = value % 100;
  const last = value % 10;
  const noun = last === 1 && lastTwo !== 11 ? 'osoba popiera' :
    last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'osoby popierają' : 'osób popiera';
  return `${value} ${noun} inicjatywę`;
}

function showCount(payload) {
  const value = Number(payload?.count ?? payload?.value ?? 0);
  supportCount.textContent = supportLabel(Number.isFinite(value) ? value : 0);
}

async function loadSupport() {
  try {
    const response = await fetch(counterUrl);
    if (!response.ok) throw new Error('Counter unavailable');
    showCount(await response.json());
  } catch {
    supportNote.textContent = 'Nie udało się teraz odświeżyć licznika. Spróbuj ponownie później.';
    supportNote.classList.add('error');
  }
}

if (localStorage.getItem(supportKey)) {
  supportButton.textContent = 'Dziękujemy za poparcie!';
  supportButton.disabled = true;
}

supportButton.addEventListener('click', async () => {
  supportButton.disabled = true;
  supportButton.textContent = 'Zapisujemy poparcie…';
  supportNote.classList.remove('error');
  supportNote.textContent = 'Jedno poparcie z jednego urządzenia.';

  try {
    const response = await fetch(`${counterUrl}/up`);
    if (!response.ok) throw new Error('Counter unavailable');
    showCount(await response.json());
    localStorage.setItem(supportKey, 'true');
    supportButton.textContent = 'Dziękujemy za poparcie!';
  } catch {
    supportButton.disabled = false;
    supportButton.textContent = 'Popieram inicjatywę';
    supportNote.textContent = 'Nie udało się zapisać poparcia. Spróbuj ponownie później.';
    supportNote.classList.add('error');
  }
});

menu.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});

nav.addEventListener('click', event => {
  if (event.target.matches('a')) {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
  }
});

document.querySelector('#year').textContent = new Date().getFullYear();
loadSupport();
