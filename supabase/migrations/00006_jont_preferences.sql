alter table public.jonts
  add column if not exists size text,
  add column if not exists jont_type text;

alter table public.jonts
  drop constraint if exists jonts_date_key;
