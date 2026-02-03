---
name: commit-and-push
description: Run full build (tests + type check) before each commit, then commit and push. Use when the user wants to commit, push, or asks how to commit; or when preparing to commit changes.
---

# Commit and push (with build)

## Workflow

1. **Run build:** `npm run build` (runs tests then Next.js build with type checking).
2. If the build fails (failing tests or type errors), fix the code or tests. Do not commit until the build passes.
3. Stage and commit with a short, simple message (e.g. "spaghetti closet login page", "mobile tweaks: inline form on iphone").
4. **Push:** `git push` (once build passes and commit is done).

## Commands

- Full build before commit (required): `npm run build`
- Watch mode for tests only (optional, while developing): `npm run test`
- Push after commit: `git push`

## Convention

- Keep commit messages concise. No marketing-style or vibe-tagline copy in messages.
- Vercel runs `npm run build` (from package.json), which runs tests then Next.js build. Running the same command locally before commit catches failing tests and type errors so the main branch stays green.
