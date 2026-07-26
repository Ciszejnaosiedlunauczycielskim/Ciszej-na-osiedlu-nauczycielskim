const menu = document.querySelector('#menu');
const nav = document.querySelector('#nav');

function closeMenu({ returnFocus = false } = {}) {
  if (!menu || !nav) return;
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  if (returnFocus) menu.focus();
}

if (menu && nav) {
  menu.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    if (open) nav.querySelector('a')?.focus();
  });

  nav.addEventListener('click', event => {
    if (event.target.matches('a')) closeMenu();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      closeMenu({ returnFocus: true });
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 980 && nav.classList.contains('open')) closeMenu();
  });
}

const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();

const supportButton = document.querySelector('#support-button');
const supportCount = document.querySelector('#support-count');
const supportStatus = document.querySelector('#support-status');

const SUPPORT_API = 'https://api.counterapi.dev/v1/ciszejnaosiedlunauczycielskim-2026-7c9f1e/wsparcie';
const SUPPORT_STORAGE_KEY = 'ciszej-wsparcie-zapisane-v1';
const SUPPORT_COOKIE_NAME = 'ciszej_wsparcie_zapisane';

function readStoredSupport() {
  try {
    if (localStorage.getItem(SUPPORT_STORAGE_KEY) === '1') return true;
  } catch (error) {
    console.warn('Pamięć lokalna jest niedostępna.', error);
  }

  return document.cookie
    .split('; ')
    .some(cookie => cookie === `${SUPPORT_COOKIE_NAME}=1`);
}

function storeSupport() {
  try {
    localStorage.setItem(SUPPORT_STORAGE_KEY, '1');
  } catch (error) {
    console.warn('Nie udało się zapisać wsparcia w pamięci lokalnej.', error);
  }

  document.cookie = `${SUPPORT_COOKIE_NAME}=1; Max-Age=315360000; Path=/; SameSite=Lax; Secure`;
}

function extractCounterValue(payload) {
  const candidates = [
    payload?.value,
    payload?.count,
    payload?.Count,
    payload?.up_count,
    payload?.data?.value,
    payload?.data?.count,
    payload?.data?.Count,
    payload?.data?.up_count
  ];

  const candidate = candidates.find(value => Number.isFinite(Number(value)));
  return candidate === undefined ? null : Math.max(0, Math.trunc(Number(candidate)));
}

function renderCount(value) {
  if (!supportCount || value === null) return;
  supportCount.textContent = new Intl.NumberFormat('pl-PL').format(value);
}

function renderSupportedState(message = 'Wsparcie z tego urządzenia zostało już zapisane.') {
  if (!supportButton) return;
  supportButton.disabled = true;
  supportButton.textContent = 'Dziękujemy';
  if (supportStatus) supportStatus.textContent = message;
}

async function fetchCounter(path = '') {
  const response = await fetch(`${SUPPORT_API}${path}`, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) throw new Error(`Błąd licznika: ${response.status}`);
  return response.json();
}

async function loadSupportCount() {
  if (!supportCount) return;

  try {
    const payload = await fetchCounter();
    renderCount(extractCounterValue(payload));
  } catch (error) {
    // Nieistniejący jeszcze licznik lub chwilowa awaria pozostawia wartość początkową 0.
    console.warn('Nie udało się pobrać licznika wsparcia.', error);
  }
}

async function submitSupport() {
  if (!supportButton || readStoredSupport()) {
    renderSupportedState();
    return;
  }

  supportButton.disabled = true;
  supportButton.textContent = 'Zapisywanie…';
  if (supportStatus) supportStatus.textContent = '';

  try {
    const payload = await fetchCounter('/up');
    const value = extractCounterValue(payload);

    storeSupport();
    if (value !== null) {
      renderCount(value);
    } else if (supportCount) {
      const current = Number(supportCount.textContent.replace(/\s/g, '')) || 0;
      renderCount(current + 1);
    }

    renderSupportedState('Dziękujemy. Wsparcie zostało zapisane.');
  } catch (error) {
    supportButton.disabled = false;
    supportButton.textContent = 'Spróbuj ponownie';
    if (supportStatus) supportStatus.textContent = 'Nie udało się zapisać wsparcia. Spróbuj ponownie.';
    console.error('Nie udało się zapisać wsparcia.', error);
  }
}

if (supportButton && supportCount) {
  loadSupportCount();

  if (readStoredSupport()) renderSupportedState();
  supportButton.addEventListener('click', submitSupport);
}