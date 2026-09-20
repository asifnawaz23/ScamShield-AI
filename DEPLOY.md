# ScamShield AI — Deployment Guide (Netlify + Turso + Brevo)

**One deploy, everything live.** A single Netlify site serves both the
frontend (Vite React app) and the backend (the Express API as a Netlify
Function on the same domain). No separate backend host, no CORS headaches.

```
Netlify site  ──►  client/dist              (static SPA)
              └─►  /.netlify/functions/api   (Express API via serverless-http)
                        └─►  Turso (libSQL)   durable database
                        └─►  Brevo            transactional email
```

- Frontend and API share one origin, so `/api/*` calls hit the same domain.
- Persistence lives in **Turso** (managed libSQL) — durable across serverless
  cold starts and multiple function instances. Local dev uses an embedded
  libSQL file automatically (no account needed).

---

## Prerequisites (free tiers)

| Service | Why | Required? |
|---------|-----|-----------|
| **Netlify** | Hosts the SPA + API function | Yes |
| **Turso** | Durable database | Yes (for real deploys) |
| **Brevo** | Sends OTP + verification emails | Yes (for email/verification) |
| **Google Cloud OAuth** | "Continue with Google" | Optional |
| OpenAI-compatible API | AI evidence explanations | Optional (demo mode otherwise) |
| VirusTotal / Safe Browsing / AbuseIPDB | URL/IP reputation | Optional |

---

## Step 1 — Create a Turso database

1. Sign up at https://turso.tech and install the CLI (or use the dashboard).
2. Create a database and an auth token:
   ```bash
   turso db create scamshield
   turso db show scamshield --url          # → libsql://scamshield-<org>.turso.io
   turso db tokens create scamshield       # → the auth token
   ```
3. Keep the URL and token for Step 4. The schema is created automatically by
   the app on first run — no manual migration needed.

## Step 2 — Set up Brevo (email)

1. Create a free account at https://www.brevo.com
2. **SMTP & API → API Keys →** create a **transactional** API key.
3. **Senders, Domains & Dedicated IPs → Senders →** add and verify a sender
   address (or verify a domain you own). Use that exact address in `EMAIL_FROM`.
4. Keep the API key for Step 4. It is used **server-side only**.

## Step 3 — (Optional) Google OAuth

1. https://console.cloud.google.com/apis/credentials → **Create OAuth client ID
   → Web application**.
2. Add an **Authorized redirect URI** that exactly matches your production
   callback:
   ```
   https://<your-site>.netlify.app/api/auth/google/callback
   ```
   No trailing slash, HTTPS only, no `localhost` in production.
3. Keep the client ID and secret for Step 4.

## Step 4 — Deploy on Netlify

1. https://app.netlify.com → **Add new site → Import an existing project → GitHub**
2. Select `asifnawaz23/ScamShield-AI`. Netlify reads [`netlify.toml`](netlify.toml):

   | Setting | Value |
   |---------|-------|
   | Build command | `npm run build:client` |
   | Publish directory | `client/dist` |
   | Functions directory | `server/netlify/functions` |
   | Node version | 22 (`NODE_VERSION`) |
   | `/api/*` → | `/.netlify/functions/api` |
   | `/*` → | `/index.html` (SPA fallback) |

3. Add the environment variables (Step 5), then **Deploy site**.

## Step 5 — Environment variables

Set these under **Netlify → Site settings → Environment variables**.

### Server-only secrets (NEVER expose to the browser)

| Variable | Required | Purpose |
|----------|----------|---------|
| `NODE_ENV` | Yes | Set to `production` (enables prod guards) |
| `JWT_SECRET` | **Yes** | ≥32-char random string. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `TURSO_DATABASE_URL` | **Yes** | `libsql://…turso.io` from Step 1 |
| `TURSO_AUTH_TOKEN` | **Yes** | Turso token from Step 1 |
| `EMAIL_PROVIDER` | Yes | `brevo` |
| `BREVO_API_KEY` | Yes | Brevo transactional API key |
| `EMAIL_FROM` | Yes | Verified Brevo sender, e.g. `ScamShield AI <no-reply@yourdomain>` |
| `APP_PUBLIC_URL` | Yes | `https://<your-site>.netlify.app` (used to build verification links) |
| `CORS_ORIGIN` | Yes | `https://<your-site>.netlify.app` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth (server-only) |
| `GOOGLE_REDIRECT_URI` | Optional | `https://<your-site>.netlify.app/api/auth/google/callback` |
| `AI_API_KEY` + `AI_MODEL` | Optional | OpenAI-compatible evidence explanations |
| `VIRUSTOTAL_API_KEY` / `GOOGLE_SAFE_BROWSING_API_KEY` / `ABUSEIPDB_API_KEY` | Optional | Reputation intel |

> **Important:** These are all server-side. Do **not** create `VITE_`-prefixed
> copies of any secret — anything named `VITE_*` is bundled into the public
> browser build.

### Frontend-safe variables (`VITE_` — bundled into the browser)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE` | Leave **empty** — the SPA calls its own domain via the Netlify redirect. Only set it if the API is hosted on a different origin. |

Nothing secret should ever be `VITE_`-prefixed.

---

## Step 6 — Test the live deployment

```bash
# Health (same domain as the site)
curl https://<your-site>.netlify.app/api/health

# Text analysis (demo engine works with no AI key)
curl -X POST https://<your-site>.netlify.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"type":"text","content":"Aapka HBL account band ho jayega. CNIC verify karein."}'
```

Then in the browser:
1. **Sign up** → check the inbox for the Brevo verification email → click the link.
2. You land on `/verify-email`, get verified + signed in.
3. Refresh `/dashboard` and `/verify-email?token=…` directly — the SPA fallback
   serves them without a 404.
4. **Sign out** → you return to `/`.
5. (If configured) **Continue with Google** → Google → back to `/dashboard`.

---

## Local development

```bash
npm run setup     # installs root + server + client deps
cp .env.example .env
# Set at least JWT_SECRET (any ≥32 chars in dev; a warning is shown if unset).
# Leave TURSO_* blank → uses an embedded libSQL file at server/data.
# Leave BREVO_API_KEY blank → verification links print to the server console.
npm run dev       # API :3001, web :5173 (Vite proxies /api → :3001)
```

Run the test suite:

```bash
npm test          # 78 tests (engine, reputation, API + security/auth)
```
