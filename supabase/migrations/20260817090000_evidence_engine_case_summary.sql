-- Remøy AI Evidence Engine — fase 3: saksbred AI-oppsummering
--
-- Additivt. Rører ingen eksisterende tabeller. Én ny tabell, append-only
-- (samme mønster som claim_assessments/claim_documentation_suggestions):
-- hvert kall til KI-oppsummeringen lagrer en ny rad, "siste" = nyeste
-- created_at. Denormaliserer case_id + user_id direkte på raden (samme
-- mønster som witness_accounts/document_facts) for enkel RLS uten join.
--
-- Feltene holder samme fem-kategori-atskillelse som resten av motoren:
-- oppsummeringen er bygget fra STRUKTURERTE data (påstandstekst, status,
-- assessment-sammendrag, hull), aldri fra rå dokumenttekst - og inneholder
-- aldri en samlet "bevisstyrke"-score, kun forklarbare kategorier.

create table if not exists public.case_summaries (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  best_documented_summary text,
  partially_documented_summary text,
  conflicts_summary text,
  key_gaps_summary text,
  strengthen_areas_summary text,

  model text,
  created_at timestamptz not null default now()
);

create index if not exists case_summaries_case_id_idx on public.case_summaries(case_id);
create index if not exists case_summaries_case_created_idx on public.case_summaries(case_id, created_at desc);

alter table public.case_summaries enable row level security;

drop policy if exists "Users can read own case summaries" on public.case_summaries;
create policy "Users can read own case summaries"
on public.case_summaries for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own case summaries" on public.case_summaries;
create policy "Users can insert own case summaries"
on public.case_summaries for insert to authenticated with check (auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select, insert on public.case_summaries to authenticated;
grant select, insert, update, delete on public.case_summaries to service_role;
