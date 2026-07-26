// Przykład integracji po wdrożeniu Workera.
// Nie jest ładowany przez obecną stronę i nie zmienia produkcyjnego licznika.

const SUPPORT_API_BASE = 'https://WSTAW_ADRES_WORKERA';
const DEVICE_KEY = 'ciszej-support-device-v1';
const PENDING_REQUEST_KEY = 'ciszej-support-pending-request-v1';
const CONFIRMED_KEY = 'ciszej-support-confirmed-v1';

function randomUuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, digit =>
    (Number(digit) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(digit) / 4).toString(16)
  );
}

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function storageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Brak trwałego magazynu nie powinien blokować działania interfejsu.
  }
}

function getDeviceId() {
  const stored = storageGet(DEVICE_KEY);
  if (stored) return stored;

  const deviceId = randomUuid();
  storageSet(DEVICE_KEY, deviceId);
  return deviceId;
}

function getPendingRequestId() {
  const stored = storageGet(PENDING_REQUEST_KEY);
  if (stored) return stored;

  const requestId = randomUuid();
  storageSet(PENDING_REQUEST_KEY, requestId);
  return requestId;
}

export async function fetchSupportCount(signal) {
  const response = await fetch(`${SUPPORT_API_BASE}/support/count`, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'omit',
    headers: { Accept: 'application/json' },
    signal
  });

  if (!response.ok) throw new Error(`count_http_${response.status}`);
  const payload = await response.json();
  const value = Number(payload?.value);
  if (!Number.isFinite(value)) throw new Error('count_invalid_payload');
  return Math.max(0, Math.trunc(value));
}

export async function submitSupport(signal) {
  if (storageGet(CONFIRMED_KEY) === '1') {
    return { alreadyConfirmed: true };
  }

  const requestId = getPendingRequestId();
  const deviceId = getDeviceId();

  const response = await fetch(`${SUPPORT_API_BASE}/support`, {
    method: 'POST',
    cache: 'no-store',
    credentials: 'omit',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Support-Device': deviceId
    },
    body: JSON.stringify({
      requestId,
      createdAt: new Date().toISOString()
    }),
    signal
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(payload?.error || `support_http_${response.status}`);
    error.status = response.status;
    throw error;
  }

  // Ten sam requestId może być bezpiecznie ponowiony po timeoutie.
  // Backend zwróci ten sam wynik bez dodania drugiego głosu.
  storageSet(CONFIRMED_KEY, '1');
  storageRemove(PENDING_REQUEST_KEY);

  return {
    accepted: Boolean(payload?.accepted),
    duplicate: Boolean(payload?.duplicate),
    value: Math.max(0, Math.trunc(Number(payload?.value)))
  };
}
