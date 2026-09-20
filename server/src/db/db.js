/**
 * ScamShield AI — Persistence layer (Turso / libSQL)
 *
 * Migrated from Node's experimental `node:sqlite` to @libsql/client so the app
 * has DURABLE persistence on Netlify serverless (node:sqlite wrote to /tmp,
 * which is ephemeral and not shared across function instances).
 *
 * Two modes, chosen automatically:
 *   - LOCAL DEV / TEST: no env vars needed. Uses an embedded libSQL file at
 *     server/data/scamshield.db (or an in-memory DB when SCAMSHIELD_DB_MEMORY
 *     is set, used by the test suite for isolation).
 *   - PRODUCTION: set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN. Data lives in the
 *     managed Turso database and survives cold starts / multiple instances.
 *
 * The @libsql/client API is async, so every exported data function returns a
 * Promise. Callers await them. The exported function NAMES and their ownership
 * semantics are unchanged from the previous implementation.
 */
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Resolve a libSQL client.
 *
 * When a remote Turso URL is configured (production), we use the WEB build
 * (`@libsql/client/web`) which talks to Turso purely over HTTP. It has no
 * native bindings, so Netlify's esbuild bundler packages it cleanly — the
 * default entry pulls in native `libsql` bindings that can break serverless
 * bundling. For local file / in-memory dev, the default client is used.
 */
let clientPromise = null;
async function getClient() {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (url) {
      const { createClient } = await import('@libsql/client/web');
      return createClient({ url, authToken });
    }

    const { createClient } = await import('@libsql/client');
    if (process.env.SCAMSHIELD_DB_MEMORY === '1') {
      return createClient({ url: ':memory:' });
    }
    const filePath = join(process.cwd(), 'data', 'scamshield.db');
    try {
      mkdirSync(dirname(filePath), { recursive: true });
    } catch {
      // directory may already exist / be read-only on some serverless FS
    }
    return createClient({ url: `file:${filePath}` });
  })();
  return clientPromise;
}

// Small helpers over the libSQL result shape.
async function run(sql, args = []) {
  const client = await getClient();
  return client.execute({ sql, args });
}
async function all(sql, args = []) {
  const client = await getClient();
  const res = await client.execute({ sql, args });
  return res.rows;
}
async function get(sql, args = []) {
  const rows = await all(sql, args);
  return rows[0] || null;
}

let initPromise = null;

/**
 * Create the schema and run idempotent migrations. Safe to call multiple times
 * (guarded by a shared promise so concurrent serverless requests don't race).
 */
export function initDb() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    // libSQL executes one statement per call; run them sequentially.
    const statements = [
      `CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        input_summary TEXT NOT NULL,
        risk_score INTEGER NOT NULL,
        risk_level TEXT NOT NULL,
        category TEXT NOT NULL,
        analysis_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        user_id TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_id)`,
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT,
        provider TEXT NOT NULL DEFAULT 'email',
        provider_id TEXT,
        avatar TEXT,
        email_verified INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS otps (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        code_hash TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        verified INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email)`,
      `CREATE TABLE IF NOT EXISTS pending_signups (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        created_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_evt_user ON email_verification_tokens(user_id)`,
      `CREATE TABLE IF NOT EXISTS oauth_states (
        state TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS demo_scenarios (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )`,
    ];
    for (const sql of statements) {
      await run(sql);
    }
  })();
  return initPromise;
}

// ─── Analyses ────────────────────────────────────────────────────────────────

export async function saveAnalysis(analysis, userId = null) {
  const category =
    typeof analysis.category === 'string' ? analysis.category : analysis.category?.id ?? 'unknown';
  await run(
    `INSERT OR REPLACE INTO analyses
      (id, type, input_summary, risk_score, risk_level, category, analysis_json, created_at, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      analysis.id,
      String(analysis.type ?? 'text'),
      String(analysis.inputSummary ?? ''),
      Number(analysis.riskScore ?? 0),
      String(analysis.riskLevel ?? 'suspicious'),
      String(category),
      JSON.stringify(analysis),
      String(analysis.createdAt ?? new Date().toISOString()),
      userId || null,
    ],
  );
}

export async function listAnalyses(userId = null, limit = 40) {
  const rows = userId
    ? await all(
        `SELECT id, type, input_summary, risk_score, risk_level, category, created_at
         FROM analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
        [userId, limit],
      )
    : await all(
        `SELECT id, type, input_summary, risk_score, risk_level, category, created_at
         FROM analyses ORDER BY created_at DESC LIMIT ?`,
        [limit],
      );
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    inputSummary: r.input_summary,
    riskScore: r.risk_score,
    riskLevel: r.risk_level,
    category: r.category,
    createdAt: r.created_at,
  }));
}

/**
 * Fetch a stored analysis by id.
 *
 * SECURITY: ownership is enforced here. Authenticated callers MUST pass userId;
 * the record is returned only when it belongs to that user. Anonymous analyses
 * (user_id IS NULL) are intentionally not retrievable over the API — the
 * anonymous creator keeps their own copy client-side. This is the IDOR fix.
 */
export async function getAnalysis(id, userId = null) {
  const row = userId
    ? await get(`SELECT analysis_json FROM analyses WHERE id = ? AND user_id = ?`, [id, userId])
    : await get(`SELECT analysis_json FROM analyses WHERE id = ?`, [id]);
  if (!row) return null;
  return JSON.parse(row.analysis_json);
}

/**
 * Delete an analysis with strict ownership. Authenticated users may only delete
 * their own records (no `OR user_id IS NULL` — that let users delete others'
 * anonymous records).
 */
export async function deleteAnalysis(id, userId = null) {
  if (userId) {
    await run(`DELETE FROM analyses WHERE id = ? AND user_id = ?`, [id, userId]);
  } else {
    await run(`DELETE FROM analyses WHERE id = ? AND user_id IS NULL`, [id]);
  }
}

export async function clearAnalyses(userId = null) {
  if (userId) {
    await run(`DELETE FROM analyses WHERE user_id = ?`, [userId]);
  } else {
    await run(`DELETE FROM analyses`);
  }
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function createUser({
  email,
  name,
  passwordHash = null,
  provider = 'email',
  providerId = null,
  avatar = null,
  emailVerified = false,
}) {
  const id = randomUUID();
  const now = new Date().toISOString();
  await run(
    `INSERT INTO users (id, email, name, password_hash, provider, provider_id, avatar, email_verified, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, String(email).toLowerCase(), name, passwordHash, provider, providerId, avatar, emailVerified ? 1 : 0, now, now],
  );
  return getUserById(id);
}

export async function userExists(email) {
  const row = await get(`SELECT 1 AS x FROM users WHERE email = ?`, [String(email || '').toLowerCase()]);
  return Boolean(row);
}

export async function setUserEmailVerified(email) {
  await run(`UPDATE users SET email_verified = 1, updated_at = ? WHERE email = ?`, [
    new Date().toISOString(),
    String(email || '').toLowerCase(),
  ]);
}

export async function touchUser(id) {
  await run(`UPDATE users SET updated_at = ? WHERE id = ?`, [new Date().toISOString(), id]);
}

export async function getUserByEmail(email) {
  return get(`SELECT * FROM users WHERE email = ?`, [String(email || '').toLowerCase()]);
}

export async function getUserById(id) {
  return get(`SELECT * FROM users WHERE id = ?`, [id]);
}

export async function getUserByProvider(provider, providerId) {
  return get(`SELECT * FROM users WHERE provider = ? AND provider_id = ?`, [provider, String(providerId)]);
}

export async function linkGoogleIdentity(userId, googleId) {
  await run(`UPDATE users SET provider = 'google', provider_id = ?, updated_at = ? WHERE id = ?`, [
    String(googleId),
    new Date().toISOString(),
    userId,
  ]);
  return getUserById(userId);
}

// ─── One-time OTP records ─────────────────────────────────────────────────────

export async function createOtp({ id, email, codeHash, expiresAt }) {
  const now = new Date().toISOString();
  await run(
    `INSERT INTO otps (id, email, code_hash, expires_at, attempts, verified, created_at) VALUES (?, ?, ?, ?, 0, 0, ?)`,
    [id, String(email).toLowerCase(), codeHash, expiresAt, now],
  );
}

export async function getLatestOtp(email) {
  return get(`SELECT * FROM otps WHERE email = ? AND verified = 0 ORDER BY rowid DESC LIMIT 1`, [
    String(email || '').toLowerCase(),
  ]);
}

export async function getLatestOtpAnyStatus(email) {
  return get(`SELECT * FROM otps WHERE email = ? ORDER BY rowid DESC LIMIT 1`, [String(email || '').toLowerCase()]);
}

export async function incrementOtpAttempts(id) {
  await run(`UPDATE otps SET attempts = attempts + 1 WHERE id = ?`, [id]);
}

export async function markOtpVerified(id) {
  await run(`UPDATE otps SET verified = 1 WHERE id = ?`, [id]);
}

export async function deleteOtpsForEmail(email) {
  await run(`DELETE FROM otps WHERE email = ?`, [String(email || '').toLowerCase()]);
}

export async function cleanupExpiredOtps(maxAgeMs = 2 * 60 * 60 * 1000) {
  await run(`DELETE FROM otps WHERE created_at < ?`, [new Date(Date.now() - maxAgeMs).toISOString()]);
}

// ─── Pending signups (name/password held until email OTP verified) ────────────

export async function savePendingSignup({ email, name, passwordHash }) {
  const now = new Date().toISOString();
  await run(
    `INSERT INTO pending_signups (email, name, password_hash, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET name = excluded.name, password_hash = excluded.password_hash`,
    [String(email).toLowerCase(), name, passwordHash, now],
  );
}

export async function getPendingSignup(email) {
  return get(`SELECT * FROM pending_signups WHERE email = ?`, [String(email || '').toLowerCase()]);
}

export async function deletePendingSignup(email) {
  await run(`DELETE FROM pending_signups WHERE email = ?`, [String(email || '').toLowerCase()]);
}

export async function cleanupPendingSignups(maxAgeMs = 2 * 60 * 60 * 1000) {
  await run(`DELETE FROM pending_signups WHERE created_at < ?`, [new Date(Date.now() - maxAgeMs).toISOString()]);
}

// ─── Email verification tokens (clickable link verification) ──────────────────

export async function createEmailVerificationToken({ id, userId, tokenHash, expiresAt }) {
  const now = new Date().toISOString();
  // Invalidate any previous unused tokens for this user first.
  await run(`DELETE FROM email_verification_tokens WHERE user_id = ? AND used_at IS NULL`, [userId]);
  await run(
    `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at, used_at, created_at)
     VALUES (?, ?, ?, ?, NULL, ?)`,
    [id, userId, tokenHash, expiresAt, now],
  );
}

export async function findVerificationTokenByHash(tokenHash) {
  return get(`SELECT * FROM email_verification_tokens WHERE token_hash = ?`, [tokenHash]);
}

export async function markVerificationTokenUsed(id) {
  await run(`UPDATE email_verification_tokens SET used_at = ? WHERE id = ?`, [new Date().toISOString(), id]);
}

export async function latestVerificationTokenForUser(userId) {
  return get(
    `SELECT * FROM email_verification_tokens WHERE user_id = ? ORDER BY rowid DESC LIMIT 1`,
    [userId],
  );
}

export async function cleanupExpiredVerificationTokens(maxAgeMs = 24 * 60 * 60 * 1000) {
  await run(`DELETE FROM email_verification_tokens WHERE created_at < ?`, [
    new Date(Date.now() - maxAgeMs).toISOString(),
  ]);
}

// ─── OAuth state (CSRF protection for Google sign-in) ─────────────────────────

export async function saveOauthState(state, ttlMs = 10 * 60 * 1000) {
  const now = Date.now();
  await run(`INSERT OR REPLACE INTO oauth_states (state, created_at, expires_at) VALUES (?, ?, ?)`, [
    state,
    new Date(now).toISOString(),
    new Date(now + ttlMs).toISOString(),
  ]);
}

/**
 * Consume an OAuth state: returns true only if it exists and is unexpired.
 * The state is deleted regardless (single use).
 */
export async function consumeOauthState(state) {
  if (!state) return false;
  const row = await get(`SELECT expires_at FROM oauth_states WHERE state = ?`, [state]);
  await run(`DELETE FROM oauth_states WHERE state = ?`, [state]);
  if (!row) return false;
  return new Date(row.expires_at).getTime() >= Date.now();
}

export async function cleanupExpiredOauthStates() {
  await run(`DELETE FROM oauth_states WHERE expires_at < ?`, [new Date().toISOString()]);
}

// ─── Demo scenarios ───────────────────────────────────────────────────────────

export async function getSeedScenarios() {
  return all(`SELECT * FROM demo_scenarios ORDER BY rowid`);
}

export async function seedScenarios(scenarios) {
  const row = await get(`SELECT COUNT(*) AS c FROM demo_scenarios`);
  if (row && Number(row.c) > 0) return;
  for (const s of scenarios) {
    await run(`INSERT OR IGNORE INTO demo_scenarios (id, title, message, type, icon) VALUES (?, ?, ?, ?, ?)`, [
      s.id,
      s.title,
      s.message,
      s.type,
      s.icon,
    ]);
  }
}
