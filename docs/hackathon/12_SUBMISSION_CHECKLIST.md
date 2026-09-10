# 12 — Submission Checklist

## Final deliverables — all must exist

- [x] README.md with problem, solution, features, architecture, tech stack, AI usage, responsible AI, privacy,
      demo instructions, environment variables, setup, API docs, structure, roadmap, limitations, team/disclosure
- [x] Source: `server/` (Express + rules engine + AI layer + SQLite) and `client/` (React/Vite/TS SPA)
- [x] `.env.example` with documented variables (no secrets)
- [x] `.gitignore` (node_modules, dist, .env, db files)
- [ ] Package locks committed for reproducibility (`package-lock.json`)
- [x] Docs pack (12 files: description, features, architecture, AI disclosure, responsible AI, privacy,
      limitations, demo script, pitch, team contributions, build log, this checklist)

## Pre-submission checks

### Functional
- [ ] Clean install from a fresh clone: `npm install`, `npm --prefix server install`, `npm --prefix client install`
- [ ] `npm run dev` → API at 3001, web at 5173, proxy working
- [ ] Live demo run: Landing scan → Sign up / in (Google, demo Google, or email OTP) → Analyze (text / image / URL
      / scenario) → Results → Dashboard (personal + demo sections) → History → Learn
- [ ] Email OTP: send code → enter code → auto-created account lands on Dashboard; wrong/expired/resend messages clear
- [ ] Protected routes: hitting /dashboard or /history while signed out redirects to /login
- [ ] After sign-in, a new analysis appears in Dashboard stats + History; sign-out hides them
- [ ] Demo mode works with no `.env` (default)
- [ ] Error states: empty text, invalid URL, oversized/unsupported file, backend offline
- [ ] Attack chain "Explore scenario" works; safe-reply "Copy" works

### Visual & interaction
- [ ] No horizontal overflow at 360 / 768 / 1280 / 1920 px (responsive review)
- [ ] Score, radar, attack chain, toasts, count-ups animate smoothly
- [ ] `prefers-reduced-motion` respected; no-WebGL fallback renders
- [ ] Keyboard-traversible nav, visible focus states, sensible aria labels

### Integrity
- [ ] No API keys in client code or committed `.env` (run: `grep -r AI_API_KEY client`)
- [ ] No fake claims: demo analytics labeled; team/prize text left honest
- [ ] Nothing in the app provides operational instructions for committing attacks
- [ ] Raw messages/images not stored; privacy page matches behavior

### Submission hygiene
- [ ] Remove `data/*.db` and temp logs before packaging
- [ ] Add a short "Screenshots" gallery to the README (attached images) if allowed
- [ ] Record/rehearse the 3-minute demo script (docs/hackathon/08)
- [ ] Fill in team name/member hours in 10_TEAM_CONTRIBUTIONS.md

## Live-demo contingency
- [ ] Backend started before the demo begins
- [ ] Demo scenarios tab ready for a zero-typing run
- [ ] Offline fallback: if the backend is down, local history/reports still render from localStorage

---

**ScamShield AI — Don't just detect the scam. Understand it. Before it understands you.**