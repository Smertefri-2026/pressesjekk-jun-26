-- PresseSjekk profile metadata sync
-- Oppdaterer ny-bruker-funksjonen slik at full_name og role_type lagres i profiles.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    email,
    role_type
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role_type', 'private_person')
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    role_type = excluded.role_type,
    updated_at = now();

  return new;
end;
$$;
