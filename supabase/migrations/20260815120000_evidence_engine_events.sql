-- Remøy AI Evidence Engine — fase 2A: hendelser, tidslinje, dokumentfakta
--
-- Rent additivt over fase 1 (20260814120000_evidence_engine.sql). Rører
-- ikke claims/claim_evidence_links/claim_assessments sin eksisterende
-- struktur eller data - kun én ny, valgfri kolonne lagt til på
-- claim_assessments (se bunn av filen). case_documents forblir eneste
-- kanoniske kilde til selve filene - dokumenter dupliseres aldri.
--
-- Nye tabeller:
--   events                -- hendelser i saken (tidslinjepunkter)
--   event_claim_links      -- hendelse <-> påstand (mange-til-mange)
--   event_document_links    -- hendelse <-> dokument (mange-til-mange)
--   document_facts          -- KI-utledede, observerbare fakta OM et
--                              dokument (dato, avsender, kildeegenskaper...),
--                              ett lag FØR dokumentet brukes i en
--                              påstandsvurdering. Én rad per dokument.
--
-- Produktnøytralt navngitt, samme mønster som fase 1.

-- events ---------------------------------------------------------------

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  description text,

  event_date date,
  event_time time,

  -- Tidslinjen skal fungere med eksakt dato+klokkeslett, kun dato, omtrent
  -- tidspunkt, eller helt ukjent dato. "approximate_label" brukes for
  -- fritekst når presisjonen ikke er eksakt (f.eks. "midt i mars 2026").
  date_precision text not null default 'date_only'
    check (date_precision in ('exact', 'date_only', 'approximate', 'unknown')),
  approximate_label text,

  -- Forberedt for at KI senere skal kunne FORESLÅ hendelser (ikke bygget i
  -- fase 2A) - et forslag skal aldri kunne overskrive brukerdata uten
  -- godkjenning, derfor egen kildetype fra start i stedet for en
  -- migrasjon når det bygges.
  source_type text not null default 'user'
    check (source_type in ('user', 'ai_suggested')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists events_case_id_idx on public.events(case_id);
create index if not exists events_user_id_idx on public.events(user_id);
create index if not exists events_case_active_idx on public.events(case_id, deleted_at);
create index if not exists events_date_idx on public.events(event_date);

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

alter table public.events enable row level security;

drop policy if exists "Users can read own events" on public.events;
create policy "Users can read own events"
on public.events for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own events" on public.events;
create policy "Users can insert own events"
on public.events for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own events" on public.events;
create policy "Users can update own events"
on public.events for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own events" on public.events;
create policy "Users can delete own events"
on public.events for delete
to authenticated
using (auth.uid() = user_id);

-- event_claim_links ------------------------------------------------------

create table if not exists public.event_claim_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  linked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  unique (event_id, claim_id)
);

create index if not exists event_claim_links_event_id_idx on public.event_claim_links(event_id);
create index if not exists event_claim_links_claim_id_idx on public.event_claim_links(claim_id);

alter table public.event_claim_links enable row level security;

drop policy if exists "Users can read own event claim links" on public.event_claim_links;
create policy "Users can read own event claim links"
on public.event_claim_links for select
to authenticated
using (
  exists (select 1 from public.events where events.id = event_claim_links.event_id and events.user_id = auth.uid())
);

drop policy if exists "Users can insert own event claim links" on public.event_claim_links;
create policy "Users can insert own event claim links"
on public.event_claim_links for insert
to authenticated
with check (
  exists (select 1 from public.events where events.id = event_claim_links.event_id and events.user_id = auth.uid())
  and exists (select 1 from public.claims where claims.id = event_claim_links.claim_id and claims.user_id = auth.uid())
);

drop policy if exists "Users can delete own event claim links" on public.event_claim_links;
create policy "Users can delete own event claim links"
on public.event_claim_links for delete
to authenticated
using (
  exists (select 1 from public.events where events.id = event_claim_links.event_id and events.user_id = auth.uid())
);

-- event_document_links -----------------------------------------------------

create table if not exists public.event_document_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  document_id uuid not null references public.case_documents(id) on delete cascade,
  linked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  unique (event_id, document_id)
);

create index if not exists event_document_links_event_id_idx on public.event_document_links(event_id);
create index if not exists event_document_links_document_id_idx on public.event_document_links(document_id);

alter table public.event_document_links enable row level security;

drop policy if exists "Users can read own event document links" on public.event_document_links;
create policy "Users can read own event document links"
on public.event_document_links for select
to authenticated
using (
  exists (select 1 from public.events where events.id = event_document_links.event_id and events.user_id = auth.uid())
);

drop policy if exists "Users can insert own event document links" on public.event_document_links;
create policy "Users can insert own event document links"
on public.event_document_links for insert
to authenticated
with check (
  exists (select 1 from public.events where events.id = event_document_links.event_id and events.user_id = auth.uid())
  and exists (
    select 1 from public.case_documents
    where case_documents.id = event_document_links.document_id
    and case_documents.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own event document links" on public.event_document_links;
create policy "Users can delete own event document links"
on public.event_document_links for delete
to authenticated
using (
  exists (select 1 from public.events where events.id = event_document_links.event_id and events.user_id = auth.uid())
);

-- document_facts -----------------------------------------------------------
-- Én rad per dokument (uavhengig av hvor mange påstander/hendelser det
-- senere kobles til) - fakta er en egenskap ved dokumentet, ikke ved bruken
-- av det. Utløses lazily (første gang dokumentet faktisk kobles til en
-- påstand eller hendelse), ikke automatisk på hver opplasting - se rapport
-- for begrunnelse (kostnadskontroll, samme prinsipp som resten av
-- AI-arbeidet i denne kodebasen).

create table if not exists public.document_facts (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.case_documents(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  extraction_status text not null default 'pending'
    check (extraction_status in ('pending', 'processing', 'completed', 'failed', 'unsupported')),
  extraction_error text,

  -- KI sin egen klassifisering av hva dokumentet faktisk ER (kan avvike
  -- fra brukerens document_type-valg på case_documents, som er et separat,
  -- brukerstyrt felt).
  document_kind text
    check (document_kind is null or document_kind in (
      'email', 'agreement', 'article', 'message', 'call_log', 'other', 'unknown'
    )),
  summary text,

  occurred_at_date date,
  occurred_at_time time,
  date_confidence text check (date_confidence is null or date_confidence in ('high', 'medium', 'low')),
  date_note text,

  -- Fleksibel, per-felt-confidence-merket bag med observerbare fakta:
  -- {"sender": {"value": "...", "confidence": "high"}, ...}. Frittstående
  -- fra dokumenttype til dokumenttype med vilje - se rapport.
  structured_facts jsonb not null default '{}'::jsonb,

  -- Kildeegenskaper - ALDRI en bevisstyrke/poengsum, kun beskrivende tagger
  -- fra en fast liste + en nøytral setning.
  source_characteristics jsonb not null default '[]'::jsonb,
  source_characteristics_note text,

  -- KI sitt forslag til hvilken hendelse dette dokumentet trolig gjelder -
  -- fritekst, ALDRI en automatisk kobling. Brukeren avgjør om og hvordan
  -- det skal bli en faktisk event_document_link.
  likely_event_description text,

  model text,
  extracted_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists document_facts_case_id_idx on public.document_facts(case_id);
create index if not exists document_facts_document_id_idx on public.document_facts(document_id);

drop trigger if exists document_facts_set_updated_at on public.document_facts;
create trigger document_facts_set_updated_at
before update on public.document_facts
for each row
execute function public.set_updated_at();

alter table public.document_facts enable row level security;

drop policy if exists "Users can read own document facts" on public.document_facts;
create policy "Users can read own document facts"
on public.document_facts for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own document facts" on public.document_facts;
create policy "Users can insert own document facts"
on public.document_facts for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.case_documents
    where case_documents.id = document_facts.document_id
    and case_documents.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own document facts" on public.document_facts;
create policy "Users can update own document facts"
on public.document_facts for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- claim_assessments: additiv utvidelse -------------------------------------
-- Ny, valgfri kolonne for tidslinjekontekst i vurderingen. Endrer ikke
-- eksisterende rader eller kolonner fra fase 1.

alter table public.claim_assessments
add column if not exists timeline_note text;
