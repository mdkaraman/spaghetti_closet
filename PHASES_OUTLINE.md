# Phases Outline

Use this file with **PROJECT_SUMMARY.md** to pick up work: summary = what’s built and tech choices; this file = Phase 1 checklist and detailed next steps (Supabase, auth, pages). Complete Phase 1 by working through the unchecked items and “Phase 1 – Next steps (detailed)” below.

---

## Phase 1: 1 jont a day

- [x] login page
- [x] wtf is this page
  - [x] has brief description of the site and a link to the login page (intro text + "click here to blow" → signup)
- [x] user sign up page
  - [x] has field for email address, user id, passcode, and confirm passcode; submit button ("send it")
- [ ] user info page
- [x] "jont of the day" page w/ link to buy
- [ ] dummy payments page
- [ ] leave email address page
  - [ ] italic text: "I never meant to hurt you I never meant to make you cry But tonight I'm cleanin' out my closet (Ha)"
  - [ ] "lmk when we back up" with a field to leave email address
- [ ] high level
  - [ ] user can login, see "jont of the day", buy it, see user info page
  - [ ] 1 jont per day (day = US East Coast time)
  - [ ] jonts for the week are loaded on the backend ahead of time (one week of jonts at a time)
  - [ ] trial this one week at a time; site goes live for a week then goes dark and has page to leave email to be notified when next week starts
  - [ ] authentication and database storage for users and jonts

### Phase 1 – Next steps (detailed)

**Supabase (DB + Auth in one place)**

- [ ] Create Supabase project at supabase.com; get project URL and anon key. Add to `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Add same vars to Vercel project Environment Variables.
- [ ] Install `@supabase/supabase-js` and (for Server Components / Server Actions) `@supabase/ssr`; create Supabase client helpers for browser and server (see Supabase Next.js docs).
- [ ] Schema in Supabase (SQL editor or migrations):
  - **Auth:** Supabase Auth handles `auth.users` (email + password). Email is required for sign up, password recovery, and communication.
  - **profiles:** id (uuid/pk, same as `auth.users.id`), user_id (unique, text) — the **handle** (“user id”) for chat and profile; email (text, for display); created_at. Create one profile row per user on signup (in app after signUp, or DB trigger).
  - **jonts:** id (uuid/pk), date (date, unique per day), title, description, image_url, price_cents, created_at. Load a week ahead.
  - Optional: **waitlist_emails** (id, email, created_at) for “lmk when we back up”.
- [ ] Seed or manual inserts for test jonts (e.g. one row per day for the current week).
- [ ] Phase 2 chat can use **Supabase Realtime** (same project, no extra provider).

**Auth flow (same UI as now; Supabase under the hood)**

- [ ] **Sign up (current form: user id, email, passcode, confirm):** Server Action (or API route) that (1) checks handle (`user_id`) and email are unique in `profiles` / auth, (2) `supabase.auth.signUp({ email, password })`, (3) insert into `profiles` (auth_user_id from signUp response, user_id = handle, email). Same form fields; user still submits “user id” + email + passcode. Redirect to `/jont` (or sign in and redirect).
- [ ] **Login (current form: user id + passcode):** Server Action that (1) lookup `profiles` by `user_id` (handle) → get email, (2) `supabase.auth.signInWithPassword({ email, password })`. User still types handle and passcode; app resolves handle → email and calls Supabase. Redirect to `/jont` on success.
- [ ] **Session:** Use Supabase `getUser()` / `getSession()` in Server Components or middleware to protect routes; redirect to `/` if not logged in on `/jont` and `/user`.
- [ ] **Password recovery:** Supabase built-in (e.g. “forgot password” link that calls `supabase.auth.resetPasswordForEmail(email)`); user id (handle) can be shown after they enter email, or they enter email only for recovery.

**Dummy payments page**

- [ ] Add page at `/pay`: simple “pay now” button (no Stripe). On submit, e.g. show “thanks” or redirect to `/user`. No real charge; just completes the “buy” flow for Phase 1.

**User info page**

- [ ] Add page at `/user`: show logged-in user’s info (user id, email). Require session; redirect to `/` if not logged in. Link back to jont (e.g. “back to the jont” or “my ish” already links here from jont page).

**Leave email address page**

- [ ] Add page (e.g. `/waitlist` or show when site is “dark”): italic text “I never meant to hurt you I never meant to make you cry But tonight I'm cleanin' out my closet (Ha)”, then “lmk when we back up” and a form (email field + submit). On submit, insert email into `waitlist_emails` (or similar table); show confirmation.

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
