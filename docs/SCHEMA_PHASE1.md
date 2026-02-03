# Phase 1 Schema Outline

## Overview

- **Auth:** Supabase Auth owns `auth.users` (email + password). We don’t create that table; it’s built-in.
- **profiles:** One row per user; links auth to our app. Holds the **handle** (“user id”) and email for display.
- **jonts:** One row per calendar day (US East Coast); the “jont of the day” for that date.
- **waitlist_emails:** Emails collected when the site is “dark” (“lmk when we back up”).
- **purchases (optional):** Records when a user “buys” a jont (dummy pay); useful for “you copped it” and Phase 2.

---

## Tables

### 1. `profiles`

| Column      | Type      | Constraints | Notes |
|------------|-----------|-------------|--------|
| id         | uuid      | PK, FK → auth.users(id) | Same as `auth.users.id`. |
| user_id    | text      | UNIQUE NOT NULL | Handle (“user id”) for chat and profile. |
| email      | text      | NOT NULL    | Duplicated from auth for display; must match auth.users. |
| created_at | timestamptz | DEFAULT now() | |

- One profile per auth user. **Migration `00002_profile_on_auth_signup.sql`** adds a trigger on `auth.users` so a profile row is created automatically on signup (with a placeholder `user_id`); the app then sets the chosen handle on `/signup/complete`. Optionally, the app can create the profile in the same request using a Secret/service_role key.
- RLS: users can read/update their own row (by `auth.uid() = id`).

### 2. `jonts`

| Column       | Type        | Constraints | Notes |
|--------------|-------------|-------------|--------|
| id           | uuid        | PK, DEFAULT gen_random_uuid() | |
| date         | date        | UNIQUE NOT NULL | Day (US East Coast); one jont per day. |
| title        | text        |             | e.g. “this that hoodie tho”. |
| description  | text        |             | e.g. “that size L jaunt”. |
| image_url    | text        |             | Path or URL to image (e.g. /hoodie.png). |
| price_cents  | integer     |             | e.g. 2000 = $20. |
| created_at   | timestamptz | DEFAULT now() | |

- “Jont of the day” = row where `date` = today in America/New_York.
- RLS: allow read for all (or for authenticated); restrict insert/update/delete to service or admin if needed later.

### 3. `waitlist_emails`

| Column     | Type        | Constraints | Notes |
|------------|-------------|-------------|--------|
| id         | uuid        | PK, DEFAULT gen_random_uuid() | |
| email      | text        | NOT NULL    | |
| created_at | timestamptz | DEFAULT now() | |

- RLS: allow insert for anonymous or all; restrict read/update/delete to service or admin.

### 4. `purchases` (optional for Phase 1)

| Column     | Type        | Constraints | Notes |
|------------|-------------|-------------|--------|
| id         | uuid        | PK, DEFAULT gen_random_uuid() | |
| user_id    | uuid        | FK → auth.users(id) NOT NULL | Buyer. |
| jont_id    | uuid        | FK → jonts(id) NOT NULL | |
| created_at | timestamptz | DEFAULT now() | |

- One row per “pay now” (dummy). Use for “you copped it” on user info and Phase 2 “who copped the jont”.
- RLS: user can read own rows; insert only for authenticated user (themselves).

---

## How to apply

**Option A – SQL Editor (no CLI)**  
1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.  
2. Paste the contents of `supabase/migrations/00001_phase1_schema.sql`.  
3. Run the query. Tables and RLS policies will be created.

**Option B – Supabase CLI**  
1. Install CLI: `npm i -g supabase` (or see [Supabase CLI](https://supabase.com/docs/guides/cli)).  
2. From project root: `supabase login`, then `supabase link --project-ref <project-id>` (project ID = from dashboard URL).  
3. Apply: `supabase db push`. This applies all files in `supabase/migrations/` (including `00001_phase1_schema.sql` and `00002_profile_on_auth_signup.sql`).

After applying, seed jonts via Dashboard → Table Editor → `jonts` → Insert row (or run a seed SQL). Use **date** = today in US East Coast for “jont of the day”.
