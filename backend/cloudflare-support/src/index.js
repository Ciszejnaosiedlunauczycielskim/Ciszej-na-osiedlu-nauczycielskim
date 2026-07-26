const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function allowedOrigins(env) {
  return new Set([
    env.ALLOWED_ORIGIN,
    env.GITHUB_PAGES_ORIGIN
  ].filter(Boolean));
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const headers = {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'Origin'
  };

  if (origin && allowedOrigins(env).has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Support-Device';
    headers['Access-Control-Max-Age'] = '86400';
  }

  return headers;
}

function json(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(request, env)
  });
}

function isAllowedBrowserOrigin(request, env) {
  const origin = request.headers.get('Origin');
  return Boolean(origin && allowedOrigins(env).has(origin));
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function readCount(env) {
  const row = await env.DB.prepare(`
    SELECT
      s.base_count + (SELECT COUNT(*) FROM support_votes) AS value
    FROM support_state s
    WHERE s.id = 1
  `).first();

  if (!row || !Number.isFinite(Number(row.value))) {
    throw new Error('Brak poprawnie zainicjalizowanego stanu licznika.');
  }

  return Math.max(0, Math.trunc(Number(row.value)));
}

async function handleCount(request, env) {
  const value = await readCount(env);
  return json(request, env, { value });
}

async function handleSupport(request, env) {
  if (!isAllowedBrowserOrigin(request, env)) {
    return json(request, env, { error: 'origin_not_allowed' }, 403);
  }

  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return json(request, env, { error: 'content_type_must_be_json' }, 415);
  }

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (Number.isFinite(contentLength) && contentLength > 2048) {
    return json(request, env, { error: 'payload_too_large' }, 413);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(request, env, { error: 'invalid_json' }, 400);
  }

  const requestId = String(payload?.requestId || '').trim();
  const deviceId = String(request.headers.get('X-Support-Device') || '').trim();

  if (!UUID_RE.test(requestId)) {
    return json(request, env, { error: 'invalid_request_id' }, 400);
  }

  if (!UUID_RE.test(deviceId)) {
    return json(request, env, { error: 'invalid_device_id' }, 400);
  }

  const deviceHash = await sha256Hex(deviceId);

  if (env.SUPPORT_RATE_LIMITER) {
    const { success } = await env.SUPPORT_RATE_LIMITER.limit({ key: deviceHash });
    if (!success) {
      return json(request, env, { error: 'rate_limited' }, 429);
    }
  }

  const createdAt = new Date().toISOString();
  const insert = env.DB.prepare(`
    INSERT OR IGNORE INTO support_votes (request_id, device_hash, created_at)
    VALUES (?, ?, ?)
  `).bind(requestId, deviceHash, createdAt);

  const count = env.DB.prepare(`
    SELECT
      s.base_count + (SELECT COUNT(*) FROM support_votes) AS value
    FROM support_state s
    WHERE s.id = 1
  `);

  const [insertResult, countResult] = await env.DB.batch([insert, count]);
  const accepted = Number(insertResult?.meta?.changes || 0) === 1;
  const value = Number(countResult?.results?.[0]?.value);

  if (!Number.isFinite(value)) {
    throw new Error('Nie udało się odczytać wartości po zapisie.');
  }

  return json(request, env, {
    accepted,
    duplicate: !accepted,
    requestId,
    createdAt,
    value: Math.max(0, Math.trunc(value))
  }, accepted ? 201 : 200);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      if (!isAllowedBrowserOrigin(request, env)) {
        return json(request, env, { error: 'origin_not_allowed' }, 403);
      }
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env)
      });
    }

    try {
      if (url.pathname === '/support/count' && request.method === 'GET') {
        return await handleCount(request, env);
      }

      if (url.pathname === '/support' && request.method === 'POST') {
        return await handleSupport(request, env);
      }

      return json(request, env, { error: 'not_found' }, 404);
    } catch (error) {
      console.error('support_api_error', {
        path: url.pathname,
        method: request.method,
        message: error instanceof Error ? error.message : String(error)
      });
      return json(request, env, { error: 'internal_error' }, 500);
    }
  }
};
