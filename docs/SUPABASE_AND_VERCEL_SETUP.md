# Supabase & Vercel setup (Phase 1)

This doc explains **what** to configure in Supabase and Vercel, **where** to do it, and **why** each step matters so the app works locally and in production.

---

## Supabase

Supabase is your database and auth provider. The app talks to it using a **project URL** and a **publishable/anon key**. Some features (like password reset) also depend on **redirect URLs** and **site URL** so Supabase knows where to send users.

### 1. Create a project and get URL + API keys

**Where:** [supabase.com/dashboard](https://supabase.com/dashboard) → New project → pick org, name, password, region.

**What:** After the project is created, go to **Project Settings** (gear) → **API**. You’ll see:

- **Project URL** (e.g. `https://xxxxx.supabase.co`)
- **API keys** — Supabase is rolling out [new key types](https://github.com/orgs/supabase/discussions/29260):
  - **Publishable key** (`sb_publishable_...`) or legacy **anon** key — safe to use in the browser; use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - **Secret key** (`sb_secret_...`) or legacy **service_role** key — backend only, bypasses RLS; use for server-only operations if you need them (see below).

**Why:** The app needs the URL and a publishable/anon key to call Supabase from the client and from Next.js. Without them, `createClient()` would throw and nothing would load.

**Local:** Put them in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

**Signup and the Secret key:** Signup works **without** a Secret/service_role key. The app uses a database trigger (migration `00002_profile_on_auth_signup.sql`) that creates a profile row when a user signs up; the app then sets the chosen handle on the next request. If you do have a **Secret key** (or legacy service_role key), you can set it so the profile is created in the same request (optional):

```env
SUPABASE_SERVICE_ROLE_KEY=your-secret-or-service-role-key
```

or the new env name:

```env
SUPABASE_SECRET_KEY=your-secret-key
```

**Never** expose the Secret/service_role key to the client or commit it. Use the same values in Vercel (see below) so production uses the same project.

---

### 2. Apply the schema (tables + RLS + trigger)

**Where:** Dashboard → **SQL Editor**, or CLI: `supabase link` then `supabase db push`.

**What:** Run the migrations in order:

1. **`supabase/migrations/00001_phase1_schema.sql`** — creates:
   - `profiles` (user id handle, email; one row per auth user)
   - `jonts` (one row per calendar day; “jont of the day”)
   - `waitlist_emails` (emails from the waitlist page)
   - `purchases` (who bought which jont)
   - RLS policies so users only see their own data where required.

2. **`supabase/migrations/00002_profile_on_auth_signup.sql`** — creates a trigger so that when a new user is created in Auth, a row is automatically inserted into `profiles`. The app then sets the chosen handle on the next request (no Secret key required for signup).

**Why:** The app assumes these tables, policies, and trigger exist. If they don’t, signup, login, jont of the day, pay, and waitlist will fail or return nothing.

---

### 3. Seed `jonts` (and optionally `waitlist_emails`)

**Where:** Dashboard → **Table Editor** → `jonts` → Import from CSV (or Insert row).

**What:** Add rows to `jonts` so there is at least one row whose **date** is “today” in **US East Coast** time. The app uses `America/New_York` for “today” (see `lib/date.ts`). Example: if today is 2025-02-03 in New York, you need a row with `date = 2025-02-03`. You can use `supabase/seed/jonts.csv` as a template; adjust the `date` column so one row matches today (or the day you’re testing).

**Why:** The jont page calls `getJontOfTheDay()`, which does `SELECT ... WHERE date = todayEastCoast()`. If no row has that date, the page shows “No jont today.” Seeding a row for today (and maybe a few days around it) makes the “jont of the day” block show real content.

---

### 4. Redirect URLs (for password reset and auth callbacks)

**Where:** Dashboard → **Authentication** → **URL Configuration**.

**What:** Add the URLs where your app is allowed to receive auth redirects:

- **Site URL:** The main origin of your app, e.g. `https://your-app.vercel.app` or `https://spaghetticloset.com`. Supabase uses this as the default redirect target and in emails (e.g. “back to app” links).
- **Redirect URLs:** Add every URL that Supabase may redirect to after an action:
  - Local: `http://localhost:3000`
  - Local auth callback: `http://localhost:3000/auth/callback`
  - Production: `https://your-app.vercel.app` and `https://your-app.vercel.app/auth/callback`
  - If you use a custom domain: `https://spaghetticloset.com` and `https://spaghetticloset.com/auth/callback`

**Why:** When a user clicks “forgot passcode” and submits their email, Supabase sends an email with a link. That link goes to Supabase first, then Supabase redirects the user **back to your app** to a URL like `/auth/callback?code=...`. If that URL isn’t in **Redirect URLs**, Supabase blocks the redirect for security (to avoid sending users to a random site). So “password reset doesn’t work” or “redirect fails” usually means the callback URL wasn’t allowed here.

---

### 5. (Optional) Email confirmation

**Where:** Dashboard → **Authentication** → **Providers** → **Email**.

**What:** **Confirm email** can be on or off.

- **On:** After signup, the user must click a link in their email before they’re fully “signed in”; until then they might not have a session when they land on `/jont`.
- **Off:** Signup immediately creates a session and redirect to `/jont` works without clicking an email link.

**Why:** For a quick trial or local dev, turning it off avoids dealing with email delivery. For production you may want it on and configure SMTP (or use Supabase’s default) so only real emails can verify.

---

## Vercel

Vercel runs your Next.js app in production. It needs the **same** Supabase URL and anon key so the deployed app talks to the same Supabase project. It can also need a **site URL** env var if you use password reset or other redirects.

### 1. Environment variables

**Where:** [vercel.com](https://vercel.com) → your project → **Settings** → **Environment Variables**.

**What:** Add:

| Name                         | Value                    | Environments   |
|-----------------------------|--------------------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL`  | Your Supabase project URL | Production, Preview (optional) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable or anon key   | Production, Preview (optional) |
| `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` | Secret key (optional; signup works without it via trigger) | Production (optional) |
| `NEXT_PUBLIC_SITE_URL`      | `https://your-app.vercel.app` or your custom domain | Production (optional) |

Use the **exact same** URL and publishable/anon key as in `.env.local` so production and local use the same database and auth.

**Why:**

- **URL + anon/publishable key:** The server and client code both read these (via `process.env`). If they’re missing or wrong in Vercel, every Supabase call in production fails (login, signup, jont of the day, pay, waitlist).
- **Secret key:** Optional. Signup works without it (trigger creates the profile; app sets the handle on `/signup/complete`). Set it only if you want profile creation in the same request or for other server-only operations.
- **NEXT_PUBLIC_SITE_URL:** The “forgot passcode” flow calls `resetPasswordForEmail(email, { redirectTo: `${base}/auth/callback?next=/reset-password` })`. If `NEXT_PUBLIC_SITE_URL` is set in Vercel, `base` is your real production URL so the link in the email sends users to your live app. If you don’t set it, the code falls back to `http://localhost:3000`, so the reset link would point at localhost and break for production users.

---

### 2. Redeploy after changing env vars

**Where:** Vercel dashboard → **Deployments** → … on latest deployment → **Redeploy**, or push a new commit.

**What:** Trigger a new build and run so the new environment variables are baked into the build/runtime.

**Why:** Env vars are read at build/start. Changing them in the dashboard doesn’t change an already-running deployment until you redeploy.

---

## Quick checklist

- **Supabase:** Project created → URL + publishable/anon key in `.env.local` (and Vercel). **Both** migrations run (schema + profile-on-signup trigger). `jonts` seeded with at least one row for “today” (US East). Redirect URLs include `https://your-domain/auth/callback` (and localhost for local testing). Optionally adjust email confirmation.
- **Vercel:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set; optionally `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` and `NEXT_PUBLIC_SITE_URL`. Redeploy after changing env vars.

Once this is done, the app can sign up, log in, show the jont of the day, record a dummy pay, show the user page, collect waitlist emails, and do password reset in production.
