# Work plan

Tracker for the work still open in **PHASES_OUTLINE.md**. Phase 1’s pages, auth, daily jont, dummy pay, and waitlist form are already built (**PROJECT_SUMMARY.md**). This file splits what is left into tasks agents can run at the same time, and it is the status board.

The phase list is not one parallel batch. Chat, bids, votes, and Spaghetti Bucks share pages and depend on each other. The cuts below are the slices that can move together without editing the same files.

## How to use this file

1. Claim the lowest task whose **Needs** are all `done`. A task whose needs are still open stays put.
2. Set **Status** to `in progress` and **Claimed by** to your branch. Only one agent per task.
3. Stay inside **Owns**. When you finish, check the **Done when** boxes and set **Status** to `done`.
4. Edit only your task’s Status, Claimed by, and Done when boxes. Leave every other section alone so two agents can update this file without a messy merge. A blocked task may append one line to the log.
5. One task per branch. `npm run build` (tests, then Next.js) before every commit. New behavior gets Vitest + React Testing Library coverage, colocated with the code (see `.cursor/skills/write-specs`). Async Server Components are not what the component tests render: test pure functions, presentational components, and Server Actions with `@/lib/supabase/server` and `next/navigation` mocked.
6. Product checklist boxes in **PHASES_OUTLINE.md** stay as they are until **V1**.

**Status** is `todo`, `in progress`, or `done`.

## Rules

- `jonts.date` stays unique through every task except **G2**. Chat, bids, votes, and purchases key off `jont_id`.
- The jont page keeps the pay link (`i will have it!` → `/pay`) until **C2**.
- Spaghetti Bucks are an append-only ledger. There is no balance column. Balance is the sum of `delta`.
- Vote bucks and gifts are written only by the RPCs in the contract. A task that needs them calls the RPC. It does not insert ledger rows from a Server Action.
- `/user` grows by adding a section component. `app/user/page.tsx` is composed in **W0** and left alone after that.
- Chat (`/chat`) and bid (`/bid`) read the `jont` query param (the jont uuid). They do not call `getJontOfTheDay`.
- New CSS goes in a file next to the component that imports it. `app/globals.css` stays as it is. Reuse `jont-link`, `jont-page`, `user-page`, and `user-heading` where they already fit.
- Copy stays short and lowercase, in line with the current pages.
- A later migration is a new file under `supabase/migrations/`. Do not edit `00001`, `00002`, or another task’s migration. Name it with the next free prefix on main at the moment you branch, and rebase the name if main takes that prefix before you merge. A later migration must apply on top of `00003_parallel_seams.sql` alone.
- `lib/date.ts` (`todayEastCoast`) and `lib/jont.ts` (`getJontOfTheDay`) stay as they are. Call them. Do not reimplement East Coast dates.

## Contracts

W0 lands these. Later tasks fill behavior inside them.

### Entry

`lib/jont/entry.ts` exports `JONT_ENTRY_MODE` (`'buy' | 'bid'`, starting at `'buy'`) and:

```ts
jontEntry({ mode, hasPurchase }): 'pay' | 'bid' | 'chat'
```

`hasPurchase` means someone has a `purchases` row for this jont. In `buy` mode, a purchase returns `'chat'` and no purchase returns `'pay'`. In `bid` mode, the result is `'bid'`.

Links, built in W0:

| Result | Href | Label |
|---|---|---|
| pay | `/pay` | `i will have it!` |
| bid | `/bid?jont=<id>` | `i will have it!` |
| chat | `/chat?jont=<id>` | `pull up` |

### Site window

**A1** implements this. **W0** only exports `getSiteWindow` and `siteStatus` so they return `live`.

`lib/week.ts` exports `getSiteWindow(supabase)` and a pure `siteStatus(rows, today)`:

- No `site_weeks` rows → `live`. Shipping the table does not take the site down.
- A row with `starts_on <= today < ends_on` and `status = 'live'` → `live`.
- A covering row with `status = 'dark'` → `dark`.
- Rows exist and none cover today → `dark`. The day after `ends_on` the site is dark without a cron.
- `ends_on` is exclusive. A week that starts 2026-11-02 is seven days when `ends_on` is 2026-11-09.

`lib/site-access.ts` exports `darkAllows(pathname)`. While the window is dark, those paths still load: `/`, `/wtf-is-this`, `/signup`, `/signup/complete`, `/forgot-password`, `/reset-password`, `/reset-password/expired`, `/auth/callback`, `/waitlist`. Everything else redirects to `/waitlist`. While the window is live, this redirect does not run. `/waitlist` stays a real page during a live week.

`today` is `todayEastCoast()`.

### Chat shell

`/chat?jont=<uuid>` is an authenticated page. `app/chat/ChatRoom.tsx` (W0) renders these slots, in order, and is not edited again:

1. `WinnerSlot`
2. `CoppedList`
3. `BidderList`
4. `CommentList`, which renders `CommentVotes` as `<CommentVotes commentId={id} />`

Stub slots return `null`. Props of `CommentVotes` stay `{ commentId: string }`.

### Bucks RPCs

Granted to `authenticated`. W0 creates them so they raise `not implemented`. **E1** replaces the bodies.

- `cast_comment_vote(comment_id uuid, value smallint)` — `value` is `-1` or `1`. Upsert the caller’s `comment_votes` row. `delta = new value - old value`, and the old value is `0` when the caller had no row. Skip the ledger insert when `delta` is `0`. Otherwise insert one ledger row for `auth.uid()` with that delta, reason `vote_up` when delta is positive and `vote_down` when it is negative, `ref_id = comment_id`.
- `bless_spaghetti(recipient_handle text, amount integer)` — amount is a whole number of bucks, at least `1`. Resolve the handle through `profile_handles`. Reject a missing handle, a gift to yourself, and an amount greater than the giver’s balance. In one transaction insert the `blessings` row, a negative `blessing_out` ledger row for the giver, and a positive `blessing_in` ledger row for the recipient. `ref_id` is the blessing id.
- `my_spaghetti_bucks()` — returns the caller’s balance as an integer. `0` when they have no rows.

Clients have no insert/update/delete policy on `spaghetti_bucks_ledger` or `blessings`. `cast_comment_vote` is the only writer of vote reasons. `bless_spaghetti` is the only writer of blessing reasons.

Pure helpers in `lib/bucks.ts` (E1), which the SQL follows:

- `voteDelta(oldValue, newValue)` with old in `-1 | 0 | 1` and new in `-1 | 1`
- `canBless(balance, amount)`

### Winner

`lib/bids/winner.ts` exports `pickWinner(bids, balanceOf)`.

Each bid is `{ userId, amountCents, createdAt }`. Sort by `amountCents` descending, then balance descending, then `createdAt` ascending, then `userId` ascending. The first row wins. No bids returns `null`. The `userId` key only keeps the result stable when the other three match.

During the jont’s East Coast date, the slot shows the high bid. After that date, the same person is the winner. Listing bids use the same sort. A listing stays open through the live week that contains its `created_at`, and the first read after that week has ended closes it (lazy close, no cron).

### Preferences

Profile columns `size` and `jont_type` are optional text. The form’s sizes are `S`, `M`, `L`, `XL`. Types are `shirt`, `pants`, `shoes`, `other`. Empty means no preference.

**G2** adds `jonts.size` and `jonts.jont_type`, then drops the unique constraint on `jonts.date`. A jont matches when the user’s size is empty or the jont’s size is null or they are equal, and the same for type. Among today’s matches, pick the earliest `created_at`, then `id`. A null size or type on a jont matches any preference, so a week loaded before G2 still resolves. No row for today keeps the current empty copy (`ain’t got naaaan for ya…. maybe later doe`).

`lib/jont/resolve.ts` is the only place that chooses the daily jont. W0 makes it call `getJontOfTheDay`. The jont page, and any remaining pay redirect, call `resolveJontForUser`.

### Selling

A listing is the seller’s own `purchases` row put up for bid. Bids use the same `bids` table with `listing_id` set and `jont_id` null. The seller does not bid on their own listing. Lazy close writes a `purchases` row for the winner (`on conflict do nothing` so a repeat close is safe) and sets the listing `closed`. The seller’s original purchase stays.

### Schema in `00003_parallel_seams.sql`

W0 adds this file. Enable RLS on every new table.

**`site_weeks`** — `id uuid pk`, `starts_on date not null`, `ends_on date not null`, `status text not null check (status in ('live','dark'))`, `check (ends_on > starts_on)`. Select for anyone. No client write policy (the SQL editor, which bypasses RLS, is how a week is inserted).

**`comments`** — `id uuid pk`, `jont_id uuid not null references jonts`, `user_id uuid not null references auth.users`, `body text not null`, `created_at timestamptz not null default now()`. Authenticated select. Insert where `auth.uid() = user_id`. Body is trimmed, rejected when empty, and capped at 500 characters (enforce in the Server Action). Add the table to the `supabase_realtime` publication.

**`listings`** — `id uuid pk`, `seller_id uuid not null references auth.users`, `jont_id uuid not null references jonts`, `purchase_id uuid not null references purchases`, `status text not null default 'open' check (status in ('open','closed'))`, `created_at timestamptz not null default now()`, unique `purchase_id`. Authenticated select. Insert where `auth.uid() = seller_id` and that user owns the purchase and the purchase’s `jont_id` matches.

**`bids`** — `id uuid pk`, `jont_id uuid null references jonts`, `listing_id uuid null references listings`, `user_id uuid not null references auth.users`, `amount_cents integer not null check (amount_cents >= 100)`, `created_at timestamptz not null default now()`, check that exactly one of `jont_id` and `listing_id` is set, unique `(jont_id, user_id)`, unique `(listing_id, user_id)`. Authenticated select. Insert and update own row. A before-update trigger keeps `created_at`, `user_id`, `jont_id`, and `listing_id` on the existing values so a later amount change does not rewrite who bid first. The form takes whole dollars and stores cents. Minimum is $1.

**`comment_votes`** — `comment_id uuid references comments`, `user_id uuid references auth.users`, `value smallint not null check (value in (-1, 1))`, primary key `(comment_id, user_id)`. Authenticated select. No client insert/update policy (the vote RPC writes them).

**`spaghetti_bucks_ledger`** — `id uuid pk`, `user_id uuid not null references auth.users`, `delta integer not null check (delta <> 0)`, `reason text not null check (reason in ('vote_up','vote_down','blessing_in','blessing_out'))`, `ref_id uuid not null`, `created_at timestamptz not null default now()`. Authenticated select own rows. No client write policy.

**`blessings`** — `id uuid pk`, `from_user uuid not null references auth.users`, `to_user uuid not null references auth.users`, `amount integer not null check (amount > 0)`, `created_at timestamptz not null default now()`, `check (from_user <> to_user)`. Authenticated select where the caller is `from_user` or `to_user`. No client write policy.

**`profiles`** — add nullable `size text` and `jont_type text`. The existing own-row update policy is enough.

**`profile_handles`** — view of `profiles.id` and `profiles.user_id` with `security_invoker = false`, select granted to `authenticated` and revoked from `anon` and `public`. Chat, bids, and blessings resolve handles through this view. Do not add a public select policy on `profiles`; that would expose email.

**`purchases`** — add an authenticated select policy so a logged-in user can read purchases for a jont (who copped it). The existing own-row insert policy stays.

Also create the three RPCs as stubs that raise `not implemented`.

### Files reserved after W0

| File | Later editor |
|---|---|
| `lib/jont/entry.ts` (`JONT_ENTRY_MODE` only) | C2 |
| `app/jont/JontCta.tsx` | C2, and only if the mode constant is not enough |
| `app/jont/__tests__/page.test.tsx` | C2 |
| `app/actions/pay.ts` | C2, then G2 |
| `lib/jont/resolve.ts` | G2 |
| `app/user/page.tsx` | none |
| `app/chat/ChatRoom.tsx` | none |
| `middleware.ts` | none |
| `lib/supabase/middleware.ts` | none |
| `app/globals.css` | none |
| `PHASES_OUTLINE.md`, `PROJECT_SUMMARY.md` | V1 |

## Waves

**Needs** is the real gate. Tasks in a wave share a start line and do not share files.

| Task | Starts after | Runs beside |
|---|---|---|
| W0 | — | nobody |
| A1, A2, B1, C1, D1, E1, G1, H1 | W0 | each other |
| C2 | B1, C1 | F1, I1 |
| F1 | E1 | C2, I1 |
| I1 | C1, E1 | C2, F1 |
| G2 | G1, A2, B1, C1, C2 | H2 |
| H2 | H1, A1, C1, I1 | G2 |
| V1 | every other task | nobody |

```
W0
 ├─ A1 ────────────────────────────┐
 ├─ A2 ──────────────┐             │
 ├─ B1 ──┐           │             │
 ├─ C1 ──┼─ C2 ──┐   │             │
 │       │       ├── G2            │
 ├─ G1 ──┘       │                 ├─ V1
 ├─ D1           │                 │
 ├─ E1 ──┬─ F1   │                 │
 │       └─ I1 ──┼─ H2 ────────────┘
 └─ H1 ──────────┘
```

## Tasks

### W0 — Seams

Status: todo
Claimed by:

Needs: nothing. One agent. Everyone else waits for this.

Owns: `supabase/migrations/00003_parallel_seams.sql`, `lib/jont/entry.ts`, `lib/jont/resolve.ts`, `lib/week.ts`, `lib/site-access.ts`, `lib/bucks.ts` (empty module is fine), `lib/bids/winner.ts` (empty module is fine), `lib/supabase/middleware.ts`, `middleware.ts`, `app/jont/page.tsx`, `app/jont/JontPageContent.tsx`, `app/jont/JontCta.tsx`, `app/user/page.tsx`, `app/user/CoppedSection.tsx`, `app/user/BucksSection.tsx`, `app/user/BlessingsSection.tsx`, `app/user/PreferencesSection.tsx`, `app/user/SellSection.tsx`, `app/user/__tests__/page.test.tsx`, `app/chat/page.tsx`, `app/chat/ChatRoom.tsx`, `app/chat/CoppedList.tsx`, `app/chat/BidderList.tsx`, `app/chat/WinnerSlot.tsx`, `app/chat/CommentList.tsx`, `app/chat/CommentVotes.tsx`, plus tests for `jontEntry`, `siteStatus`’s stub behavior, and `darkAllows`.

Behavior stays the Phase 1 site. `JONT_ENTRY_MODE` is `'buy'`. `resolveJontForUser` calls `getJontOfTheDay`. `getSiteWindow` returns live and does not query. `siteStatus` can be a stub that returns live; **A1** replaces it. Section components other than the existing profile and copped list return `null` and do not query. `updateSession` also returns the site window by calling `getSiteWindow` with the middleware Supabase client. When the URL or anon key is missing, the window is live. Root middleware redirects disallowed paths to `/waitlist` only when the window is dark. Protected prefixes gain `/chat`, `/bid`, and `/sell`.

The user-page test mock currently throws on an unexpected table. Change that fallback to empty data so later sections can query without another edit to that file. Keep the assertions it already has (`my ish`, purchases newest first, empty copy). Keep the purchases read as `created_at, jonts(title, date, image_url, price_cents)` for `user_id`, newest `created_at` first, whether that query stays in `page.tsx` or moves into `CoppedSection`.

The jont page test still sees `i will have it!` → `/pay` with the default props. Add a case that a purchase renders `pull up` → `/chat?jont=<id>`. Pass `hasPurchase` into the presentational component, default false, so the old tests stay valid.

Done when:

- [ ] `00003_parallel_seams.sql` matches the contract (tables, view, policies, purchase read, realtime, RPC stubs).
- [ ] Jont page still links to `/pay` in buy mode, and the chat href is covered by a test.
- [ ] User page still shows the handle, email, and copped list.
- [ ] Dark allowlist is tested, and a live stub does not redirect.
- [ ] `npm run build` passes.

### A1 — Week window

Status: done
Claimed by: cursor/a1-week-window-220c

Needs: W0

Owns: `lib/week.ts`, `lib/week/__tests__/site-status.test.ts`

Implement `siteStatus` and `getSiteWindow` per the contract. Query `site_weeks` with the client passed in. Middleware already calls this; do not edit it.

Done when:

- [x] No rows → live. Covering live row → live. Covering dark row → dark. Rows that miss today → dark. `ends_on` is exclusive.
- [x] Tests cover those four cases, including a seven-day span.
- [x] `npm run build` passes.

### A2 — Load one week

Status: todo
Claimed by:

Needs: W0

Owns: `supabase/seed/load_next_week.sql`, `supabase/seed/README.md` (one short paragraph)

Follow `supabase/seed/copy_hoodie_rest_of_year.sql`: America/New_York dates, copy the hoodie source row, `on conflict (date) do nothing`. Insert only the seven dates from today through the exclusive end, plus one `site_weeks` row (`live`) for that span when no row already overlaps it. Say in the seed README that running this file arms the dark gate: with a week row present, the site is dark outside that span. Leave `copy_hoodie_rest_of_year.sql` in place; it is a dev filler, and the week gate is what limits a trial.

Done when:

- [ ] The SQL is safe to run twice (existing dates and an overlapping week row are skipped).
- [ ] The README says how to run it and that it arms the gate.
- [ ] `npm run build` passes.

### B1 — Chat

Status: todo
Claimed by:

Needs: W0

Owns: `app/chat/CommentList.tsx`, `app/chat/CoppedList.tsx`, `app/actions/chat.ts`, `app/chat/chat.css` if needed, tests next to those files. A new migration only if realtime or the comments policies in `00003` are incomplete; do not edit `00003`.

The room loads for `/chat?jont=`. `CoppedList` reads `purchases` for that jont and handles from `profile_handles`, and shows who copped it. Empty list copy: `nobody copped it yet`. `CommentList` lists that jont’s comments, oldest first, keeps `<CommentVotes commentId={id} />` on each, and has a composer at the bottom. Empty copy: `say something`. Posting inserts a comment for the logged-in user. Subscribe to Supabase Realtime for inserts on that `jont_id`. Reject empty bodies and bodies over 500 characters.

Done when:

- [ ] A logged-in user sees copped handles and comments for the jont in the query param.
- [ ] A comment post shows up in the list (test the action and the presentational list).
- [ ] `CommentVotes` is still rendered with `commentId` only.
- [ ] The page does not call `getJontOfTheDay`.
- [ ] `npm run build` passes.

### C1 — Bid page

Status: todo
Claimed by:

Needs: W0

Owns: `app/bid/page.tsx`, `app/bid/BidForm.tsx`, `app/chat/BidderList.tsx`, `app/actions/bid.ts`, tests for those. CSS beside the bid page if needed.

`/bid?jont=` shows a whole-dollar field and a submit button. Submit upserts the caller’s bid (`amount_cents`, first `created_at` preserved) and redirects to `/chat?jont=`. `BidderList` lists handles and amounts for that jont. The jont page link stays on `/pay` (that flip is **C2**).

Done when:

- [ ] Submitting a bid stores dollars as cents, minimum $1, and redirects to that jont’s chat.
- [ ] A second submit from the same user changes the amount and keeps the original `created_at`.
- [ ] Bidder names render from `profile_handles`.
- [ ] The bid page does not call `getJontOfTheDay`.
- [ ] `npm run build` passes.

### D1 — Comment votes

Status: todo
Claimed by:

Needs: W0

Owns: `app/chat/CommentVotes.tsx`, `app/actions/vote.ts`, tests for those.

Up and down controls for one comment. They call `cast_comment_vote`. Show the current tallies (count of `1` and count of `-1`). One row per user: sending the other value switches the vote. Tests mock the RPC and assert the comment id and value. Do not write the ledger in this task.

Done when:

- [ ] The component renders up and down for a `commentId` and shows both tallies.
- [ ] The action calls `cast_comment_vote` with `1` or `-1`.
- [ ] Props stay `{ commentId: string }`.
- [ ] `npm run build` passes.

### E1 — Spaghetti Bucks

Status: todo
Claimed by:

Needs: W0

Owns: `lib/bucks.ts`, `lib/bucks/__tests__/bucks.test.ts`, `app/user/BucksSection.tsx`, and one new migration that replaces the three RPC stubs.

Implement `voteDelta` and `canBless` with tests. Replace `cast_comment_vote`, `bless_spaghetti`, and `my_spaghetti_bucks` so they match the contract, including the balance check and the single transaction on a gift. `BucksSection` shows the caller’s balance from `my_spaghetti_bucks()` as a whole number. Heading: `spaghetti bucks`.

Done when:

- [ ] `voteDelta(0, 1)` is `1`, `voteDelta(1, -1)` is `-2`, `voteDelta(-1, -1)` is `0`.
- [ ] `canBless` is false for an amount above the balance, for `0`, and for a negative amount.
- [ ] The migration’s vote and gift functions follow those rules, and a gift cannot overdraw.
- [ ] `/user` shows the balance.
- [ ] `npm run build` passes.

### G1 — Preference form

Status: todo
Claimed by:

Needs: W0

Owns: `app/user/PreferencesSection.tsx`, `app/actions/preferences.ts`, tests for those.

The section saves the logged-in user’s `size` and `jont_type` on `profiles`. Options are the contract lists, plus an empty choice. This task does not change which jont someone sees.

Done when:

- [ ] Choosing a size and a type updates the caller’s profile.
- [ ] Empty is a valid saved value.
- [ ] `npm run build` passes.

### H1 — Put a jont up for sale

Status: todo
Claimed by:

Needs: W0

Owns: `app/sell/page.tsx`, `app/user/SellSection.tsx`, `app/actions/list.ts`, tests for those.

`SellSection` links to `/sell`. `/sell` lists the caller’s purchases that are not already listed and lets them open a listing. It also lists their open and closed listings. Creating a listing inserts a `listings` row tied to that purchase. No bids on this task.

Done when:

- [ ] A user can list a purchase they own, and cannot list someone else’s.
- [ ] A purchase that already has a listing is not offered again.
- [ ] `/user` links to `/sell`.
- [ ] `npm run build` passes.

### C2 — Bid-only jont page

Status: todo
Claimed by:

Needs: B1, C1

Owns: `lib/jont/entry.ts` (the `JONT_ENTRY_MODE` constant), `app/actions/pay.ts`, `app/jont/__tests__/page.test.tsx`. `app/jont/JontCta.tsx` only if the constant does not already drive the href.

Set `JONT_ENTRY_MODE` to `'bid'`. Update the jont page test so the unsold jont links `i will have it!` to `/bid?jont=<id>`. `payNow` no longer inserts a purchase: it resolves the jont and redirects to `/bid?jont=<id>`.

Done when:

- [ ] The unsold jont CTA is the bid page.
- [ ] A purchase still links `pull up` to that jont’s chat.
- [ ] `payNow` does not write a `purchases` row.
- [ ] `npm run build` passes.

### F1 — Blessing

Status: todo
Claimed by:

Needs: E1

Owns: `app/user/BlessingsSection.tsx`, `app/actions/bless.ts`, tests for those.

A form takes a handle and a whole-number amount and calls `bless_spaghetti`. Under it, list incoming blessings (newest first): handle from `profile_handles` and amount. Heading: `blessings`. Tests mock the RPC. The balance check lives in the RPC from E1.

Done when:

- [ ] The form submits a handle and an amount to `bless_spaghetti`.
- [ ] The section lists who blessed the caller, newest first.
- [ ] A gift to yourself is rejected in the form before the RPC (empty handle and amount under `1` too).
- [ ] `npm run build` passes.

### I1 — High bid and winner

Status: todo
Claimed by:

Needs: C1, E1

Owns: `lib/bids/winner.ts`, `lib/bids/__tests__/winner.test.ts`, `app/chat/WinnerSlot.tsx`

`pickWinner` follows the contract. Tests cover a higher amount, a tie broken by balance, a remaining tie broken by earlier `createdAt`, and an empty list. `WinnerSlot` loads that jont’s bids and balances, runs `pickWinner`, and shows the handle. On the jont’s own date the label is `high bid`. After that date the label is `winner`. Reading other bidders’ balances happens in this server component (the caller can already read ledger rows for themselves; for other bidders, select is own-row only, so add a security-definer RPC `balances_for_bidders(jont_id)` in a new migration that returns balances only for users who have a bid on that jont).

Done when:

- [ ] The four `pickWinner` cases are tested.
- [ ] The slot shows `high bid` on the jont’s date and `winner` after it.
- [ ] Balances used for the tie-break are only the bidders’ balances.
- [ ] `npm run build` passes.

### G2 — One jont matched to preferences

Status: todo
Claimed by:

Needs: G1, A2, B1, C1, C2

Owns: `lib/jont/resolve.ts`, a new migration that adds `jonts.size` and `jonts.jont_type` and drops the unique constraint on `jonts.date`, `supabase/seed/load_next_week.sql`, `supabase/seed/copy_hoodie_rest_of_year.sql`, `app/actions/pay.ts` (only the jont lookup inside the redirect C2 left).

`resolveJontForUser` uses the match rule in the contract and the caller’s profile preferences. Chat and bid already receive that jont’s id, so they stay put. After the unique constraint is gone, both seed files stop using `on conflict (date)` and instead skip a date that already has a row (the default one-per-day load). `payNow`’s redirect uses `resolveJontForUser` so a leftover `/pay` request follows the same jont.

Done when:

- [ ] A user with preferences resolves to a matching jont for today when one exists.
- [ ] A jont with null size and type still matches, and no row for today still shows the empty copy.
- [ ] The two seed files are safe to run after the unique constraint is gone.
- [ ] `npm run build` passes.

### H2 — Listing bids

Status: todo
Claimed by:

Needs: H1, A1, C1, I1

Owns: `app/sell/[id]/page.tsx`, `app/actions/listing-bid.ts`, `app/actions/close-listing.ts`, tests for those, and a new migration for `close_listing_if_due(listing_id)` if the close cannot be expressed with the existing policies.

Another logged-in user can bid on an open listing (same cents rule as C1, `listing_id` set, `jont_id` null). The seller cannot bid. The listing page shows bidders and the high bid via `pickWinner`. Find the `site_weeks` row that covers the listing’s `created_at` date in America/New_York. On the first load where today is on or after that row’s `ends_on`, close the listing: status `closed`, a purchase row for the winner, and the winner shown. If no week row covers the listing date, leave it open. Closing twice does not create a second purchase.

Done when:

- [ ] A non-seller can place a bid and see the high bid.
- [ ] The seller’s own bid is rejected.
- [ ] A load after the listing’s week writes the winner’s purchase once and marks the listing closed.
- [ ] `npm run build` passes.

### V1 — Phase checklist

Status: todo
Claimed by:

Needs: A1, A2, B1, C1, C2, D1, E1, F1, G1, G2, H1, H2, I1

Owns: `PHASES_OUTLINE.md`, `PROJECT_SUMMARY.md`, and fixes that close a gap in a task above without widening it. One agent.

Walk the original phases and check the boxes that are actually true. Update the project summary’s “what’s built” and next-step lines to match.

Done when:

- [ ] Phase 1: a week of jonts can be loaded ahead, the site is live inside that window, and outside it visitors get `/waitlist` (login, signup, wtf, auth, and waitlist still load).
- [ ] Phase 2: a copped jont opens the chat and shows who copped it. People can post. Leave the outline’s “links to payment” box unchecked, and note beside it that C2 replaced that link with bidding.
- [ ] Phase 3: the jont page goes to the bid field, a bid lands in the chat, and buy-now does not write a purchase.
- [ ] Phase 4: comments can be upvoted and downvoted, one vote per user, switchable.
- [ ] Phase 5: a vote changes bucks 1:1 through `voteDelta`, equal bids go to the higher balance and then the earlier bid, and `/user` shows the balance.
- [ ] Phase 6: a user can bless bucks to a handle, the gift cannot overdraw, and `/user` lists who blessed them.
- [ ] Phase 7: size and type save on the profile, and the daily jont is the one match for today.
- [ ] Phase 8: a user can list a jont they copped, others can bid, and the week’s end records the winner.
- [ ] `npm run build` passes.

## Log

Agents: append a line here only when you had to stop because a contract is wrong. One line, task id, what blocked you. Do not rewrite the task to route around it.
