# Spaghetti Closet verification map

Maintained source for verifying user-facing Spaghetti Closet behavior in a real browser. Read this index first, then the matching feature file.

## Baseline preconditions

- Launch with `./.cursor/skills/verify-spaghetti-closet/bin/sc-verify launch` and keep `RUN_ID` / `VERIFY_DIR`.
- Default verification URL: `http://127.0.0.1:3101` (not 3001).
- Run `sc-verify doctor` and require `pidAlive`, `readyFile`, `httpOk`, and `packageName: "spaghetti-closet"`.
- Never drive an instance this run did not start.
- Public / logged-out proofs work without Supabase env. Mutation proofs (login success, signup submit, waitlist insert, pay, bid) require `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the environment that launched Next.

## Driving conventions

- Start from the launched base URL unless a feature lists another precondition.
- Prefer `getByRole` / `getByLabel` via `sc-verify browser` (`--role`/`--name`, `--label`) over CSS or coordinates.
- Treat commands in feature files as literal.
- Restore nothing on shared Supabase; prefer read-only journeys when credentials are shared. Do not delete proof under `evidence/`.

## Proof and skip reporting

- Capture action + resulting state (URL, visible copy, screenshot, ARIA snapshot).
- Record the feature id and entry point with every artifact.
- If an entry point needs Supabase and env is missing, report failure with that precondition—do not mark the feature verified via a different path.

## Feature entry contract

Each feature file: H1 + one paragraph, then exactly four H2s: `Sub-features`, `How to get to it (user POV)`, `Driving it with sc-verify`, `Gotchas`.

## Features

- [Intro (wtf is this)](./intro-wtf.md) — cold open → signup CTA.
- [Login home](./login-home.md) — brand, login fields, footer links.
- [Auth gate](./auth-gate.md) — logged-out redirects from protected routes.
- [Signup form](./signup.md) — signup fields reachable from intro (submit needs Supabase).
- [Waitlist](./waitlist.md) — dark-week email capture UI (submit needs Supabase).
