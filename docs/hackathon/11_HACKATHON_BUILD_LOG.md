# 11 — Hackathon Build Log

> Keep this updated as the build proceeds. Record real dates and progress only.

## Timeline

### Phase 0 — Decisions (Day 0, ~1 h)
- Scoped MVP: landing + analyzer + explainable report + demo mode as P0; dashboard/history/learn as P1.
- Chose React/Vite/TS + Express + SQLite (node:sqlite) to avoid native compilation pain.
- Decided demo-mode-first so the product works with zero credentials at judging time.

### Phase 1 — Backend core
- Scaffolded Express server, CORS, rate limiting, size limits.
- Built `engine.js`: 14 signal detectors, weighted scoring, category priority, 5 risk dimensions,
  evidence/inference/uncertainty model, attack chains per category, safe reply, disclaimers.
- Added SQLite storage with summaries only (privacy-by-default).

### Phase 2 — AI layer
- `provider.js`: OpenAI-compatible caller, system prompt, strict-JSON enforcement, one retry, fallback,
  optional vision path for images.

### Phase 3 — Frontend
- Tailwind design system (ink/accent/risk tokens, glass cards, magnetic buttons).
- Layout shell (fixed glass nav, footer, animated page transitions).
- Landing + ShieldScene (R3F) + phone mock + cinematic scan overlay + hero demo.
- Analyze workspace (4 tabs, drag-drop image, URL validation, scenarios).
- Results page (score ring, radar, reasons, attack chain, safe reply, actions, evidence panel).
- Dashboard (Recharts), History (CRUD), Learn (quiz), About, Privacy.

### Phase 4 — Accounts & connected dashboard
- Backend auth: `users` table, HMAC-signed session tokens, scrypt password hashing, brute-force limiter.
- Auth routes: signup / login / me / google config / google url / google callback / demo google.
- Analyses now carry `user_id`; history and deletes are scoped to the signed-in account.
- Frontend: AuthProvider, protected routes, Login/Signup/AuthCallback pages, Google (and labeled Demo Google) buttons,
  user-aware navbar with avatar + sign-out, and a live personal dashboard on top of the labeled demo analytics.
- Verified end-to-end: signup 201, duplicate 409, login 200, wrong password 401, `/me` 200/401, authed analyze lands in
  the user's history, delete/clear scoped, google demo sign-in, through both port 3001 and the Vite proxy.

### Phase 4.5 — Email OTP + hardened Google
- `server/src/auth/otp.js`: 6-digit codes via `crypto.randomInt`, scrypt-only storage, expiry, resend cooldown,
  attempt budget; codes never appear in responses.
- `server/src/auth/mailer.js`: nodemailer SMTP delivery with a clean HTML/text template; explicit dev-only console
  fallback when SMTP is not configured.
- Routes: `POST /auth/send-otp`, `POST /auth/verify-otp` (verify → login or auto-create, no duplicates, links to
  existing Google/password accounts), `POST /auth/logout`; Google-created accounts are marked `email_verified`.
- `POST /auth/signup-send-otp`: signup form (name/email/password) sends a code **only to the email entered**; the
  account with the entered name + salted password is created after the code is verified; duplicates are rejected.
- DB: `users.email_verified` + `updated_at`, new `otps` table, `pending_signups` table (holds signup name/password
  until verified), idempotent migrations.
- Frontend: segmented OTP input with paste/auto-advance + auto-verify, resend countdown, masked email, method toggle
  (Email code / Password) on Login, debouncing/disabled buttons.
- Verify 23/23 backend OTP scenarios + 26/26 signup-OTP scenarios (send, resend cooldown, wrong/expired/exhausted
  codes, auto-create, existing-user login, verified signup preserving name+password, no duplicates, logout,
  token-protected routes) + live proxy smoke tests.

### Phase 5 — Verification & polish
- TS strict build clean; production Vite build clean; code-split into three/charts/motion/react chunks.
- End-to-end API tests (analyze, URL, image, safe-reply, history, scenarios, health, 400/404 paths).
- QA checklist below.

### Phase 6 — Security penetration suite + hard fixes + theme switch
- Wrote an isolated-port full-stack suite (`scamshield-full-pentest.mjs`, Temp dir): spawns a fresh server on port 3210
  with console mailer, exercises every route, then cleans its users from the shared DB. Result: **74/74 PASS**.
- Covered: signup/login/me/logout, duplicate + validation 4xx, OTP (masked email, cooldown 429+retryAfter, wrong/short
  code), verified signup via OTP, demo-scenarios, text/URL/image/generate-safe-reply analysis, history scoping across
  users, IDOR read/delete, token forgery (wrong sig, alg-confusion, expired, malformed → all 401), rate limits (analyze
  429, resend 429), SQLi/XSS/prompt-injection lookalikes, malformed JSON 400, unknown route 404, path traversal,
  oversized-body graceful truncation.
- Real bugs found and fixed:
  - `security.js` — `sanitizeText` now trims, so whitespace-only input is rejected with 400 instead of silently
    analyzing an empty string.
  - `engine.js` — pure-URL submissions barely scored (an obvious phishing URL returned 14 = "safe"). URL structural
    risk now blends into `riskScore`, added a "Brand-style Domain Token" danger indicator, a "URL Structure Risk"
    reason, and a false-positive rule that stops legitimate brand URLs (e.g. `paypal.com`) being labelled
    "impersonation". (Phishing test URL now scores 44 = suspicious.)
- QA checklist below.

## QA checklist (run at the end)
- [ ] `npm install` at root and in server + client
- [ ] `npm run dev` starts API + web
- [ ] `npm run build` (client) succeeds
- [x] text analysis (fake prize → High/Critical, safe message → Low)
- [x] URL validation and error handling
- [x] image upload validation (type/size) and demo fallback
- [x] demo mode labeled when no API key
- [x] signup / login / wrong-password, duplicate-account, authed-history, delete/clear scoping (end-to-end)
- [x] Google demo sign-in works with zero credentials; real Google button correctly hidden until configured
- [x] OTP: send, resend cooldown, wrong-code warnings, attempts exhausted, expired code, auto-create, existing-user
      login, no duplicate accounts, logout, token-protected routes
- [ ] live-AI mode tested once with a real key (manual)
- [x] responsive layout / no horizontal overflow (manual review)
- [x] reduced-motion & no-WebGL fallbacks (manual review)
- [x] no exposed API keys (grep for AI_API_KEY in client)
- [x] penetration suite 74/74: auth, OTP, analysis quality, history scoping/IDOR, token forgery, rate limits, injection, oversized input
- [x] whitespace-only input rejected (400) and pure-URL submissions scored correctly (phishing URL → suspicious)
- [ ] console errors clean (devtools run)
- [ ] demo script rehearsed end-to-end