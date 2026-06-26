import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { getStripeCheckoutPlan } from "@/lib/stripe/plans";

export const runtime = "nodejs";

async function activateCaseAccess(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  const userId = metadata.user_id;
  const caseId = metadata.case_id;
  const packageId = metadata.package_id;

  if (!userId || !caseId || !packageId) {
    throw new Error("Stripe session mangler user_id, case_id eller package_id");
  }

  const plan = getStripeCheckoutPlan(packageId);

  if (!plan) {
    throw new Error(`Ukjent package_id fra Stripe: ${packageId}`);
  }

  const supabase = getSupabaseServiceClient();

  const { error } = await supabase.from("case_access").upsert(
    {
      user_id: userId,
      case_id: caseId,
      package_id: plan.packageId,
      status: "active",
      source: "stripe_checkout",
      stripe_checkout_session_id: session.id,
      stripe_customer_id:
        typeof session.customer === "string" ? session.customer : null,
      stripe_subscription_id:
        typeof session.subscription === "string" ? session.subscription : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "case_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret === "midlertidig") {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET er ikke satt riktig." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Mangler stripe-signature header." },
      { status: 400 }
    );
  }

  const rawBody = Buffer.from(await request.arrayBuffer());

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kunne ikke verifisere webhook.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await activateCaseAccess(event.data.object as Stripe.Checkout.Session);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook-feil.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
