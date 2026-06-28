import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/server";
import { getStripeCheckoutPlan } from "@/lib/stripe/plans";
import { isV1Purchasable } from "@/data/packagePlans";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const packageId = String(body.packageId || "");
    const caseId = body.caseId ? String(body.caseId) : "";

    if (!isV1Purchasable(packageId)) {
      return NextResponse.json(
        {
          error:
            "Denne pakken kan ikke kjøpes på nett. Ta kontakt for proff- eller utredningspakke.",
        },
        { status: 400 }
      );
    }

    const plan = getStripeCheckoutPlan(packageId);

    if (!plan) {
      return NextResponse.json(
        { error: "Ugyldig pakke." },
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
        { error: "Du må være innlogget for å kjøpe pakke." },
        { status: 401 }
      );
    }

    if (plan.mode === "payment" && packageId !== "investigation_pack" && !caseId) {
      return NextResponse.json(
        { error: "Enkeltpakker må kobles til en sak." },
        { status: 400 }
      );
    }

    if (caseId) {
      const { data: caseItem, error: caseError } = await supabase
        .from("cases")
        .select("id,user_id,title")
        .eq("id", caseId)
        .maybeSingle();

      if (caseError || !caseItem) {
        return NextResponse.json(
          { error: "Fant ikke saken." },
          { status: 404 }
        );
      }

      if (caseItem.user_id !== user.id) {
        return NextResponse.json(
          { error: "Du har ikke tilgang til denne saken." },
          { status: 403 }
        );
      }
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";
    const stripe = getStripe();

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: plan.mode,
      success_url: `${origin}/min-side?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/priser?checkout=cancelled`,
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        case_id: caseId,
        package_id: plan.packageId,
        source: "stripe_checkout",
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: plan.currency,
            unit_amount: plan.amount,
            product_data: {
              name: plan.name,
              description: plan.description,
              metadata: {
                package_id: plan.packageId,
              },
            },
            recurring:
              plan.mode === "subscription"
                ? {
                    interval: "month",
                  }
                : undefined,
          },
        },
      ],
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kunne ikke starte betaling.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
