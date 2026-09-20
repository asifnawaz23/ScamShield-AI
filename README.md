<!-- ═══════════════════════════════════════════════════════════════════════ -->
<!--                              HERO BANNER                                 -->
<!-- ═══════════════════════════════════════════════════════════════════════ -->

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:020617,30:0f2942,70:0e7490,100:22d3ee&height=210&section=header&text=ScamShield%20AI&fontSize=62&fontColor=ffffff&fontAlignY=36&desc=Evidence-Based%20Scam%20%26%20Phishing%20Intelligence%20for%20Pakistan&descAlignY=58&descSize=18&animation=fadeIn" width="100%" />

<a href="https://myscamshield-ai.netlify.app">
  <img src="https://readme-typing-svg.demolab.com/?font=Fira+Code&weight=600&size=22&pause=1000&color=22D3EE&center=true&vCenter=true&width=760&lines=Don't+just+detect+the+scam.+Understand+it.;16%2B+signal+classes+%C2%B7+Pakistan-calibrated+%C2%B7+Roman+Urdu;Typosquat+%2B+%40-trick+%2B+OCR+%2B+reputation+intelligence;AI+explains+the+evidence+%E2%80%94+it+never+invents+it." alt="ScamShield AI" />
</a>

<br/><br/>

[![Live Demo](https://img.shields.io/badge/🚀_LIVE_DEMO-myscamshield--ai.netlify.app-22d3ee?style=for-the-badge&logo=netlify&logoColor=white&labelColor=020617)](https://myscamshield-ai.netlify.app)
[![Built with Kiro](https://img.shields.io/badge/Built_with-Kiro_2026-7c3aed?style=for-the-badge&labelColor=020617)](https://kiro.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-22d3ee?style=for-the-badge&labelColor=020617)](LICENSE)

<br/>

![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=three.js&logoColor=white)
![Node](https://img.shields.io/badge/Node_20-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express_4-000000?style=flat-square&logo=express&logoColor=white)
![Turso](https://img.shields.io/badge/Turso_libSQL-4FF8D2?style=flat-square&logo=turso&logoColor=black)
![Brevo](https://img.shields.io/badge/Brevo_Email-0B996E?style=flat-square&logo=brevo&logoColor=white)
![Groq](https://img.shields.io/badge/Groq_Vision-F55036?style=flat-square&logo=groq&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=flat-square&logo=netlify&logoColor=white)

<br/>

**[🌐 Live App](https://myscamshield-ai.netlify.app)** ·
**[📋 Requirements](.kiro/specs/requirements.md)** ·
**[🏗️ Design](.kiro/specs/design.md)** ·
**[🚀 Deploy Guide](DEPLOY.md)**

</div>

---

## 🛡️ What is ScamShield AI?

> **Don't just detect the scam — understand it.**

**ScamShield AI** turns a suspicious **message, screenshot, or link** into a full, structured, **explainable threat report** in seconds — calibrated for the **Pakistani market** (banks, mobile wallets, NADRA/CNIC, BISP/Ehsaas, telecom) in **English + Roman Urdu**.

Unlike generic spam filters that just say *"likely spam"* and stop:

<table>
<tr>
<td width="50%">

**❌ Ordinary spam filter**
- "Likely spam" — no reason
- Black box score
- Can't explain itself
- Guesses even with no evidence

</td>
<td width="50%">

**✅ ScamShield AI**
- Shows the **exact phrases** that triggered the alert
- **Deterministic** score traceable to each signal
- Explains **why** each signal is dangerous
- Returns an honest **"Unknown"** when evidence is thin

</td>
</tr>
</table>

> 🏆 Built as a solo submission for the **Build with Kiro 2026 Hackathon** using Kiro's spec-driven workflow.

---

## 🇵🇰 Pakistan Market Coverage

<div align="center">

| 🏦 Banks | 💳 Wallets | 🏛️ Government | 📡 Telecom | 🛒 E-Commerce |
|:---:|:---:|:---:|:---:|:---:|
| HBL, MCB, UBL | JazzCash | NADRA · FBR | Jazz · Telenor | Daraz |
| Meezan, ABL | EasyPaisa | SBP · PTA | Zong · Ufone | OLX PK |
| Alfalah, Faysal | NayaPay, SadaPay | BISP · Ehsaas | | |

</div>

**Unique Pakistani signal classes**

🪪 **CNIC / NADRA theft** &nbsp;·&nbsp; 💰 **BISP / Ehsaas welfare scam (8171 spoofing)** &nbsp;·&nbsp; 📱 **JazzCash / EasyPaisa OTP theft** &nbsp;·&nbsp; 📲 **WhatsApp / +92 redirect detection**

---

## ✨ Features

| | Feature | What it does |
|:---:|---|---|
| 📊 | **Risk Score 0–98** | Deterministic, weighted, **traceable to signals** — never random |
| 🔍 | **Signal Evidence** | Literal quotes from the message shown as proof |
| 🌐 | **URL Analysis** | Structural checks + **typosquat / homoglyph** (`paypa1`, `faceb00k`) + **`@`-host spoof** + IP hosting + punycode |
| 🪪 | **CNIC / Wallet / Gov** | NADRA theft, JazzCash/EasyPaisa OTP, BISP/Ehsaas/FBR impersonation |
| 📷 | **Screenshot OCR** | AI vision **reads text directly from screenshots** and scores it |
| 🤖 | **Evidence-First AI** | AI explains the evidence — **bound to the heuristic score, cannot hallucinate** |
| 🛡️ | **Reputation Intel** | VirusTotal · Google Safe Browsing · AbuseIPDB (optional, honest states) |
| 💬 | **Safe Reply** | A ready reply that shares **zero** sensitive info |
| ⚠️ | **Honest Limitations** | Every report lists what was **not** checked |
| 🔐 | **Full Auth** | Email + Password, **clickable email verification**, OTP, **Google OAuth** |
| 📈 | **Dashboard** | Per-account charts, history, risk distribution |

---

## 🔬 How It Works

```mermaid
flowchart TD
    A["📥 User input<br/>text · URL · screenshot"] --> B["🧹 Validate & sanitize"]
    B --> C["🧠 Deterministic Signal Engine<br/>16 signal classes · Roman Urdu · 150+ trusted domains"]
    C --> D["🌐 URL structural analysis<br/>typosquat · @-trick · IP · punycode · TLD"]
    D --> E["🔎 Reputation check<br/>VirusTotal · Safe Browsing · AbuseIPDB"]
    E --> F["⚖️ Weighted risk score 0–98<br/>traceable to each signal"]
    F --> G["🤖 AI explanation layer<br/>explains evidence · never invents"]
    G --> H["📄 Full threat report<br/>score · signals · attack chain · safe reply · limits"]
```

> **The fundamental rule:** the AI **explains** structured evidence — it does **not** generate verdicts. Screenshots are read by an AI vision model (OCR), then scored by the same deterministic engine used for pasted text.

---

## 🧱 Tech Stack

<div align="center">

| Layer | Technology |
|---|---|
| **Frontend** | React 18 · TypeScript · Vite 5 |
| **Styling / UX** | Tailwind CSS 3 · Glassmorphism · Framer Motion |
| **3D / WebGL** | Three.js · @react-three/fiber (animated globe + shield scene) |
| **Charts** | Recharts |
| **Backend** | Node.js 20 · Express 4 (Netlify Function via `serverless-http`) |
| **Database** | **Turso (libSQL)** — durable serverless SQL; embedded file for local dev |
| **Auth** | HMAC-SHA256 JWT · scrypt · OTP · clickable email verification · Google OAuth (CSRF-safe) |
| **Email** | **Brevo** transactional API |
| **AI / Vision** | Any OpenAI-compatible endpoint (**Groq** free vision model for OCR) |
| **Hosting** | **Netlify** (SPA + serverless API on one domain) |
| **Testing** | Node.js built-in `node:test` — **89 passing tests** |

</div>

---

## 🚀 Quick Start

> **Requires Node.js ≥ 20**

```bash
# 1 · Clone
git clone https://github.com/asifnawaz23/ScamShield-AI.git
cd ScamShield-AI

# 2 · Install everything (root + server + client)
npm run setup

# 3 · Configure
cp .env.example .env
#   • Set a JWT_SECRET (any 32+ random chars in dev)
#   • Leave TURSO_* blank → uses an embedded local libSQL file
#   • Leave BREVO_API_KEY blank → verification links print to the console
#   • Leave AI_API_KEY blank → deterministic DEMO mode (no key needed)

# 4 · Run both servers
npm run dev
#   API → http://localhost:3001
#   Web → http://localhost:5173
```

---

## 🔑 Environment Variables

See [`.env.example`](.env.example) for the full list. Highlights:

| Variable | Scope | Purpose |
|---|:---:|---|
| `JWT_SECRET` | 🔴 **Required** | ≥32-char secret. Server **refuses to start** in production with a placeholder |
| `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` | Prod | Durable Turso DB (local dev uses a file automatically) |
| `BREVO_API_KEY` + `EMAIL_FROM` | Prod | Transactional email — OTP + verification links |
| `APP_PUBLIC_URL` · `CORS_ORIGIN` | Prod | Your Netlify URL |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` + `GOOGLE_REDIRECT_URI` | Optional | Google OAuth sign-in |
| `AI_API_KEY` + `AI_BASE_URL` + `AI_MODEL` | Optional | AI explanations + screenshot OCR (e.g. Groq) |
| `VIRUSTOTAL_API_KEY` · `GOOGLE_SAFE_BROWSING_API_KEY` · `ABUSEIPDB_API_KEY` | Optional | URL/IP reputation |

> 🔒 All secrets are **server-side only** — never `VITE_`-prefixed, never committed.

---

## 🧪 Testing

```bash
npm test                 # full suite — 89 tests
npm run test:engine      # heuristic detection engine
npm run test:api         # API + security/auth integration
npm run test:reputation  # reputation service
```

Covers scam detection quality (typosquat, `@`-trick, card/CVV theft), **security** (IDOR, cross-user delete, JWT guard, OAuth state), and the **email-verification token lifecycle** (single-use, expiry, reuse rejection).

---

## ☁️ Deployment

**One Netlify site runs everything** — the React SPA and the Express API (a Netlify Function) share the same domain, so there's no CORS or separate backend host.

```
Netlify site ──► client/dist            (static SPA)
             └─► /.netlify/functions/api  (Express via serverless-http)
                     ├─► Turso (libSQL)    durable database
                     ├─► Brevo             transactional email
                     └─► Groq / OpenAI     AI explanations + OCR
```

Step-by-step (Turso + Brevo + Google OAuth + env vars) in **[`DEPLOY.md`](DEPLOY.md)**.

---

## 🔐 Security & Privacy

- 🛡️ **Ownership-enforced history** — a user can only read/delete their **own** analyses (IDOR-safe)
- 🔑 **JWT** signed with a required strong secret; **CSRF-validated** Google OAuth
- 🔒 **CORS locked down** in production; secrets are environment-only
- 🕵️ **Privacy** — the full original message is **not stored**; only a short summary, the report, and metadata
- ✋ AI is instructed to **never accuse the sender** or provide attack instructions
- ⚠️ Every report includes explicit **uncertainty & limitation** disclosures

---

## 🧭 Kiro Spec-Driven Workflow

```
.kiro/specs/
├── requirements.md   ← user stories + acceptance criteria
├── design.md         ← architecture, scoring, AI design, security
└── tasks.md          ← implementation checklist
```

The specs reflect the genuine development process — not retroactive documentation.

---

## ⚠️ Known Limitations

- URL checker inspects **structure only** — it never opens or crawls the target
- Screenshot OCR quality depends on the configured AI vision model; with no key it honestly reports **"not assessed"** (never a fake "safe")
- Reputation APIs are optional — without keys, status is honestly **"not configured"**
- Pattern-based scoring — very short or novel messages may have lower confidence
- Assessment is **probabilistic** — not a legal verdict about sender intent

---

<div align="center">

## 👤 Author

**Muhammad Asif Nawaz** &nbsp;·&nbsp; Full-Stack Developer · AI Enthusiast

[![GitHub](https://img.shields.io/badge/GitHub-asifnawaz23-22d3ee?style=for-the-badge&logo=github&logoColor=white&labelColor=020617)](https://github.com/asifnawaz23)
[![Email](https://img.shields.io/badge/Email-masifnawaz815@gmail.com-7c3aed?style=for-the-badge&logo=gmail&logoColor=white&labelColor=020617)](mailto:masifnawaz815@gmail.com)

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:22d3ee,40:0e7490,100:020617&height=120&section=footer&text=Don't%20just%20detect%20the%20scam.%20Understand%20it.&fontSize=18&fontColor=ffffff&fontAlignY=72&animation=fadeIn" width="100%" />

⭐ **Star this repo if ScamShield AI helped you understand a threat.**

</div>
