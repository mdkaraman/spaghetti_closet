# Spaghetti Closet — Project Summary

## What’s Built

- **Stack:** Next.js 14, React 18, TypeScript. Deploy: Vercel (free tier). No DB or auth yet.
- **Routes:** `/` (login), `/wtf-is-this` (intro → “click here to blow” → signup), `/signup` (user id, email, passcode, confirm → “send it” → `/jont`), `/jont` (jont of the day: hoodie image, $20, description, “i will have it!” → `/pay`, “my ish” → `/user`). `/pay` and `/user` are linked but not implemented.
- **Styling:** Plain HTML + basic CSS, no Tailwind. Title = image `public/title.png`; hoodie = `public/hoodie.png`. Responsive; signup form right-aligned; jont page has 8-point price star.
- **Vibe:** Simple, sparse, DIY. Commit messages concise (e.g. “spaghetti closet login page”).

## Product (from PHASES_OUTLINE.md)

- **Core:** One vintage clothing item (“jont”) per day (US East Coast). User logs in, sees jont, buys or skips; after that day it’s gone. Week-on, then site goes dark with waitlist page.
- **Later:** Bidding (Phase 3), chat (Phase 2), up/down vote comments, Spaghetti Bucks, blessing, preferences, users selling jonts.

## Tech choices (for Phase 1+)

- **DB + Auth:** Supabase (Postgres + Auth in one place; Realtime for Phase 2 chat). “User id” = handle (display name for chat/profile); auth is email + password; login form stays “user id” + passcode (app resolves handle → email).
- **Payments:** Stripe later; Phase 1 = dummy pay page only.
- **Next steps:** All Phase 1 tasks and detailed steps (Supabase setup, schema, auth flow, dummy pay, user info, waitlist, jont-of-the-day logic) are in **PHASES_OUTLINE.md** → “Phase 1 – Next steps (detailed)”. Use that as the checklist to complete Phase 1.

## Testing

- **Framework:** Vitest + React Testing Library (`npm run test`, `npm run test:run`). Config: `vitest.config.ts`, `vitest.setup.ts` (jest-dom); paths via `vite-tsconfig-paths`.
- **Coverage:** `app/__tests__/page.test.tsx` (home), `app/wtf-is-this/__tests__/page.test.tsx`, `app/signup/__tests__/page.test.tsx`, `app/jont/__tests__/page.test.tsx`. Run `npm run test:run` before commit; see `.cursor/skills/write-specs` for how to add tests.

## Repo / Deploy

- **Vercel:** `vercel.json` → `buildCommand`: `npm run test:run && next build`. Failing tests block deploy. Commit workflow: run specs, then commit and push (`.cursor/skills/commit-and-push`).
- **Live:** spaghetticloset.com (per user).
