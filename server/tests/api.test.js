/**
 * ScamShield AI — API Route Integration Tests
 * Uses Node.js built-in test runner (node:test).
 * Run: node --test server/tests/api.test.js
 *
 * These tests start a real Express server on a random port
 * and exercise the full request → response pipeline.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';

// Use an isolated in-memory libSQL database for the test run so tests never
// touch dev/production data. Set BEFORE importing modules that open the DB.
process.env.SCAMSHIELD_DB_MEMORY = '1';
process.env.DISABLE_RATE_LIMIT = '1';
delete process.env.TURSO_DATABASE_URL;

let server;
let baseUrl;

before(async () => {
  // Dynamic imports so the env flag above is applied before db.js initializes.
  const { createApp } = await import('../src/app.js');
  const { initDb } = await import('../src/db/db.js');
  await initDb();
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(() => {
  server?.close();
});

async function post(path, body) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function get(path, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${baseUrl}${path}`, { headers });
  return { status: res.status, body: await res.json().catch(() => null) };
}

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

describe('GET /api/health', () => {
  test('returns 200 with ok:true and mode field', async () => {
    const { status, body } = await get('/api/health');
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.ok(typeof body.mode === 'string', 'mode field must be present');
    assert.ok(['ai', 'demo'].includes(body.mode), `Unexpected mode: ${body.mode}`);
  });
});

// ---------------------------------------------------------------------------
// Demo scenarios
// ---------------------------------------------------------------------------

describe('GET /api/demo-scenarios', () => {
  test('returns 200 with at least one scenario', async () => {
    const { status, body } = await get('/api/demo-scenarios');
    assert.equal(status, 200);
    assert.equal(body.ok, true);
    assert.ok(Array.isArray(body.scenarios), 'scenarios must be an array');
    assert.ok(body.scenarios.length >= 1, 'must have at least one scenario');
  });

  test('each scenario has id, title, type, message', async () => {
    const { body } = await get('/api/demo-scenarios');
    for (const s of body.scenarios) {
      assert.ok(typeof s.id === 'string' && s.id.length > 0, 'scenario must have id');
      assert.ok(typeof s.title === 'string' && s.title.length > 0, 'scenario must have title');
      assert.ok(typeof s.type === 'string', 'scenario must have type');
      assert.ok(typeof s.message === 'string' && s.message.length > 0, 'scenario must have message');
    }
  });
});

// ---------------------------------------------------------------------------
// POST /api/analyze — text analysis
// ---------------------------------------------------------------------------

describe('POST /api/analyze', () => {
  test('valid text returns 200 with analysis payload', async () => {
    const { status, body } = await post('/api/analyze', {
      type: 'text',
      content: 'Your account will be blocked. Share your OTP immediately to verify.',
    });
    assert.equal(status, 200, `Expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.equal(body.ok, true);
    assert.ok(typeof body.id === 'string');
    const a = body.analysis;
    assert.ok(typeof a.riskScore === 'number');
    assert.ok(a.riskScore >= 0 && a.riskScore <= 100);
    assert.ok(typeof a.riskLevel === 'string');
    assert.ok(typeof a.category === 'object');
    assert.ok(Array.isArray(a.reasons));
    assert.ok(Array.isArray(a.limitations), 'limitations array must be present');
    assert.ok(a.limitations.length > 0, 'limitations should not be empty');
  });

  test('empty content returns 400', async () => {
    const { status, body } = await post('/api/analyze', { type: 'text', content: '' });
    assert.equal(status, 400);
    assert.ok(typeof body.error === 'string', 'error message must be present');
  });

  test('missing content returns 400', async () => {
    const { status } = await post('/api/analyze', { type: 'text' });
    assert.equal(status, 400);
  });

  test('whitespace-only content returns 400', async () => {
    const { status } = await post('/api/analyze', { type: 'text', content: '   ' });
    assert.equal(status, 400);
  });

  test('analysis payload contains evidenceBasis with three keys', async () => {
    const { body } = await post('/api/analyze', {
      type: 'text',
      content: 'Congratulations! You have been selected to win a prize.',
    });
    const a = body.analysis;
    assert.ok(a.evidenceBasis, 'evidenceBasis must be present');
    assert.ok(Array.isArray(a.evidenceBasis.evidence), 'evidence array required');
    assert.ok(Array.isArray(a.evidenceBasis.inference), 'inference array required');
    assert.ok(Array.isArray(a.evidenceBasis.uncertainty), 'uncertainty array required');
  });

  test('mode is either "demo" or "ai"', async () => {
    const { body } = await post('/api/analyze', {
      type: 'text',
      content: 'Test message for mode check.',
    });
    assert.ok(['demo', 'ai'].includes(body.mode), `Unexpected mode: ${body.mode}`);
  });

  test('analysis result is labeled correctly when no AI key is set', async () => {
    // In test environment there is no AI_API_KEY, so mode must be "demo"
    if (process.env.AI_API_KEY) return; // skip if AI configured in test env
    const { body } = await post('/api/analyze', {
      type: 'text',
      content: 'Check your account status.',
    });
    assert.equal(body.mode, 'demo', 'Without AI key, mode must be demo');
    assert.equal(body.analysis.aiUsed, false, 'aiUsed must be false without AI key');
  });
});

// ---------------------------------------------------------------------------
// POST /api/analyze/url
// ---------------------------------------------------------------------------

describe('POST /api/analyze/url', () => {
  test('valid URL returns 200 with analysis payload', async () => {
    const { status, body } = await post('/api/analyze/url', {
      url: 'https://www.example.com/path?q=test',
    });
    assert.equal(status, 200, `Expected 200, got ${status}`);
    assert.equal(body.ok, true);
    assert.ok(typeof body.analysis.riskScore === 'number');
    assert.equal(body.analysis.type, 'url');
  });

  test('empty URL returns 400', async () => {
    const { status } = await post('/api/analyze/url', { url: '' });
    assert.equal(status, 400);
  });

  test('missing URL field returns 400', async () => {
    const { status } = await post('/api/analyze/url', {});
    assert.equal(status, 400);
  });

  test('URL analysis includes urlIndicators array', async () => {
    const { body } = await post('/api/analyze/url', {
      url: 'http://192.168.1.1/suspicious-login',
    });
    assert.ok(Array.isArray(body.analysis.urlIndicators), 'urlIndicators must be an array');
    assert.ok(body.analysis.urlIndicators.length > 0, 'IP URL should produce indicators');
  });

  test('URL analysis includes reputationResult object', async () => {
    const { body } = await post('/api/analyze/url', {
      url: 'https://www.google.com',
    });
    // reputationResult should exist (may be not_configured if keys absent, but must exist)
    assert.ok(body.analysis.reputationResult !== undefined, 'reputationResult must be present for URL analysis');
  });

  test('IP address URL scores higher than legitimate domain', async () => {
    const { body: ipBody } = await post('/api/analyze/url', { url: 'http://123.45.67.89/login' });
    const { body: legitBody } = await post('/api/analyze/url', { url: 'https://www.amazon.com' });
    assert.ok(
      ipBody.analysis.riskScore > legitBody.analysis.riskScore,
      `IP URL (${ipBody.analysis.riskScore}) should score higher than legitimate domain (${legitBody.analysis.riskScore})`,
    );
  });
});

// ---------------------------------------------------------------------------
// POST /api/analyze/image
// ---------------------------------------------------------------------------

describe('POST /api/analyze/image', () => {
  test('invalid dataUrl returns 400', async () => {
    const { status, body } = await post('/api/analyze/image', { dataUrl: 'not-a-data-url' });
    assert.equal(status, 400);
    assert.ok(typeof body.error === 'string');
  });

  test('missing dataUrl returns 400', async () => {
    const { status } = await post('/api/analyze/image', {});
    assert.equal(status, 400);
  });

  test('oversized dataUrl returns 400 or 413', async () => {
    // Fake a data URL that's too large
    const hugeFakeDataUrl = 'data:image/png;base64,' + 'A'.repeat(5_600_000);
    const { status } = await post('/api/analyze/image', { dataUrl: hugeFakeDataUrl });
    assert.ok([400, 413].includes(status), `Expected 400 or 413, got ${status}`);
  });

  test('valid small PNG data URL with visibleText returns 200', async () => {
    // 1x1 red PNG as base64
    const tiny1x1Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';
    const { status, body } = await post('/api/analyze/image', {
      dataUrl: tiny1x1Png,
      visibleText: 'Your account will be blocked. Share OTP now.',
    });
    assert.equal(status, 200, `Expected 200, got ${status}: ${JSON.stringify(body)}`);
    assert.ok(body.analysis.type === 'image');
  });
});

// ---------------------------------------------------------------------------
// GET /api/history — without auth
// ---------------------------------------------------------------------------

describe('GET /api/history (unauthenticated)', () => {
  test('returns 200 with empty items array when not authenticated', async () => {
    const { status, body } = await get('/api/history');
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.items), 'items must be an array');
    assert.equal(body.items.length, 0, 'unauthenticated history must be empty');
  });
});

// ---------------------------------------------------------------------------
// GET /api/history/:id — not found
// ---------------------------------------------------------------------------

// Register a user, verify their email via the token service, and return a
// working bearer token. Signup no longer auto-logs-in, so tests must verify.
async function signupVerified(email, name = 'Test User') {
  await post('/api/auth/signup', { email, password: 'longpassword123', name });
  const { issueVerificationToken } = await import('../src/auth/verification.js');
  const { getUserByEmail } = await import('../src/db/db.js');
  const user = await getUserByEmail(email);
  const rawToken = await issueVerificationToken(user.id);
  const { body } = await post('/api/auth/verify-email', { token: rawToken });
  return body.token;
}

describe('GET /api/history/:id (ownership enforced)', () => {
  const signup = (email) => signupVerified(email, 'History Owner');

  test('unauthenticated request is rejected (401), never leaks a report', async () => {
    // Create an anonymous analysis (no token).
    const { body: postBody } = await post('/api/analyze', {
      type: 'text',
      content: 'URGENT: Verify your account to avoid permanent suspension.',
    });
    const id = postBody.id;
    // Fetching it with no auth must NOT return the report (IDOR fix).
    const { status } = await get(`/api/history/${id}`);
    assert.equal(status, 401, 'unauthenticated history fetch must be rejected');
  });

  test('returns 404 for non-existent analysis id (authenticated)', async () => {
    const token = await signup(`missing_${Date.now()}@example.com`);
    const { status } = await get('/api/history/nonexistent-id-12345', token);
    assert.equal(status, 404);
  });

  test('owner can retrieve their own analysis by id', async () => {
    const token = await signup(`owner_${Date.now()}@example.com`);
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ type: 'text', content: 'Owner-only report content.' }),
    });
    const postBody = await res.json();
    const id = postBody.id;
    const { status, body } = await get(`/api/history/${id}`, token);
    assert.equal(status, 200);
    assert.equal(body.analysis.id, id);
    assert.ok(typeof body.analysis.riskScore === 'number');
  });

  test('a different authenticated user cannot read another user\'s analysis (IDOR)', async () => {
    const ownerToken = await signup(`a_${Date.now()}@example.com`);
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ type: 'text', content: 'Private report for user A.' }),
    });
    const { id } = await res.json();

    const attackerToken = await signup(`b_${Date.now()}@example.com`);
    const { status } = await get(`/api/history/${id}`, attackerToken);
    assert.equal(status, 404, 'another user must not be able to read the analysis');
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/history/:id — ownership enforced
// ---------------------------------------------------------------------------

describe('DELETE /api/history/:id (ownership enforced)', () => {
  const signup = (email) => signupVerified(email, 'Delete Tester');

  test('unauthenticated delete is rejected (401)', async () => {
    const res = await fetch(`${baseUrl}/api/history/whatever-id`, { method: 'DELETE' });
    assert.equal(res.status, 401);
  });

  test('a user cannot delete another user\'s analysis', async () => {
    const ownerToken = await signup(`del_owner_${Date.now()}@example.com`);
    const created = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ type: 'text', content: 'User A private analysis to protect.' }),
    });
    const { id } = await created.json();

    // Attacker attempts delete — request "succeeds" (200) but must NOT remove the row.
    const attackerToken = await signup(`del_attacker_${Date.now()}@example.com`);
    await fetch(`${baseUrl}/api/history/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${attackerToken}` },
    });

    // Owner can still read it → it was not deleted by the attacker.
    const { status } = await get(`/api/history/${id}`, ownerToken);
    assert.equal(status, 200, "attacker must not have deleted the owner's analysis");
  });
});

// ---------------------------------------------------------------------------
// Email verification (clickable link) token lifecycle
// ---------------------------------------------------------------------------

describe('Email verification', () => {
  test('signup creates an UNVERIFIED account and does not auto-login', async () => {
    const { status, body } = await post('/api/auth/signup', {
      email: `verify_${Date.now()}@example.com`,
      password: 'longpassword123',
      name: 'Verify Me',
    });
    assert.equal(status, 201);
    assert.equal(body.requiresVerification, true);
    assert.ok(!body.token, 'signup must not return a session token before verification');
    assert.equal(body.user.emailVerified, false);
  });

  test('unverified user cannot log in with password (403 + requiresVerification)', async () => {
    const email = `noverify_${Date.now()}@example.com`;
    await post('/api/auth/signup', { email, password: 'longpassword123', name: 'No Verify' });
    const { status, body } = await post('/api/auth/login', { email, password: 'longpassword123' });
    assert.equal(status, 403);
    assert.equal(body.requiresVerification, true);
  });

  test('valid token verifies email, is single-use, and issues a session token', async () => {
    // Use the token service + db directly to obtain a raw token for a user.
    const { issueVerificationToken } = await import('../src/auth/verification.js');
    const { getUserByEmail } = await import('../src/db/db.js');
    const email = `tok_${Date.now()}@example.com`;
    await post('/api/auth/signup', { email, password: 'longpassword123', name: 'Token User' });
    const user = await getUserByEmail(email);
    const rawToken = await issueVerificationToken(user.id);

    // First use → success + token.
    const ok = await post('/api/auth/verify-email', { token: rawToken });
    assert.equal(ok.status, 200);
    assert.ok(ok.body.token, 'verify-email must return a session token on success');
    assert.equal(ok.body.user.emailVerified, true);

    // Reuse → rejected.
    const reuse = await post('/api/auth/verify-email', { token: rawToken });
    assert.equal(reuse.status, 400);
    assert.equal(reuse.body.reason, 'used');

    // Verified user can now log in.
    const login = await post('/api/auth/login', { email, password: 'longpassword123' });
    assert.equal(login.status, 200);
    assert.ok(login.body.token);
  });

  test('invalid token is rejected', async () => {
    const { status, body } = await post('/api/auth/verify-email', { token: 'not-a-real-token-value' });
    assert.equal(status, 400);
    assert.equal(body.reason, 'invalid');
  });

  test('resend-verification returns a generic response (no account enumeration)', async () => {
    const real = await post('/api/auth/resend-verification', { email: `resend_${Date.now()}@example.com` });
    assert.equal(real.status, 200);
    assert.equal(real.body.ok, true);
    // Same generic shape for an address with no account.
    const none = await post('/api/auth/resend-verification', { email: 'definitely-not-registered@example.com' });
    assert.equal(none.status, 200);
    assert.equal(none.body.ok, true);
  });
});

// ---------------------------------------------------------------------------
// Google OAuth — state validation (CSRF) and demo gating
// ---------------------------------------------------------------------------

describe('Google OAuth security', () => {
  // Follow redirects manually so we can inspect the callback redirect target.
  async function getNoRedirect(path) {
    const res = await fetch(`${baseUrl}${path}`, { redirect: 'manual' });
    return { status: res.status, location: res.headers.get('location') || '' };
  }

  test('callback with missing state redirects with google_state_invalid', async () => {
    const { status, location } = await getNoRedirect('/api/auth/google/callback?code=fakecode');
    assert.ok([301, 302, 303, 307, 308].includes(status), `expected a redirect, got ${status}`);
    assert.ok(location.includes('error=google_state_invalid'), `expected state error, got: ${location}`);
  });

  test('callback with an unknown state redirects with google_state_invalid', async () => {
    const { location } = await getNoRedirect('/api/auth/google/callback?code=fakecode&state=neverissued');
    assert.ok(location.includes('error=google_state_invalid'), `expected state error, got: ${location}`);
  });

  test('demo Google sign-in works in non-production (test env)', async () => {
    // DISABLE_RATE_LIMIT is set; NODE_ENV is not production in tests.
    const { status, body } = await post('/api/auth/google/demo', {});
    assert.equal(status, 200);
    assert.ok(body.token, 'demo sign-in should return a token outside production');
    assert.equal(body.demo, true);
  });
});

// ---------------------------------------------------------------------------
// Auth endpoints — basic validation
// ---------------------------------------------------------------------------

describe('POST /api/auth/signup', () => {
  test('short password returns 400', async () => {
    const { status, body } = await post('/api/auth/signup', {
      email: 'test@example.com',
      password: 'short',
      name: 'Test User',
    });
    assert.equal(status, 400);
    assert.ok(body.error.toLowerCase().includes('password'), `Error should mention password: ${body.error}`);
  });

  test('invalid email returns 400', async () => {
    const { status } = await post('/api/auth/signup', {
      email: 'not-an-email',
      password: 'longpassword123',
      name: 'Test',
    });
    assert.equal(status, 400);
  });
});

describe('POST /api/auth/login', () => {
  test('wrong credentials return 401', async () => {
    const { status } = await post('/api/auth/login', {
      email: 'nonexistent@example.com',
      password: 'wrongpassword',
    });
    assert.equal(status, 401);
  });
});

// ---------------------------------------------------------------------------
// Rate limit / security headers
// ---------------------------------------------------------------------------

describe('Security headers', () => {
  test('x-powered-by header is not present', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.ok(!res.headers.get('x-powered-by'), 'x-powered-by should be removed');
  });
});

console.log('\n✓ All API tests completed.\n');
