# 06 — Privacy

## What is analyzed
The text, URL, or screenshot the user supplies. In live-AI mode the supplied content is sent to the configured AI
provider (see 04 — AI Disclosure). In demo mode everything stays local to the server.

## What is stored
- A short input summary (first ~90 characters)
- The generated analysis report
- Metadata (type, score, level, category, timestamp)

Why: so the user can revisit reports in History. Stored on the local SQLite database. History can be deleted
individually or cleared entirely.

## What is NOT stored
- Raw message content
- Uploaded screenshots / images
- Passwords, OTPs, PINs, card numbers, or any personal/financial secrets (the product never asks for them)

## AI provider usage
- Demo mode: no external network call for analysis.
- Live-AI mode: the content is sent to the provider configured via `AI_BASE_URL` / `AI_MODEL`. The operator should
  review the provider's privacy terms. ScamShield sends no secrets.

## Client-side storage
The browser stores recent analyses in localStorage (key `scamshield:analysis-store`) so History/Results still work if
the backend is unreachable. This can be cleared in your browser settings or via "Clear history."

## Disclosure level
This is a hackathon demo. No compliance certifications are claimed. Where the demo uses illustrative analytics, it is
labeled "Demo analytics" / "Demo simulation."

## User responsibility
- Verify important claims through official channels.
- Never paste passwords, OTPs, or other secrets into any tool — including this one.
- Treat the output as decision support, not a verdict.