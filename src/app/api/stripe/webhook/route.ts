import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { getStripeCheckoutPlan } from "@/lib/stripe/plans";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import type { PackagePlanId } from "@/data/packagePlans";

function includedCasesForPackage(packageId: PackagePlanId) {
  if (packageId === "case_bundle_3") return 3;
  if (packageId === "case_bundle_5") return 5;
  if (packageId === "case_bundle_10") return 10;

  if (packageId === "monthly_start") return 3;
  if (packageId === "monthly_pro") return 15;
  if (packageId === "monthly_agency") return 50;

  return 1;
}

function isEntitlementPackage(packageId: PackagePlanId) {
  return (
    packageId === "report_pack" ||
    packageId === "pfu_pack" ||
    packageId === "full_pack" ||
    packageId === "investigation_pack" ||
    packageId === "case_bundle_3" ||
    packageId === "case_bundle_5" ||
    packageId === "case_bundle_10" ||
    packageId === "monthly_start" ||
    packageId === "monthly_pro" ||
    packageId === "monthly_agency" ||
    packageId === "monthly_enterprise"
  );
}

async function activateCaseAccess(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  const userId = metadata.user_id;
  const caseId = metadata.case_id;
  const packageId = metadata.package_id as PackagePlanId | undefined;

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
      case_id: caseId,
      user_id: userId,
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
    {
      onConflict: "case_id",
    }
  );

  if (error) {
    console.error("Feil ved lagring av user_case_entitlement", {
      sessionId: session.id,
      userId,
      packageId,
      error,
    });

    throw new Error(error.message);
  }

  console.log("Lagret user_case_entitlement", {
    sessionId: session.id,
    userId,
    packageId,
    includedCases,
  });

  const creditEntitlementIds = String(
    metadata.credit_entitlement_ids ?? ""
  )
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (creditEntitlementIds.length > 0) {
    const { error: creditError } = await supabase
      .from("user_case_entitlements")
      .update({
        status: "expired",
        source: "converted_to_new_purchase",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .in("id", creditEntitlementIds);

    if (creditError) {
      throw new Error(creditError.message);
    }
  }
}

async function activateUserEntitlement(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  const userId = metadata.user_id;
  const packageId = metadata.package_id as PackagePlanId | undefined;

  if (!userId || !packageId) {
    throw new Error("Stripe session mangler user_id eller package_id");
  }

  const plan = getStripeCheckoutPlan(packageId);

  if (!plan || !isEntitlementPackage(packageId)) {
    throw new Error(`Ukjent entitlement package_id fra Stripe: ${packageId}`);
  }

  const supabase = getSupabaseServiceClient();
  const includedCases = includedCasesForPackage(packageId);

  const { error } = await supabase.from("user_case_entitlements").insert({
    user_id: userId,
    package_id: packageId,
    included_cases: includedCases,
    used_cases: 0,
    status: "active",
    source: "stripe_checkout",
    stripe_checkout_session_id: session.id,
    stripe_customer_id:
      typeof session.customer === "string" ? session.customer : null,
    stripe_subscription_id:
      typeof session.subscription === "string" ? session.subscription : null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET mangler." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Stripe signature mangler." },
      { status: 400 }
    );
  }

  const rawBody = await request.text();

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
      const session = event.data.object as Stripe.Checkout.Session;
      const caseId = session.metadata?.case_id;

      if (caseId) {
        await activateCaseAccess(session);
      } else {
        const metadata = session.metadata ?? {};

        if (!metadata.user_id || !metadata.package_id) {
          console.warn("Ignorerer checkout.session.completed uten PresseSjekk-metadata", {
            sessionId: session.id,
            metadata,
          });

          return NextResponse.json({ received: true, ignored: true });
        }

        await activateUserEntitlement(session);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook-feil.";
    console.error("Stripe webhook feilet", { message, error });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
