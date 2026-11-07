create or replace function public.balances_for_bidders(jont_id uuid)
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
  where b.jont_id = balances_for_bidders.jont_id
  group by b.user_id;
end;
$$;

revoke all on function public.balances_for_bidders(uuid) from public;
revoke all on function public.balances_for_bidders(uuid) from anon;
grant execute on function public.balances_for_bidders(uuid) to authenticated;
