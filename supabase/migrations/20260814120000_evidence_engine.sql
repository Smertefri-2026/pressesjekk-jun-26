-- Remøy AI Evidence Engine — fase 1
--
-- Legger et generisk bevis-resonneringslag over eksisterende case_documents,
-- uten å endre eller flytte noe eksisterende data. case_documents forblir
-- den kanoniske kilden til selve dokumentene.
--
-- Nye tabeller:
--   claims                -- atomære påstander/opplysninger i saken
--   claim_evidence_links   -- kobling påstand <-> dokument (mange-til-mange)
--   claim_assessments      -- KI sin strukturerte vurdering av en påstand,
--                             versjonert (append-only, overskriver aldri)
--
-- Bevisst produktnøytralt navngitt (ikke "presse_*") slik at samme motor
-- kan gjenbrukes i Skattetap/Navnsjekk/Utleggssjekk senere. Eneste
-- PresseSjekk-spesifikke kobling i fase 1 er fremmednøkkelen til
-- public.cases — se rapport for hvordan dette generaliseres videre.
--
-- Additiv og idempotent. Rører aldri case_documents, cases eller annen
-- eksisterende data.

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  text text not null,

  -- Fase 1 bruker i praksis kun 'user_statement'. De andre er med fra start
  -- slik at vitneopplysninger og tredjepartsopplysninger (fase 2) ikke
  -- krever en ny migrasjon for å få plass i modellen.
  source_type text not null default 'user_statement'
    check (source_type in (
      'user_statement',
      'witness_statement',
      'third_party_statement',
      'ai_inference'
    )),

  -- Satt når brukeren aktivt har svart "jeg har ingen dokumentasjon" på
  -- spørsmålet systemet stiller. Skiller "ennå ikke tatt stilling til" fra
  -- "spurt, og bekreftet at det ikke finnes" - sistnevnte er i seg selv en
  -- del av en grundig saksdokumentasjon.
  no_evidence_confirmed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists claims_case_id_idx on public.claims(case_id);
create index if not exists claims_user_id_idx on public.claims(user_id);
create index if not exists claims_case_active_idx on public.claims(case_id, deleted_at);

drop trigger if exists claims_set_updated_at on public.claims;
create trigger claims_set_updated_at
before update on public.claims
for each row
execute function public.set_updated_at();

alter table public.claims enable row level security;

drop policy if exists "Users can read own claims" on public.claims;
create policy "Users can read own claims"
on public.claims for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own claims" on public.claims;
create policy "Users can insert own claims"
on public.claims for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own claims" on public.claims;
create policy "Users can update own claims"
on public.claims for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own claims" on public.claims;
create policy "Users can delete own claims"
on public.claims for delete
to authenticated
using (auth.uid() = user_id);

-- claim_evidence_links ------------------------------------------------------
-- Mange-til-mange. Ingen "relasjonstype" lagres her bevisst - hvorvidt et
-- dokument støtter, motsier eller ikke sier noe om påstanden er noe KI
-- vurderer (claim_assessments.evidence_breakdown), ikke noe brukeren
-- forhåndsdeklarerer. Det er selve poenget: systemet skal kunne oppdage at
-- et dokument brukeren trodde støttet saken, faktisk ikke gjør det.

create table if not exists public.claim_evidence_links (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  document_id uuid not null references public.case_documents(id) on delete cascade,
  linked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  unique (claim_id, document_id)
);

create index if not exists claim_evidence_links_claim_id_idx on public.claim_evidence_links(claim_id);
create index if not exists claim_evidence_links_document_id_idx on public.claim_evidence_links(document_id);

alter table public.claim_evidence_links enable row level security;

drop policy if exists "Users can read own claim evidence links" on public.claim_evidence_links;
create policy "Users can read own claim evidence links"
on public.claim_evidence_links for select
to authenticated
using (
  exists (
    select 1 from public.claims
    where claims.id = claim_evidence_links.claim_id
    and claims.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own claim evidence links" on public.claim_evidence_links;
create policy "Users can insert own claim evidence links"
on public.claim_evidence_links for insert
to authenticated
with check (
  exists (
    select 1 from public.claims
    where claims.id = claim_evidence_links.claim_id
    and claims.user_id = auth.uid()
  )
  and exists (
    select 1 from public.case_documents
    where case_documents.id = claim_evidence_links.document_id
    and case_documents.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own claim evidence links" on public.claim_evidence_links;
create policy "Users can delete own claim evidence links"
on public.claim_evidence_links for delete
to authenticated
using (
  exists (
    select 1 from public.claims
    where claims.id = claim_evidence_links.claim_id
    and claims.user_id = auth.uid()
  )
);

-- claim_assessments -----------------------------------------------------
-- Append-only. En ny rad legges til når vurderingen kjøres på nytt - den
-- forrige overskrives aldri. "Siste vurdering" = raden med nyest created_at
-- for en gitt claim_id.

create table if not exists public.claim_assessments (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,

  what_it_shows text not null,
  supports_summary text,
  contradicts_summary text,
  not_documented_summary text not null,
  conflicts_between_evidence text,

  status text not null
    check (status in ('well_documented', 'partially_documented', 'conflicting', 'undocumented')),
  confidence text not null
    check (confidence in ('high', 'medium', 'low')),
  confidence_reasoning text not null,

  -- Strukturert per-dokument utfall: [{document_id, verdict, note}, ...]
  evidence_breakdown jsonb not null default '[]'::jsonb,
  -- Snapshot av hvilke dokumenter som faktisk lå til grunn da vurderingen
  -- ble kjørt, for sporbarhet hvis nye dokumenter kobles til senere.
  evidence_ids_considered uuid[] not null default '{}',

  model text,
  created_at timestamptz not null default now()
);

create index if not exists claim_assessments_claim_id_idx on public.claim_assessments(claim_id);
create index if not exists claim_assessments_claim_created_idx on public.claim_assessments(claim_id, created_at desc);

alter table public.claim_assessments enable row level security;

drop policy if exists "Users can read own claim assessments" on public.claim_assessments;
create policy "Users can read own claim assessments"
on public.claim_assessments for select
to authenticated
using (
  exists (
    select 1 from public.claims
    where claims.id = claim_assessments.claim_id
    and claims.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own claim assessments" on public.claim_assessments;
create policy "Users can insert own claim assessments"
on public.claim_assessments for insert
to authenticated
with check (
  exists (
    select 1 from public.claims
    where claims.id = claim_assessments.claim_id
    and claims.user_id = auth.uid()
  )
);

-- Ingen update/delete-policy for claim_assessments med vilje - vurderinger
-- er append-only fra applikasjonen sin side.
