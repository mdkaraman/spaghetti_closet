-- Seams for chat, bids, votes, bucks, listings, and the week window.
-- Apply after 00002. The SQL editor (service role) bypasses RLS for week rows.

-- 1. site_weeks: live or dark span. ends_on is exclusive.
create table public.site_weeks (
  id uuid primary key default gen_random_uuid(),
  starts_on date not null,
  ends_on date not null,
  status text not null check (status in ('live', 'dark')),
  check (ends_on > starts_on)
);

alter table public.site_weeks enable row level security;

create policy "Anyone can read site weeks"
  on public.site_weeks for select
  using (true);

-- 2. comments
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  jont_id uuid not null references public.jonts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "Authenticated can read comments"
  on public.comments for select
  to authenticated
  using (true);

create policy "Users can insert own comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.comments;

-- 3. listings: a purchase put up for bid
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  jont_id uuid not null references public.jonts(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now(),
  unique (purchase_id)
);

alter table public.listings enable row level security;

create policy "Authenticated can read listings"
  on public.listings for select
  to authenticated
  using (true);

create policy "Sellers can insert own listings"
  on public.listings for insert
  to authenticated
  with check (
    auth.uid() = seller_id
    and exists (
      select 1
      from public.purchases p
      where p.id = listings.purchase_id
        and p.user_id = auth.uid()
        and p.jont_id = listings.jont_id
    )
  );

-- 4. bids: exactly one of jont_id or listing_id
create table public.bids (
  id uuid primary key default gen_random_uuid(),
  jont_id uuid references public.jonts(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_cents integer not null check (amount_cents >= 100),
  created_at timestamptz not null default now(),
  check (
    (jont_id is not null and listing_id is null)
    or (jont_id is null and listing_id is not null)
  ),
  unique (jont_id, user_id),
  unique (listing_id, user_id)
);

alter table public.bids enable row level security;

create policy "Authenticated can read bids"
  on public.bids for select
  to authenticated
  using (true);

create policy "Users can insert own bids"
  on public.bids for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own bids"
  on public.bids for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- A later amount change must not rewrite who bid first.
create or replace function public.keep_bid_identity()
returns trigger
language plpgsql
as $$
begin
  new.created_at := old.created_at;
  new.user_id := old.user_id;
  new.jont_id := old.jont_id;
  new.listing_id := old.listing_id;
  return new;
end;
$$;

create trigger keep_bid_identity
  before update on public.bids
  for each row
  execute function public.keep_bid_identity();

-- 5. comment_votes: the vote RPC is the only writer
create table public.comment_votes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  primary key (comment_id, user_id)
);

alter table public.comment_votes enable row level security;

create policy "Authenticated can read comment votes"
  on public.comment_votes for select
  to authenticated
  using (true);

-- 6. spaghetti_bucks_ledger: append-only, no client writes
create table public.spaghetti_bucks_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  delta integer not null check (delta <> 0),
  reason text not null check (reason in ('vote_up', 'vote_down', 'blessing_in', 'blessing_out')),
  ref_id uuid not null,
  created_at timestamptz not null default now()
);

alter table public.spaghetti_bucks_ledger enable row level security;

create policy "Users can read own bucks"
  on public.spaghetti_bucks_ledger for select
  to authenticated
  using (auth.uid() = user_id);

-- 7. blessings: the bless RPC is the only writer
create table public.blessings (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount > 0),
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);

alter table public.blessings enable row level security;

create policy "Users can read own blessings"
  on public.blessings for select
  to authenticated
  using (auth.uid() = from_user or auth.uid() = to_user);

-- 8. profiles: optional size and type
alter table public.profiles
  add column size text,
  add column jont_type text;

-- 9. profile_handles: handles only, no email. Owner rights, not the caller.
create view public.profile_handles
with (security_invoker = false) as
select id, user_id
from public.profiles;

revoke all on public.profile_handles from public;
revoke all on public.profile_handles from anon;
grant select on public.profile_handles to authenticated;

-- 10. purchases: a logged-in user can see who copped a jont
create policy "Authenticated can read purchases"
  on public.purchases for select
  to authenticated
  using (true);

-- 11. RPC stubs. E1 replaces the bodies.
create or replace function public.cast_comment_vote(comment_id uuid, value smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'not implemented';
end;
$$;

create or replace function public.bless_spaghetti(recipient_handle text, amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'not implemented';
end;
$$;

create or replace function public.my_spaghetti_bucks()
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'not implemented';
end;
$$;

revoke all on function public.cast_comment_vote(uuid, smallint) from public;
revoke all on function public.cast_comment_vote(uuid, smallint) from anon;
grant execute on function public.cast_comment_vote(uuid, smallint) to authenticated;

revoke all on function public.bless_spaghetti(text, integer) from public;
revoke all on function public.bless_spaghetti(text, integer) from anon;
grant execute on function public.bless_spaghetti(text, integer) to authenticated;

revoke all on function public.my_spaghetti_bucks() from public;
revoke all on function public.my_spaghetti_bucks() from anon;
grant execute on function public.my_spaghetti_bucks() to authenticated;
