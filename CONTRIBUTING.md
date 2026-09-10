# Contributing to ScamShield AI

Thank you for your interest in contributing to ScamShield AI! 🛡️

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/your-username/ScamShield-AI.git
   cd ScamShield-AI
   ```
3. **Install dependencies:**
   ```bash
   npm run setup
   ```
4. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
5. **Start development:**
   ```bash
   npm run dev
   ```

## Development Setup

### Requirements

- **Node.js ≥ 22.5** (uses built-in `node:sqlite`)
- npm (comes with Node.js)

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run setup` | Install all dependencies (root + server + client) |
| `npm run dev` | Start both API (port 3001) and Web (port 5173) |
| `npm run dev:server` | Start only the API server |
| `npm run dev:client` | Start only the Vite dev server |
| `npm run build` | Build the client for production |
| `npm start` | Start the production server |

### Demo Mode

The app runs in **demo mode** by default — no AI API key needed. The built-in rules engine provides full threat analysis. To enable live AI:

```bash
# In .env
AI_API_KEY=your-openai-compatible-key
AI_MODEL=gpt-4o-mini
```

## Project Structure

```
scamshield-ai/
├── server/                 # Express API backend
│   └── src/
│       ├── routes/         # API route handlers
│       ├── services/       # Business logic (engine.js)
│       ├── ai/             # AI provider integration
│       ├── auth/           # Authentication (JWT, OTP, OAuth)
│       ├── middleware/     # CORS, rate-limit, validation
│       └── db/             # SQLite storage layer
│
├── client/                 # React SPA frontend
│   └── src/
│       ├── pages/          # Route-level components
│       ├── components/     # Reusable UI components
│       ├── context/        # React context providers
│       ├── hooks/          # Custom React hooks
│       └── lib/            # Utilities and API client
```

## Making Changes

### Branch Naming

Use descriptive branch names:

```
feat/safe-reply-improvements
fix/score-ring-animation
docs/update-api-reference
chore/upgrade-deps
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add URL blocklist integration
fix: correct score calculation for short messages
docs: add API endpoint reference
style: improve glassmorphism contrast
refactor: extract auth middleware
test: add engine unit tests
```

### Code Guidelines

- **TypeScript** for all client code
- **JavaScript (ES modules)** for server code
- **No external databases** — SQLite only (via `node:sqlite`)
- **No external state management** — React Context + hooks only
- **No CSS frameworks beyond Tailwind** — keep the glassmorphism design system

## Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following the code guidelines
3. **Test locally** — ensure both API and client work
4. **Update documentation** if needed (README, inline comments)
5. **Submit your PR** with a clear description

### PR Title Format

```
feat: add new threat category detection
fix: resolve JWT token refresh issue
```

### PR Description Template

```markdown
## What
Brief description of the changes.

## Why
Motivation or link to issue.

## How
Technical approach taken.

## Testing
How you verified the changes work.
```

### Review Checklist

- [ ] No hardcoded secrets or API keys
- [ ] No raw user messages stored in database
- [ ] Error handling is graceful (no unhandled rejections)
- [ ] UI changes work on both desktop and mobile
- [ ] New features have appropriate demo-mode fallbacks

## Code Style

### Client (TypeScript/React)

- Functional components with hooks
- Tailwind CSS for styling (glassmorphism tokens)
- Framer Motion for animations
- Lucide React for icons

### Server (JavaScript/Node.js)

- Express route handlers
- Service layer for business logic
- Middleware for cross-cutting concerns
- Error middleware for centralized error handling

## Reporting Bugs

Use the [Bug Report template](https://github.com/asifnawaz23/ScamShield-AI/issues/new?template=bug_report.md) with:

- Steps to reproduce
- Expected vs. actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node version, browser)

## Suggesting Features

Use the [Feature Request template](https://github.com/asifnawaz23/ScamShield-AI/issues/new?template=feature_request.md) with:

- Problem statement
- Proposed solution
- Alternatives considered
- Additional context

---

<div align="center">

**Questions?** Open a [Discussion](https://github.com/asifnawaz23/ScamShield-AI/discussions) or reach out at **masifnawaz815@gmail.com**

</div>
