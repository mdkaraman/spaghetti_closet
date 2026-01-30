---
name: commit-and-push
description: Run specs before each commit, then commit and push. Use when the user wants to commit, push, or asks how to commit; or when preparing to commit changes.
---

# Commit and push (with specs)

## Workflow

1. **Run specs:** `npm run test:run`
2. If any test fails, fix the code or tests. Do not commit failing tests.
3. Stage and commit with a short, simple message (e.g. "spaghetti closet login page", "mobile tweaks: inline form on iphone").
4. **Push:** `git push` (once specs pass and commit is done).

## Commands

- Run tests once (required before commit): `npm run test:run`
- Watch mode (optional, while developing): `npm run test`
- Push after commit: `git push`

## Convention

- Keep commit messages concise. No marketing-style or vibe-tagline copy in messages.
- Vercel build runs `npm run test:run && next build`; a failing test blocks deploy. Running specs locally before commit keeps the main branch green.
