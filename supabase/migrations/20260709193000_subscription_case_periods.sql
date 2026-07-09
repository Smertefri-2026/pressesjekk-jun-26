create table if not exists public.subscription_case_periods (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid not null references public.user_subscriptions(id) on delete cascade,

  package_id text not null,

  period_start timestamptz not null,
  period_end timestamptz not null,

  included_cases integer not null default 0,
  rollover_cases integer not null default 0,
  used_cases integer not null default 0,

  rollover_expires_at timestamptz,
  status text not null default 'active',

  stripe_subscription_id text,
  stripe_invoice_id text,
  stripe_event_id text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint subscription_case_periods_status_check
    check (status in ('active', 'closed', 'expired', 'cancelled')),

  constraint subscription_case_periods_cases_check
    check (
      included_cases >= 0
      and rollover_cases >= 0
      and used_cases >= 0
    )
);

create index if not exists subscription_case_periods_user_id_idx
  on public.subscription_case_periods(user_id);

create index if not exists subscription_case_periods_subscription_id_idx
  on public.subscription_case_periods(subscription_id);

create index if not exists subscription_case_periods_stripe_subscription_id_idx
  on public.subscription_case_periods(stripe_subscription_id);

create unique index if not exists subscription_case_periods_unique_period
  on public.subscription_case_periods(subscription_id, period_start, period_end);

alter table public.subscription_case_periods enable row level security;

drop policy if exists "Users can read own subscription periods"
  on public.subscription_case_periods;

create policy "Users can read own subscription periods"
  on public.subscription_case_periods
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage subscription periods"
  on public.subscription_case_periods;

create policy "Service role can manage subscription periods"
  on public.subscription_case_periods
  for all
  to service_role
  using (true)
  with check (true);

grant select on table public.subscription_case_periods to authenticated;
grant all on table public.subscription_case_periods to service_role;
