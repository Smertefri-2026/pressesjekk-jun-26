import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/server";
import { getStripeCheckoutPlan } from "@/lib/stripe/plans";
import type { PackagePlanId } from "@/data/packagePlans";

const subscriptionPackageIds: PackagePlanId[] = [
  "monthly_start",
  "monthly_pro",
  "monthly_agency",
];

function isSubscriptionPackage(packageId: PackagePlanId) {
  return subscriptionPackageIds.includes(packageId);
}

function includedCasesForSubscription(packageId: PackagePlanId) {
  if (packageId === "monthly_start") return 3;
  if (packageId === "monthly_pro") return 15;
  if (packageId === "monthly_agency") return 50;
  return 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const packageId = String(body?.packageId || "") as PackagePlanId;

    const plan = getStripeCheckoutPlan(packageId);

    if (!plan || !isSubscriptionPackage(packageId)) {
      return NextResponse.json(
        { error: "Dette abonnementet kan ikke kjøpes her." },
        { status: 400 }
      );
    }

    if (plan.mode !== "subscription") {
      return NextResponse.json(
        { error: "Denne pakken er ikke et abonnement." },
        { status: 400 }
      );
    }

    if (plan.amount <= 0) {
      return NextResponse.json(
        { error: "Dette abonnementet må avtales manuelt." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase-miljøvariabler mangler." },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization") ?? "";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Du må være innlogget før abonnement kan startes." },
        { status: 401 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://pressesjekk.no";

    const stripe = getStripe();
    const includedCases = includedCasesForSubscription(packageId);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: plan.currency,
            unit_amount: plan.amount,
            recurring: {
              interval: "month",
            },
            product_data: {
              name: plan.name,
              description: plan.description,
            },
          },
        },
      ],
      metadata: {
        user_id: user.id,
        package_id: plan.packageId,
        included_cases: String(includedCases),
        source: "stripe_checkout_subscription",
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          package_id: plan.packageId,
          included_cases: String(includedCases),
          source: "stripe_checkout_subscription",
        },
      },
      success_url: `${origin}/min-side/kjop?subscription=success`,
      cancel_url: `${origin}/utsjekk?plan=${encodeURIComponent(
        plan.packageId
      )}&subscription=cancelled`,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Kunne ikke starte abonnement.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
