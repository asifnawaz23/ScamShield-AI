<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,50:1e3a5f,100:06b6d4&height=180&section=header&text=ScamShield%20AI&fontSize=56&fontColor=ffffff&fontAlignY=38&desc=Evidence-Based%20Scam%20%26%20Phishing%20Intelligence&descAlignY=60&descSize=17&animation=fadeIn" width="100%" />

<br/>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-scamshield--ai.vercel.app-06b6d4?style=for-the-badge&logo=vercel&logoColor=white&labelColor=0f172a)](https://scamshield-ai.vercel.app)
[![Build with Kiro](https://img.shields.io/badge/Built%20with-Kiro%202026-7c3aed?style=for-the-badge&labelColor=0f172a)](https://kiro.dev)
[![Node.js ≥22.5](https://img.shields.io/badge/Node.js-%E2%89%A522.5-339933?style=for-the-badge&logo=node.js&logoColor=white&labelColor=0f172a)](https://nodejs.org)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white&labelColor=0f172a)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white&labelColor=0f172a)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-06b6d4?style=for-the-badge&labelColor=0f172a)](LICENSE)

**[🚀 Live Application](https://scamshield-ai.vercel.app) · [📋 Requirements](.kiro/specs/requirements.md) · [🏗️ Design](.kiro/specs/design.md) · [✅ Tasks](.kiro/specs/tasks.md)**

</div>

---

## What is ScamShield AI?

ScamShield AI is an **evidence-based scam and phishing intelligence platform** built for the Pakistani market. It turns a suspicious message, screenshot, or link into a full, structured, explainable threat report — in seconds.

Unlike generic spam filters that say "likely spam" and stop there, ScamShield:
- **Shows you exactly which phrases triggered the alert** (literal evidence quotes)
- **Explains why each signal is dangerous** in plain language
- **Calculates a deterministic risk score** traceable to contributing signals
- **Never invents threats** — AI explains evidence, it does not generate it
- **Returns an honest "Unknown"** when evidence is insufficient — never forces a verdict

> Built as a solo submission for the **Build with Kiro 2026 Hackathon** using Kiro's spec-driven development workflow.

---

## 🇵🇰 Pakistan Market Coverage

Calibrated for Pakistani users. Detects scams targeting:

| Category | Covered Entities |
|----------|-----------------|
| **Banks** | HBL, MCB, UBL, ABL, Meezan, Bank Alfalah, Askari, Faysal, NBP, BOP, Standard Chartered PK |
| **Mobile Wallets** | JazzCash, EasyPaisa, NayaPay, SadaPay, UPaisa, HBL Konnect |
| **Government** | NADRA, FBR, SBP, PTA, FIA, NAB, BISP, Ehsaas Programme |
| **Telecom** | Jazz, Telenor, Zong, Ufone |
| **E-Commerce** | Daraz, OLX Pakistan |
| **Languages** | English + Roman Urdu scam patterns |

**Unique Pakistani Signal Classes:**
- 🪪 **CNIC/NADRA theft** — detects identity card number requests
- 💰 **BISP/Ehsaas welfare scam** — detects fake government payment messages (8171 spoofing)
- 📱 **JazzCash/EasyPaisa OTP theft** — mobile wallet account takeover
- 📲 **WhatsApp bypass detection** — +92 redirect to unofficial channels

---

## How It Works

```
User Input (text / URL / screenshot)
         │
         ▼
┌─────────────────────────────────────┐
│  1. Input Validation & Sanitization │
│  2. Deterministic Signal Engine     │  ← 16 signal classes, regex-matched
│     • 150+ Pakistani trusted domains│  ← false-positive protection
│     • Scam domain pattern matching  │
│     • Phone redirect detection      │
│  3. URL Structural Analysis         │  ← never opens/crawls the URL
│  4. External Reputation Check       │  ← VirusTotal / GSB / AbuseIPDB (optional)
│  5. Weighted Risk Scoring           │  ← deterministic, traceable, 0–98
│  6. AI Explanation Layer            │  ← AI receives evidence, never invents it
│  7. Report Assembly                 │  ← Evidence / Inference / Uncertainty
└─────────────────────────────────────┘
         │
         ▼
  Full Threat Report
  (score + signals + attack chain + safe reply + limitations)
```

**The fundamental rule:** AI explains structured evidence. AI does NOT generate verdicts.

---

## Features

| Feature | Description |
|---------|-------------|
| 📊 **Risk Score 0–100** | Deterministic, weighted, traceable to signals — never random |
| 🔍 **Signal Evidence** | Literal quotes from the message shown as proof |
| 🌐 **URL Analysis** | 12+ structural checks — never opens the URL |
| 🪪 **CNIC Detection** | NADRA identity theft attempt flagging |
| 💸 **Wallet Scam Detection** | JazzCash/EasyPaisa OTP and transfer scam patterns |
| 🏛️ **Gov Impersonation** | BISP/Ehsaas/FBR/NADRA impersonation detection |
| 🤖 **Evidence-First AI** | AI bound to ±15 of heuristic score — cannot hallucinate |
| 🛡️ **Reputation Intel** | VirusTotal, Google Safe Browsing, AbuseIPDB (optional) |
| ⚠️ **Honest Limitations** | Every report lists what was NOT checked |
| 🔐 **Full Auth** | Email+Password, OTP, Google OAuth |
| 📈 **Dashboard** | Charts, history, risk distribution |
| 💬 **Safe Reply** | Pre-written response that shares no sensitive info |
| 📷 **Screenshot Analysis** | AI vision or user-supplied text fallback |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite 5 |
| **Styling** | Tailwind CSS 3, Glassmorphism |
| **Animation** | Framer Motion |
| **3D / WebGL** | Three.js, @react-three/fiber |
| **Charts** | Recharts |
| **Backend** | Node.js ≥22.5, Express 4 |
| **Database** | SQLite (built-in `node:sqlite`) |
| **Auth** | HMAC-SHA256 JWT, scrypt, OTP |
| **AI** | Any OpenAI-compatible endpoint |
| **Testing** | Node.js built-in test runner |

---

## Quick Start

> **Requires Node.js ≥ 22.5**

```bash
# 1. Clone
git clone https://github.com/asifnawaz23/ScamShield-AI.git
cd ScamShield-AI

# 2. Install all dependencies
npm run setup

# 3. Configure environment
cp .env.example .env
# Edit .env — set JWT_SECRET at minimum
# Leave AI_API_KEY empty to run in DEMO MODE (no key needed)

# 4. Start both servers
npm run dev
# API  → http://localhost:3001
# Web  → http://localhost:5173
```

---

## Environment Variables

See [`.env.example`](.env.example) for all variables. Key ones:

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | ✅ Yes | Long random string for token signing |
| `AI_API_KEY` | Optional | OpenAI-compatible key — leave empty for demo mode |
| `VIRUSTOTAL_API_KEY` | Optional | Free tier: 4 req/min |
| `GOOGLE_SAFE_BROWSING_API_KEY` | Optional | Free tier: 10k req/day |
| `ABUSEIPDB_API_KEY` | Optional | Free tier: 1k req/day |
| `RESEND_API_KEY` | Optional | For email OTP delivery |
| `CORS_ORIGIN` | Production | Your frontend URL |

---

## Running Tests

```bash
npm test                    # all 66 tests
npm run test:engine         # heuristic engine (24 tests)
npm run test:api            # API integration (27 tests)
npm run test:reputation     # reputation service (15 tests)
```

All tests use Node.js built-in `node:test` — no external test framework needed.

---

## Deployment

See [`DEPLOY.md`](DEPLOY.md) for step-by-step instructions.

- **Backend:** [Render.com](https://render.com) (free tier) — see [`render.yaml`](render.yaml)
- **Frontend:** [Vercel](https://vercel.com) (free tier) — see [`vercel.json`](vercel.json)

---

## Kiro Spec-Driven Workflow

This project was built using Kiro's spec-driven development workflow:

```
.kiro/specs/
├── requirements.md   ← 14 user stories with acceptance criteria
├── design.md         ← architecture, scoring, AI design, security
└── tasks.md          ← implementation checklist with completion status
```

The specs represent the genuine development process — not retroactive documentation.

---

## Known Limitations

- URL checker inspects structure only — does not crawl or visit URLs
- Demo mode image analysis requires user-supplied visible text (no bundled OCR)
- Reputation APIs are optional — without keys, status is honestly "not configured"
- Pattern-based scoring — novel or very short messages may have low confidence
- Assessment is probabilistic — not a legal verdict about sender intent

---

## Privacy & Safety

- Raw message text is **never stored** — only a 90-character summary
- Analysis results are saved per user account (sign-in required for persistence)
- All secrets are environment-variable only — never in code
- AI is instructed never to accuse the sender or provide attack instructions
- Every report includes explicit uncertainty and limitation disclosures

---

## Author

**Muhammad Asif Nawaz**
Full-Stack Developer · AI Enthusiast
📧 masifnawaz815@gmail.com
[![GitHub](https://img.shields.io/badge/GitHub-asifnawaz23-06b6d4?style=for-the-badge&logo=github&logoColor=white&labelColor=0f172a)](https://github.com/asifnawaz23)

---

<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=0:06b6d4,50:1e3a5f,100:0f172a&height=100&section=footer&animation=fadeIn" width="100%" />

**ScamShield AI — Don't just detect the scam. Understand it.**
</div>
