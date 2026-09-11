import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Uses Node's built-in SQLite engine — zero native dependencies, which makes
// the module safe for serverless bundling (esbuild/nft). Serverless caches are
// per-instance and ephemeral: writes survive the lifetime of a warm instance.
// Swap this module for a cloud SQLite later if persistent hosting is needed.
const __dirname = dirname(fileURLToPath(import.meta.url));
const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.NETLIFY);

const dbPath = IS_SERVERLESS
  ? '/tmp/scamshield.db'
  : join(__dirname, '..', '..', 'data', 'scamshield.db');

if (!IS_SERVERLESS) {
  mkdirSync(dirname(dbPath), { recursive: true });
}

export const db = new DatabaseSync(dbPath);

// Schema is created at module load so route modules that seed at import time
// always find the tables ready.
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    input_summary TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    risk_level TEXT NOT NULL,
    category TEXT NOT NULL,
    analysis_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
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
  );
  CREATE TABLE IF NOT EXISTS otps (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
  CREATE TABLE IF NOT EXISTS pending_signups (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS demo_scenarios (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    icon TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Backwards-compatible migration: add user ownership to existing analyses.
const analysisCols = db.prepare(`PRAGMA table_info(analyses)`).all();
if (!analysisCols.some((c) => c.name === 'user_id')) {
  db.exec(`ALTER TABLE analyses ADD COLUMN user_id TEXT`);
}

// Loop-safe idempotent migrations for the auth schema.
const userCols = db.prepare(`PRAGMA table_info(users)`).all();
if (!userCols.some((c) => c.name === 'email_verified')) {
  db.exec(`ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0`);
}
if (!userCols.some((c) => c.name === 'updated_at')) {
  db.exec(`ALTER TABLE users ADD COLUMN updated_at TEXT`);
}
if (!userCols.some((c) => c.name === 'updated_at')) {
  db.exec(`UPDATE users SET updated_at = created_at WHERE updated_at IS NULL`);
}

export function initDb() {
  // Kept for backwards compatibility — schema is already ensured above.
}

export function saveAnalysis(analysis, userId = null) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO analyses (id, type, input_summary, risk_score, risk_level, category, analysis_json, created_at, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const category = typeof analysis.category === 'string' ? analysis.category : analysis.category?.id ?? 'unknown';
  stmt.run(
    analysis.id,
    String(analysis.type ?? 'text'),
    String(analysis.inputSummary ?? ''),
    Number(analysis.riskScore ?? 0),
    String(analysis.riskLevel ?? 'suspicious'),
    String(category),
    JSON.stringify(analysis),
    String(analysis.createdAt ?? new Date().toISOString()),
    userId || null,
  );
}

export function listAnalyses(userId = null, limit = 40) {
  const rows = userId
    ? db
        .prepare(`SELECT id, type, input_summary, risk_score, risk_level, category, created_at FROM analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`)
        .all(userId, limit)
    : db.prepare(`SELECT id, type, input_summary, risk_score, risk_level, category, created_at FROM analyses ORDER BY created_at DESC LIMIT ?`).all(limit);
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

export function getAnalysis(id) {
  const rows = db.prepare(`SELECT * FROM analyses WHERE id = ?`).all(id);
  if (!rows.length) return null;
  return JSON.parse(rows[0].analysis_json);
}

export function deleteAnalysis(id, userId = null) {
  if (userId) {
    db.prepare(`DELETE FROM analyses WHERE id = ? AND (user_id = ? OR user_id IS NULL)`).run(id, userId);
  } else {
    db.prepare(`DELETE FROM analyses WHERE id = ?`).run(id);
  }
}

export function clearAnalyses(userId = null) {
  if (userId) {
    db.prepare(`DELETE FROM analyses WHERE user_id = ?`).run(userId);
  } else {
    db.prepare(`DELETE FROM analyses`).run();
  }
}

export function createUser({ email, name, passwordHash = null, provider = 'email', providerId = null, avatar = null, emailVerified = false }) {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO users (id, email, name, password_hash, provider, provider_id, avatar, email_verified, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, email, name, passwordHash, provider, providerId, avatar, emailVerified ? 1 : 0, now, now);
  return getUserById(id);
}

export function userExists(email) {
  const rows = db.prepare(`SELECT 1 AS x FROM users WHERE email = ?`).all(String(email || '').toLowerCase());
  return rows.length > 0;
}

export function setUserEmailVerified(email) {
  db.prepare(`UPDATE users SET email_verified = 1, updated_at = ? WHERE email = ?`).run(new Date().toISOString(), String(email || '').toLowerCase());
}

export function touchUser(id) {
  db.prepare(`UPDATE users SET updated_at = ? WHERE id = ?`).run(new Date().toISOString(), id);
}

// --- One-time OTP records ---------------------------------------------------

export function createOtp({ id, email, codeHash, expiresAt }) {
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO otps (id, email, code_hash, expires_at, attempts, verified, created_at) VALUES (?, ?, ?, ?, 0, 0, ?)`)
    .run(id, String(email).toLowerCase(), codeHash, expiresAt, now);
}

export function getLatestOtp(email) {
  const rows = db.prepare(`SELECT * FROM otps WHERE email = ? AND verified = 0 ORDER BY rowid DESC LIMIT 1`).all(String(email || '').toLowerCase());
  return rows[0] || null;
}

export function getLatestOtpAnyStatus(email) {
  const rows = db.prepare(`SELECT * FROM otps WHERE email = ? ORDER BY rowid DESC LIMIT 1`).all(String(email || '').toLowerCase());
  return rows[0] || null;
}

export function incrementOtpAttempts(id) {
  db.prepare(`UPDATE otps SET attempts = attempts + 1 WHERE id = ?`).run(id);
}

export function markOtpVerified(id) {
  db.prepare(`UPDATE otps SET verified = 1 WHERE id = ?`).run(id);
}

export function deleteOtpsForEmail(email) {
  db.prepare(`DELETE FROM otps WHERE email = ?`).run(String(email || '').toLowerCase());
}

export function cleanupExpiredOtps(maxAgeMs = 2 * 60 * 60 * 1000) {
  db.prepare(`DELETE FROM otps WHERE created_at < ?`).run(new Date(Date.now() - maxAgeMs).toISOString());
}

// --- Pending signups (name/password held until the email OTP is verified) -----

export function savePendingSignup({ email, name, passwordHash }) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO pending_signups (email, name, password_hash, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET name = excluded.name, password_hash = excluded.password_hash
  `).run(String(email).toLowerCase(), name, passwordHash, now);
}

export function getPendingSignup(email) {
  const rows = db.prepare(`SELECT * FROM pending_signups WHERE email = ?`).all(String(email || '').toLowerCase());
  return rows[0] || null;
}

export function deletePendingSignup(email) {
  db.prepare(`DELETE FROM pending_signups WHERE email = ?`).run(String(email || '').toLowerCase());
}

export function cleanupPendingSignups(maxAgeMs = 2 * 60 * 60 * 1000) {
  db.prepare(`DELETE FROM pending_signups WHERE created_at < ?`).run(new Date(Date.now() - maxAgeMs).toISOString());
}

export function getUserByEmail(email) {
  const rows = db.prepare(`SELECT * FROM users WHERE email = ?`).all(String(email || '').toLowerCase());
  return rows[0] || null;
}

export function getUserById(id) {
  const rows = db.prepare(`SELECT * FROM users WHERE id = ?`).all(id);
  return rows[0] || null;
}

export function getUserByProvider(provider, providerId) {
  const rows = db.prepare(`SELECT * FROM users WHERE provider = ? AND provider_id = ?`).all(provider, String(providerId));
  return rows[0] || null;
}

export function getSeedScenarios() {
  return db.prepare(`SELECT * FROM demo_scenarios ORDER BY rowid`).all();
}

export function seedScenarios(scenarios) {
  const existing = db.prepare(`SELECT COUNT(*) AS c FROM demo_scenarios`).get();
  if (existing.c > 0) return;
  const stmt = db.prepare(`INSERT INTO demo_scenarios (id, title, message, type, icon) VALUES (?, ?, ?, ?, ?)`);
  for (const s of scenarios) stmt.run(s.id, s.title, s.message, s.type, s.icon);
}