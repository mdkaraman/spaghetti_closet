---
name: verify-spaghetti-closet
description: Drive the Spaghetti Closet Next.js web UI (browser) to prove user-facing behavior. Use when verifying pages, auth gates, signup/waitlist flows, or any change that should be shown working in a real browser—not unit tests alone.
---

# Verify Spaghetti Closet (web UI)

Agent-facing harness for the **Spaghetti Closet** Next.js app. Primary surface is the **browser**. Secondary surfaces (Supabase Auth/DB, Vitest) are out of scope here except as preconditions.

Helper: `.cursor/skills/verify-spaghetti-closet/bin/sc-verify` (executable). Prefer invoking it with an absolute path or from the repo root as:

```bash
./.cursor/skills/verify-spaghetti-closet/bin/sc-verify <command>
```

## Launch

Starts an isolated `next dev` bound to `127.0.0.1` on a verification port (default **3101**, not the README’s 3001) so it does not steal a human’s default session.

```bash
export RUN_ID="verify-$(date +%s)"
./.cursor/skills/verify-spaghetti-closet/bin/sc-verify launch --port 3101
# prints export lines; keep RUN_ID / VERIFY_DIR for the rest of the run
eval "$(./.cursor/skills/verify-spaghetti-closet/bin/sc-verify launch --port 3101 2>/dev/null | grep '^export ')"
```

Ready when:

- `http://127.0.0.1:$PORT/` returns HTTP &lt; 500, and
- `http://127.0.0.1:$PORT/wtf-is-this` returns HTTP &lt; 500, and
- `$VERIFY_DIR/ready` exists.

No seed DB is required for public pages. Middleware treats missing `NEXT_PUBLIC_SUPABASE_*` as **live** window + logged-out. Mutations that call `createClient()` (login, signup submit, waitlist submit, pay, bid) **need** a real `.env.local` with Supabase URL + anon key; without it those actions throw. Do not claim mutation proofs without that env.

Teardown: see **Cleanup**. Never kill by process name (`pkill next`); only stop the pid recorded for this `RUN_ID`.

**Isolation:** two runs may share a machine if they use different `RUN_ID` / ports. They must **not** share a live Supabase project for conflicting writes. Prefer disposable credentials or skip mutation features when env points at a shared project. Never drive an instance you did not launch in this run.

## Doctor

Read-only health check. Run first whenever anything looks off.

```bash
./.cursor/skills/verify-spaghetti-closet/bin/sc-verify doctor
```

Expect JSON with `pidAlive: true`, `readyFile: true`, `httpOk: true`, `packageName: "spaghetti-closet"`, and `portOwnerOk` true when `lsof` is available. Non-zero exit means do not drive.

## Drive

Browser actions go through Playwright via `sc-verify browser`. Prefer labeled fields and link/button names from this app:

| Handle | Where |
|--------|--------|
| `img` alt `Spaghetti closet.` | `/` title |
| textbox `user id:` / `passcode:` | login |
| link `wtf is this??` | `/` → `/wtf-is-this` |
| link `click here to blow` | `/wtf-is-this` → `/signup` |
| textboxes `user id:`, `email:`, `passcode:`, `confirm:` | `/signup` |
| button `send it` | signup / waitlist |
| heading `lmk when we back up` | `/waitlist` |
| textbox `email:` | waitlist / forgot-password |
| link `smh i forgot` | `/` → `/forgot-password` |

Examples:

```bash
./.cursor/skills/verify-spaghetti-closet/bin/sc-verify browser goto --url /wtf-is-this
./.cursor/skills/verify-spaghetti-closet/bin/sc-verify browser expect-text --text "click here to blow"
./.cursor/skills/verify-spaghetti-closet/bin/sc-verify browser click --role link --name "click here to blow"
./.cursor/skills/verify-spaghetti-closet/bin/sc-verify browser expect-url --url /signup
./.cursor/skills/verify-spaghetti-closet/bin/sc-verify browser fill --label "user id:" --value "demo_user"
./.cursor/skills/verify-spaghetti-closet/bin/sc-verify browser screenshot --path intro-wtf/after-click.png
./.cursor/skills/verify-spaghetti-closet/bin/sc-verify browser snapshot --path intro-wtf/after-click.aria.txt
```

Each `browser` invocation is a new Chromium process; the helper resumes `last-url` from `$VERIFY_DIR` so journeys continue across commands.

Protected routes (`/jont`, `/user`, `/pay`, `/chat`, `/bid`, `/sell`) must redirect logged-out users to `/?next=…`.

Feature recipes live in [`features/`](./features/). Read the index, then the feature file. Drive every listed entry point or report the unmet precondition—do not substitute a different path and call it verified.

## Evidence

Proof lives under:

`.cursor/skills/verify-spaghetti-closet/evidence/<feature>/`

Standards:

- Exercise the **real user path** in the browser (links, forms, redirects)—not Vitest, not internal setters, not test-only routes.
- Capture the **action and the resulting state** (screenshot + ARIA/accessibility snapshot and/or URL + visible text), not only the final screen.
- For mutations (when Supabase env is present), also verify the side effect the user would see (success copy, redirect target, list entry)—and note that DB rows are the durable side effect for waitlist/pay.
- Mocks only at production boundaries (external email/Stripe). This Phase 1 app’s “pay now” is intentionally dummy; still prove the UI path and redirect.
- Relative `--path` values for `screenshot` / `snapshot` resolve under `evidence/`.

## Cleanup

```bash
./.cursor/skills/verify-spaghetti-closet/bin/sc-verify cleanup
```

Stops the pid from this run’s `VERIFY_DIR` / `meta.json`, deletes `/tmp/sc-verify-$RUN_ID` (and storage state). **Does not** delete `evidence/`. After cleanup, confirm evidence files still exist before reporting success.

## Helpers

| Command | Purpose |
|---------|---------|
| `sc-verify launch [--port N]` | Start Next on 127.0.0.1; write state under `/tmp/sc-verify-$RUN_ID` |
| `sc-verify doctor` | JSON health report; exit 1 if not driveable |
| `sc-verify browser …` | `goto`, `click`, `fill`, `press`, `snapshot`, `screenshot`, `content`, `eval`, `expect-url`, `expect-text` |
| `sc-verify cleanup` | Tear down instance state only |

Requires `playwright` (devDependency) and a Chromium build (`npx playwright install chromium` once per machine). Optional: `VERIFY_CHROME_PATH` or `VERIFY_CHROME_CHANNEL` to point at a system Chrome.
