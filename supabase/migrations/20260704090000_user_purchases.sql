create table if not exists public.user_purchases (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,

  package_id text not null,
  purchase_type text not null default 'new_purchase',
  status text not null default 'paid',

  amount_paid integer not null default 0,
  amount_original integer,
  amount_credit integer not null default 0,
  currency text not null default 'nok',

  included_cases integer,
  used_cases integer not null default 0,

  source text not null default 'stripe_payment_element',

  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  stripe_charge_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_invoice_id text,
  stripe_receipt_url text,

  refund_status text not null default 'none',
  refund_requested_at timestamptz,
  refunded_amount integer not null default 0,
  refund_note text,

  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint user_purchases_purchase_type_check check (
    purchase_type in (
      'new_purchase',
      'case_upgrade',
      'subscription',
      'investigation',
      'manual'
    )
  ),

  constraint user_purchases_status_check check (
    status in (
      'pending',
      'paid',
      'failed',
      'cancelled',
      'refunded',
      'partially_refunded'
    )
  ),

  constraint user_purchases_refund_status_check check (
    refund_status in (
      'none',
      'requested',
      'approved',
      'rejected',
      'refunded',
      'partially_refunded'
    )
  ),

  constraint user_purchases_amounts_check check (
    amount_paid >= 0
    and amount_credit >= 0
    and refunded_amount >= 0
  )
);

alter table public.user_purchases enable row level security;

drop policy if exists "Users can view own purchases" on public.user_purchases;
create policy "Users can view own purchases"
on public.user_purchases
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can view all purchases" on public.user_purchases;
create policy "Admins can view all purchases"
on public.user_purchases
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  )
);

drop policy if exists "Admins can update purchases" on public.user_purchases;
create policy "Admins can update purchases"
on public.user_purchases
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  )
);

grant select on public.user_purchases to authenticated;
grant insert, update, delete on public.user_purchases to service_role;

create index if not exists user_purchases_user_id_idx
on public.user_purchases(user_id);

create index if not exists user_purchases_case_id_idx
on public.user_purchases(case_id);

create index if not exists user_purchases_package_id_idx
on public.user_purchases(package_id);

create index if not exists user_purchases_status_idx
on public.user_purchases(status);

create unique index if not exists user_purchases_payment_intent_unique_idx
on public.user_purchases(stripe_payment_intent_id)
where stripe_payment_intent_id is not null;

create unique index if not exists user_purchases_checkout_session_unique_idx
on public.user_purchases(stripe_checkout_session_id)
where stripe_checkout_session_id is not null;

create or replace function public.set_user_purchases_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_purchases_updated_at
on public.user_purchases;

create trigger set_user_purchases_updated_at
before update on public.user_purchases
for each row
execute function public.set_user_purchases_updated_at();

-- Service role access for Stripe webhook purchase recording
grant all on table public.user_purchases to service_role;
grant usage on schema public to service_role;

drop policy if exists "Service role can insert purchases" on public.user_purchases;
create policy "Service role can insert purchases"
on public.user_purchases
for insert
to service_role
with check (true);

drop policy if exists "Service role can update purchases" on public.user_purchases;
create policy "Service role can update purchases"
on public.user_purchases
for update
to service_role
using (true)
with check (true);

drop policy if exists "Service role can select purchases" on public.user_purchases;
create policy "Service role can select purchases"
on public.user_purchases
for select
to service_role
using (true);
