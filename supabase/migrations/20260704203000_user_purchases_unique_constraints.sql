-- Ensure PostgREST/Supabase upsert can use onConflict fields for purchase history

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_purchases_stripe_payment_intent_id_key'
  ) then
    alter table public.user_purchases
      add constraint user_purchases_stripe_payment_intent_id_key
      unique (stripe_payment_intent_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_purchases_stripe_checkout_session_id_key'
  ) then
    alter table public.user_purchases
      add constraint user_purchases_stripe_checkout_session_id_key
      unique (stripe_checkout_session_id);
  end if;
end $$;
