# ScamShield AI — Deployment Guide

**One deploy, everything live.** The Netlify site serves both the frontend
and the backend (API as a Netlify Function on the same domain). No separate
backend hosting, no CORS, no extra accounts.

## Step 1 — Deploy on Netlify (Free, no credit card)

1. Go to https://app.netlify.com → **Add new site → Import an existing project → GitHub**
2. Select `asifnawaz23/ScamShield-AI`
3. Netlify reads [`netlify.toml`](netlify.toml) automatically:

| Setting | Value |
|---------|-------|
| Build command | `npm run build:client` |
| Publish directory | `client/dist` |
| Functions directory | `server/netlify/functions` |
| Node version | 22 (via `NODE_VERSION`) |

4. Click **Deploy site** — wait ~2 minutes.
5. Netlify auto-deploys on every push to `main`.

## What runs where

- **Frontend** — static build from `client/` (Vite React app).
- **Backend** — `server/netlify/functions/api.mjs` — the full Express API
  wrapped by `serverless-http`, mounted under `/.netlify/functions/api`.
  Everything `/api/*` is rewritten to it (see `netlify.toml`), so the site
  calls its own domain — no `VITE_API_BASE` needed.

## Test the live deployment

```bash
# Backend health (same domain as the site)
curl https://<your-site>.netlify.app/api/health

# Text analysis
curl -X POST https://<your-site>.netlify.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"type":"text","content":"Aapka HBL account band ho jayega. CNIC verify karein."}'
```

## Environment Variables (optional)

Add these under Netlify → Site settings → Environment variables. The site
works fully in demo mode without any of them.

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` / `EMAIL_PROVIDER=resend` | Real email OTP delivery |
| `JWT_SECRET` | Session signing (default dev secret — set in production) |
| `CORS_ORIGIN` | Exact frontend origin(s) to lock CORS down to |
| `AI_API_KEY` + `AI_MODEL` | Enable OpenAI-powered evidence explanations |
| `VIRUSTOTAL_API_KEY` | Domain reputation API (free tier) |
| `GOOGLE_SAFE_BROWSING_API_KEY` | URL reputation API (free tier) |
| `ABUSEIPDB_API_KEY` | IP reputation API (free tier) |

AI / reputation keys are optional: without them the app honestly reports
"Not configured" — it never fakes results.