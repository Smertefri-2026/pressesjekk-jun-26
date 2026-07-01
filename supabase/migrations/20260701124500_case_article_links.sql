create table if not exists public.case_article_links (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text,
  media_name text,
  published_date date,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint case_article_links_url_not_blank check (length(trim(url)) > 0),
  constraint case_article_links_sort_order_check check (sort_order >= 0)
);

create index if not exists case_article_links_case_id_idx
on public.case_article_links(case_id);

create index if not exists case_article_links_user_id_idx
on public.case_article_links(user_id);

create unique index if not exists case_article_links_one_primary_per_case_idx
on public.case_article_links(case_id)
where is_primary = true;

create unique index if not exists case_article_links_unique_url_per_case_idx
on public.case_article_links(case_id, url);

alter table public.case_article_links enable row level security;

drop policy if exists "Users can read own case article links" on public.case_article_links;
create policy "Users can read own case article links"
on public.case_article_links
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own case article links" on public.case_article_links;
create policy "Users can insert own case article links"
on public.case_article_links
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.cases
    where cases.id = case_article_links.case_id
      and cases.user_id = auth.uid()
  )
);

drop policy if exists "Users can update own case article links" on public.case_article_links;
create policy "Users can update own case article links"
on public.case_article_links
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.cases
    where cases.id = case_article_links.case_id
      and cases.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete own case article links" on public.case_article_links;
create policy "Users can delete own case article links"
on public.case_article_links
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.enforce_case_article_links_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  link_count integer;
begin
  select count(*)
  into link_count
  from public.case_article_links
  where case_id = new.case_id
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  if link_count >= 5 then
    raise exception 'Maks 5 artikkellenker per sak.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_case_article_links_limit_trigger on public.case_article_links;
create trigger enforce_case_article_links_limit_trigger
before insert on public.case_article_links
for each row
execute function public.enforce_case_article_links_limit();

create or replace function public.set_case_article_links_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_case_article_links_updated_at_trigger on public.case_article_links;
create trigger set_case_article_links_updated_at_trigger
before update on public.case_article_links
for each row
execute function public.set_case_article_links_updated_at();

insert into public.case_article_links (
  case_id,
  user_id,
  url,
  title,
  media_name,
  published_date,
  is_primary,
  sort_order
)
select
  id,
  user_id,
  article_url,
  article_title,
  media_name,
  published_date,
  true,
  0
from public.cases
where article_url is not null
  and length(trim(article_url)) > 0
on conflict do nothing;

grant select, insert, update, delete on public.case_article_links to authenticated;
grant select, insert, update, delete on public.case_article_links to service_role;
