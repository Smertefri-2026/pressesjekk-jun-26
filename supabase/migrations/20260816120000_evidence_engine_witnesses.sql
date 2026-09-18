-- Remøy AI Evidence Engine — fase 2B: vitner, dokumentasjonshull, forslag
--
-- Additivt over fase 1 + 2A. Rører ikke eksisterende tabeller utover to nye,
-- valgfrie kolonner på claim_assessments (witness_breakdown, corroboration_note).
-- GRANT-setninger er inkludert i SAMME fil som tabellene denne gangen -
-- lærdommen fra fase 1/2A sin manglende-GRANT-brist er tatt med videre.
--
-- Nye tabeller:
--   witnesses                     -- vitne-identitet, tilhører saken
--   witness_accounts               -- én konkret ting et vitne kan forklare
--   witness_account_claim_links     -- vitneopplysning <-> påstand
--   witness_account_document_links  -- vitneopplysning <-> skriftlig erklæring
--                                     (case_documents - ingen filduplisering)
--   claim_documentation_suggestions -- KI sine kontekstuelle forslag til
--                                      hva brukeren kan lete etter

-- witnesses ------------------------------------------------------------

create table if not exists public.witnesses (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Identitetsakse: mulig (nevnt, ikke bekreftet) / navngitt / anonymisert.
  -- Dette er UAVHENGIG av om vitnet faktisk har avgitt en erklæring - det
  -- avgjøres av om witness_account_document_links har rader, ikke av et
  -- lagret felt her (unngår tilstand som kan gå ut av synk).
  identity_status text not null default 'possible'
    check (identity_status in ('possible', 'named', 'anonymous')),

  name text,
  contact_info text,
  relationship_to_case text,
  note text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists witnesses_case_id_idx on public.witnesses(case_id);
create index if not exists witnesses_user_id_idx on public.witnesses(user_id);
create index if not exists witnesses_case_active_idx on public.witnesses(case_id, deleted_at);

drop trigger if exists witnesses_set_updated_at on public.witnesses;
create trigger witnesses_set_updated_at
before update on public.witnesses
for each row
execute function public.set_updated_at();

alter table public.witnesses enable row level security;

drop policy if exists "Users can read own witnesses" on public.witnesses;
create policy "Users can read own witnesses"
on public.witnesses for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own witnesses" on public.witnesses;
create policy "Users can insert own witnesses"
on public.witnesses for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own witnesses" on public.witnesses;
create policy "Users can update own witnesses"
on public.witnesses for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own witnesses" on public.witnesses;
create policy "Users can delete own witnesses"
on public.witnesses for delete to authenticated using (auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.witnesses to authenticated;
grant select, insert, update, delete on public.witnesses to service_role;

-- witness_accounts -----------------------------------------------------
-- "Hva kan vitnet faktisk forklare" - én rad per konkret observasjon. Et
-- vitne kan ha flere accounts (og dermed samlet dekke flere hendelser).

create table if not exists public.witness_accounts (
  id uuid primary key default gen_random_uuid(),
  witness_id uuid not null references public.witnesses(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  description text not null,

  -- Direkte observasjon vs. annenhåndsinformasjon - AI skal ALDRI behandle
  -- disse likt.
  observation_type text not null default 'direct'
    check (observation_type in ('direct', 'secondhand')),

  event_id uuid references public.events(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists witness_accounts_witness_id_idx on public.witness_accounts(witness_id);
create index if not exists witness_accounts_case_id_idx on public.witness_accounts(case_id);
create index if not exists witness_accounts_event_id_idx on public.witness_accounts(event_id);

drop trigger if exists witness_accounts_set_updated_at on public.witness_accounts;
create trigger witness_accounts_set_updated_at
before update on public.witness_accounts
for each row
execute function public.set_updated_at();

alter table public.witness_accounts enable row level security;

drop policy if exists "Users can read own witness accounts" on public.witness_accounts;
create policy "Users can read own witness accounts"
on public.witness_accounts for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own witness accounts" on public.witness_accounts;
create policy "Users can insert own witness accounts"
on public.witness_accounts for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own witness accounts" on public.witness_accounts;
create policy "Users can update own witness accounts"
on public.witness_accounts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own witness accounts" on public.witness_accounts;
create policy "Users can delete own witness accounts"
on public.witness_accounts for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.witness_accounts to authenticated;
grant select, insert, update, delete on public.witness_accounts to service_role;

-- witness_account_claim_links --------------------------------------------

create table if not exists public.witness_account_claim_links (
  id uuid primary key default gen_random_uuid(),
  witness_account_id uuid not null references public.witness_accounts(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  linked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  unique (witness_account_id, claim_id)
);

create index if not exists witness_account_claim_links_account_idx on public.witness_account_claim_links(witness_account_id);
create index if not exists witness_account_claim_links_claim_idx on public.witness_account_claim_links(claim_id);

alter table public.witness_account_claim_links enable row level security;

drop policy if exists "Users can read own witness claim links" on public.witness_account_claim_links;
create policy "Users can read own witness claim links"
on public.witness_account_claim_links for select to authenticated
using (exists (select 1 from public.witness_accounts wa where wa.id = witness_account_claim_links.witness_account_id and wa.user_id = auth.uid()));

drop policy if exists "Users can insert own witness claim links" on public.witness_account_claim_links;
create policy "Users can insert own witness claim links"
on public.witness_account_claim_links for insert to authenticated
with check (
  exists (select 1 from public.witness_accounts wa where wa.id = witness_account_claim_links.witness_account_id and wa.user_id = auth.uid())
  and exists (select 1 from public.claims c where c.id = witness_account_claim_links.claim_id and c.user_id = auth.uid())
);

drop policy if exists "Users can delete own witness claim links" on public.witness_account_claim_links;
create policy "Users can delete own witness claim links"
on public.witness_account_claim_links for delete to authenticated
using (exists (select 1 from public.witness_accounts wa where wa.id = witness_account_claim_links.witness_account_id and wa.user_id = auth.uid()));

grant select, insert, delete on public.witness_account_claim_links to authenticated;
grant select, insert, update, delete on public.witness_account_claim_links to service_role;

-- witness_account_document_links -----------------------------------------
-- Tilstedeværelse av en rad her = "faktisk skriftlig erklæring finnes".
-- Ingen egen boolsk status-kolonne noe sted - utledes alltid herfra.

create table if not exists public.witness_account_document_links (
  id uuid primary key default gen_random_uuid(),
  witness_account_id uuid not null references public.witness_accounts(id) on delete cascade,
  document_id uuid not null references public.case_documents(id) on delete cascade,
  linked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  unique (witness_account_id, document_id)
);

create index if not exists witness_account_document_links_account_idx on public.witness_account_document_links(witness_account_id);
create index if not exists witness_account_document_links_document_idx on public.witness_account_document_links(document_id);

alter table public.witness_account_document_links enable row level security;

drop policy if exists "Users can read own witness document links" on public.witness_account_document_links;
create policy "Users can read own witness document links"
on public.witness_account_document_links for select to authenticated
using (exists (select 1 from public.witness_accounts wa where wa.id = witness_account_document_links.witness_account_id and wa.user_id = auth.uid()));

drop policy if exists "Users can insert own witness document links" on public.witness_account_document_links;
create policy "Users can insert own witness document links"
on public.witness_account_document_links for insert to authenticated
with check (
  exists (select 1 from public.witness_accounts wa where wa.id = witness_account_document_links.witness_account_id and wa.user_id = auth.uid())
  and exists (select 1 from public.case_documents cd where cd.id = witness_account_document_links.document_id and cd.user_id = auth.uid())
);

drop policy if exists "Users can delete own witness document links" on public.witness_account_document_links;
create policy "Users can delete own witness document links"
on public.witness_account_document_links for delete to authenticated
using (exists (select 1 from public.witness_accounts wa where wa.id = witness_account_document_links.witness_account_id and wa.user_id = auth.uid()));

grant select, insert, delete on public.witness_account_document_links to authenticated;
grant select, insert, update, delete on public.witness_account_document_links to service_role;

-- claim_documentation_suggestions -----------------------------------------
-- KI sine kontekstuelle forslag til hva brukeren kan lete etter for å
-- styrke en påstand. Append-only, samme mønster som claim_assessments.

create table if not exists public.claim_documentation_suggestions (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,

  suggestions jsonb not null default '[]'::jsonb,
  model text,

  created_at timestamptz not null default now()
);

create index if not exists claim_documentation_suggestions_claim_idx on public.claim_documentation_suggestions(claim_id);

alter table public.claim_documentation_suggestions enable row level security;

drop policy if exists "Users can read own documentation suggestions" on public.claim_documentation_suggestions;
create policy "Users can read own documentation suggestions"
on public.claim_documentation_suggestions for select to authenticated
using (exists (select 1 from public.claims c where c.id = claim_documentation_suggestions.claim_id and c.user_id = auth.uid()));

drop policy if exists "Users can insert own documentation suggestions" on public.claim_documentation_suggestions;
create policy "Users can insert own documentation suggestions"
on public.claim_documentation_suggestions for insert to authenticated
with check (exists (select 1 from public.claims c where c.id = claim_documentation_suggestions.claim_id and c.user_id = auth.uid()));

grant select, insert on public.claim_documentation_suggestions to authenticated;
grant select, insert, update, delete on public.claim_documentation_suggestions to service_role;

-- claim_assessments: additive utvidelse ------------------------------------
-- Vitneopplysninger skal ha egen tydelig identitet i vurderingen, aldri
-- blandes inn i evidence_breakdown (som er forbeholdt dokumenter).
-- corroboration_note: kort, forsiktig notat når uavhengige kildetyper
-- (dokument, vitne, tidslinje) samlet peker samme vei.

alter table public.claim_assessments
add column if not exists witness_breakdown jsonb not null default '[]'::jsonb;

alter table public.claim_assessments
add column if not exists corroboration_note text;
