# 03 — Technical Architecture

## Overview

Two processes: a **React SP** (Vite + TypeScript) and an **Express API** (Node.js). In development Vite proxies
`/api` to the server. SQLite is used for lightweight persistence via the built-in `node:sqlite` module (no native
compilation).

## Analysis pipeline

```
Input (text / URL / screenshot)
        │
        ▼
Route validation + sanitization      (type whitelist, size limits, control-char stripping)
        │
        ▼
┌───────────────────────  AI ORCHESTRATION  ───────────────────────┐
│  1. Rules engine (server/src/services/engine.js) ALWAYS runs     │
│     → produces a complete, schema-valid report                   │
│  2. If AI_API_KEY is set → call OpenAI-compatible model:        │
│       • system prompt enforces explainability rules              │
│       • response_format = json_object                            │
│       • schema validated; one retry; fall back to rules engine   │
└───────────────────────────────────────────────────────────────────┘
        │
        ▼
Persist summary + report (SQLite) → return full analysis to client
```

### The rules engine (demo mode / safety net)
- Signal detectors: urgency, fear, authority impersonation, reward bait, too-good-to-be-true, credential requests,
  OTP requests, payments, procedure-bypass, fake employment, investment promises, romance/pretence, tech support,
  delivery/parcel patterns, grammar anomalies, and suspicious links.
- Weighted scoring → 0–100 risk, risk level, category priority logic, 5 risk dimensions, confidence.
- Every output object separates **evidence** (quoted phrases) from **inference** from **uncertainty**.

### AI layer (optional live mode)
`server/src/ai/provider.js`:
- System prompt (defensive, explainability-first, no-attack-instructions, no-secrets).
- Strict JSON output, schema validation (`validateAiPayload`), normalized via `normalize`.
- Retry once on invalid output; any failure falls back to the rules engine with `mode: "demo"` and the UI shows
  **Demo Mode**.

## API surface

| Method & path | Purpose |
|---|---|
| `POST /api/analyze` | Analyze pasted text |
| `POST /api/analyze/url` | Analyze a URL structurally |
| `POST /api/analyze/image` | Analyze a screenshot (vision AI if configured; demo fallback otherwise) |
| `POST /api/generate-safe-reply` | Return a safe response for a message |
| `GET /api/health` | Health + mode flag |
| `GET /api/demo-scenarios` | Six one-click demo scenarios |
| `GET /api/history` · `GET/POST/DELETE` | History list / fetch / delete, clear (sign-in scoped) |
| `POST /api/auth/signup` · `POST /api/auth/login` | Email/password accounts → `{ token, user }` |
| `POST /api/auth/signup-send-otp` | Signup form → sends a code only to the email entered; account is created after the code is verified |
| `GET /api/auth/me` | Current user (Bearer token) |
| `POST /api/auth/logout` | Explicit sign-out acknowledgement (stateless tokens) |
| `POST /api/auth/send-otp` · `POST /api/auth/verify-otp` | Email OTP: send a 6-digit code, then verify → login or auto-create |
| `GET /api/auth/google/config` · `GET /api/auth/google/url` | Google OAuth availability + auth URL |
| `GET /api/auth/google/callback` | OAuth code exchange → redirects to SPA `/auth/callback?token=…` |
| `POST /api/auth/google/demo` | Labeled demo Google sign-in (never contacts Google) |

## Data model (SQLite)

- `users(id, email, name, password_hash, provider, provider_id, avatar, email_verified, created_at, updated_at)`
- `otps(id, email, code_hash, expires_at, attempts, verified, created_at)` — one-time codes, scrypt-hashed
- `analyses(id, type, input_summary, risk_score, risk_level, category, analysis_json, created_at, user_id)`
- `demo_scenarios(id, title, message, type, icon)`
- `settings(key, value)`

Raw messages are **not** stored — only a short summary and the generated report.

## Auth flow

- `server/src/auth/token.js` signs self-contained HMAC-SHA256 JWTs (no external dependency).
- `server/src/auth/password.js` hashes passwords with scrypt + per-user salt (`node:crypto`).
- `server/src/auth/otp.js` generates 6-digit codes with `crypto.randomInt`, stores them only as scrypt hashes, and
  enforces expiry (`OTP_EXPIRY_MINUTES`), a resend cooldown and an attempt budget. Codes are never returned in API
  responses and never logged through the SMTP path.
- `server/src/auth/mailer.js` sends professional HTML/text verification emails via nodemailer (SMTP). Without SMTP
  credentials it prints the code to the server console as an explicit development-only fallback.
- `server/src/middleware/auth.js` provides `requireAuth` / `optionalAuth`. Analyze endpoints attach the analysis to the
  signed-in user via `user_id`; history endpoints only return the caller's own analyses.
- Google OAuth is optional (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`). When unconfigured the sign-in screen shows a
  clearly-labeled **Demo Google** button instead. The callback exchanges the code server-side and redirects to the SPA,
  where the token is stored and the popup window closes.

## Frontend structure

- Route-level code splitting (React.lazy) + manual chunking for three.js / recharts / framer-motion / react.
- Design system: Tailwind tokens for ink (near-black), accent cyan/violet, and risk colors.
- Visual modules: `three/ShieldScene` (R3F), `viz/ThreatRadar`, `viz/AttackChain`, `viz/ResultPanels`,
  `viz/EvidencePanel`, `ui/ScoreRing`, `scan/ScanOverlay`, `scan/PhoneMockup`, `layout/` shell.
- Local analysis store (localStorage) supplements server history so the app works even if the backend is offline.
- Auth lives in `context/AuthContext` (token/user state) + `components/auth/*` (protected routes, auth shell, Google
  button, form fields) with dedicated `Login` / `Signup` / `AuthCallback` pages; Dashboard and History are protected.

## Security notes

- No API keys in the frontend; all provider keys live in server env vars.
- CORS allowlist, per-route rate limits, 6 MB JSON body limit, data-URL validation for images.
- Sanitized/escaped rendering; the suspicious URL in the demo is an `<a href="#">` that prevents navigation.
- The app never opens embedded URLs, never downloads remote content, and never executes uploaded files.