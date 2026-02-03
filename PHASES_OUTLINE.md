# Phases Outline

Use this file with **PROJECT_SUMMARY.md** to pick up work: summary = what’s built and tech choices; this file = Phase 1 checklist and detailed next steps (Supabase, auth, pages). Complete Phase 1 by working through the unchecked items and “Phase 1 – Next steps (detailed)” below.

---

## Phase 1: 1 jont a day

- [x] login page
- [x] wtf is this page
  - [x] has brief description of the site and a link to the login page (intro text + "click here to blow" → signup)
- [x] user sign up page
  - [x] has field for email address, user id, passcode, and confirm passcode; submit button ("send it")
- [x] user info page
- [x] "jont of the day" page w/ link to buy
- [x] dummy payments page
- [x] leave email address page
  - [x] italic text: "I never meant to hurt you I never meant to make you cry But tonight I'm cleanin' out my closet (Ha)"
  - [x] "lmk when we back up" with a field to leave email address
- [ ] high level
  - [ ] user can login, see "jont of the day", buy it, see user info page
  - [ ] 1 jont per day (day = US East Coast time)
  - [ ] jonts for the week are loaded on the backend ahead of time (one week of jonts at a time)
  - [ ] trial this one week at a time; site goes live for a week then goes dark and has page to leave email to be notified when next week starts
  - [ ] authentication and database storage for users and jonts

### Phase 1 – Next steps (detailed)

**Supabase (DB + Auth in one place)**

- [x] Create Supabase project at supabase.com; get project URL and anon key. Add to `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Add same vars to Vercel project Environment Variables.
- [x] Install `@supabase/supabase-js` and `@supabase/ssr`; create Supabase client helpers in `lib/supabase/client.ts` and `lib/supabase/server.ts`.
- [x] Schema in Supabase: run `supabase/migrations/00001_phase1_schema.sql` in SQL Editor (or `supabase db push`). Tables: **profiles**, **jonts**, **waitlist_emails**, **purchases** (see `docs/SCHEMA_PHASE1.md`).
- [x] Seed: jonts and waitlist_emails tables populated (e.g. from `supabase/seed/*.csv` in Table Editor).
- [ ] Phase 2 chat can use **Supabase Realtime** (same project, no extra provider).

**Auth flow (same UI as now; Supabase under the hood)**

- [x] **Wire signup page to create user in DB:** Signup form submits to a Server Action that (1) validates passcode vs confirm match, (2) checks handle (`user_id`) and email are not already taken (query `profiles` or auth), (3) `supabase.auth.signUp({ email, password })`, (4) insert into `profiles` (id = auth user id from signUp response, user_id = handle, email). Then sign in and redirect to `/jont`. Keep current form fields (user id, email, passcode, confirm); no UI change.
- [x] **Wire login (home page) to Supabase:** Server Action that (1) lookup `profiles` by `user_id` (handle) → get email, (2) `supabase.auth.signInWithPassword({ email, password })`. User still types handle and passcode; app resolves handle → email. Redirect to `/jont` on success.
- [x] **Session:** Use Supabase `getUser()` / `getSession()` in Server Components or middleware to protect routes; redirect to `/` if not logged in on `/jont` and `/user`.
- [x] **Password recovery:** Supabase built-in (e.g. “forgot password” link that calls `supabase.auth.resetPasswordForEmail(email)`); user id (handle) can be shown after they enter email, or they enter email only for recovery.

**Dummy payments page**

- [x] Add page at `/pay`: simple “pay now” button (no Stripe). On submit, e.g. show “thanks” or redirect to `/user`. No real charge; just completes the “buy” flow for Phase 1.

**User info page**

- [x] Add page at `/user`: show logged-in user’s info (user id, email). Require session; redirect to `/` if not logged in. Link back to jont (e.g. “back to the jont” or “my ish” already links here from jont page).

**Leave email address page**

- [x] Add page (e.g. `/waitlist` or show when site is “dark”): italic text “I never meant to hurt you I never meant to make you cry But tonight I'm cleanin' out my closet (Ha)”, then “lmk when we back up” and a form (email field + submit). On submit, insert email into `waitlist_emails` (or similar table); show confirmation.

**Flow and backend logic**

- [ ] “Jont of the day”: API or Server Component that selects the jont where `date` = today (US East Coast). Use `Intl` or a small helper with `America/New_York` for “today”.
- [ ] After “pay now” on dummy pay page: optionally record a “purchase” in DB (e.g. `purchases`: profile_id or auth user id, jont_id, created_at) so we can show “you copped it” on user info later; or skip until Phase 2 and just redirect.

## Phase 2: The Chat

- [ ] if item has not been bought, "jont of the day" page still links to payment page
- [ ] if item has already been bought, "jont of the day" links to similar page with chat at the bottom and shows who copped the jont; chat for people to hang out

## Phase 3: Bidding

- [ ] bid only: replaces buy-now (no buy-now option from Phase 1/2)
- [ ] "jont of the day" page links to a page with bidding field and a submit button
- [ ] once bid is entered, user lands in the chat with the other bidders

## Phase 4: Up/Down Vote comments

- [ ] comments in The Chat can be up/down voted

## Phase 5: Spaghetti Bucks

- [ ] when a comment is up/down voted, the user earns or loses spaghetti bucks (1:1 ratio for up/down votes)
- [ ] if there are multiple bidders with same bid, the user with the most spaghetti bucks wins
  - [ ] if spaghetti bucks are tied, the user who entered the bid first wins
- [ ] user info page shows spaghetti bucks balance

## Phase 6: Blessing Spaghetti Bucks

- [ ] Spaghetti Bucks can be blessed (aka gifted) to other users
- [ ] user info page shows spaghetti bucks balance and a list of users who have blessed you with spaghetti bucks

## Phase 7: Preferences and multiple jonts per day

- [ ] user can select what they are interested in
  - [ ] size
  - [ ] type of jont (e.g. shirt, pants, shoes, etc.)
- [ ] when a user selects preferences, they are shown jonts that match their preferences
- [ ] still one jont per day; backend filters jonts to match user preferences

## Phase 8: Users can sell jonts

- [ ] users can put their jonts up for sale
