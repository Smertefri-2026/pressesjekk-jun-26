-- PresseSjekk v1 — case_access (repair/lockdown + unik case_id)
-- Trygt på eksisterende database OG nye miljøer.
-- Beholder eksisterende tabell og data. Fjerner skrivetilgang for vanlige
-- brukere (revenue/sikkerhet) og lar innloggede kun LESE egne rader.
--
-- VIKTIG — kjør FØR denne migrasjonen mot live Supabase:
-- Unik-constrainten på case_id vil feile dersom det finnes duplikate rader.
-- Verifiser at følgende spørring returnerer NULL rader før du kjører videre:
--   select case_id, count(*)
--   from public.case_access
--   group by case_id
--   having count(*) > 1;
-- Rydd opp i eventuelle duplikater manuelt før migrasjonen kjøres.

-- 1. Tabell — opprettes kun hvis den mangler (rører ikke eksisterende data)
create table if not exists public.case_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null unique references public.cases(id) on delete cascade,

  package_id text not null,
  status text not null default 'active'
    check (status in ('active', 'pending', 'cancelled', 'expired')),
  source text,

  stripe_checkout_session_id text,
  stripe_customer_id text,
  stripe_subscription_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Sikre unik case_id (kreves av upsert onConflict: "case_id").
--    Legges kun til hvis ingen single-column unik på case_id finnes fra før.
do $$
begin
  if not exists (
    select 1
    from pg_index i
    join pg_class c on c.oid = i.indrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'case_access'
      and i.indisunique
      and i.indnatts = 1
      and i.indkey[0] = (
        select attnum
        from pg_attribute
        where attrelid = 'public.case_access'::regclass
          and attname = 'case_id'
      )
  ) then
    alter table public.case_access
      add constraint case_access_case_id_key unique (case_id);
  end if;
end
$$;

-- 3. Indekser (idempotent)
create index if not exists case_access_user_id_idx on public.case_access(user_id);
create index if not exists case_access_status_idx on public.case_access(status);

-- 4. updated_at-trigger (idempotent)
drop trigger if exists case_access_set_updated_at on public.case_access;
create trigger case_access_set_updated_at
before update on public.case_access
for each row
execute function public.set_updated_at();

-- 5. Slå på RLS (idempotent)
alter table public.case_access enable row level security;

-- 6. Fjern ALLE eksisterende policyer ved navn (live + tidligere planlagte)
drop policy if exists "Users can view own case access" on public.case_access;
drop policy if exists "Users can read own case access" on public.case_access;
drop policy if exists "Users can insert own case access" on public.case_access;
drop policy if exists "Users can update own case access" on public.case_access;
drop policy if exists "Users can delete own case access" on public.case_access;
drop policy if exists "Admins can read all case access" on public.case_access;
drop policy if exists "Admins can insert case access" on public.case_access;
drop policy if exists "Admins can update case access" on public.case_access;
drop policy if exists "Admins can delete case access" on public.case_access;

-- 7. Eneste policy som beholdes: innloggede kan LESE egne tilgangsrader
create policy "Users can read own case access"
on public.case_access
for select
to authenticated
using (user_id = auth.uid());

-- 8. Lås ned grants: kun SELECT for authenticated, ingen tilgang for anon.
--    Service role får full tilgang eksplisitt (Stripe-webhook nå,
--    B3 admin-server senere) og omgår i tillegg RLS.
revoke all on table public.case_access from anon;
revoke insert, update, delete on table public.case_access from authenticated;
grant select on table public.case_access to authenticated;
grant all on table public.case_access to service_role;
