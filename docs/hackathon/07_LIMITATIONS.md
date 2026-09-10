# 07 — Limitations

Honestly documented limits of the current build.

## Known limitations

### Image analysis (demo mode)
- No OCR engine is bundled. In demo mode the user is asked to type the visible text (which is then analyzed), or the
  scan is explicitly labeled "illustrative." With a vision-capable AI model configured, real extraction works.

### URL analysis
- Structural indicators only: protocol, shorteners, high-risk TLDs, IP hosting, numeric domains, subdomain tricks,
  action-oriented paths, and domain/brand mismatch.
- We do **not** crawl page content, check WHOIS history, check certificates beyond scheme, or query blocklists.
- Recommended rule: never click a suspicious link — verify through official channels.

### Rules engine (demo mode)
- Pattern/keyword based; can miss novel phrasing, non-English messages, or messages built to evade detectors.
- Very short inputs produce low confidence by design.

### Data & analytics
- Dashboard numbers are demo/sample data, labeled as such — not real telemetry. After sign-in the dashboard is built
  from the user's own real analyses; a separate, clearly-labeled **Demo simulation** section remains.
- Auth is a lightweight hackathon implementation: HMAC-signed session tokens + scrypt hashed passwords stored in the
  local SQLite DB. No email verification, no password reset, no refresh tokens, no 2FA.

### Scale
- Single-process server; SQLite local storage — suitable for a demo, not production multi-tenant scale.
- No cloud sync across devices.

## Non-goals (explicitly out of scope)
- Not a substitute for antivirus, spam filtering, or your bank's official channels.
- Does not provide operational instructions for committing attacks.
- Does not determine criminal intent.