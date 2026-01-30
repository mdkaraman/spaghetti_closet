# Spaghetti Closet — Project Summary

## What’s Built

- **Stack:** Next.js 14, React 18, TypeScript. Deploy target: Vercel (free tier).
- **Home/login page:** White, minimal layout. Title is an image (`public/title.png`) — handwritten “Spaghetti closet.” text. Form: user id, passcode, “enter” (submit), “wtf is this??” link bottom-left. Form shifted left (~30px) to align with title. No Tailwind; plain HTML + basic CSS. Responsive.
- **Vibe:** DIY, early-2000s feel. Simple, silly, not “polished.” No “early 2000s DIY vibe”–style copy; keep language simple and sparse (e.g. commit: “spaghetti closet login page”).

## Product Idea

- **Core:** One vintage clothing item per day. User logs in, sees that single item. Buy or skip; after that day the item is gone, new item next day.
- **Possible later:** Bidding; chat hangout while waiting; up/down vote on chat comments (e.g. tiebreaker for tied bids).

## Tech Direction (Discussed, Not Implemented)

- **Next.js:** Fine for core + bidding, chat, voting. Limits are DB, payments, real-time — not the framework.
- **Suggested stack:** Postgres (Vercel Postgres / Supabase / Neon), NextAuth (or similar) for auth, Stripe for payments, real-time later (Supabase Realtime, Pusher, or Ably).
- **Order:** Ship “one item per day + buy” first, then add bidding, then chat/voting.

## Testing

- **Framework:** Vitest + React Testing Library (not included in Next.js; added explicitly).
- **Scripts:** `npm run test` (watch), `npm run test:run` (single run, for CI).
- **Config:** `vitest.config.ts`, `vitest.setup.ts` (jest-dom). Paths via `vite-tsconfig-paths`.
- **Coverage:** `app/__tests__/page.test.tsx` — login page: title image, user id/passcode fields, enter button, wtf link, form action/method. Add tests alongside new features; run `test:run` before pushing for confidence.

## Repo / Deploy

- Git repo and GitHub push were done manually (permission issues in automated setup).
- README has Eminem-style description; deployment steps are in README.
- **Vercel:** `vercel.json` sets `buildCommand` to `npm run test:run && next build`. Tests run on every deploy; a failing test blocks the deploy. Local convention: run specs before each commit (see `.cursor/skills/commit`).
