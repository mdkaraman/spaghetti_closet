# Spaghetti Closet — Project Summary

## What’s Built

- **Stack:** Next.js 14, React 18, TypeScript. Deploy: Vercel. **DB + Auth:** Supabase (Postgres + Auth).
- **Routes:**
  - `/` — login (handle + passcode; app resolves handle → email)
  - `/wtf-is-this` — intro → “click here to blow” → signup
  - `/signup` — user id, email, passcode, confirm → “send it”
  - `/signup/complete` — set handle after auth signup (profile trigger creates placeholder)
  - `/jont` — jont of the day from DB (America/New_York); “i will have it!” → `/pay`, “my ish” → `/user`; empty state if no jont for today
  - `/pay` — dummy “pay now” (no Stripe); records a `purchases` row then redirects to `/user`
  - `/user` — logged-in profile (user id, email) and purchased jonts (“you copped it”, newest first); session required
  - `/waitlist` — dark-week email capture (“lmk when we back up”) → `waitlist_emails`
  - `/forgot-password`, `/reset-password`, `/reset-password/expired` — password recovery
  - `/auth/callback` — Supabase auth callback
- **Middleware:** Protects `/jont`, `/user`, `/pay`; unauthenticated users redirect to `/`.
- **Schema:** `profiles`, `jonts`, `waitlist_emails`, `purchases` (migrations in `supabase/migrations/`; outline in `docs/SCHEMA_PHASE1.md`). Seed CSVs in `supabase/seed/`.
- **Styling:** Plain HTML + basic CSS, no Tailwind. Title = `public/title.png`; fallback hoodie = `public/hoodie.png`. Responsive; signup form right-aligned; jont page has 8-point price star.
- **Vibe:** Simple, sparse, DIY. Commit messages concise (e.g. “spaghetti closet login page”).

## Product (from PHASES_OUTLINE.md)

- **Core:** One vintage clothing item (“jont”) per day (US East Coast). User logs in, sees jont, buys or skips; after that day it’s gone. Week-on, then site goes dark with waitlist page.
- **Phase 1 status:** Pages, Supabase auth, schema, jont-of-the-day lookup, dummy pay + purchase insert, waitlist, and the “you copped it” list on `/user` are in place. Still open at a product level: week-ahead jont loading and the automatic week-on / site-goes-dark trial loop.
- **Later:** Chat (Phase 2), bidding (Phase 3), up/down vote comments, Spaghetti Bucks, blessing, preferences, users selling jonts. Checklist: **PHASES_OUTLINE.md**.

## Tech choices

- **DB + Auth:** Supabase (Postgres + Auth; Realtime planned for Phase 2 chat). “User id” = handle (display name); auth is email + password; login form stays “user id” + passcode (app resolves handle → email). Setup: `docs/SUPABASE_AND_VERCEL_SETUP.md`.
- **Payments:** Stripe later; Phase 1 = dummy pay page only (already writes `purchases`).
- **Next steps:** Remaining work is tracked in **WORK_PLAN.md** (task split, what can run in parallel, status). The phase checklist stays in **PHASES_OUTLINE.md**. Still open in Phase 1: week-ahead jont loading and the week-on / site-goes-dark loop.

## Testing

- **Framework:** Vitest + React Testing Library (`npm run test`, `npm run test:run`). Config: `vitest.config.ts`, `vitest.setup.ts` (jest-dom); paths via `vite-tsconfig-paths`.
- **Coverage:** Home, wtf-is-this, signup (+ complete), jont, pay, user, waitlist, forgot/reset password (+ expired), auth actions (`app/actions/__tests__/auth.test.ts`), and the forgot-password action. Run `npm run test:run` before commit; see `.cursor/skills/write-specs` for how to add tests.

## Repo / Deploy

- **Vercel:** `npm run build` runs `test:run` then `next build`. Failing tests block deploy. Commit workflow: run build, then commit and push (`.cursor/skills/commit-and-push`).
- **Env:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and optionally service-role / site URL) in `.env.local` and Vercel.
- **Live:** spaghetticloset.com (per user).
