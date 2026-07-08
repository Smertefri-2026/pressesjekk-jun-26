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

async function recordCheckoutSessionPurchase(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  const userId = metadata.user_id;
  const packageId = metadata.package_id as PackagePlanId | undefined;

  if (!userId || !packageId) {
    throw new Error("Stripe session mangler user_id eller package_id");
  }

  const plan = getStripeCheckoutPlan(packageId);

  if (!plan) {
    throw new Error(`Ukjent package_id fra Stripe: ${packageId}`);
  }

  const supabase = getSupabaseServiceClient();
  const includedCases = includedCasesForPackage(packageId);
  const amountPaid = session.amount_total ?? plan.amount;
  const currency = session.currency ?? plan.currency;

  const receiptUrl =
    typeof session.invoice === "string"
      ? null
      : session.invoice?.hosted_invoice_url ?? null;

  const { error } = await supabase.from("user_purchases").upsert(
    {
      user_id: userId,
      case_id: null,
      package_id: packageId,
      purchase_type: plan.mode === "subscription" ? "subscription" : "new_purchase",
      status: "paid",
      amount_paid: amountPaid,
      amount_original: plan.amount,
      amount_credit: 0,
      currency,
      included_cases: includedCases,
      used_cases: 0,
      source:
        plan.mode === "subscription"
          ? "stripe_checkout_subscription"
          : "stripe_checkout",
      stripe_checkout_session_id: session.id,
      stripe_customer_id:
        typeof session.customer === "string" ? session.customer : null,
      stripe_subscription_id:
        typeof session.subscription === "string" ? session.subscription : null,
      stripe_receipt_url: receiptUrl,
      refund_status: "none",
      metadata: {
        stripe_metadata: metadata,
        stripe_mode: session.mode,
        stripe_invoice:
          typeof session.invoice === "string" ? session.invoice : null,
      },
    },
    {
      onConflict: "stripe_checkout_session_id",
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

async function activateSubscription(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  const userId = metadata.user_id;
  const packageId = metadata.package_id as PackagePlanId | undefined;

  if (!userId || !packageId) {
    throw new Error("Stripe session mangler user_id eller package_id");
  }

  const plan = getStripeCheckoutPlan(packageId);

  if (!plan || plan.mode !== "subscription") {
    return;
  }

  const stripe = getStripe();
  const supabase = getSupabaseServiceClient();
  const includedCases = includedCasesForPackage(packageId);

  let subscription: Stripe.Subscription | null = null;

  if (typeof session.subscription === "string") {
    subscription = await stripe.subscriptions.retrieve(session.subscription);
  }

  const subscriptionWithPeriod = subscription as
    | (Stripe.Subscription & {
        current_period_start?: number;
        current_period_end?: number;
      })
    | null;

  const currentPeriodStart =
    subscriptionWithPeriod?.current_period_start
      ? new Date(subscriptionWithPeriod.current_period_start * 1000).toISOString()
      : null;

  const currentPeriodEnd =
    subscriptionWithPeriod?.current_period_end
      ? new Date(subscriptionWithPeriod.current_period_end * 1000).toISOString()
      : null;

  const { error } = await supabase.from("user_subscriptions").upsert(
    {
      user_id: userId,
      package_id: packageId,
      status: subscription?.status ?? "active",
      included_cases_per_month: includedCases,
      used_cases_current_period: 0,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: subscription?.cancel_at_period_end ?? false,
      stripe_customer_id:
        typeof session.customer === "string" ? session.customer : null,
      stripe_subscription_id:
        typeof session.subscription === "string" ? session.subscription : null,
      stripe_checkout_session_id: session.id,
      metadata: {
        stripe_metadata: metadata,
        stripe_subscription_status: subscription?.status ?? null,
      },
    },
    {
      onConflict: "stripe_subscription_id",
    }
  );

  if (error) {
    throw new Error(error.message);
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

async function recordPaymentIntentPurchase({
  paymentIntent,
  userId,
  caseId,
  packageId,
  includedCases,
}: {
  paymentIntent: Stripe.PaymentIntent;
  userId: string;
  caseId: string | null;
  packageId: PackagePlanId;
  includedCases: number | null;
}) {
  const metadata = paymentIntent.metadata ?? {};
  const supabase = getSupabaseServiceClient();

  const amountPaid = paymentIntent.amount_received || paymentIntent.amount || 0;
  const plan = packageId ? getStripeCheckoutPlan(packageId) : null;
  const fallbackAmountOriginal =
    Number(metadata.amount_to_pay || amountPaid) || amountPaid;
  const amountOriginal = plan?.amount ?? fallbackAmountOriginal;

  const previousPackageId = metadata.previous_package_id
    ? (metadata.previous_package_id as PackagePlanId)
    : null;

  const previousPlan = previousPackageId
    ? getStripeCheckoutPlan(previousPackageId)
    : null;

  const amountCredit = previousPlan?.amount ?? 0;

  let receiptUrl: string | null = null;
  let chargeId: string | null = null;

  const latestCharge = paymentIntent.latest_charge;

  if (typeof latestCharge === "string") {
    chargeId = latestCharge;

    try {
      const stripe = getStripe();
      const charge = await stripe.charges.retrieve(latestCharge);
      receiptUrl = charge.receipt_url ?? null;
    } catch (error) {
      console.warn("Kunne ikke hente Stripe charge/receipt", {
        paymentIntentId: paymentIntent.id,
        latestCharge,
        error,
      });
    }
  }

  const purchaseType = caseId
    ? "case_upgrade"
    : packageId === "investigation_pack"
      ? "investigation"
      : "new_purchase";

  const { error } = await supabase.from("user_purchases").upsert(
    {
      user_id: userId,
      case_id: caseId,
      package_id: packageId,
      purchase_type: purchaseType,
      status: "paid",
      amount_paid: amountPaid,
      amount_original: amountOriginal,
      amount_credit: amountCredit,
      currency: paymentIntent.currency || "nok",
      included_cases: includedCases,
      used_cases: 0,
      source: "stripe_payment_element",
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id: chargeId,
      stripe_customer_id:
        typeof paymentIntent.customer === "string" ? paymentIntent.customer : null,
      stripe_receipt_url: receiptUrl,
      refund_status: "none",
      metadata: {
        stripe_metadata: metadata,
        payment_method_types: paymentIntent.payment_method_types,
      },
    },
    {
      onConflict: "stripe_payment_intent_id",
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  console.log("Lagret kjøpshistorikk", {
    paymentIntentId: paymentIntent.id,
    userId,
    caseId,
    packageId,
    purchaseType,
    amountPaid,
  });
}

async function activatePaymentIntentEntitlement(
  paymentIntent: Stripe.PaymentIntent
) {
  const metadata = paymentIntent.metadata ?? {};
  const userId = metadata.user_id;
  const caseId = metadata.case_id;
  const packageId = metadata.package_id as PackagePlanId | undefined;

  if (!userId || !packageId) {
    throw new Error("Stripe payment intent mangler user_id eller package_id");
  }

  const plan = getStripeCheckoutPlan(packageId);

  if (!plan || !isEntitlementPackage(packageId)) {
    throw new Error(`Ukjent entitlement package_id fra Stripe: ${packageId}`);
  }

  if (plan.mode !== "payment") {
    throw new Error("PaymentIntent kan bare aktivere engangskjøp.");
  }

  const supabase = getSupabaseServiceClient();

  if (caseId) {
    const { data: existingAccess, error: existingError } = await supabase
      .from("case_access")
      .select("id, stripe_checkout_session_id")
      .eq("case_id", caseId)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message);
    }

    if (existingAccess?.stripe_checkout_session_id === paymentIntent.id) {
      console.log("PaymentIntent-case_access finnes allerede", {
        paymentIntentId: paymentIntent.id,
        caseId,
      });

      await recordPaymentIntentPurchase({
        paymentIntent,
        userId,
        caseId,
        packageId,
        includedCases: 1,
      });

      return;
    }

    const { error } = await supabase.from("case_access").upsert(
      {
        case_id: caseId,
        user_id: userId,
        package_id: plan.packageId,
        status: "active",
        source: "stripe_payment_element",
        stripe_checkout_session_id: paymentIntent.id,
        stripe_customer_id:
          typeof paymentIntent.customer === "string" ? paymentIntent.customer : null,
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "case_id",
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    console.log("Oppgraderte sak via PaymentIntent", {
      paymentIntentId: paymentIntent.id,
      userId,
      caseId,
      packageId,
    });

    await recordPaymentIntentPurchase({
      paymentIntent,
      userId,
      caseId,
      packageId,
      includedCases: 1,
    });

    return;
  }

  const includedCases = includedCasesForPackage(packageId);

  const { data: existingEntitlement, error: existingError } = await supabase
    .from("user_case_entitlements")
    .select("id")
    .eq("stripe_checkout_session_id", paymentIntent.id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingEntitlement) {
    console.log("PaymentIntent-entitlement finnes allerede", {
      paymentIntentId: paymentIntent.id,
      entitlementId: existingEntitlement.id,
    });

    await recordPaymentIntentPurchase({
      paymentIntent,
      userId,
      caseId: null,
      packageId,
      includedCases,
    });

    return;
  }

  const { error } = await supabase.from("user_case_entitlements").insert({
    user_id: userId,
    package_id: packageId,
    included_cases: includedCases,
    used_cases: 0,
    status: "active",
    source: "stripe_payment_element",
    stripe_checkout_session_id: paymentIntent.id,
    stripe_customer_id:
      typeof paymentIntent.customer === "string" ? paymentIntent.customer : null,
    stripe_subscription_id: null,
  });

  if (error) {
    throw new Error(error.message);
  }

  console.log("Lagret PaymentIntent-entitlement", {
    paymentIntentId: paymentIntent.id,
    userId,
    packageId,
  });

  await recordPaymentIntentPurchase({
    paymentIntent,
    userId,
    caseId: null,
    packageId,
    includedCases,
  });
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "PresseSjekk Stripe webhook er aktiv. Stripe skal sende POST-kall hit.",
  });
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
        await recordCheckoutSessionPurchase(session);
        await activateSubscription(session);
      }
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const metadata = paymentIntent.metadata ?? {};

      if (!metadata.user_id || !metadata.package_id) {
        console.warn("Ignorerer payment_intent.succeeded uten PresseSjekk-metadata", {
          paymentIntentId: paymentIntent.id,
          metadata,
        });

        return NextResponse.json({ received: true, ignored: true });
      }

      await activatePaymentIntentEntitlement(paymentIntent);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook-feil.";
    console.error("Stripe webhook feilet", { message, error });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
