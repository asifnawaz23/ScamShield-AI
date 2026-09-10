# 02 — Features

## Product features (all implemented and wired to a live pipeline)

### Core workflow
- Cinematic landing page with a live "Scan message" demo: staged scan sequence
  (Initializing → Extracting signals → Analyzing language → Checking links → Manipulation → Explanation)
- Analysis workspace with four input modes:
  - Paste text (SMS, email, job offer, payment request, social message)
  - Upload screenshot (PNG / JPG / WEBP, browser preview, 5 MB limit)
  - Analyze URL (structural indicators only; the URL is never opened)
  - One-click demo scenarios (6 curated scam types)
- Full threat report page with:
  - Animated circular risk score (0→N count-up)
  - How-was-this-flagged reason list with contribution ratings
  - Interactive threat radar (8 signals; detected nodes light up; hover explanations)
  - Risk dimension bars
  - Attack-chain visualization with sequential illumination + "Explore scenario"
  - URL indicators, manipulation tactics, requested-information panels
  - Safe-reply generator with copy-to-clipboard
  - "What should I do?" action panel
  - Evidence / AI-inference / Uncertainty columns
  - "AI is not a verdict" disclosure

### Accounts & connected dashboard
- Sign up / sign in with email **OTP** (passwordless code sent to the inbox, 6 digits, expires in 10 min, resend
  cooldown + attempt limits); the code is sent **only to the email you sign up with**, and the account is created only
  after you prove you own that inbox (no fake/inboxless signups)
- Email + password sign-in also available (scrypt-hashed, Bearer-token sessions)
- Google OAuth sign-in when configured; a clearly-labeled **Demo Google** button otherwise (zero credentials needed)
- After sign-in, a **personal dashboard** is built live from the user's own analyses — threat counts, high-risk
  detections, average score, most common type, category/risk charts, and a 7-day timeline
- History and delete actions are scoped to the signed-in account; raw messages are never stored
- A separate **Demo simulation** section keeps the pitch-ready illustrative charts, clearly labeled

### Supporting pages
- Security dashboard with demo analytics (clearly labeled): stat cards, category bar chart, risk pie chart,
  detection timeline (Recharts)
- Analysis history: view / delete / clear, privacy-first summaries only
- Scam education center: 6 animated topic cards + interactive "Would you trust this message?" quiz
- About page and Privacy / Responsible AI page

### Engineering features
- Honest demo mode (deterministic rules engine) when no AI key is configured
- Live-AI mode with strict JSON enforcement, single retry, and safe fallback
- Explainability first: evidence, inference, and uncertainty are never conflated
- Privacy by default: raw messages and images are not stored; only summaries + reports are kept
- Responsive from phone to full desktop (no horizontal overflow)
- Accessibility: semantic HTML, keyboard navigation, focus states, ARIA labels, `prefers-reduced-motion`
- 3D shield scene (React Three Fiber) with WebGL-support and reduced-motion fallbacks
- Error handling for empty input, bad URLs, unsupported/large files, API failure and backend offline — never a raw
  stack trace
- Security: env-based config, input validation, size limits, rate limiting, CORS, no keys in the frontend