---
name: commit
description: Run specs before each commit and create commits in this repo. Use when the user wants to commit, push, or asks how to commit; or when preparing to commit changes.
---

# Commit (with specs)

## Workflow

Before every commit:

1. **Run specs:** `npm run test:run`
2. If any test fails, fix the code or tests. Do not commit failing tests.
3. Stage and commit with a short, simple message (e.g. "spaghetti closet login page", "mobile tweaks: inline form on iphone").

## Commands

- Run tests once (required before commit): `npm run test:run`
- Watch mode (optional, while developing): `npm run test`

## Convention

- Keep commit messages concise. No marketing-style or vibe-tagline copy in messages.
- Vercel build runs `npm run test:run && next build`; a failing test blocks deploy. Running specs locally before commit keeps the main branch green.
