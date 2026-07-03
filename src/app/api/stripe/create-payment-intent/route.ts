import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/server";
import { getStripeCheckoutPlan } from "@/lib/stripe/plans";
import type { PackagePlanId } from "@/data/packagePlans";

const paymentIntentPackageIds: PackagePlanId[] = [
  "report_pack",
  "pfu_pack",
  "full_pack",
  "case_bundle_3",
  "case_bundle_5",
  "case_bundle_10",
];

function isPaymentIntentPackage(packageId: PackagePlanId) {
  return paymentIntentPackageIds.includes(packageId);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const packageId = String(body.packageId || "") as PackagePlanId;
    const url = body.url ? String(body.url) : "";

    const plan = getStripeCheckoutPlan(packageId);

    if (!plan || !isPaymentIntentPackage(packageId)) {
      return NextResponse.json(
        { error: "Denne pakken kan ikke betales her ennå." },
        { status: 400 }
      );
    }

    if (plan.mode !== "payment") {
      return NextResponse.json(
        { error: "Abonnement kobles i neste steg." },
        { status: 400 }
      );
    }

    if (plan.amount <= 0) {
      return NextResponse.json(
        { error: "Denne pakken må avtales manuelt." },
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
        { error: "Du må være innlogget før betaling." },
        { status: 401 }
      );
    }

    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.amount,
      currency: plan.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: user.email ?? undefined,
      metadata: {
        user_id: user.id,
        package_id: plan.packageId,
        source: "stripe_payment_element",
        url,
      },
      description: plan.description,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: plan.amount,
      packageId: plan.packageId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kunne ikke starte betaling.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
