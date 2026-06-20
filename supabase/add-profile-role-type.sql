-- PresseSjekk profile role support

alter table public.profiles
add column if not exists role_type text default 'private_person';

update public.profiles
set role_type = 'private_person'
where role_type is null;
