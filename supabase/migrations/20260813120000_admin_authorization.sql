-- PresseSjekk — fang opp admin-autorisasjon i versjonskontroll
--
-- profiles.is_admin og public.current_user_is_admin() har vært i bruk i
-- appen og i tidligere migrasjoner (bl.a. 20260629130000_user_case_entitlements.sql)
-- uten å noensinne være definert i sporet SQL - de ble opprettet direkte i
-- Supabase (dashbord/SQL-editor). Denne migrasjonen fanger opp det som
-- åpenbart er den tiltenkte definisjonen, basert på hvordan is_admin brukes
-- konsekvent i appkoden (8 admin-sider sjekker profiles.is_admin identisk).
--
-- VIKTIG FØR DENNE KJØRES MOT LIVE SUPABASE:
-- Kjør følgende i SQL-editoren først og sammenlign med det som står under,
-- slik at vi ikke ved et uhell endrer semantikken til en funksjon som
-- allerede finnes med annen logikk:
--   select pg_get_functiondef('public.current_user_is_admin()'::regprocedure);
-- Hvis resultatet avviker vesentlig fra definisjonen under, IKKE kjør denne
-- migrasjonen uten å avklare først - meld gjerne tilbake hva den faktiske
-- definisjonen er.
--
-- Selve migrasjonen er trygg å kjøre flere ganger (idempotent):
-- - "add column if not exists" er en no-op hvis kolonnen allerede finnes.
-- - "create or replace function" med samme signatur bytter kun ut kroppen.

alter table public.profiles
add column if not exists is_admin boolean not null default false;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function public.current_user_is_admin() to authenticated;

-- Oppdaget under testing: service_role har ALDRI hatt et eksplisitt GRANT på
-- profiles (i motsetning til case_access/user_purchases/user_case_entitlements,
-- som alle har "grant ... to service_role" i sine migrasjoner). BYPASSRLS
-- alene er ikke nok - PostgREST/Postgres krever i tillegg et grunnleggende
-- GRANT på tabellen. Uten denne linjen feiler ethvert service-role-kall mot
-- profiles (bl.a. src/lib/access/requireAdmin.ts) med
-- "permission denied for table profiles", bekreftet i praksis mot denne
-- databasen før denne linjen ble lagt til.
grant select on public.profiles to service_role;

-- Admin-lesetilgang på tabellene admin-sidene faktisk leser fra.
-- (Skrivetilgang for admin holdes bevisst UTENFOR RLS for case_access -
-- den går via en egen server-rute med service-role, se
-- src/app/api/admin/case-access/route.ts - for å beholde lockdownen fra
-- case-access-v1.sql.)

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using (public.current_user_is_admin());

drop policy if exists "Admins can read all cases" on public.cases;
create policy "Admins can read all cases"
on public.cases
for select
to authenticated
using (public.current_user_is_admin());

drop policy if exists "Admins can read all case reports" on public.case_reports;
create policy "Admins can read all case reports"
on public.case_reports
for select
to authenticated
using (public.current_user_is_admin());

drop policy if exists "Admins can read all case access" on public.case_access;
create policy "Admins can read all case access"
on public.case_access
for select
to authenticated
using (public.current_user_is_admin());
