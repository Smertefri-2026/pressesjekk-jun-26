/**
 * Kanonisk rad-form for `user_purchases` (supabase/migrations/20260704090000_user_purchases.sql).
 * Sidefiler som kun henter et utvalg kolonner bruker `Pick<PurchaseRow, ...>`
 * fremfor å redefinere typen lokalt.
 */
export type PurchaseRow = {
  id: string;
  user_id: string;
  case_id: string | null;
  package_id: string;
  purchase_type: string;
  status: string;
  amount_paid: number;
  amount_original: number | null;
  amount_credit: number;
  currency: string;
  included_cases: number | null;
  used_cases: number;
  source: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_charge_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_invoice_id: string | null;
  stripe_receipt_url: string | null;
  refund_status: string;
  refund_requested_at: string | null;
  refunded_amount: number;
  refund_note: string | null;
  created_at: string;
};
