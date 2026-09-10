# ScamShield AI — Deployment Guide

## Step 1 — Deploy Backend on Render (Free)

1. Go to https://render.com → Sign in → New → Web Service
2. Connect your GitHub repo: `asifnawaz23/ScamShield-AI`
3. Use these settings:

| Field | Value |
|-------|-------|
| Name | scamshield-api |
| Branch | main |
| Root Directory | (leave empty) |
| Runtime | Node |
| Build Command | `npm --prefix server install` |
| Start Command | `node server/index.js` |
| Plan | Free |

4. Add Environment Variables (click "Environment"):

```
NODE_ENV=production
PORT=3001
JWT_SECRET=<generate: openssl rand -hex 32>
CORS_ORIGIN=https://scamshield-ai.vercel.app
AI_API_KEY=<your OpenAI key — leave empty for demo mode>
AI_MODEL=gpt-4o-mini
EMAIL_PROVIDER=console
```

5. Click **Deploy** — wait 2-3 minutes
6. Test: `https://your-app.onrender.com/api/health` → should return `{"ok":true,"mode":"demo"}`

---

## Step 2 — Deploy Frontend on Vercel (Free)

1. Go to https://vercel.com → New Project → Import from GitHub
2. Select `asifnawaz23/ScamShield-AI`
3. Use these settings:

| Field | Value |
|-------|-------|
| Framework | Other (Vite) |
| Root Directory | `client` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

4. Add Environment Variable:

```
VITE_API_BASE=https://your-app.onrender.com
```
(Use the Render URL from Step 1)

5. Click **Deploy**

---

## Step 3 — Update CORS on Render

After Vercel gives you a URL (e.g. `https://scamshield-ai.vercel.app`):

1. Go to Render → your service → Environment
2. Update `CORS_ORIGIN` to your exact Vercel URL
3. Render will auto-redeploy

---

## Step 4 — Test Live Deployment

Run these checks:

```bash
# Backend health
curl https://your-app.onrender.com/api/health

# Text analysis
curl -X POST https://your-app.onrender.com/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"type":"text","content":"Aapka HBL account band ho jayega. CNIC verify karein."}'

# URL analysis  
curl -X POST https://your-app.onrender.com/api/analyze/url \
  -H "Content-Type: application/json" \
  -d '{"url":"http://hbl-secure-verify.xyz/confirm"}'
```

---

## Optional: Add Real AI (OpenAI)

In Render Environment Variables, add:
```
AI_API_KEY=sk-...your-openai-key...
AI_MODEL=gpt-4o-mini
```

This enables:
- Evidence-first AI explanations (AI explains heuristic signals, does NOT invent them)
- AI vision for screenshot analysis
- Richer safe reply generation

---

## Optional: Add Reputation APIs (Free Tiers)

```
VIRUSTOTAL_API_KEY=   # https://virustotal.com — 4 req/min free
GOOGLE_SAFE_BROWSING_API_KEY=  # https://console.cloud.google.com — 10k/day free
ABUSEIPDB_API_KEY=   # https://abuseipdb.com — 1k/day free
```

Without these keys, the system shows "Not configured" honestly — never fakes results.
