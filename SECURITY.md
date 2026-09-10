# Security Policy

## Reporting a Vulnerability

ScamShield AI takes security seriously. If you discover a security vulnerability, please report it responsibly.

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **masifnawaz815@gmail.com**

You should receive a response within **48 hours**. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of vulnerability (e.g., SQL injection, XSS, authentication bypass, etc.)
- Full paths of source file(s) related to the vulnerability
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact assessment

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Best Practices

When deploying ScamShield AI in production, ensure you:

1. **Set a strong `JWT_SECRET`** — Use a long, random string (at least 64 characters)
2. **Never commit `.env` files** — The `.env.example` is tracked, but `.env` is gitignored
3. **Use HTTPS** — Always serve the application over TLS in production
4. **Set `CORS_ORIGIN`** — Restrict CORS to your actual domain
5. **Keep dependencies updated** — Run `npm audit` regularly
6. **Use environment-specific configurations** — Never use development secrets in production

## Data Privacy

ScamShield AI is designed with privacy-first principles:

- **Raw messages are never stored** — Only summaries and generated reports are persisted
- **No telemetry or tracking** — No user data is sent to third parties
- **Local database** — All data stays on your server via SQLite
- **Optional AI** — The app works fully in demo mode with zero external API calls

## Authentication Security

- Passwords are hashed using **scrypt** (Node.js built-in)
- Session tokens are **HMAC-signed JWTs** (stateless, no server-side session storage)
- OTP codes expire after **10 minutes** with rate limiting
- **Google OAuth** is optional and clearly labeled

## Disclosure Policy

- We follow **coordinated disclosure**
- We request **90 days** to address vulnerabilities before public disclosure
- We will credit reporters in the security advisory (unless they prefer anonymity)
