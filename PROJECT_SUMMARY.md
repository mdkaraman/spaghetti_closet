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

## Repo / Deploy

- Git repo and GitHub push were done manually (permission issues in automated setup).
- README has Eminem-style description; deployment steps are in README.
