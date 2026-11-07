# Spaghetti Closet development plan

Six tasks are left in `WORK_PLAN.md`. This plan finishes them in order and ends with one feature map that replaces three out-of-date status docs.
When the plan is done, an unsold jont sends people to bidding instead of buy-now. People can gift spaghetti bucks. The chat shows the high bid and the winner. The daily jont follows a user's size and type. Other users can bid on a jont that someone listed for sale.
Today there are no open PRs. All 17 earlier PRs are merged.
The PRs, in order, are PR-C2, PR-F1, PR-I1, PR-G2, PR-H2, and PR-V1.

## How to read this

One box is one unit of work. Every box names the evidence that checks it. A nested box is a sub-step of the box above it. Check a box only when its evidence exists, such as a file, a log line, a screenshot, a test run, or a commit SHA. The body is a how-to. The appendices explain and record. Appendix E defines the terms used here.

The program runs `playbooks/autopilot-stack.md` from the pstack plugin. The `pstack/` paths in this file point at that plugin, not at this repo. Agents build and verify each PR and stop when it is ready to merge. The operator lands every PR. PR-C2, PR-F1, PR-I1, PR-G2, and PR-H2 change what a user sees, so the operator reviews them before merge. PR-V1 only changes docs and needs no review.

Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

The six PRs at a glance.

| PR | What it does | Starts after |
|---|---|---|
| PR-C2 | Sends an unsold jont to the bid page and stops `/pay` from creating a purchase | Nothing |
| PR-F1 | Adds the blessing form and list to `/user` | Nothing |
| PR-I1 | Shows the high bid, then the winner, in the chat | Nothing |
| PR-G2 | Picks the daily jont by the user's size and type | PR-C2 |
| PR-H2 | Lets other users bid on a listing and records the winner | PR-I1 |
| PR-V1 | Writes the feature map and fixes the status docs | All five above |

## Program checklist

### Arm the program

- [ ] Tell the operator the protocol and this plan, then stop. Start only when the operator says go.
- [ ] Read these files from `main` at the start and at every tick.
  - [ ] `git show origin/main:pstack/skills/poteto-mode/playbooks/autopilot-stack.md`
  - [ ] `git show origin/main:pstack/skills/swarm/SKILL.md`
  - [ ] `git show origin/main:.cursor/skills/verify-spaghetti-closet/SKILL.md`
  - [ ] `git show origin/main:pstack/skills/poteto-mode/playbooks/opening-a-pr.md`
  - [ ] `git show origin/main:pstack/skills/poteto-mode/playbooks/babysit.md`
  - [ ] `git show origin/main:pstack/skills/technical-writing/SKILL.md`
  - [ ] `git show origin/main:WORK_PLAN.md`
- [ ] When the operator says go, start the audit tick with `/loop 1h` and the tick prompt below.
- [ ] Use this tick prompt. "Re-read the execution playbook from main and fix any drift. Check each active lane for real progress, such as commits, PR state, and test runs, not for claims. Replace any stuck lane now. Post a short status message to the operator only when something new happened that no earlier message reported. Examples are a PR opened, a verdict, a merge-ready report, a stuck agent and what you did, or a decision only the operator can make. Otherwise end the turn with no text. Log every tick in the decision trail, naming what you reported or none."
- [ ] When the operator says hold or stop, tell every owner to stop writing at once.

### Spawn owners

- [ ] Start one owner per PR. Each owner runs the full lifecycle the execution playbook describes.
- [ ] Follow this order. A dependent PR starts only after its parent is merged, or it branches from the parent's branch when the playbook stacks.
  - [ ] PR-C2, PR-F1, and PR-I1 are independent and start first. All three branch from `main`.
  - [ ] PR-G2 starts after PR-C2.
  - [ ] PR-H2 starts after PR-I1.
  - [ ] PR-V1 starts after PR-C2, PR-F1, PR-I1, PR-G2, and PR-H2.
- [ ] Keep each PR inside its own files, so no two PRs edit the same file.
  - [ ] PR-C2 edits `lib/jont/entry.ts`, `lib/jont/__tests__/entry.test.ts`, `app/actions/pay.ts`, `app/actions/__tests__/pay.test.ts`, and `app/jont/__tests__/page.test.tsx`.
  - [ ] PR-F1 edits `app/user/BlessingsSection.tsx`, `app/actions/bless.ts`, and their tests.
  - [ ] PR-I1 edits `lib/bids/winner.ts`, `lib/bids/__tests__/winner.test.ts`, `app/chat/WinnerSlot.tsx`, and `supabase/migrations/00005_balances_for_bidders.sql`.
  - [ ] PR-G2 edits `lib/jont/resolve.ts`, `supabase/migrations/00006_jont_preferences.sql`, `supabase/seed/load_next_week.sql`, and `supabase/seed/copy_hoodie_rest_of_year.sql`.
  - [ ] PR-H2 edits `app/sell/[id]/page.tsx`, `app/actions/listing-bid.ts`, `app/actions/close-listing.ts`, their tests, and `supabase/migrations/00007_close_listing_if_due.sql`.
  - [ ] PR-V1 edits `PHASES_OUTLINE.md`, `PROJECT_SUMMARY.md`, `docs/FEATURE_MAP.md`, `docs/SCHEMA_PHASE1.md`, and `.cursor/skills/verify-spaghetti-closet/features/`.
- [ ] Hold PR-C2, PR-F1, PR-I1, PR-G2, and PR-H2 for the operator's review. The operator sees screenshots and a video in chat before merge.
- [ ] Apply these two decisions, which the plan already made. PR-C2 changes `payNow` to call `resolveJontForUser`, so PR-G2 never edits `app/actions/pay.ts`. The new migrations are numbered in advance, `00005` for PR-I1, `00006` for PR-G2, and `00007` for PR-H2.

### PR mechanics, for every PR

- [ ] Pick the forge once. Use `gh` by default. If `command -v origin` succeeds and Origin can find the repository, use `origin pr` for every PR step. Record any fallback to `gh`. Never require `gt`.
- [ ] Open each PR ready for review, never as a draft, as the Opening a PR playbook says. Use the run's built-in PR tool if it has one. Otherwise run `origin pr create --status open --base <base-branch>` or `gh pr create --base <base-branch>`. A stacked PR targets its parent's branch.
- [ ] Run `npm run build` once before the push that opens the PR. It runs the tests, then the type-checked Next.js build. Push with hooks on.
- [ ] Run `/deslop` before each commit and `/no-comments` before review.
- [ ] Triage every Bugbot and security-review comment as `references/bugbot-triage.md` says.
- [ ] Rebase onto `main` before the code-ready report. Keep that base during fix rounds. Rebase again only at merge prep, on a conflict that `git merge-tree` finds, when CI fails because of a change on `main`, or when a known change to the same files lands.
- [ ] Set the matching `WORK_PLAN.md` task to `in progress` with the branch name when the owner starts. Set it to `done` when the PR is ready to merge. Edit only that task's Status, Claimed by, and Done when lines.

### Verdict and merge, for every PR

- [ ] Run one full swarm at the code-ready commit, as `pstack/skills/swarm/SKILL.md` describes. It has one gates lane, the ten live lanes from the PR's **Verify, live** block, the perf lane from its **Verify, perf** block, and at least two audit lanes. Audit lanes read the diff and the receipts and do not trust the PR body. Run another full swarm only for new behavior, a redesign, or a large new diff. A rebase, a conflict fix, or a small fix gets one verifier at the new commit. A wording-only change gets none.
- [ ] Judge each finding by the playbook's blocking rule. The verdict is clean when nothing blocks. A failure in a lane named `Regression lane against trunk.` that comes from trunk behavior is recorded against trunk and does not block the PR. A new commit needs a new verdict, except where `playbooks/shipping.md` says an earlier result still holds because the patch-id is unchanged.
- [ ] Owners stop at ready to merge. The root agent adds each PR to the stack. The operator lands the verified PRs from the bottom up. After the verdict, rebase onto current `main` and confirm the patch-id did not change.

### Boot recipe, for every live lane

Each live lane runs on its own cloud VM at the PR's commit. Drive the app with `.cursor/skills/verify-spaghetti-closet` and its `sc-verify` command.

- [ ] Run `git fetch origin <head-branch> && git checkout <head SHA>`.
- [ ] Run `npm ci`. When the lane signs in, bids, votes, gifts, or lists, copy a disposable Supabase URL and anon key into `.env.local`. A lane that only visits public pages can skip this.
- [ ] Run `eval "$(./.cursor/skills/verify-spaghetti-closet/bin/sc-verify launch --port 3101 2>/dev/null | grep '^export ')"`, then `./.cursor/skills/verify-spaghetti-closet/bin/sc-verify doctor`. The app is ready when `doctor` reports `pidAlive`, `readyFile`, and `httpOk` as true and `packageName` as `spaghetti-closet`.
- [ ] Send input only through `sc-verify browser`, using role, name, or label selectors from the feature recipes. For read-only checks, use `doctor`, the page URL, the visible text, the accessibility snapshot, and screenshots.
- [ ] Save every screenshot to `/tmp/swarm-<pr-id>/worker-<n>/<slug>.png` and return the paths with the report.
- [ ] Stop the app with `sc-verify cleanup` for this `RUN_ID` only. Never run `pkill next`.

## Send unsold jonts to the bid page (PR-C2)

**Depends on.** None. The chat and the bid page are already on `main`.

**Files.**

- [ ] Edit `lib/jont/entry.ts`.
- [ ] Edit `lib/jont/__tests__/entry.test.ts`.
- [ ] Edit `app/actions/pay.ts`.
- [ ] Edit `app/jont/__tests__/page.test.tsx`.
- [ ] Create `app/actions/__tests__/pay.test.ts`.
- [ ] Leave `app/jont/JontCta.tsx` alone unless the constant alone does not set the link.

**Build.**

- [ ] Set `JONT_ENTRY_MODE` to `'bid'` in `lib/jont/entry.ts`.
- [ ] Change `payNow` so it calls `resolveJontForUser`, redirects to `/bid?jont=<id>`, and never inserts a `purchases` row.
- [ ] Update the tests so an unsold jont links `i will have it!` to `/bid?jont=<id>`, and a purchased jont still links `pull up` to `/chat?jont=<id>`.

**You see.**

- [ ] On today's unsold jont, the link `i will have it!` points to `/bid?jont=<uuid>`.
- [ ] Submitting `/pay` lands on `/bid?jont=<uuid>` and adds no row to `purchases`.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `lib/jont/__tests__/entry.test.ts` expects mode `'bid'` and the purchase-to-chat result. Run `npm run test:run -- lib/jont/__tests__/entry.test.ts`.
- [ ] `app/jont/__tests__/page.test.tsx` expects the unsold link `/bid?jont=` and the purchased link `/chat?jont=`. Run `npm run test:run -- app/jont/__tests__/page.test.tsx`.
- [ ] `app/actions/__tests__/pay.test.ts` checks that `payNow` inserts no purchase and redirects to `/bid?jont=`. Run `npm run test:run -- app/actions/__tests__/pay.test.ts`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.7-xhigh-fast` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Load the unsold jont on `main` and on the PR. `main` still links to `/pay`, so record that as trunk behavior. Check that the PR links to `/bid?jont=` and shows the bid form. Save `c2-regression-cta.png`. Pass when the PR's link contains `/bid?jont=` and the bid form is visible.
- [ ] Lane 2. Open `/jont` while logged in with no purchase today. Save `c2-unsold-cta.png`. Pass when the link `i will have it!` points to `/bid?jont=`.
- [ ] Lane 3. Follow that link. Save `c2-bid-page.png`. Pass when the URL starts with `/bid?jont=` and a whole-dollar field is visible.
- [ ] Lane 4. Submit a bid of `1`. Save `c2-bid-submit.png`. Pass when the browser lands on `/chat?jont=` with the same id.
- [ ] Lane 5. After that bid, open `/jont` again. Save `c2-still-bid.png`. Pass when the link still points to `/bid?jont=`, because a bid is not a purchase.
- [ ] Lane 6. Add a purchase for the jont, then open `/jont`. Save `c2-pull-up.png`. Pass when the link `pull up` points to `/chat?jont=`.
- [ ] Lane 7. Open `/pay` directly while logged in. Save `c2-pay-redirect.png`. Pass when the browser lands on `/bid?jont=` and a new query shows no new `purchases` row from this visit.
- [ ] Lane 8. Open `/jont` while logged out. Save `c2-auth-gate.png`. Pass when the browser lands on the login page, as it does on `main`.
- [ ] Lane 9. Add a dark `site_weeks` row that covers today, then open `/jont`. Save `c2-dark-gate.png`. Pass when the browser lands on `/waitlist`.
- [ ] Lane 10. Load the unsold jont at 390px wide. Save `c2-mobile-cta.png`. Pass when the bid link is visible and tappable and the page does not scroll sideways.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time from loading `/jont` to a visible link, on `main` and on the PR. Also time `/pay` submit to a ready `/bid` page on the PR alone, because `main` still writes a purchase.
- [ ] Probe. Run three `sc-verify` samples per side, alternating `main` and the PR.
- [ ] Baseline. Record the `main` time for `/jont` first.
- [ ] Rule. Fail if the PR's `/jont` p95 is over 1.25 times the `main` p95, or if `/pay` to `/bid` takes over 3000 ms.

**Review gate.** The operator reviews before merge.

- [ ] Copy the lane 2 and lane 7 screenshots to `/cursor/stores/self/artifacts/PR-C2-review-unsold-cta.png` and `/cursor/stores/self/artifacts/PR-C2-review-pay-redirect.png`.
- [ ] Record a 30 to 60 second video of the unsold link through a bid on a lane VM. Save it as `/cursor/stores/self/artifacts/PR-C2-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at ready to merge and wait for the operator.

**Merge.**

- [ ] The root agent gives a clean verdict at the exact commit.
- [ ] Bugbot comments are triaged.
- [ ] The PR is rebased onto current `main` after the verdict, with the patch-id unchanged.
- [ ] The root agent adds PR-C2 to the stack and the operator lands it from the bottom up.

## Add the blessing form to the user page (PR-F1)

**Depends on.** None. The bucks balance and the `bless_spaghetti` function are already on `main`.

**Files.**

- [ ] Edit `app/user/BlessingsSection.tsx`.
- [ ] Create `app/actions/bless.ts`.
- [ ] Create `app/user/__tests__/BlessingsSection.test.tsx`.
- [ ] Create `app/actions/__tests__/bless.test.ts`.

**Build.**

- [ ] Add a form with a handle field and a whole-number amount field. It calls `bless_spaghetti`. Under it, list incoming blessings, newest first, under the heading `blessings`.
- [ ] Reject an empty handle, a gift to yourself, and an amount under `1` in the form before it calls the function.
- [ ] Leave `app/user/page.tsx` alone. It already shows this section.

**You see.**

- [ ] `/user` shows the `blessings` heading, a handle field, an amount field, and the list.
- [ ] After a gift, the recipient's list shows the giver's handle and the amount at the top, and the giver's balance drops by that amount.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `app/actions/__tests__/bless.test.ts` mocks the function and covers an empty handle, a self gift, an amount under `1`, and a good gift. Run `npm run test:run -- app/actions/__tests__/bless.test.ts`.
- [ ] `app/user/__tests__/BlessingsSection.test.tsx` checks the heading, the two fields, and the newest-first list. Run `npm run test:run -- app/user/__tests__/BlessingsSection.test.tsx`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.7-xhigh-fast` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Open `/user` on `main` and on the PR. `main` has no blessings section, so record that as trunk behavior. Check that the PR shows `blessings` and that `spaghetti bucks` still shows. Save `f1-regression-user.png`. Pass when the PR shows both headings.
- [ ] Lane 2. Open `/user` while logged in with a positive balance. Save `f1-form.png`. Pass when the handle and amount fields are visible under `blessings`.
- [ ] Lane 3. Submit an empty handle. Save `f1-empty-handle.png`. Pass when an error shows and the list does not change.
- [ ] Lane 4. Submit your own handle. Save `f1-self-gift.png`. Pass when the form rejects it.
- [ ] Lane 5. Submit an amount of `0`. Save `f1-zero-amount.png`. Pass when the form rejects it.
- [ ] Lane 6. Gift `1` to another user, then sign in as that user. Save `f1-success.png`. Pass when the giver's handle and `1` are at the top of the recipient's list.
- [ ] Lane 7. Check the giver's balance after that gift. Save `f1-balance.png`. Pass when the balance is one lower than before.
- [ ] Lane 8. Try to gift more than the giver's balance. Save `f1-overdraw.png`. Pass when the gift fails and the balance stays the same.
- [ ] Lane 9. Open `/user` while logged out. Save `f1-auth-gate.png`. Pass when the browser lands on the login page.
- [ ] Lane 10. Open `/user` at 390px wide. Save `f1-mobile.png`. Pass when the form and the list are readable and the heading is not cut off.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time from loading `/user` to a visible `spaghetti bucks` balance, on `main` and on the PR. Also time a gift submit to the updated list on the PR alone.
- [ ] Probe. Run three loads per side, alternating `main` and the PR.
- [ ] Baseline. Record the `main` time for `/user` first.
- [ ] Rule. Fail if the PR's `/user` p95 is over 1.25 times the `main` p95, or if a gift takes over 3000 ms to show in the list.

**Review gate.** The operator reviews before merge.

- [ ] Copy the lane 2 and lane 6 screenshots to `/cursor/stores/self/artifacts/PR-F1-review-form.png` and `/cursor/stores/self/artifacts/PR-F1-review-success.png`.
- [ ] Record a 30 to 60 second video of a successful gift on a lane VM. Save it as `/cursor/stores/self/artifacts/PR-F1-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at ready to merge and wait for the operator.

**Merge.**

- [ ] The root agent gives a clean verdict at the exact commit.
- [ ] Bugbot comments are triaged.
- [ ] The PR is rebased onto current `main` after the verdict, with the patch-id unchanged.
- [ ] The root agent adds PR-F1 to the stack and the operator lands it from the bottom up.

## Show the high bid and the winner in the chat (PR-I1)

**Depends on.** None. The bid page and the bucks ledger are already on `main`.

**Files.**

- [ ] Edit `lib/bids/winner.ts`.
- [ ] Create `lib/bids/__tests__/winner.test.ts`.
- [ ] Edit `app/chat/WinnerSlot.tsx`.
- [ ] Create `supabase/migrations/00005_balances_for_bidders.sql`.

**Build.**

- [ ] Write `pickWinner(bids, balanceOf)` using the Winner rules in `WORK_PLAN.md`. Sort by amount, then by balance, then by earlier bid time.
- [ ] Add a database function `balances_for_bidders(jont_id)` that runs with elevated rights. It returns balances only for users who bid on that jont.
- [ ] Make `WinnerSlot` load the bids and balances, call `pickWinner`, and show the handle. The label is `high bid` on the jont's East Coast date and `winner` after it.
- [ ] Leave `app/chat/ChatRoom.tsx` alone. It already shows the slot.

**You see.**

- [ ] `/chat?jont=` shows a `high bid` or `winner` line with a handle above the copped list.
- [ ] When two bids match in amount, the user with more spaghetti bucks wins. If balances also match, the earlier bid wins.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `lib/bids/__tests__/winner.test.ts` covers a higher amount, a balance tie-break, an earlier-bid tie-break, and an empty list. Run `npm run test:run -- lib/bids/__tests__/winner.test.ts`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.7-xhigh-fast` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Open `/chat?jont=` for a jont with bids on `main` and on the PR. `main` shows no winner line, so record that as trunk behavior. Check that the PR shows a label and a handle. Save `i1-regression-slot.png`. Pass when the PR shows `high bid` or `winner` and a handle.
- [ ] Lane 2. Use today's jont with one bidder. Save `i1-high-bid.png`. Pass when the label is `high bid` and the handle is that bidder's.
- [ ] Lane 3. Use today's jont with two bids of different amounts. Save `i1-amount-wins.png`. Pass when the higher bidder's handle shows.
- [ ] Lane 4. Use two bids of the same amount and different balances. Save `i1-balance-tie.png`. Pass when the bidder with the higher balance shows.
- [ ] Lane 5. Use two bids with the same amount and the same balance. Save `i1-time-tie.png`. Pass when the earlier bidder shows.
- [ ] Lane 6. Open the chat after the jont's date has passed. Save `i1-winner-label.png`. Pass when the label is `winner` and the handle is unchanged.
- [ ] Lane 7. Open the chat for a jont with no bids. Save `i1-empty.png`. Pass when no handle shows and the page does not error.
- [ ] Lane 8. Check the bidder list under the slot. Save `i1-bidder-list.png`. Pass when the slot and every bidder in the `bids` list are visible.
- [ ] Lane 9. Open `/chat?jont=` while logged out. Save `i1-auth-gate.png`. Pass when the browser lands on the login page.
- [ ] Lane 10. Open the chat at 390px wide. Save `i1-mobile.png`. Pass when the label and handle wrap without covering the copped list.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time from loading `/chat?jont=` to a visible chat page, on `main` and on the PR. Also time the wait for the winner label on the PR alone.
- [ ] Probe. Use a jont with at least two bids. Run three loads per side, alternating `main` and the PR.
- [ ] Baseline. Record the `main` time for the chat page first.
- [ ] Rule. Fail if the PR's chat p95 is over 1.25 times the `main` p95, or if the winner label takes over 3000 ms to appear.

**Review gate.** The operator reviews before merge.

- [ ] Copy the lane 2 and lane 4 screenshots to `/cursor/stores/self/artifacts/PR-I1-review-high-bid.png` and `/cursor/stores/self/artifacts/PR-I1-review-balance-tie.png`.
- [ ] Record a 30 to 60 second video of the high-bid label on a lane VM. Save it as `/cursor/stores/self/artifacts/PR-I1-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at ready to merge and wait for the operator.

**Merge.**

- [ ] The root agent gives a clean verdict at the exact commit.
- [ ] Bugbot comments are triaged.
- [ ] The PR is rebased onto current `main` after the verdict, with the patch-id unchanged.
- [ ] The root agent adds PR-I1 to the stack and the operator lands it from the bottom up.

## Pick the daily jont by size and type (PR-G2)

**Depends on.** PR-C2.

**Files.**

- [ ] Edit `lib/jont/resolve.ts`.
- [ ] Create `lib/jont/__tests__/resolve.test.ts`.
- [ ] Create `supabase/migrations/00006_jont_preferences.sql`.
- [ ] Edit `supabase/seed/load_next_week.sql`.
- [ ] Edit `supabase/seed/copy_hoodie_rest_of_year.sql`.
- [ ] Do not edit `app/actions/pay.ts`. PR-C2 already routes it through `resolveJontForUser`.

**Build.**

- [ ] In the new migration, add the optional columns `jonts.size` and `jonts.jont_type`, and drop the unique rule on `jonts.date`.
- [ ] Make `resolveJontForUser` use the matching rule in `WORK_PLAN.md` and the user's saved size and type. Among today's matches, take the earliest `created_at`, then the lowest `id`.
- [ ] Change both seed files to skip a date that already has a row, instead of using `on conflict (date)`.

**You see.**

- [ ] A user with size `L` and type `shirt` sees today's matching jont when one exists.
- [ ] A jont with no size or type matches any preference. When no jont exists for today, the page still shows `ain’t got naaaan for ya…. maybe later doe`.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `lib/jont/__tests__/resolve.test.ts` covers a match, a jont with no size or type, empty preferences, and no jont for today. Run `npm run test:run -- lib/jont/__tests__/resolve.test.ts`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.7-xhigh-fast` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. On a test database with the new migration applied, add two jonts for today and open `/jont` as a user with preferences, on `main` and on the PR. If `main` cannot hold two jonts for one day, record that as trunk behavior. Check that the PR shows the matching title. Save `g2-regression-resolve.png`. Pass when the PR shows the matching title.
- [ ] Lane 2. Open `/jont` as a user with no preferences. Save `g2-empty-prefs.png`. Pass when the earliest jont for today shows.
- [ ] Lane 3. Use a user with size `L`, one `L` jont, and one other jont for today. Save `g2-size-match.png`. Pass when the `L` jont's title shows.
- [ ] Lane 4. Use a user who prefers `shoes` and a jont for today with no type. Save `g2-null-type.png`. Pass when that jont shows.
- [ ] Lane 5. Open `/jont` on a day with no jont. Save `g2-empty-day.png`. Pass when the empty message `ain’t got naaaan for ya…. maybe later doe` shows.
- [ ] Lane 6. Save preferences on `/user`, then open `/jont`. Save `g2-pref-form-roundtrip.png`. Pass when the jont matches the saved size and type.
- [ ] Lane 7. Open `/pay` after PR-C2. Save `g2-pay-same-jont.png`. Pass when the redirect goes to `/bid?jont=` with the same id that `/jont` shows.
- [ ] Lane 8. Open `/chat?jont=` for that id. Save `g2-chat-query-param.png`. Pass when the chat loads comments for that id.
- [ ] Lane 9. Run `load_next_week.sql` twice on the test database. Save `g2-seed-idempotent.png` as a screenshot of the SQL output. Pass when the second run adds no duplicate week row and raises no error.
- [ ] Lane 10. Open the matched `/jont` at 390px wide. Save `g2-mobile.png`. Pass when the title and the bid link are visible.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time from loading `/jont` to a visible title or empty message, on `main` and on the PR. Also time the same load on the PR with two candidate jonts.
- [ ] Probe. Run three loads per side, alternating `main` and the PR.
- [ ] Baseline. Record the `main` time for `/jont` first.
- [ ] Rule. Fail if the PR's `/jont` p95 is over 1.25 times the `main` p95, or if the two-candidate load takes over 3000 ms.

**Review gate.** The operator reviews before merge.

- [ ] Copy the lane 3 and lane 5 screenshots to `/cursor/stores/self/artifacts/PR-G2-review-match.png` and `/cursor/stores/self/artifacts/PR-G2-review-empty.png`.
- [ ] Record a 30 to 60 second video of saving preferences and then seeing the matched jont on a lane VM. Save it as `/cursor/stores/self/artifacts/PR-G2-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at ready to merge and wait for the operator.

**Merge.**

- [ ] The root agent gives a clean verdict at the exact commit.
- [ ] Bugbot comments are triaged.
- [ ] The PR is rebased onto current `main` after the verdict, with the patch-id unchanged.
- [ ] The root agent adds PR-G2 to the stack and the operator lands it from the bottom up.

## Let other users bid on a listing (PR-H2)

**Depends on.** PR-I1.

**Files.**

- [ ] Create `app/sell/[id]/page.tsx`.
- [ ] Create `app/actions/listing-bid.ts`.
- [ ] Create `app/actions/close-listing.ts`.
- [ ] Create a test file beside each of the two actions.
- [ ] Create `supabase/migrations/00007_close_listing_if_due.sql`.

**Build.**

- [ ] Add the page `/sell/[id]`. It lists the bidders and shows the high bid, chosen with `pickWinner`.
- [ ] Let a user other than the seller place or change a bid in cents, with `listing_id` set and `jont_id` empty. Reject a bid from the seller.
- [ ] Add a database function `close_listing_if_due(listing_id)` that runs with elevated rights. Once today is on or after the `ends_on` of the week that covers the listing, it closes the listing and records one purchase for the winner. A repeat call must not create a second purchase.

**You see.**

- [ ] Another user can open `/sell/<id>`, place a bid, and see the high bid.
- [ ] A visit on or after the listing week's `ends_on` shows the winner once and the status `closed`.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] The action tests cover a bid from another user, a rejected seller bid, the one-dollar minimum, and a repeat close. Run `npm run test:run -- app/actions/__tests__/listing-bid.test.ts app/actions/__tests__/close-listing.test.ts`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.7-xhigh-fast` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Open `/sell/<id>` for an open listing on `main` and on the PR. `main` has no such page, so record that as trunk behavior. Check that the PR shows the listing with its bids or an empty state. Save `h2-regression-listing.png`. Pass when the PR renders the listing page.
- [ ] Lane 2. As the seller, open `/sell` and follow a listing to `/sell/<id>`. Save `h2-seller-view.png`. Pass when the page loads and the bid control is missing or disabled.
- [ ] Lane 3. As another user, place a bid of `$1`. Save `h2-bid.png`. Pass when that user appears as a bidder and the high bid updates.
- [ ] Lane 4. As the seller, try to bid. Save `h2-seller-rejected.png`. Pass when the bid is rejected and no seller bid row appears.
- [ ] Lane 5. As a second user, outbid the first. Save `h2-outbid.png`. Pass when the higher amount shows as the high bid.
- [ ] Lane 6. Set the test data so today is on or after the week's `ends_on`, then reload the listing. Save `h2-lazy-close.png`. Pass when the status is `closed` and the winner has one purchase.
- [ ] Lane 7. Reload the closed listing. Save `h2-idempotent-close.png`. Pass when the winner still has exactly one purchase for that jont.
- [ ] Lane 8. Use a listing whose creation date no week covers. Save `h2-no-week-row.png`. Pass when the status stays `open`.
- [ ] Lane 9. Open `/sell/<id>` while logged out. Save `h2-auth-gate.png`. Pass when the browser lands on the login page.
- [ ] Lane 10. Open `/sell/<id>` at 390px wide. Save `h2-mobile.png`. Pass when the bid field and the high bid are usable.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. `main` has no `/sell/[id]`, so time the PR's listing page from navigation to a visible high bid or empty state. Also time bid submit to an updated high bid. For a nearby `main` reference, time the `/sell` list page.
- [ ] Probe. Run three loads per side, alternating the `main` list page and the PR's listing page.
- [ ] Baseline. Record the `main` time for `/sell` first.
- [ ] Rule. Fail if the listing page takes over 3000 ms to be ready, or if a bid takes over 3000 ms to show. Do not compare the two pages as a ratio, because they do different work.

**Review gate.** The operator reviews before merge.

- [ ] Copy the lane 3 and lane 6 screenshots to `/cursor/stores/self/artifacts/PR-H2-review-bid.png` and `/cursor/stores/self/artifacts/PR-H2-review-close.png`.
- [ ] Record a 30 to 60 second video of another user placing a bid on a lane VM. Save it as `/cursor/stores/self/artifacts/PR-H2-review.mp4`.
- [ ] Post the screenshots and the video in chat. Stop at ready to merge and wait for the operator.

**Merge.**

- [ ] The root agent gives a clean verdict at the exact commit.
- [ ] Bugbot comments are triaged.
- [ ] The PR is rebased onto current `main` after the verdict, with the patch-id unchanged.
- [ ] The root agent adds PR-H2 to the stack and the operator lands it from the bottom up.

## Write the feature map and fix the status docs (PR-V1)

**Depends on.** PR-C2, PR-F1, PR-I1, PR-G2, and PR-H2.

**Files.**

- [ ] Create `docs/FEATURE_MAP.md`.
- [ ] Edit `PHASES_OUTLINE.md`.
- [ ] Edit `PROJECT_SUMMARY.md`.
- [ ] Edit `docs/SCHEMA_PHASE1.md`.
- [ ] Edit `.cursor/skills/verify-spaghetti-closet/features/README.md` and add one recipe file each for the chat, the bid page, bucks, blessings, preferences, selling, and listing bids.
- [ ] Edit `WORK_PLAN.md` only to mark V1 done and point readers at `docs/FEATURE_MAP.md`.

**Build.**

- [ ] Write `docs/FEATURE_MAP.md` as the one product map. Give each feature one row with its status (`shipped` or `open`), its route or database function, its `WORK_PLAN.md` task id, and the path of its verify recipe.
- [ ] Walk the V1 done-when list in `WORK_PLAN.md` and check every Phase box that is now true. Leave the Phase 2 payment-link box unchecked and add a note that PR-C2 replaced that link with bidding.
- [ ] Shorten `PROJECT_SUMMARY.md` so its built-features and next-steps sections point at `docs/FEATURE_MAP.md` instead of repeating a route list that goes stale.
- [ ] Add the tables, view, and functions from migrations `00003` and `00004` to `docs/SCHEMA_PHASE1.md`. Keep the file path, and retitle it if the new content no longer fits "Phase 1".
- [ ] Do not fix product bugs in this PR. Open a follow-up for the task that owns the files.

**You see.**

- [ ] `docs/FEATURE_MAP.md` lists every shipped feature from sign-in through listing bids, and no unchecked Phase box contradicts it.
- [ ] `PROJECT_SUMMARY.md` no longer says week loading or chat are unbuilt.

**Verify, unit.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] `npm run build` still passes with the docs-only change. Run `npm run build`.
- [ ] Save the list of checked and unchecked Phase boxes, each with the code or test that proves it, to `/cursor/stores/self/artifacts/PR-V1-outline-receipt.txt`.

**Verify, live.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `grok-4.7-xhigh-fast` at the PR head, per the boot recipe.

- [ ] Lane 1. Regression lane against trunk. Open `/` on `main` and on the PR. A docs-only change must not alter the login page. Save `v1-regression-home.png`. Pass when the PR's login text and fields match `main`.
- [ ] Lane 2. Open `/wtf-is-this`. Save `v1-intro.png`. Pass when the intro shows and `click here to blow` leads to signup.
- [ ] Lane 3. Open `/jont` while logged in. Save `v1-jont.png`. Pass when the bid link from PR-C2 shows.
- [ ] Lane 4. Open `/chat?jont=` for a jont with bids. Save `v1-chat.png`. Pass when the winner line, the copped list, the bids, and the comments all show.
- [ ] Lane 5. Open `/user`. Save `v1-user.png`. Pass when the bucks, blessings, preferences, and sell sections show.
- [ ] Lane 6. Open `/sell` and then a listing page. Save `v1-sell.png`. Pass when the listing bid page from PR-H2 loads.
- [ ] Lane 7. Open `/waitlist`. Save `v1-waitlist.png`. Pass when the lyric and the email field show.
- [ ] Lane 8. Open `docs/FEATURE_MAP.md` on the PR. Save `v1-feature-map-receipt.png`. Pass when it lists the chat, the bid page, bucks, blessings, preferences, selling, and listing bids as `shipped`.
- [ ] Lane 9. Open the verify recipes README on the PR. Save `v1-verify-index-receipt.png`. Pass when it links a recipe for each of those features.
- [ ] Lane 10. Add a dark `site_weeks` row that covers today, then open `/jont`. Save `v1-dark-gate.png`. Pass when the browser lands on `/waitlist`.

**Verify, perf.** Tests alone are not sufficient verification. A PR is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. Time from loading `/` to a visible login page, on `main` and on the PR.
- [ ] Probe. Run three loads per side, alternating `main` and the PR.
- [ ] Baseline. Record the `main` time for `/` first.
- [ ] Rule. Fail if the PR's `/` p95 is over 1.10 times the `main` p95.

**Review gate.** None. PR-V1 is not review-gated.

**Merge.**

- [ ] The root agent gives a clean verdict at the exact commit.
- [ ] Bugbot comments are triaged.
- [ ] The PR is rebased onto current `main` after the verdict, with the patch-id unchanged.
- [ ] The root agent adds PR-V1 to the stack and the operator lands it from the bottom up.

## Close the program

- [ ] Every box above is checked with its evidence.
- [ ] Reply to the operator with the report the execution playbook names.
- [ ] After the operator confirms, delete the 17 leftover remote branches listed in Appendix D. Each one is a branch from a PR that was already squash-merged.

## Appendix A. Prototype evidence

No prototype was built. `WORK_PLAN.md` already settles the open product questions for entry mode, the blessing form, the winner sort order, the preference match, and the listing close.

The plan relies on these facts, read from `main` at commit `5971701`. `JONT_ENTRY_MODE` is `'buy'`. `BlessingsSection` and `WinnerSlot` return nothing. The folder `app/sell/[id]` does not exist.

One thing stays unproven until the work runs on a test database. This repo does not show whether production already has a live `site_weeks` row.

## Appendix B. Alternatives rejected

**One large PR for all six tasks.** The files do not overlap, so three PRs can start at once. A single PR would hide which change broke something.

**Keeping buy-now next to bidding.** Phase 3 and PR-C2 call for bid-only. Running both would mean temporary code that someone has to delete later.

**A fourth status doc.** Three docs already overlap. `docs/FEATURE_MAP.md` replaces them as the one map, and `PROJECT_SUMMARY.md` points to it.

**Asking the operator to choose migration numbers or who edits `pay.ts`.** Neither choice is a product decision. The plan sets both in advance.

**Letting agents merge their own PRs.** You asked for a plan and a path, so the run stops at ready to merge and the operator lands the PRs.

## Appendix C. Risks

**Two PRs editing `app/actions/pay.ts`.** PR-C2 changes `payNow` to call `resolveJontForUser`, which keeps PR-G2 out of that file. The PR-G2 owner checks that its diff does not touch `pay.ts`.

**Two PRs taking the same migration number.** The plan reserves `00005`, `00006`, and `00007`. An owner renames its file if `main` takes a number first.

**No `control-ui` skill in this environment.** Live lanes use `.cursor/skills/verify-spaghetti-closet` instead. Lanes that sign in or change data need a disposable Supabase project.

**No live week in production.** The week-loading code is shipped, but production may have no `site_weeks` row. Dark-gate lanes build their own test row. Check production separately after the PRs land.

**Fixing product bugs inside PR-V1.** The PR-V1 owner opens a follow-up PR instead of widening the docs PR.

**Old merged branches look like open work.** They are not open work. Delete them only after the operator says yes.

## Appendix D. Links and reading list

Read these before you edit behavior code. `WORK_PLAN.md`, `lib/jont/entry.ts`, `lib/jont/resolve.ts`, `lib/week.ts`, `lib/site-access.ts`, `supabase/migrations/00003_parallel_seams.sql`, `supabase/migrations/00004_spaghetti_bucks.sql`, `.cursor/skills/verify-spaghetti-closet/SKILL.md`, and `.cursor/skills/write-specs/SKILL.md`.

PR-C2 and PR-G2 owners read `pstack/skills/how/SKILL.md` first, for the jont entry and resolve path. PR-I1 and PR-H2 owners read `pstack/skills/interrogate/SKILL.md` first, for the winner sort and the listing close. The root agent keeps a decision trail as `pstack/skills/show-me-your-work/SKILL.md` describes.

Earlier PRs mapped to tasks. PR 8 is W0, PR 9 is A2, PR 10 is A1, PR 11 is H1, PR 12 is G1, PR 13 is E1, PR 14 is D1, PR 15 is B1, PR 16 is C1, and PR 17 added the verification skills. PRs 1 through 7 are docs, copy, seed, and the work-plan draft.

The 17 leftover remote branches are `cursor/update-project-summary-831c`, `cursor/user-copped-jonts-c545`, `cursor/reset-wait-copy-c545`, `cursor/copy-tweaks-c545`, `cursor/sync-phase-docs-c545`, `cursor/hoodie-rest-of-year-becf`, `cursor/parallel-work-plan-6f5c`, `cursor/w0-seams-5248`, `cursor/load-next-week-fe8b`, `cursor/a1-week-window-220c`, `cursor/h1-list-purchase-9f3e`, `cursor/preference-form-605a`, `cursor/spaghetti-bucks-e1-774d`, `cursor/comment-votes-a2cd`, `cursor/chat-room-63cc`, `cursor/bid-page-21fd`, and `cursor/verification-skills-7dc2`.

## Appendix E. Terms

**Trunk.** The `main` branch. Lane 1 of each PR compares the PR against it.

**Seam.** A placeholder an earlier task left on purpose, such as a component that returns nothing, so a later task can fill it without editing shared files.

**Database function.** A named routine stored in Supabase that the app calls. The code calls these RPCs. `bless_spaghetti` is one.

**Elevated rights.** The `security definer` setting. The function runs with its owner's permissions, so it can read or write rows the caller cannot. Use it only for a small, checked job.

**Lazy close.** A listing closes the first time anyone loads it after its week ends. No scheduled job runs.

**Stack.** A chain of PRs where each one targets the branch of the PR before it.

**Patch-id.** A fingerprint of a PR's changes. If it is the same after a rebase, the earlier test results still apply.

**Swarm and lane.** A swarm is a group of agents that check one PR at the same time. Each agent runs one lane, which is one scenario with a screenshot and a pass rule.

**Review gate.** A pause where the operator looks at screenshots and a video before a PR merges.

**Ready to merge.** The PR passed its verdict and the root agent stopped. The operator decides when it lands.
