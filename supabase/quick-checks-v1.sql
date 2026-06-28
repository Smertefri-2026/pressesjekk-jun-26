-- PresseSjekk v1 — quick_checks (definisjon + lockdown)
-- Offentlige raske sjekker. ALL tilgang går via server (service role):
--   - /api/quick-check SKRIVER (skal bruke service role, ikke anon)
--   - admin LESER via B3 server-endepunkt (service role)
-- Verken anon eller innloggede brukere får lese/skrive tabellen direkte.
--
-- PARET KODEENDRING (VIKTIG): /api/quick-check må bytte fra anon-klient til
-- service-role-klient i samme leveranse. Uten dette vil endepunktet slutte å
-- virke etter at grants/policyer låses her.
--
-- Duplikatsjekk på normalized_url er allerede bekreftet (0 rader) på live.

-- 1. Tabell — opprettes kun hvis den mangler (rører ikke eksisterende data)
create table if not exists public.quick_checks (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  normalized_url text not null,
  role text not null default 'reader',
  check_count integer not null default 1,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  ai_status text not null default 'not_started'
    check (ai_status in ('not_started', 'ready', 'failed')),
  ai_summary text,
  ai_ethics_points jsonb not null default '[]'::jsonb,
  ai_legal_points jsonb not null default '[]'::jsonb,
  ai_missing_context jsonb not null default '[]'::jsonb,
  ai_recommendation text,
  ai_generated_at timestamptz,

  -- Leses av admin (raske-sjekker); skrives foreløpig ikke av API-ruten
  ai_risk_level text,
  ai_recommended_next_step text
);

-- 2. Sikre admin-kolonner på eksisterende tabell (idempotent; mangler på live)
alter table public.quick_checks
  add column if not exists ai_risk_level text;
alter table public.quick_checks
  add column if not exists ai_recommended_next_step text;

-- 3. Sikre unik normalized_url. Finnes allerede live — legges kun til hvis
--    ingen single-column unik på normalized_url finnes fra før.
do $$
begin
  if not exists (
    select 1
    from pg_index i
    join pg_class c on c.oid = i.indrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'quick_checks'
      and i.indisunique
      and i.indnatts = 1
      and i.indkey[0] = (
        select attnum
        from pg_attribute
        where attrelid = 'public.quick_checks'::regclass
          and attname = 'normalized_url'
      )
  ) then
    alter table public.quick_checks
      add constraint quick_checks_normalized_url_key unique (normalized_url);
  end if;
end
$$;

-- 4. Indekser (idempotent)
create index if not exists quick_checks_last_checked_at_idx
  on public.quick_checks(last_checked_at desc);
create index if not exists quick_checks_ai_status_idx
  on public.quick_checks(ai_status);

-- 5. Slå på RLS (idempotent)
alter table public.quick_checks enable row level security;

-- 6. Fjern ALLE eksisterende policyer (uavhengig av navn) → full lockdown
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'quick_checks'
  loop
    execute format('drop policy if exists %I on public.quick_checks', pol.policyname);
  end loop;
end
$$;

-- 7. Ingen policyer opprettes: kun service role (omgår RLS) får tilgang.

-- 8. Lås ned grants
revoke all on table public.quick_checks from anon;
revoke all on table public.quick_checks from authenticated;
grant all on table public.quick_checks to service_role;
