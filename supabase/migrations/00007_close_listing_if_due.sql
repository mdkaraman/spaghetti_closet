alter table public.listings
  add column winner_id uuid references auth.users(id) on delete set null;

create policy "Listing bids need an open listing from someone else"
  on public.bids
  as restrictive
  for insert
  to authenticated
  with check (
    listing_id is null
    or exists (
      select 1
      from public.listings l
      where l.id = bids.listing_id
        and l.status = 'open'
        and l.seller_id <> auth.uid()
    )
  );

create policy "Listing bid changes need an open listing from someone else"
  on public.bids
  as restrictive
  for update
  to authenticated
  using (
    listing_id is null
    or exists (
      select 1
      from public.listings l
      where l.id = bids.listing_id
        and l.status = 'open'
        and l.seller_id <> auth.uid()
    )
  );

create or replace function public.balances_for_listing_bidders(listing_id uuid)
returns table (user_id uuid, balance integer)
language plpgsql
stable
security definer
set search_path = public
as $$
#variable_conflict use_column
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  return query
  select
    b.user_id,
    coalesce(sum(l.delta), 0)::integer as balance
  from public.bids b
  left join public.spaghetti_bucks_ledger l
    on l.user_id = b.user_id
  where b.listing_id = balances_for_listing_bidders.listing_id
  group by b.user_id;
end;
$$;

create or replace function public.close_listing_if_due(listing_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  target public.listings%rowtype;
  listed_on date;
  week_ends_on date;
  winner uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select *
  into target
  from public.listings l
  where l.id = close_listing_if_due.listing_id
  for update;

  if not found or target.status <> 'open' then
    return;
  end if;

  listed_on := (target.created_at at time zone 'America/New_York')::date;

  select max(w.ends_on)
  into week_ends_on
  from public.site_weeks w
  where w.starts_on <= listed_on
    and listed_on < w.ends_on;

  if week_ends_on is null
    or (now() at time zone 'America/New_York')::date < week_ends_on then
    return;
  end if;

  select b.user_id
  into winner
  from public.bids b
  cross join lateral (
    select coalesce(sum(x.delta), 0) as balance
    from public.spaghetti_bucks_ledger x
    where x.user_id = b.user_id
  ) bal
  where b.listing_id = target.id
    and b.user_id <> target.seller_id
  order by b.amount_cents desc, bal.balance desc, b.created_at asc, b.user_id asc
  limit 1;

  if winner is not null then
    insert into public.purchases (user_id, jont_id)
    values (winner, target.jont_id)
    on conflict (jont_id, user_id) do nothing;
  end if;

  update public.listings
  set status = 'closed', winner_id = winner
  where id = target.id;
end;
$$;

revoke all on function public.balances_for_listing_bidders(uuid) from public;
revoke all on function public.balances_for_listing_bidders(uuid) from anon;
grant execute on function public.balances_for_listing_bidders(uuid) to authenticated;

revoke all on function public.close_listing_if_due(uuid) from public;
revoke all on function public.close_listing_if_due(uuid) from anon;
grant execute on function public.close_listing_if_due(uuid) to authenticated;
