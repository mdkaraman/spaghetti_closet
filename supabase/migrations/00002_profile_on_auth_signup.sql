-- Create profile row when a new auth user is created (no app-side privileged key needed).
-- The app then updates user_id (handle) on the next request when the session is available.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, user_id, email)
  values (
    new.id,
    new.id::text,
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
