const timelineEvents = [
  { date: '2011', title: 'Pomiar i analiza przy ul. Sudeckiej 24', text: 'Powstała historyczna dokumentacja pomiarowa oraz analiza wariantów zabezpieczeń. Materiał opisuje ówczesny stan i nie dowodzi stanu obecnego.' },
  { date: '2022', title: 'Strategiczne mapowanie hałasu', text: 'Mapa dla Tarnowa, wykonana metodą CNOSSOS-EU, stała się głównym punktem bazowym dla oceny układu DK94 i ul. Lwowskiej.' },
  { date: '15–25.07.2025', title: 'Interwencja poselska i odpowiedź GDDKiA', text: 'Interwencję skierowano 15 lipca, wpłynęła 18 lipca, a odpowiedź GDDKiA z 25 lipca odwołała się do map strategicznych i braku przekroczeń według modelu.' },
  { date: '08.01–08.05.2026', title: 'Publiczne informacje o możliwej jednostce wojskowej', text: 'Materiały potwierdziły etap rozpoznawczy; lokalizacja, parametry i układ dojazdowy nie zostały przesądzone.' },
  { date: '13.05.2026', title: 'Stanowisko ZDiK', text: 'ZDiK przedstawił interpretację wcześniejszych map akustycznych. W pakiecie publicznym zamieszczono opisowy wyciąg bez danych identyfikujących.' },
  { date: '17.07.2026', title: 'Stan procesu A4–DK94', text: 'Sprawdzono oficjalny stan prac przygotowawczych GDDKiA. Analizowane warianty pozostają scenariuszami, a nie przesądzonym przebiegiem.' },
  { date: 'Obecnie', title: 'Petycja i etap przygotowawczy', text: 'Wniosek dotyczy audytu danych, programu reprezentatywnych pomiarów i etapowej oceny skumulowanego oddziaływania.' }
];

const documents = [
  { title: 'Petycja wraz z pakietem dowodowym', meta: 'PDF · 45 stron · wersja publiczna', description: 'Zatwierdzony zestaw bez danych osób popierających, obejmujący petycję, mapę orientacyjną i materiały dowodowe.', url: 'dokumenty/zestaw-publiczny-do-bip.pdf' }
];

const counterUrl = 'https://api.counterapi.dev/v1/ciszejnaosiedlunauczycielskim-pl/poparcie';
const supportKey = 'ciszej-poparcie-v1';
const timeline = document.querySelector('#timeline');
const documentsContainer = document.querySelector('#documents');
const menuButton = document.querySelector('#menu-button');
const nav = document.querySelector('#main-nav');
const supportButton = document.querySelector('#support-button');
const supportCount = document.querySelector('#support-count');
const supportNote = document.querySelector('#support-note');

timeline.innerHTML = timelineEvents.map(({ date, title, text }) => `
  <li class="timeline-item">
    <time>${date}</time>
    <div><h3>${title}</h3><p>${text}</p></div>
  </li>
`).join('');

documentsContainer.innerHTML = documents.map(({ title, meta, description, url }) => `
  <article class="document-card">
    <div><p class="document-meta">${meta}</p><h3>${title}</h3><p>${description}</p></div>
    <a class="button button-outline" href="${url}" target="_blank" rel="noopener">Otwórz dokument <span aria-hidden="true">↗</span></a>
  </article>
`).join('');

function supportLabel(value) {
  const lastTwo = value % 100;
  const last = value % 10;
  const noun = last === 1 && lastTwo !== 11 ? 'osoba popiera' :
    last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'osoby popierają' : 'osób popiera';
  return `${value} ${noun} inicjatywę`;
}

function savedSupport() {
  try { return localStorage.getItem(supportKey) === 'true'; } catch { return false; }
}

function rememberSupport() {
  try { localStorage.setItem(supportKey, 'true'); } catch { /* Licznik nadal działa bez pamięci lokalnej. */ }
}

function setSupportedState() {
  supportButton.textContent = 'Dziękujemy za poparcie!';
  supportButton.disabled = true;
  supportNote.textContent = 'Poparcie zostało już zapisane w tej przeglądarce.';
}

function showCount(payload) {
  const value = Number(payload?.count ?? payload?.value);
  if (!Number.isFinite(value)) throw new Error('Nieprawidłowa odpowiedź licznika');
  supportCount.textContent = supportLabel(value);
}

async function loadSupport() {
  try {
    const response = await fetch(counterUrl);
    if (!response.ok) throw new Error('Licznik niedostępny');
    showCount(await response.json());
  } catch {
    supportCount.textContent = 'Licznik jest chwilowo niedostępny';
    supportNote.textContent = 'Spróbuj ponownie później.';
    supportNote.classList.add('is-error');
  }
}

if (savedSupport()) setSupportedState();

supportButton.addEventListener('click', async () => {
  if (savedSupport()) { setSupportedState(); return; }
  supportButton.disabled = true;
  supportButton.textContent = 'Zapisujemy poparcie…';
  supportNote.classList.remove('is-error');
  try {
    const response = await fetch(`${counterUrl}/up`);
    if (!response.ok) throw new Error('Licznik niedostępny');
    showCount(await response.json());
    rememberSupport();
    setSupportedState();
  } catch {
    supportButton.disabled = false;
    supportButton.textContent = 'Popieram inicjatywę';
    supportNote.textContent = 'Nie udało się zapisać poparcia. Spróbuj ponownie później.';
    supportNote.classList.add('is-error');
  }
});

menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(open));
});

nav.addEventListener('click', event => {
  if (event.target.matches('a')) {
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('is-open')) {
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.focus();
  }
});

document.querySelector('#year').textContent = new Date().getFullYear();
loadSupport();
