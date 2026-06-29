create table if not exists public.user_case_entitlements (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  package_id text not null,
  included_cases integer not null default 1,
  used_cases integer not null default 0,

  status text not null default 'active',
  source text not null default 'manual',

  stripe_checkout_session_id text,
  stripe_customer_id text,
  stripe_subscription_id text,

  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_case_entitlements_package_id_check check (
    package_id in (
      'report_pack',
      'pfu_pack',
      'full_pack',
      'investigation_pack',
      'case_bundle_3',
      'case_bundle_5',
      'case_bundle_10',
      'monthly_start',
      'monthly_pro',
      'monthly_agency',
      'monthly_enterprise'
    )
  ),

  constraint user_case_entitlements_status_check check (
    status in ('active', 'pending', 'cancelled', 'expired')
  ),

  constraint user_case_entitlements_cases_check check (
    included_cases >= 0 and used_cases >= 0 and used_cases <= included_cases
  )
);

alter table public.user_case_entitlements enable row level security;

drop policy if exists "Users can view own case entitlements" on public.user_case_entitlements;
create policy "Users can view own case entitlements"
on public.user_case_entitlements
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can view all case entitlements" on public.user_case_entitlements;
create policy "Admins can view all case entitlements"
on public.user_case_entitlements
for select
to authenticated
using (public.current_user_is_admin());

drop policy if exists "Admins can insert case entitlements" on public.user_case_entitlements;
create policy "Admins can insert case entitlements"
on public.user_case_entitlements
for insert
to authenticated
with check (public.current_user_is_admin());

drop policy if exists "Admins can update case entitlements" on public.user_case_entitlements;
create policy "Admins can update case entitlements"
on public.user_case_entitlements
for update
to authenticated
using (public.current_user_is_admin())
with check (public.current_user_is_admin());

drop policy if exists "Admins can delete case entitlements" on public.user_case_entitlements;
create policy "Admins can delete case entitlements"
on public.user_case_entitlements
for delete
to authenticated
using (public.current_user_is_admin());

grant select on public.user_case_entitlements to authenticated;
grant insert, update, delete on public.user_case_entitlements to authenticated;

create index if not exists user_case_entitlements_user_id_idx
on public.user_case_entitlements(user_id);

create index if not exists user_case_entitlements_status_idx
on public.user_case_entitlements(status);

create index if not exists user_case_entitlements_stripe_checkout_session_idx
on public.user_case_entitlements(stripe_checkout_session_id);

create or replace function public.set_user_case_entitlements_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_case_entitlements_updated_at
on public.user_case_entitlements;

create trigger set_user_case_entitlements_updated_at
before update on public.user_case_entitlements
for each row
execute function public.set_user_case_entitlements_updated_at();

grant usage on schema public to service_role;

grant select, insert, update, delete
on public.user_case_entitlements
to service_role;

grant usage, select
on all sequences in schema public
to service_role;

grant usage on schema public to service_role;

grant select, insert, update, delete
on public.cases
to service_role;

grant select, insert, update, delete
on public.case_access
to service_role;

grant select, insert, update, delete
on public.user_case_entitlements
to service_role;

grant usage, select
on all sequences in schema public
to service_role;
