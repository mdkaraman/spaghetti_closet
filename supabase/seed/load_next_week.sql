-- Load one week of the hoodie jont and arm a live site window.
-- Run in the Supabase SQL Editor (it bypasses RLS). Safe to re-run:
-- a date that already has a jont is left alone (jonts.date is unique),
-- and a site_weeks row that already overlaps this span is left alone.
--
-- Today is America/New_York. The span is seven days: starts_on is today
-- and ends_on is exclusive (today + 7). New jont rows get a fresh id.
--
-- Source row: image_url = '/hoodie.png', otherwise the earliest title that
-- contains "hoodie" (same rule as copy_hoodie_rest_of_year.sql).
--
-- Needs public.site_weeks (id, starts_on, ends_on, status).

do $$
declare
  src record;
  start_day date;
  end_day date;
  inserted_count integer;
  week_inserted integer;
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
  end_day := start_day + 7;

  insert into public.jonts (date, title, description, image_url, price_cents)
  select
    day::date,
    src.title,
    src.description,
    src.image_url,
    src.price_cents
  from generate_series(start_day, end_day - 1, interval '1 day') as day
  on conflict (date) do nothing;

  get diagnostics inserted_count = row_count;

  insert into public.site_weeks (id, starts_on, ends_on, status)
  select gen_random_uuid(), start_day, end_day, 'live'
  where not exists (
    select 1
    from public.site_weeks
    where starts_on < end_day
      and ends_on > start_day
  );

  get diagnostics week_inserted = row_count;

  raise notice
    'Copied "%" (%) at % cents. Inserted % jont row(s) for % through % (exclusive end %). Week row %.',
    src.title,
    src.image_url,
    src.price_cents,
    inserted_count,
    start_day,
    end_day - 1,
    end_day,
    case
      when week_inserted > 0 then 'inserted'
      else 'skipped (an overlapping row is already there)'
    end;
end $$;

-- What this span now holds. ends_on is exclusive, so the last jont date is the day before it.
select
  count(*) as jonts_this_span,
  min(date) as first_day,
  max(date) as last_day
from public.jonts
where date >= (timezone('America/New_York', now()))::date
  and date < (timezone('America/New_York', now()))::date + 7;

select starts_on, ends_on, status
from public.site_weeks
where starts_on < (timezone('America/New_York', now()))::date + 7
  and ends_on > (timezone('America/New_York', now()))::date;
