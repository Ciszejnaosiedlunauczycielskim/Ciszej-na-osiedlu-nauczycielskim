const counterUrl = 'https://api.counterapi.dev/v1/ciszejnaosiedlunauczycielskim-pl/poparcie';
const supportKey = 'ciszej-poparcie-v1';
const menu = document.querySelector('#menu');
const nav = document.querySelector('#nav');
const supportButton = document.querySelector('#support-button');
const supportCount = document.querySelector('#support-count');
const supportNote = document.querySelector('#support-note');

function supportLabel(value) {
  const lastTwo = value % 100;
  const last = value % 10;
  const noun = last === 1 && lastTwo !== 11 ? 'osoba popiera' :
    last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'osoby popierają' : 'osób popiera';
  return `${value} ${noun} inicjatywę`;
}

function showCount(payload) {
  const value = Number(payload?.count ?? payload?.value);
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid counter response');
  supportCount.textContent = supportLabel(value);
}

async function loadSupport() {
  try {
    const response = await fetch(counterUrl);
    if (!response.ok) throw new Error('Counter unavailable');
    showCount(await response.json());
  } catch {
    supportCount.textContent = 'Licznik poparcia jest chwilowo niedostępny.';
    supportNote.textContent = 'Nie udało się teraz odświeżyć licznika. Spróbuj ponownie później.';
    supportNote.classList.add('error');
  }
}

let hasSupported = false;
try {
  hasSupported = localStorage.getItem(supportKey) === 'true';
} catch {
  supportNote.textContent = 'Ta przeglądarka nie pozwala zapamiętać poparcia na urządzeniu.';
}

if (hasSupported) {
  supportButton.textContent = 'Dziękujemy za poparcie!';
  supportButton.disabled = true;
}

supportButton.addEventListener('click', async () => {
  supportButton.disabled = true;
  supportButton.textContent = 'Zapisujemy poparcie…';
  supportNote.classList.remove('error');
  supportNote.textContent = 'Przeglądarka zapamięta poparcie na tym urządzeniu.';

  try {
    const response = await fetch(`${counterUrl}/up`);
    if (!response.ok) throw new Error('Counter unavailable');
    showCount(await response.json());
    try {
      localStorage.setItem(supportKey, 'true');
    } catch {
      supportNote.textContent = 'Poparcie zapisano, ale przeglądarka nie może zapamiętać go na urządzeniu.';
    }
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
