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
import { createApp } from '../src/app.js';
import { initDb } from '../src/db/db.js';

let server;
let baseUrl;

before(async () => {
  initDb();
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

describe('GET /api/history/:id', () => {
  test('returns 404 for non-existent analysis id', async () => {
    const { status } = await get('/api/history/nonexistent-id-12345');
    assert.equal(status, 404);
  });

  test('stores and retrieves an analysis by id', async () => {
    const { body: postBody } = await post('/api/analyze', {
      type: 'text',
      content: 'URGENT: Verify your account to avoid permanent suspension.',
    });
    const id = postBody.id;
    const { status, body } = await get(`/api/history/${id}`);
    assert.equal(status, 200);
    assert.equal(body.analysis.id, id);
    assert.ok(typeof body.analysis.riskScore === 'number');
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
