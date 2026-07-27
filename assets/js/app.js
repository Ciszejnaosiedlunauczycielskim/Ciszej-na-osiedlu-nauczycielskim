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
const SUPPORT_STORAGE_KEY_V2 = 'ciszej-wsparcie-zapisane-v2';
const SUPPORT_COOKIE_NAME = 'ciszej_wsparcie_zapisane';
const SUPPORT_CACHE_KEY = 'ciszej-wsparcie-licznik-v6';
const SUPPORT_PENDING_KEY = 'ciszej-wsparcie-niepotwierdzone-v1';
const SUPPORT_LOCK_KEY = 'ciszej-wsparcie-blokada-v3';
const SUPPORT_CHANNEL_NAME = 'ciszej-wsparcie-v3';
const REQUEST_TIMEOUT_MS = 10000;
const CACHE_MAX_AGE_MS = 120000;
const LOCK_MAX_AGE_MS = 30000;
const AMBIGUOUS_PENDING_MAX_AGE_MS = 86400000;
const READ_RETRY_DELAYS_MS = [30000, 60000, 120000, 300000];

let countRequest = null;
let readRetryTimer = null;
let readFailureCount = 0;
let supportChannel = null;

try {
  if ('BroadcastChannel' in window) {
    supportChannel = new BroadcastChannel(SUPPORT_CHANNEL_NAME);
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

function readCookie(name) {
  try {
    const prefix = `${name}=`;
    const cookie = document.cookie
      .split('; ')
      .find(item => item.startsWith(prefix));
    return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
  } catch (error) {
    logCounter('WARNING', { place: 'cookie.read', name, error });
    return null;
  }
}

function writeCookie(name, value, maxAge = 315360000) {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
    return true;
  } catch (error) {
    logCounter('WARNING', { place: 'cookie.write', name, error });
    return false;
  }
}

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  if (globalThis.crypto?.getRandomValues) {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, digit =>
      (Number(digit) ^ (globalThis.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(digit) / 4)))).toString(16)
    );
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

function readStoredSupport() {
  return storageGet(SUPPORT_STORAGE_KEY) === '1'
    || storageGet(SUPPORT_STORAGE_KEY_V2) === '1'
    || readCookie(SUPPORT_COOKIE_NAME) === '1';
}

function storeSupport() {
  storageSet(SUPPORT_STORAGE_KEY, '1');
  storageSet(SUPPORT_STORAGE_KEY_V2, '1');
  writeCookie(SUPPORT_COOKIE_NAME, '1');
  clearPendingSupport();
}

function readPendingSupport() {
  const raw = storageGet(SUPPORT_PENDING_KEY);
  if (!raw) return null;

  try {
    const pending = JSON.parse(raw);
    const createdAt = Number(pending?.createdAt);
    if (!Number.isFinite(createdAt)) {
      clearPendingSupport();
      return null;
    }

    if (Date.now() - createdAt > AMBIGUOUS_PENDING_MAX_AGE_MS) {
      clearPendingSupport();
      return null;
    }

    return pending;
  } catch (error) {
    logCounter('WARNING', { place: 'pending.parse', error });
    clearPendingSupport();
    return null;
  }
}

function storePendingSupport() {
  const pending = {
    id: randomId(),
    createdAt: Date.now()
  };
  storageSet(SUPPORT_PENDING_KEY, JSON.stringify(pending));
  return pending;
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

function storeCachedCounter(value, { broadcast = true } = {}) {
  const normalized = Math.max(0, Math.trunc(Number(value)));
  if (!Number.isFinite(normalized)) return null;

  const current = readCachedCounter();
  const cached = {
    value: current ? Math.max(current.value, normalized) : normalized,
    updatedAt: Date.now()
  };

  storageSet(SUPPORT_CACHE_KEY, JSON.stringify(cached));
  if (broadcast) supportChannel?.postMessage({ type: 'counter', ...cached });
  return cached.value;
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
  if (!supportCount || !supportLabel || !Number.isFinite(Number(value))) return;

  const normalized = Math.max(0, Math.trunc(Number(value)));
  const formatted = new Intl.NumberFormat('pl-PL').format(normalized);
  const label = getSupportLabel(normalized);

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

function renderAmbiguousState() {
  if (!supportButton) return;
  supportButton.disabled = true;
  supportButton.textContent = 'Sprawdzamy zapis';
  if (supportStatus) {
    supportStatus.textContent = 'Nie udało się potwierdzić odpowiedzi serwera. Ponowne kliknięcie jest zablokowane, aby nie dodać wsparcia drugi raz.';
  }
}

function acquireSubmitLock() {
  const now = Date.now();
  const token = randomId();
  const raw = storageGet(SUPPORT_LOCK_KEY);

  if (raw) {
    try {
      const lock = JSON.parse(raw);
      if (Number.isFinite(Number(lock?.createdAt)) && now - Number(lock.createdAt) < LOCK_MAX_AGE_MS) {
        return null;
      }
    } catch {
      // Uszkodzony lub stary wpis można bezpiecznie nadpisać.
    }
  }

  const persisted = storageSet(SUPPORT_LOCK_KEY, JSON.stringify({ token, createdAt: now }));
  if (!persisted) return token;

  try {
    const confirmed = JSON.parse(storageGet(SUPPORT_LOCK_KEY) || '{}');
    return confirmed.token === token ? token : null;
  } catch {
    return null;
  }
}

function releaseSubmitLock(token) {
  if (!token) return;
  const raw = storageGet(SUPPORT_LOCK_KEY);
  if (!raw) return;

  try {
    const lock = JSON.parse(raw);
    if (lock?.token === token) storageRemove(SUPPORT_LOCK_KEY);
  } catch {
    storageRemove(SUPPORT_LOCK_KEY);
  }
}

async function requestCounter(path = '', { cacheBust = false } = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const url = new URL(`${SUPPORT_API}${path}`);
  if (cacheBust) url.searchParams.set('_', String(Date.now()));

  try {
    const response = await fetch(url.href, {
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
    let payload = null;
    try {
      payload = body ? JSON.parse(body) : null;
    } catch {
      const error = new Error('Licznik zwrócił nieprawidłową odpowiedź JSON.');
      error.ambiguous = response.ok;
      throw error;
    }

    if (!response.ok) {
      const error = new Error(`Błąd licznika: ${response.status}`);
      error.status = response.status;
      const retryAfter = Number(response.headers.get('Retry-After'));
      error.retryAfter = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null;
      throw error;
    }

    return payload;
  } catch (error) {
    if (error?.name === 'AbortError' || !error?.status) error.ambiguous = true;
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function scheduleReadRetry(error) {
  window.clearTimeout(readRetryTimer);
  const fallbackDelay = READ_RETRY_DELAYS_MS[Math.min(readFailureCount, READ_RETRY_DELAYS_MS.length - 1)];
  const delay = error?.status === 429 && error?.retryAfter
    ? Math.max(fallbackDelay, error.retryAfter * 1000)
    : fallbackDelay;

  readFailureCount += 1;
  readRetryTimer = window.setTimeout(() => loadSupportCount({ force: true }), delay);
}

async function loadSupportCount({ force = false } = {}) {
  if (!supportCount) return;

  const cached = readCachedCounter();
  if (cached) renderCount(cached.value);

  if (!force && cached && Date.now() - cached.updatedAt < CACHE_MAX_AGE_MS) return;
  if (navigator.onLine === false) {
    renderUnavailable();
    return;
  }
  if (countRequest) return countRequest;

  renderLoading();
  countRequest = (async () => {
    try {
      const payload = await requestCounter('', { cacheBust: true });
      const serverValue = extractCounterValue(payload);
      if (serverValue === null) throw new Error('Odpowiedź licznika nie zawiera wartości.');

      const visibleValue = storeCachedCounter(serverValue);
      renderCount(visibleValue);
      readFailureCount = 0;
      window.clearTimeout(readRetryTimer);
      logCounter('FINAL SUCCESS', { operation: 'load', serverValue, visibleValue });
    } catch (error) {
      renderUnavailable();
      scheduleReadRetry(error);
      logCounter('FINAL FAILURE', {
        operation: 'load',
        reason: error?.message,
        status: error?.status,
        stack: error?.stack
      });
    } finally {
      countRequest = null;
    }
  })();

  return countRequest;
}

async function submitSupport() {
  if (!supportButton) return;

  if (readStoredSupport()) {
    renderSupportedState();
    return;
  }

  if (readPendingSupport()) {
    renderAmbiguousState();
    loadSupportCount({ force: true });
    return;
  }

  if (navigator.onLine === false) {
    supportButton.disabled = false;
    supportButton.textContent = 'Popieram';
    if (supportStatus) supportStatus.textContent = 'Brak internetu. Połącz się z siecią i kliknij ponownie.';
    return;
  }

  const lockToken = acquireSubmitLock();
  if (!lockToken) {
    if (supportStatus) supportStatus.textContent = 'Wsparcie jest już zapisywane w innej karcie.';
    return;
  }

  supportButton.disabled = true;
  supportButton.textContent = 'Zapisywanie…';
  if (supportStatus) supportStatus.textContent = '';
  storePendingSupport();

  try {
    const payload = await requestCounter('/up');
    const value = extractCounterValue(payload);

    storeSupport();
    if (value !== null) {
      const visibleValue = storeCachedCounter(value);
      renderCount(visibleValue);
    }
    renderSupportedState('Dziękujemy. Wsparcie zostało zapisane.');
    supportChannel?.postMessage({ type: 'supported' });
    logCounter('FINAL SUCCESS', { operation: 'submit', value });
  } catch (error) {
    const definitelyRejected = Number.isFinite(Number(error?.status))
      && Number(error.status) >= 400
      && Number(error.status) < 500
      && Number(error.status) !== 408;

    if (definitelyRejected) {
      clearPendingSupport();
      supportButton.disabled = false;
      supportButton.textContent = 'Spróbuj ponownie';
      if (supportStatus) {
        supportStatus.textContent = error.status === 429
          ? 'Licznik ma chwilowy limit zapytań. Odczekaj chwilę i kliknij ponownie.'
          : 'Serwer odrzucił zapis. Odśwież stronę i spróbuj ponownie.';
      }
    } else {
      renderAmbiguousState();
    }

    window.setTimeout(() => loadSupportCount({ force: true }), 1500);
    logCounter('FINAL FAILURE', {
      operation: 'submit',
      reason: error?.message,
      status: error?.status,
      ambiguous: !definitelyRejected,
      stack: error?.stack
    });
  } finally {
    releaseSubmitLock(lockToken);
  }
}

if (supportButton && supportCount) {
  const cached = readCachedCounter();
  if (cached) renderCount(cached.value);
  else renderLoading();

  if (readStoredSupport()) renderSupportedState();
  else if (readPendingSupport()) renderAmbiguousState();

  supportButton.addEventListener('click', submitSupport);
  loadSupportCount();

  window.addEventListener('online', () => {
    loadSupportCount({ force: true });
    if (supportStatus && !readStoredSupport() && !readPendingSupport()) {
      supportStatus.textContent = '';
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

    if ((event.key === SUPPORT_STORAGE_KEY || event.key === SUPPORT_STORAGE_KEY_V2) && event.newValue === '1') {
      renderSupportedState();
    }

    if (event.key === SUPPORT_PENDING_KEY) {
      if (readPendingSupport() && !readStoredSupport()) renderAmbiguousState();
    }
  });

  supportChannel?.addEventListener('message', event => {
    if (event.data?.type === 'counter' && Number.isFinite(Number(event.data.value))) {
      const visibleValue = storeCachedCounter(event.data.value, { broadcast: false });
      renderCount(visibleValue);
    }

    if (event.data?.type === 'supported') {
      storeSupport();
      renderSupportedState();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const latest = readCachedCounter();
    if (!latest || Date.now() - latest.updatedAt >= CACHE_MAX_AGE_MS) {
      loadSupportCount({ force: true });
    }
  });

  window.addEventListener('pagehide', () => supportChannel?.close(), { once: true });
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
