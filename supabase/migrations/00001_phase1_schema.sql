-- Phase 1 schema: profiles, jonts, waitlist_emails, purchases
-- Run in Supabase SQL Editor, or via: supabase db push (after supabase link)

-- 1. profiles: one row per auth user; id = auth.users.id, user_id = handle
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id text not null unique,
  email text not null,
  created_at timestamptz not null default now()
);

-- RLS: users can read/update their own profile
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Service/anon can insert (app creates profile after signUp)
create policy "Allow insert for authenticated"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. jonts: one row per calendar day (US East Coast)
create table if not exists public.jonts (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  title text,
  description text,
  image_url text,
  price_cents integer,
  created_at timestamptz not null default now()
);

alter table public.jonts enable row level security;

-- Anyone can read jonts (public catalog)
create policy "Anyone can read jonts"
  on public.jonts for select
  using (true);

-- (No insert/update/delete policy = only service role can write; use dashboard or API with service key to seed.)

-- 3. waitlist_emails: "lmk when we back up"
create table if not exists public.waitlist_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.waitlist_emails enable row level security;

-- Anyone can insert (submit email on waitlist page)
create policy "Anyone can insert waitlist"
  on public.waitlist_emails for insert
  with check (true);

-- No public read/update/delete (admin only via dashboard or service role)
create policy "No anon read waitlist"
  on public.waitlist_emails for select
  using (false);

-- 4. purchases: who bought which jont (dummy pay for Phase 1)
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  jont_id uuid not null references public.jonts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(jont_id, user_id)
);

alter table public.purchases enable row level security;

create policy "Users can read own purchases"
  on public.purchases for select
  using (auth.uid() = user_id);

create policy "Users can insert own purchase"
  on public.purchases for insert
  with check (auth.uid() = user_id);
