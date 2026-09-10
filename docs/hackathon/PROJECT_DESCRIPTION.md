# ScamShield AI — Project Description
## Build with Kiro 2026 Hackathon Submission

### The Problem

Pakistan loses billions of rupees annually to digital fraud. Scammers impersonate HBL, MCB, NADRA, JazzCash, EasyPaisa, and BISP/Ehsaas — targeting ordinary people through SMS, WhatsApp, and social media. Most victims receive a suspicious message but have no reliable way to verify it quickly. Generic spam filters give a binary "spam/not spam" verdict with no explanation. People need to understand *why* something is dangerous before they act.

### The Solution

ScamShield AI is an evidence-based scam and phishing intelligence platform built specifically for the Pakistani market. It turns any suspicious message, URL, or screenshot into a full structured threat report in seconds — showing exactly which phrases triggered the alert, why each signal is dangerous, and what the user should do next.

### What Makes It Different

The fundamental design principle: **AI explains evidence — AI does not generate it.**

Most "AI scam detectors" simply ask a language model "is this a scam?" and display whatever it says. ScamShield uses a layered pipeline:

1. A deterministic heuristic engine extracts signals — literal evidence phrases from the message
2. URL structural analysis inspects link anatomy (never opens or crawls URLs)
3. External reputation APIs check against VirusTotal, Google Safe Browsing, AbuseIPDB when configured
4. Risk scoring calculates a deterministic 0–100 score traceable to every contributing signal
5. The AI layer receives the pre-computed evidence and *explains* it — it cannot invent threats not present in the message
6. The AI's score is bounded to ±15 of the deterministic score, preventing hallucinated verdicts

If evidence is insufficient, the system returns an honest "Unknown / Low Confidence" result — never forcing a verdict.

### Pakistan-Specific Intelligence

The engine is calibrated for Pakistan with 16 signal classes covering HBL, MCB, UBL, Meezan, JazzCash, EasyPaisa, NADRA, BISP, Ehsaas, FBR, PTA, and Pakistani telecoms. It understands both English and Roman Urdu scam patterns, detects CNIC identity theft attempts, BISP/Ehsaas welfare scam impersonation, JazzCash/EasyPaisa OTP theft, and WhatsApp bypass tactics.

### Technical Implementation

- **Backend:** Node.js + Express, SQLite (built-in node:sqlite), HMAC-SHA256 JWT auth
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Three.js, Framer Motion
- **AI:** Evidence-first architecture with any OpenAI-compatible endpoint; full heuristic fallback
- **Testing:** 66 passing tests using Node.js built-in test runner
- **Deployment:** Render (backend) + Vercel (frontend)

### Kiro Workflow

This project was built using Kiro's spec-driven development workflow. The `.kiro/specs/` directory contains `requirements.md` (14 user stories with acceptance criteria), `design.md` (full architecture documentation), and `tasks.md` (implementation checklist) — representing the genuine development process from initial audit through deployment.

**GitHub:** https://github.com/asifnawaz23/ScamShield-AI
