create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  package_id text not null,

  status text not null default 'active',

  included_cases_per_month integer not null default 0,
  used_cases_current_period integer not null default 0,

  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,

  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_session_id text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_subscriptions_package_id_check check (
    package_id in (
      'monthly_start',
      'monthly_pro',
      'monthly_agency',
      'monthly_enterprise'
    )
  ),

  constraint user_subscriptions_status_check check (
    status in (
      'active',
      'trialing',
      'past_due',
      'cancelled',
      'unpaid',
      'incomplete',
      'incomplete_expired'
    )
  ),

  constraint user_subscriptions_used_cases_check check (
    used_cases_current_period >= 0
  ),

  constraint user_subscriptions_included_cases_check check (
    included_cases_per_month >= 0
  )
);

alter table public.user_subscriptions enable row level security;

drop policy if exists "Users can view own subscriptions" on public.user_subscriptions;
create policy "Users can view own subscriptions"
on public.user_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can view all subscriptions" on public.user_subscriptions;
create policy "Admins can view all subscriptions"
on public.user_subscriptions
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

drop policy if exists "Admins can update subscriptions" on public.user_subscriptions;
create policy "Admins can update subscriptions"
on public.user_subscriptions
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.is_admin = true
  )
);

grant select, update on table public.user_subscriptions to authenticated;
grant all on table public.user_subscriptions to service_role;

create index if not exists user_subscriptions_user_id_idx
on public.user_subscriptions(user_id);

create index if not exists user_subscriptions_status_idx
on public.user_subscriptions(status);

create unique index if not exists user_subscriptions_stripe_subscription_id_unique_idx
on public.user_subscriptions(stripe_subscription_id)
where stripe_subscription_id is not null;

create unique index if not exists user_subscriptions_stripe_checkout_session_id_unique_idx
on public.user_subscriptions(stripe_checkout_session_id)
where stripe_checkout_session_id is not null;

create or replace function public.set_user_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_subscriptions_updated_at
on public.user_subscriptions;

create trigger set_user_subscriptions_updated_at
before update on public.user_subscriptions
for each row
execute function public.set_user_subscriptions_updated_at();
