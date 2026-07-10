import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/server";

export async function POST(request: NextRequest) {
  try {
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
        { error: "Du må være innlogget for å administrere abonnement." },
        { status: 401 }
      );
    }

    const { data: subscription, error: subscriptionError } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id,status,created_at")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      return NextResponse.json(
        { error: subscriptionError.message },
        { status: 500 }
      );
    }

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Fant ikke aktiv Stripe-kunde for abonnementet." },
        { status: 404 }
      );
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://pressesjekk.no";

    const body = await request.json().catch(() => null);
    const requestedReturnPath =
      typeof body?.returnPath === "string" ? body.returnPath : "/min-side/kjop";

    const safeReturnPath =
      requestedReturnPath.startsWith("/") && !requestedReturnPath.startsWith("//")
        ? requestedReturnPath
        : "/min-side/kjop";

    const stripe = getStripe();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}${safeReturnPath}`,
    });

    return NextResponse.json({
      url: portalSession.url,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Kunne ikke åpne Stripe kundeportal.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
