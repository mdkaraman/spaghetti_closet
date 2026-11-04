# Auth gate

Logged-out visitors hitting protected app routes are sent home with a `next` return path. Middleware also owns dark-week redirects to `/waitlist` when the site window is dark (requires Supabase `site_weeks` data).

## Sub-features

- `gate-jont` redirects `/jont` → `/?next=%2Fjont` (or equivalent encoding) when logged out.
- `gate-user` redirects `/user` when logged out.
- `gate-pay` redirects `/pay` when logged out.
- `gate-chat` redirects `/chat` when logged out.
- `gate-bid` redirects `/bid` when logged out.
- `gate-sell` redirects `/sell` when logged out.

## How to get to it (user POV)

- Paste or open any protected path while signed out: `/jont`, `/user`, `/pay`, `/chat`, `/bid`, `/sell`.

## Driving it with sc-verify

Preconditions:

- Doctor ok.
- Fresh launch (no auth cookies). Missing Supabase env is fine: middleware still redirects unauthenticated users.

- **Jont gate.** Run `sc-verify browser goto --url /jont` then `sc-verify browser expect-url --url "/?next=%2Fjont"` (accept equivalent encoding of `/jont`). Home login form is visible.
- **User gate.** Run `sc-verify browser goto --url /user` then expect URL query `next` pointing at `/user`.
- **Bid gate.** Run `sc-verify browser goto --url /bid` then expect `next` for `/bid`.
- **Proof.** `sc-verify browser screenshot --path auth-gate/jont-redirect.png` on the post-redirect home page; filename records the entry point.

## Gotchas

- With a live Supabase session cookie from a prior human run, gates will not fire—only drive the instance this harness launched.
- Dark-week behavior (`siteWindow === 'dark'`) needs Supabase rows; without env the window stays `live`. Do not claim dark-week redirect proofs without that data.
