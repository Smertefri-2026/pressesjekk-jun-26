-- Sporing av faktisk Stripe-refusjon på user_purchases.
-- Additiv og idempotent - rører ikke eksisterende rader/data.

alter table public.user_purchases
add column if not exists stripe_refund_id text,
add column if not exists refunded_at timestamptz;

create index if not exists user_purchases_stripe_refund_id_idx
on public.user_purchases(stripe_refund_id);
