import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireAdmin } from "@/lib/access/requireAdmin";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/stripe/server";
import type { PurchaseRow as FullPurchaseRow } from "@/lib/purchases/types";

type RouteContext = {
  params: Promise<{ purchaseId: string }>;
};

type Decision = "approve" | "reject" | "refund";

type PurchaseRow = Pick<
  FullPurchaseRow,
  | "id"
  | "user_id"
  | "case_id"
  | "package_id"
  | "purchase_type"
  | "status"
  | "refund_status"
  | "amount_paid"
  | "currency"
  | "stripe_payment_intent_id"
  | "stripe_charge_id"
  | "stripe_checkout_session_id"
  | "refund_note"
>;

function isDecision(value: unknown): value is Decision {
  return value === "approve" || value === "reject" || value === "refund";
}

function appendNote(existing: string | null, addition: string) {
  const stamp = new Date().toISOString();
  const line = `[${stamp}] ${addition}`;
  return existing ? `${existing}\n${line}` : line;
}

/**
 * Trekker tilbake tilgangen refusjonen gjaldt - kun etter bekreftet
 * Stripe-refusjon, aldri før. Konservativt av design:
 * - case-spesifikke kjøp: case_access settes til 'cancelled', men KUN hvis
 *   saken fortsatt står på nøyaktig den pakken dette kjøpet gjaldt (hvis
 *   saken siden er oppgradert av et annet kjøp, rører vi den ikke - det
 *   krever manuell vurdering, siden en nyere, fortsatt betalt oppgradering
 *   ellers ville blitt slettet ved et uhell).
 * - pakke-/bunt-kjøp uten case_id: tilhørende user_case_entitlements-rad
 *   (matchet på Stripe-referanse) settes til 'cancelled'.
 * - abonnement: røres bevisst IKKE automatisk her - å kansellere et løpende
 *   abonnement er en egen beslutning, se rapport.
 */
async function revokeAccessForPurchase(
  service: ReturnType<typeof getSupabaseServiceClient>,
  purchase: PurchaseRow
): Promise<string> {
  if (purchase.purchase_type === "subscription") {
    return "Abonnement - tilgang IKKE trukket automatisk. Vurder manuelt i Stripe/Min Side.";
  }

  if (purchase.case_id) {
    const { data: access } = await service
      .from("case_access")
      .select("case_id,package_id,status")
      .eq("case_id", purchase.case_id)
      .maybeSingle();

    if (!access) {
      return "Fant ingen case_access-rad å trekke tilbake.";
    }

    if (access.package_id !== purchase.package_id) {
      return `case_access rørt IKKE - saken har siden fått pakken "${access.package_id}" (dette kjøpet gjaldt "${purchase.package_id}"). Vurder manuelt.`;
    }

    const { error } = await service
      .from("case_access")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("case_id", purchase.case_id);

    if (error) {
      return `Kunne ikke trekke tilbake case_access: ${error.message}`;
    }

    return "case_access satt til cancelled.";
  }

  const stripeRef = purchase.stripe_payment_intent_id ?? purchase.stripe_checkout_session_id;

  if (!stripeRef) {
    return "Fant ingen Stripe-referanse å matche mot user_case_entitlements.";
  }

  const { data: entitlement } = await service
    .from("user_case_entitlements")
    .select("id,status")
    .eq("stripe_checkout_session_id", stripeRef)
    .maybeSingle();

  if (!entitlement) {
    return "Fant ingen user_case_entitlements-rad å trekke tilbake.";
  }

  const { error } = await service
    .from("user_case_entitlements")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", entitlement.id);

  if (error) {
    return `Kunne ikke trekke tilbake entitlement: ${error.message}`;
  }

  return "user_case_entitlements satt til cancelled.";
}

export async function POST(request: NextRequest, context: RouteContext) {
  const admin = await requireAdmin(request);

  if (!admin.ok) {
    return jsonError(admin.error, admin.status);
  }

  const { purchaseId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { decision?: unknown };

  if (!isDecision(body.decision)) {
    return jsonError('decision må være "approve", "reject" eller "refund".', 400);
  }

  const decision = body.decision;
  const service = getSupabaseServiceClient();

  const { data: purchase, error: purchaseError } = await service
    .from("user_purchases")
    .select(
      "id,user_id,case_id,package_id,purchase_type,status,refund_status,amount_paid,currency,stripe_payment_intent_id,stripe_charge_id,stripe_checkout_session_id,refund_note"
    )
    .eq("id", purchaseId)
    .maybeSingle();

  if (purchaseError) {
    return jsonError(purchaseError.message, 500);
  }

  if (!purchase) {
    return jsonError("Fant ikke kjøpet.", 404);
  }

  const row = purchase as PurchaseRow;

  if (decision === "approve") {
    if (row.refund_status !== "requested") {
      return jsonError(
        `Kan bare godkjenne kjøp med status "requested" (nåværende: "${row.refund_status}").`,
        400
      );
    }

    const { data: updated, error } = await service
      .from("user_purchases")
      .update({
        refund_status: "approved",
        refund_note: appendNote(row.refund_note, `Godkjent av admin ${admin.user.id}.`),
      })
      .eq("id", purchaseId)
      .select("id,refund_status,refund_note")
      .single();

    if (error) return jsonError(error.message, 500);

    console.log("Refusjon godkjent", { adminUserId: admin.user.id, purchaseId });

    return jsonOk({ purchase: updated });
  }

  if (decision === "reject") {
    if (row.refund_status !== "requested" && row.refund_status !== "approved") {
      return jsonError(
        `Kan ikke avvise kjøp med status "${row.refund_status}".`,
        400
      );
    }

    const { data: updated, error } = await service
      .from("user_purchases")
      .update({
        refund_status: "rejected",
        refunded_amount: 0,
        refund_note: appendNote(row.refund_note, `Avvist av admin ${admin.user.id}.`),
      })
      .eq("id", purchaseId)
      .select("id,refund_status,refund_note")
      .single();

    if (error) return jsonError(error.message, 500);

    console.log("Refusjon avvist", { adminUserId: admin.user.id, purchaseId });

    return jsonOk({ purchase: updated });
  }

  // decision === "refund" - eneste gren som faktisk flytter penger.
  if (row.refund_status !== "approved") {
    return jsonError(
      `Refusjon må være godkjent ("approved") før den kan utføres i Stripe (nåværende: "${row.refund_status}").`,
      400
    );
  }

  const stripe = getStripe();
  const refundTarget = row.stripe_payment_intent_id
    ? { payment_intent: row.stripe_payment_intent_id }
    : row.stripe_charge_id
      ? { charge: row.stripe_charge_id }
      : null;

  if (!refundTarget) {
    return jsonError(
      "Mangler Stripe payment_intent/charge-referanse på kjøpet - kan ikke refundere automatisk.",
      400
    );
  }

  let refund;
  try {
    refund = await stripe.refunds.create(refundTarget);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukjent Stripe-feil.";

    console.error("Stripe-refusjon feilet", {
      adminUserId: admin.user.id,
      purchaseId,
      error: message,
    });

    return jsonError(`Stripe-refusjon feilet: ${message}`, 502);
  }

  const refundedAt = new Date().toISOString();

  const { data: updated, error: updateError } = await service
    .from("user_purchases")
    .update({
      status: "refunded",
      refund_status: "refunded",
      refunded_amount: row.amount_paid,
      stripe_refund_id: refund.id,
      refunded_at: refundedAt,
      refund_note: appendNote(
        row.refund_note,
        `Refundert i Stripe av admin ${admin.user.id} (refund_id=${refund.id}).`
      ),
    })
    .eq("id", purchaseId)
    .select(
      "id,status,refund_status,refunded_amount,stripe_refund_id,refunded_at,refund_note"
    )
    .single();

  if (updateError) {
    // Stripe-refusjonen har allerede skjedd her - vi kan ikke late som den
    // ikke gjorde det. Rapporter tydelig at databasen må rettes manuelt.
    console.error("Stripe refundert, men kunne ikke oppdatere user_purchases", {
      adminUserId: admin.user.id,
      purchaseId,
      stripeRefundId: refund.id,
      error: updateError.message,
    });

    return jsonError(
      `Refusjon ble gjennomført i Stripe (refund_id=${refund.id}), men kunne ikke lagres: ${updateError.message}. Rett opp manuelt.`,
      500
    );
  }

  const accessResult = await revokeAccessForPurchase(service, row);

  console.log("Refusjon fullført", {
    adminUserId: admin.user.id,
    purchaseId,
    stripeRefundId: refund.id,
    accessResult,
  });

  return jsonOk({ purchase: updated, accessResult });
}
