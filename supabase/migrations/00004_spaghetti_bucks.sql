-- Replace the E1 stubs from 00003. Bodies follow lib/bucks.ts:
-- voteDelta(old, new) = new - old (old is 0 when the caller has no vote row)
-- canBless(balance, amount) requires a whole amount >= 1 and amount <= balance.
-- Apply on top of 00003. Clients still cannot write the ledger or blessings.

create or replace function public.cast_comment_vote(comment_id uuid, value smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  caller uuid := auth.uid();
  new_value smallint := value;
  old_value smallint := 0;
  delta integer;
begin
  if caller is null then
    raise exception 'not authenticated';
  end if;

  if new_value is null or new_value not in (-1, 1) then
    raise exception 'value must be -1 or 1';
  end if;

  -- Same caller lock as bless_spaghetti, so a gift cannot race a vote.
  perform pg_advisory_xact_lock(hashtextextended(caller::text, 0));

  select cv.value
  into old_value
  from public.comment_votes cv
  where cv.comment_id = cast_comment_vote.comment_id
    and cv.user_id = caller
  for update;

  if not found then
    old_value := 0;
  end if;

  -- voteDelta(old_value, new_value)
  delta := new_value - old_value;

  insert into public.comment_votes (comment_id, user_id, value)
  values (cast_comment_vote.comment_id, caller, new_value)
  on conflict (comment_id, user_id)
  do update set value = excluded.value;

  if delta = 0 then
    return;
  end if;

  insert into public.spaghetti_bucks_ledger (user_id, delta, reason, ref_id)
  values (
    caller,
    delta,
    case when delta > 0 then 'vote_up' else 'vote_down' end,
    cast_comment_vote.comment_id
  );
end;
$$;

create or replace function public.bless_spaghetti(recipient_handle text, amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  caller uuid := auth.uid();
  recipient uuid;
  balance integer;
  blessing_id uuid;
  gift integer := amount;
begin
  if caller is null then
    raise exception 'not authenticated';
  end if;

  -- canBless rejects 0, negatives, and anything that is not a whole number.
  -- The argument is already an integer, so the whole-number check is the type.
  if gift is null or gift < 1 then
    raise exception 'amount must be at least 1';
  end if;

  select ph.id
  into recipient
  from public.profile_handles ph
  where ph.user_id = bless_spaghetti.recipient_handle;

  if recipient is null then
    raise exception 'missing handle';
  end if;

  if recipient = caller then
    raise exception 'cannot bless yourself';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(caller::text, 0));

  select coalesce(sum(l.delta), 0)::integer
  into balance
  from public.spaghetti_bucks_ledger l
  where l.user_id = caller;

  -- canBless(balance, gift): false when the gift is above the balance.
  if gift > balance then
    raise exception 'amount greater than balance';
  end if;

  insert into public.blessings (from_user, to_user, amount)
  values (caller, recipient, gift)
  returning id into blessing_id;

  insert into public.spaghetti_bucks_ledger (user_id, delta, reason, ref_id)
  values
    (caller, -gift, 'blessing_out', blessing_id),
    (recipient, gift, 'blessing_in', blessing_id);
end;
$$;

create or replace function public.my_spaghetti_bucks()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'not authenticated';
  end if;

  return coalesce((
    select sum(l.delta)
    from public.spaghetti_bucks_ledger l
    where l.user_id = caller
  ), 0)::integer;
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
