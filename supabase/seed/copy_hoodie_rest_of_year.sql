-- Copy the hoodie jont onto every remaining day of this year (US East Coast).
-- Run in the Supabase SQL Editor. Safe to re-run: a date that already has a
-- jont is left alone (jonts.date is unique). New rows get a fresh id.
--
-- Source row: image_url = '/hoodie.png', otherwise the earliest title that
-- contains "hoodie" (seed row is "this that hoodie tho" / "that size L jaunt"
-- / /hoodie.png / 2000 cents).
--
-- Optional check before inserting. Run this by itself if you want to see
-- which row will be copied:
--
--   select id, date, title, description, image_url, price_cents
--   from public.jonts
--   where image_url = '/hoodie.png'
--      or title ilike '%hoodie%'
--   order by (image_url = '/hoodie.png') desc, date asc
--   limit 1;

do $$
declare
  src record;
  start_day date;
  end_day date;
  inserted_count integer;
begin
  select title, description, image_url, price_cents
    into src
  from public.jonts
  where image_url = '/hoodie.png'
     or title ilike '%hoodie%'
  order by (image_url = '/hoodie.png') desc, date asc
  limit 1;

  if not found then
    raise exception
      'No hoodie row in public.jonts. Expected image_url = /hoodie.png or a title containing hoodie.';
  end if;

  start_day := (timezone('America/New_York', now()))::date;
  end_day := (
    date_trunc('year', timezone('America/New_York', now()))
    + interval '1 year'
    - interval '1 day'
  )::date;

  insert into public.jonts (date, title, description, image_url, price_cents)
  select
    day::date,
    src.title,
    src.description,
    src.image_url,
    src.price_cents
  from generate_series(start_day, end_day, interval '1 day') as day
  on conflict (date) do nothing;

  get diagnostics inserted_count = row_count;

  raise notice
    'Copied "%" (%) at % cents. Inserted % row(s) from % through %. Dates that already had a jont were skipped.',
    src.title,
    src.image_url,
    src.price_cents,
    inserted_count,
    start_day,
    end_day;
end $$;

-- What is now scheduled from today through the end of the year.
select
  count(*) as jonts_rest_of_year,
  min(date) as first_day,
  max(date) as last_day,
  count(*) filter (
    where image_url = '/hoodie.png' or title ilike '%hoodie%'
  ) as hoodie_days
from public.jonts
where date >= (timezone('America/New_York', now()))::date
  and date < (
    date_trunc('year', timezone('America/New_York', now())) + interval '1 year'
  )::date;
