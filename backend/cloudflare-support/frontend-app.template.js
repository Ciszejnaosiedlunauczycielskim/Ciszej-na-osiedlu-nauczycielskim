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

const SUPPORT_API_BASE = '__SUPPORT_API_BASE__';
const LEGACY_CONFIRMED_KEY = 'ciszej-wsparcie-zapisane-v1';
const CONFIRMED_KEY = 'ciszej-support-confirmed-v1';
const CONFIRMED_COOKIE = 'ciszej_wsparcie_zapisane';
const DEVICE_KEY = 'ciszej-support-device-v1';
const DEVICE_COOKIE = 'ciszej_support_device';
const PENDING_REQUEST_KEY = 'ciszej-support-pending-request-v1';
const CACHE_KEY = 'ciszej-wsparcie-licznik-v5';
const LOCK_KEY = 'ciszej-support-submit-lock-v1';
const REQUEST_TIMEOUT_MS = 12000;
const CACHE_MAX_AGE_MS = 60000;
const READ_RETRY_DELAY_MS = 30000;
const SUBMIT_RETRY_DELAY_MS = 20000;
const LOCK_MAX_AGE_MS = 30000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let countRequest = null;
let readRetryTimer = null;
let submitRetryTimer = null;
let inMemoryDeviceId = null;
let inMemoryPendingRequest = null;
let supportChannel = null;

try {
  if ('BroadcastChannel' in window) {
    supportChannel = new BroadcastChannel('ciszej-support-v1');
  }
} catch (error) {
  console.warn('[LICZNIK] BroadcastChannel niedostępny.', error);
}

function logCounter(stage, details = {}) {
  const method = stage === 'FINAL FAILURE' || stage === 'ERROR'
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
    const match = document.cookie
      .split('; ')
      .find(cookie => cookie.startsWith(prefix));
    return match ? decodeURIComponent(match.slice(prefix.length)) : null;
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

function randomUuid() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  if (crypto?.getRandomValues) {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, digit =>
      (Number(digit) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(digit) / 4).toString(16)
    );
  }

  const random = `${Date.now()}-${Math.random()}-${Math.random()}`;
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const value = Math.floor(Math.random() * 16);
    const normalized = character === 'x' ? value : (value & 0x3) | 0x8;
    return normalized.toString(16);
  }).replace(/^.{8}/, random.slice(-8).replace(/[^0-9a-f]/gi, '0').padStart(8, '0'));
}

function readConfirmedSupport() {
  return storageGet(LEGACY_CONFIRMED_KEY) === '1'
    || storageGet(CONFIRMED_KEY) === '1'
    || readCookie(CONFIRMED_COOKIE) === '1';
}

function storeConfirmedSupport() {
  storageSet(LEGACY_CONFIRMED_KEY, '1');
  storageSet(CONFIRMED_KEY, '1');
  writeCookie(CONFIRMED_COOKIE, '1');
  clearPendingRequest();
}

function getDeviceId() {
  const stored = storageGet(DEVICE_KEY);
  if (stored && UUID_RE.test(stored)) return stored;

  const cookie = readCookie(DEVICE_COOKIE);
  if (cookie && UUID_RE.test(cookie)) {
    storageSet(DEVICE_KEY, cookie);
    return cookie;
  }

  if (inMemoryDeviceId && UUID_RE.test(inMemoryDeviceId)) return inMemoryDeviceId;

  const deviceId = randomUuid();
  inMemoryDeviceId = deviceId;
  storageSet(DEVICE_KEY, deviceId);
  writeCookie(DEVICE_COOKIE, deviceId);
  return deviceId;
}

function readPendingRequest() {
  const raw = storageGet(PENDING_REQUEST_KEY);
  if (raw) {
    try {
      const pending = JSON.parse(raw);
      if (UUID_RE.test(pending?.requestId)) return pending;
    } catch (error) {
      logCounter('WARNING', { place: 'pending.parse', error });
    }
  }

  return inMemoryPendingRequest;
}

function ensurePendingRequest() {
  const existing = readPendingRequest();
  if (existing?.requestId && UUID_RE.test(existing.requestId)) return existing;

  const pending = {
    requestId: randomUuid(),
    createdAt: new Date().toISOString()
  };
  inMemoryPendingRequest = pending;
  storageSet(PENDING_REQUEST_KEY, JSON.stringify(pending));
  return pending;
}

function clearPendingRequest() {
  inMemoryPendingRequest = null;
  storageRemove(PENDING_REQUEST_KEY);
}

function readCachedCount() {
  const raw = storageGet(CACHE_KEY);
  if (!raw) return null;

  try {
    const cached = JSON.parse(raw);
    const value = Number(cached?.value);
    const updatedAt = Number(cached?.updatedAt);
    if (!Number.isFinite(value) || !Number.isFinite(updatedAt)) return null;
    return { value: Math.max(0, Math.trunc(value)), updatedAt };
  } catch (error) {
    logCounter('WARNING', { place: 'cache.parse', error });
    return null;
  }
}

function storeCachedCount(value) {
  const normalized = Math.max(0, Math.trunc(Number(value)));
  const current = readCachedCount();
  const cached = {
    value: current ? Math.max(current.value, normalized) : normalized,
    updatedAt: Date.now()
  };
  storageSet(CACHE_KEY, JSON.stringify(cached));
  supportChannel?.postMessage({ type: 'counter', ...cached });
  return cached.value;
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
  if (!supportCount || readCachedCount()) return;
  supportCount.textContent = '…';
  supportCount.setAttribute('aria-label', 'Pobieranie aktualnej liczby osób wspierających');
  if (supportLabel) supportLabel.textContent = 'pobieranie aktualnej liczby';
}

function renderUnavailable() {
  const cached = readCachedCount();
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
  const token = randomUuid();
  const raw = storageGet(LOCK_KEY);

  if (raw) {
    try {
      const lock = JSON.parse(raw);
      if (Number.isFinite(Number(lock?.createdAt)) && now - Number(lock.createdAt) < LOCK_MAX_AGE_MS) {
        return null;
      }
    } catch {
      // Uszkodzony lub stary wpis można nadpisać.
    }
  }

  const stored = storageSet(LOCK_KEY, JSON.stringify({ token, createdAt: now }));
  if (!stored) return token;

  try {
    const confirmed = JSON.parse(storageGet(LOCK_KEY) || '{}');
    return confirmed.token === token ? token : null;
  } catch {
    return null;
  }
}

function releaseSubmitLock(token) {
  if (!token) return;
  const raw = storageGet(LOCK_KEY);
  if (!raw) return;
  try {
    const lock = JSON.parse(raw);
    if (lock?.token === token) storageRemove(LOCK_KEY);
  } catch {
    storageRemove(LOCK_KEY);
  }
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const externalSignal = options.signal;
  const abortFromExternal = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', abortFromExternal, { once: true });
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(payload?.error || `HTTP ${response.status}`);
      error.status = response.status;
      const retryAfter = Number(response.headers.get('Retry-After'));
      error.retryAfter = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null;
      throw error;
    }

    if (!payload || typeof payload !== 'object') {
      throw new Error('Serwer zwrócił nieprawidłową odpowiedź.');
    }

    return payload;
  } finally {
    window.clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', abortFromExternal);
  }
}

function scheduleReadRetry(delay = READ_RETRY_DELAY_MS) {
  window.clearTimeout(readRetryTimer);
  readRetryTimer = window.setTimeout(() => loadSupportCount({ force: true }), delay);
}

function scheduleSubmitRetry(delay = SUBMIT_RETRY_DELAY_MS) {
  window.clearTimeout(submitRetryTimer);
  submitRetryTimer = window.setTimeout(() => {
    if (!readConfirmedSupport() && readPendingRequest() && navigator.onLine !== false) {
      submitSupport({ automatic: true });
    }
  }, delay);
}

async function loadSupportCount({ force = false } = {}) {
  if (!supportCount) return;

  const cached = readCachedCount();
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
      const payload = await fetchJson(`${SUPPORT_API_BASE}/support/count`, {
        method: 'GET',
        headers: { Accept: 'application/json' }
      });
      const serverValue = Number(payload?.value);
      if (!Number.isFinite(serverValue)) throw new Error('Odpowiedź licznika nie zawiera wartości.');
      const value = storeCachedCount(serverValue);
      renderCount(value);
      logCounter('FINAL SUCCESS', { operation: 'load', value, serverValue });
    } catch (error) {
      renderUnavailable();
      scheduleReadRetry();
      logCounter('FINAL FAILURE', {
        operation: 'load',
        reason: error?.message,
        stack: error?.stack
      });
    } finally {
      countRequest = null;
    }
  })();

  return countRequest;
}

async function submitSupport({ automatic = false } = {}) {
  if (!supportButton) return;

  if (readConfirmedSupport()) {
    renderSupportedState();
    return;
  }

  const pending = ensurePendingRequest();

  if (navigator.onLine === false) {
    supportButton.disabled = false;
    supportButton.textContent = 'Oczekuje na internet';
    if (supportStatus) {
      supportStatus.textContent = 'Brak połączenia. Wsparcie zostanie wysłane automatycznie po odzyskaniu internetu.';
    }
    return;
  }

  const lockToken = acquireSubmitLock();
  if (!lockToken) {
    if (supportStatus) supportStatus.textContent = 'Wsparcie jest już zapisywane w innej karcie.';
    if (automatic) scheduleSubmitRetry(2500);
    return;
  }

  supportButton.disabled = true;
  supportButton.textContent = automatic ? 'Ponawianie zapisu…' : 'Zapisywanie…';
  if (supportStatus) supportStatus.textContent = '';

  try {
    const payload = await fetchJson(`${SUPPORT_API_BASE}/support`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Support-Device': getDeviceId()
      },
      body: JSON.stringify({
        requestId: pending.requestId,
        createdAt: pending.createdAt
      })
    });

    const value = Number(payload?.value);
    if (!Number.isFinite(value)) throw new Error('Odpowiedź zapisu nie zawiera wartości licznika.');

    storeConfirmedSupport();
    const visibleValue = storeCachedCount(value);
    renderCount(visibleValue);
    renderSupportedState('Dziękujemy. Wsparcie zostało zapisane.');
    supportChannel?.postMessage({ type: 'supported', value: visibleValue });
    logCounter('FINAL SUCCESS', {
      operation: 'submit',
      accepted: Boolean(payload?.accepted),
      duplicate: Boolean(payload?.duplicate),
      value: visibleValue,
      requestId: pending.requestId
    });
  } catch (error) {
    const retryable = !error?.status || error.status === 429 || error.status >= 500 || error?.name === 'AbortError';

    if (retryable) {
      const delay = error?.status === 429 && error?.retryAfter
        ? Math.max(SUBMIT_RETRY_DELAY_MS, error.retryAfter * 1000)
        : SUBMIT_RETRY_DELAY_MS;
      supportButton.disabled = false;
      supportButton.textContent = 'Oczekuje na zapis';
      if (supportStatus) {
        supportStatus.textContent = 'Nie udało się potwierdzić zapisu. To samo zgłoszenie zostanie bezpiecznie ponowione.';
      }
      scheduleSubmitRetry(delay);
    } else {
      clearPendingRequest();
      supportButton.disabled = false;
      supportButton.textContent = 'Spróbuj ponownie';
      if (supportStatus) {
        supportStatus.textContent = 'Nie udało się zapisać wsparcia. Odśwież stronę i spróbuj ponownie.';
      }
    }

    window.setTimeout(() => loadSupportCount({ force: true }), 1500);
    logCounter('FINAL FAILURE', {
      operation: 'submit',
      retryable,
      reason: error?.message,
      status: error?.status,
      requestId: pending.requestId,
      stack: error?.stack
    });
  } finally {
    releaseSubmitLock(lockToken);
  }
}

if (supportButton && supportCount) {
  const cached = readCachedCount();
  if (cached) renderCount(cached.value);
  else renderLoading();

  if (readConfirmedSupport()) renderSupportedState();

  supportButton.addEventListener('click', () => submitSupport());
  loadSupportCount();

  if (!readConfirmedSupport() && readPendingRequest() && navigator.onLine !== false) {
    window.setTimeout(() => submitSupport({ automatic: true }), 1200);
  }

  window.addEventListener('online', () => {
    loadSupportCount({ force: true });
    if (!readConfirmedSupport() && readPendingRequest()) {
      submitSupport({ automatic: true });
    }
  });

  window.addEventListener('offline', () => {
    if (supportStatus && !readConfirmedSupport()) {
      supportStatus.textContent = 'Brak połączenia z internetem.';
    }
  });

  window.addEventListener('storage', event => {
    if (event.key === CACHE_KEY && event.newValue) {
      const latest = readCachedCount();
      if (latest) renderCount(latest.value);
    }

    if ((event.key === LEGACY_CONFIRMED_KEY || event.key === CONFIRMED_KEY) && event.newValue === '1') {
      renderSupportedState();
    }
  });

  supportChannel?.addEventListener('message', event => {
    if (event.data?.type === 'counter' && Number.isFinite(Number(event.data.value))) {
      renderCount(storeCachedCount(event.data.value));
    }
    if (event.data?.type === 'supported') {
      storeConfirmedSupport();
      renderSupportedState();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const latest = readCachedCount();
    if (!latest || Date.now() - latest.updatedAt >= CACHE_MAX_AGE_MS) {
      loadSupportCount({ force: true });
    }
    if (!readConfirmedSupport() && readPendingRequest() && navigator.onLine !== false) {
      submitSupport({ automatic: true });
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
