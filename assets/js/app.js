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
const supportLabel = document.querySelector('#support-label');
const supportStatus = document.querySelector('#support-status');
const supportCounter = document.querySelector('.support-counter');

const SUPPORT_API = 'https://api.counterapi.dev/v1/ciszejnaosiedlunauczycielskim-2026-7c9f1e/wsparcie/';
const SUPPORT_STORAGE_KEY = 'ciszej-wsparcie-zapisane-v1';
const SUPPORT_COOKIE_NAME = 'ciszej_wsparcie_zapisane';
const SUPPORT_CACHE_KEY = 'ciszej-wsparcie-licznik-v3';
const SUPPORT_PENDING_KEY = 'ciszej-wsparcie-oczekuje-v2';
const SUPPORT_LOCK_KEY = 'ciszej-wsparcie-blokada-v2';
const SUPPORT_TIMEOUT_MS = 10000;
const SUPPORT_CACHE_MAX_AGE_MS = 60000;
const SUPPORT_LOCK_MAX_AGE_MS = 20000;
const SUPPORT_READ_RETRY_DELAY_MS = 30000;

let counterRequest = null;
let readRetryTimer = null;
let supportChannel = null;

try {
  if ('BroadcastChannel' in window) {
    supportChannel = new BroadcastChannel('ciszej-wsparcie-v2');
  }
} catch (error) {
  console.warn('[LICZNIK] BroadcastChannel niedostępny.', error);
}

function logCounter(stage, details = {}) {
  const method = stage === 'ERROR' || stage === 'FINAL FAILURE'
    ? 'error'
    : stage === 'WARNING'
      ? 'warn'
      : 'info';
  console[method](`[LICZNIK] ${stage}`, details);
}

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    logCounter('WARNING', { place: 'localStorage.getItem', key, error });
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    logCounter('WARNING', { place: 'localStorage.setItem', key, error });
    return false;
  }
}

function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    logCounter('WARNING', { place: 'localStorage.removeItem', key, error });
  }
}

function readStoredSupport() {
  if (storageGet(SUPPORT_STORAGE_KEY) === '1') return true;

  try {
    return document.cookie
      .split('; ')
      .some(cookie => cookie === `${SUPPORT_COOKIE_NAME}=1`);
  } catch (error) {
    logCounter('WARNING', { place: 'cookie.read', error });
    return false;
  }
}

function storeSupport() {
  storageSet(SUPPORT_STORAGE_KEY, '1');
  storageRemove(SUPPORT_PENDING_KEY);

  try {
    document.cookie = `${SUPPORT_COOKIE_NAME}=1; Max-Age=315360000; Path=/; SameSite=Lax; Secure`;
  } catch (error) {
    logCounter('WARNING', { place: 'cookie.write', error });
  }
}

function readPendingSupport() {
  return storageGet(SUPPORT_PENDING_KEY);
}

function queueOfflineSupport() {
  storageSet(SUPPORT_PENDING_KEY, 'offline');
}

function clearPendingSupport() {
  storageRemove(SUPPORT_PENDING_KEY);
}

function readCachedCounter() {
  const raw = storageGet(SUPPORT_CACHE_KEY);
  if (!raw) return null;

  try {
    const cached = JSON.parse(raw);
    const value = Number(cached?.value);
    const updatedAt = Number(cached?.updatedAt);

    if (!Number.isFinite(value) || !Number.isFinite(updatedAt)) return null;
    return {
      value: Math.max(0, Math.trunc(value)),
      updatedAt
    };
  } catch (error) {
    logCounter('WARNING', { place: 'cache.parse', error });
    return null;
  }
}

function storeCachedCounter(value) {
  const cached = { value, updatedAt: Date.now() };
  storageSet(SUPPORT_CACHE_KEY, JSON.stringify(cached));
  supportChannel?.postMessage({ type: 'counter', ...cached });
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

function getSupportLabel(value) {
  const absolute = Math.abs(value);
  const lastDigit = absolute % 10;
  const lastTwoDigits = absolute % 100;

  if (absolute === 1) return 'osoba wspiera inicjatywę';
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14)) {
    return 'osoby wspierają inicjatywę';
  }
  return 'osób wspiera inicjatywę';
}

function renderCount(value) {
  if (!supportCount || !supportLabel || value === null) return;

  const formatted = new Intl.NumberFormat('pl-PL').format(value);
  const label = getSupportLabel(value);

  supportCount.textContent = formatted;
  supportCount.setAttribute('aria-label', `${formatted} ${label}`);
  supportLabel.textContent = label;
  supportCounter?.setAttribute('aria-label', `${formatted} ${label}`);
}

function renderLoading() {
  if (!supportCount || readCachedCounter()) return;
  supportCount.textContent = '…';
  supportCount.setAttribute('aria-label', 'Pobieranie aktualnej liczby osób wspierających');
  if (supportLabel) supportLabel.textContent = 'pobieranie aktualnej liczby';
}

function renderUnavailable() {
  const cached = readCachedCounter();
  if (cached) {
    renderCount(cached.value);
    return;
  }

  if (supportCount) supportCount.textContent = '—';
  if (supportLabel) supportLabel.textContent = 'licznik chwilowo się aktualizuje';
  supportCounter?.setAttribute('aria-label', 'Aktualizacja licznika chwilowo niedostępna');
}

function renderSupportedState(message = 'Wsparcie z tego urządzenia zostało już zapisane.') {
  if (!supportButton) return;
  supportButton.disabled = true;
  supportButton.textContent = 'Dziękujemy';
  if (supportStatus) supportStatus.textContent = message;
}

function acquireSubmitLock() {
  const now = Date.now();
  const existing = Number(storageGet(SUPPORT_LOCK_KEY));

  if (Number.isFinite(existing) && now - existing < SUPPORT_LOCK_MAX_AGE_MS) {
    return false;
  }

  storageSet(SUPPORT_LOCK_KEY, String(now));
  return true;
}

function releaseSubmitLock() {
  storageRemove(SUPPORT_LOCK_KEY);
}

async function requestCounter(path = '') {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), SUPPORT_TIMEOUT_MS);
  const endpoint = path ? new URL(path.replace(/^\/+/, ''), SUPPORT_API).href : SUPPORT_API;

  logCounter('API REQUEST', { endpoint, path });

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    const body = await response.text();
    logCounter('API RESPONSE', { endpoint, status: response.status, ok: response.ok });

    if (!response.ok) {
      const error = new Error(`Błąd licznika: ${response.status}${body ? ` — ${body.slice(0, 160)}` : ''}`);
      error.status = response.status;
      throw error;
    }

    try {
      return JSON.parse(body);
    } catch (error) {
      throw new Error('Licznik zwrócił nieprawidłową odpowiedź JSON.');
    }
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function scheduleReadRetry() {
  window.clearTimeout(readRetryTimer);
  readRetryTimer = window.setTimeout(() => {
    loadSupportCount({ force: true });
  }, SUPPORT_READ_RETRY_DELAY_MS);
}

async function loadSupportCount({ force = false } = {}) {
  if (!supportCount) return;

  const cached = readCachedCounter();
  if (cached) renderCount(cached.value);

  if (!force && cached && Date.now() - cached.updatedAt < SUPPORT_CACHE_MAX_AGE_MS) {
    return;
  }

  if (!navigator.onLine) {
    renderUnavailable();
    return;
  }

  if (counterRequest) return counterRequest;

  renderLoading();
  counterRequest = (async () => {
    try {
      const payload = await requestCounter();
      const value = extractCounterValue(payload);
      if (value === null) throw new Error('Odpowiedź licznika nie zawiera wartości.');

      storeCachedCounter(value);
      renderCount(value);
      logCounter('FINAL SUCCESS', { operation: 'load', value });
    } catch (error) {
      renderUnavailable();
      scheduleReadRetry();
      logCounter('FINAL FAILURE', {
        operation: 'load',
        reason: error?.message,
        stack: error?.stack
      });
    } finally {
      counterRequest = null;
    }
  })();

  return counterRequest;
}

async function submitSupport({ fromOfflineQueue = false } = {}) {
  if (!supportButton) return;

  if (readStoredSupport()) {
    renderSupportedState();
    return;
  }

  if (!navigator.onLine) {
    queueOfflineSupport();
    supportButton.disabled = false;
    supportButton.textContent = 'Oczekuje na internet';
    if (supportStatus) {
      supportStatus.textContent = 'Brak połączenia. Wsparcie zostanie wysłane raz po odzyskaniu internetu.';
    }
    return;
  }

  if (!acquireSubmitLock()) {
    if (supportStatus) supportStatus.textContent = 'Wsparcie jest już zapisywane w innej karcie.';
    return;
  }

  supportButton.disabled = true;
  supportButton.textContent = 'Zapisywanie…';
  if (supportStatus) supportStatus.textContent = '';

  try {
    // Po wysłaniu żądania zwiększającego licznik nie wykonujemy żadnego
    // automatycznego ponowienia. CounterAPI v1 nie obsługuje idempotencji,
    // więc ponowienie po timeout/429/5xx mogłoby dodać tę samą osobę drugi raz.
    clearPendingSupport();
    const payload = await requestCounter('up');
    const value = extractCounterValue(payload);
    if (value === null) throw new Error('Odpowiedź licznika nie zawiera wartości.');

    storeSupport();
    storeCachedCounter(value);
    renderCount(value);
    renderSupportedState('Dziękujemy. Wsparcie zostało zapisane.');
    supportChannel?.postMessage({ type: 'supported', value });
    logCounter('FINAL SUCCESS', { operation: 'submit', value, fromOfflineQueue });
  } catch (error) {
    clearPendingSupport();
    supportButton.disabled = false;
    supportButton.textContent = 'Sprawdź i spróbuj ponownie';
    if (supportStatus) {
      supportStatus.textContent = 'Nie udało się potwierdzić zapisu. Odśwież stronę i sprawdź licznik przed ponownym kliknięciem.';
    }

    window.setTimeout(() => loadSupportCount({ force: true }), 1500);
    logCounter('FINAL FAILURE', {
      operation: 'submit',
      reason: error?.message,
      stack: error?.stack,
      possibleImpact: 'Automatyczne ponowienie wyłączono, aby uniknąć podwójnego głosu.'
    });
  } finally {
    releaseSubmitLock();
  }
}

if (supportButton && supportCount) {
  const cached = readCachedCounter();
  if (cached) renderCount(cached.value);
  else renderLoading();

  if (readStoredSupport()) renderSupportedState();

  supportButton.addEventListener('click', () => submitSupport());
  loadSupportCount();

  if (readPendingSupport() === 'offline' && !readStoredSupport() && navigator.onLine) {
    window.setTimeout(() => submitSupport({ fromOfflineQueue: true }), 1200);
  }

  window.addEventListener('online', () => {
    loadSupportCount({ force: true });
    if (readPendingSupport() === 'offline' && !readStoredSupport()) {
      submitSupport({ fromOfflineQueue: true });
    }
  });

  window.addEventListener('offline', () => {
    if (supportStatus && !readStoredSupport()) {
      supportStatus.textContent = 'Brak połączenia z internetem.';
    }
  });

  window.addEventListener('storage', event => {
    if (event.key === SUPPORT_CACHE_KEY && event.newValue) {
      const latest = readCachedCounter();
      if (latest) renderCount(latest.value);
    }

    if (event.key === SUPPORT_STORAGE_KEY && event.newValue === '1') {
      renderSupportedState();
    }
  });

  supportChannel?.addEventListener('message', event => {
    if (event.data?.type === 'counter' && Number.isFinite(Number(event.data.value))) {
      renderCount(Math.max(0, Math.trunc(Number(event.data.value))));
    }

    if (event.data?.type === 'supported') {
      renderSupportedState();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const latest = readCachedCounter();
    if (!latest || Date.now() - latest.updatedAt >= SUPPORT_CACHE_MAX_AGE_MS) {
      loadSupportCount({ force: true });
    }
  });
}

const shareButton = document.querySelector('#share-button');
const shareStatus = document.querySelector('#share-status');

if (shareButton) {
  const shareData = {
    title: 'Ciszej na Osiedlu Nauczycielskim',
    text: 'Poznaj historię pomiarów hałasu przy Osiedlu Nauczycielskim w Tarnowie i poprzyj na stronie inicjatywę mieszkańców osiedla dotyczącą wykonania aktualnych pomiarów oraz wdrożenia zabezpieczeń przed hałasem.',
    url: 'https://ciszejnaosiedlunauczycielskim.pl/'
  };

  shareButton.addEventListener('click', async () => {
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareData.url);
        const originalLabel = shareButton.textContent;
        shareButton.textContent = 'Link skopiowany';
        if (shareStatus) shareStatus.textContent = 'Link do strony został skopiowany.';
        window.setTimeout(() => {
          shareButton.textContent = originalLabel;
          if (shareStatus) shareStatus.textContent = '';
        }, 2200);
        return;
      }

      window.prompt('Skopiuj link do petycji:', shareData.url);
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('Nie udało się udostępnić petycji.', error);
      }
    }
  });
}
