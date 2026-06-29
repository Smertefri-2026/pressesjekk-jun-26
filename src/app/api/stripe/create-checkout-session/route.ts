import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/server";
import {
  getStripeCheckoutPlan,
  stripeCheckoutPlans,
} from "@/lib/stripe/plans";
import type { PackagePlanId } from "@/data/packagePlans";

function packageRank(packageId: PackagePlanId | null) {
  if (!packageId) return 0;
  if (packageId === "report_pack") return 1;
  if (packageId === "pfu_pack") return 2;
  if (packageId === "full_pack") return 3;
  if (packageId === "investigation_pack") return 4;
  return 1;
}

function getPackageAmount(packageId: PackagePlanId | null) {
  if (!packageId) return 0;
  return stripeCheckoutPlans[packageId]?.amount ?? 0;
}

function packageLabel(packageId: PackagePlanId | null) {
  if (packageId === "report_pack") return "Rapportpakke";
  if (packageId === "pfu_pack") return "PFU-pakke";
  if (packageId === "full_pack") return "Full dokumentpakke";
  if (packageId === "investigation_pack") return "Utredningspakke";
  return "Ingen pakke";
}

function isSingleCasePackage(packageId: PackagePlanId) {
  return (
    packageId === "report_pack" ||
    packageId === "pfu_pack" ||
    packageId === "full_pack" ||
    packageId === "investigation_pack"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const packageId = String(body.packageId || "") as PackagePlanId;
    const caseId = body.caseId ? String(body.caseId) : "";
    const plan = getStripeCheckoutPlan(packageId);

    if (!plan) {
      return NextResponse.json({ error: "Ugyldig pakke." }, { status: 400 });
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

    if (isSingleCasePackage(packageId) && !caseId) {
      return NextResponse.json(
        { error: "Enkeltpakker må kobles til en sak." },
        { status: 400 }
      );
    }

    let currentPackageId: PackagePlanId | null = null;
    let caseTitle = "PresseSjekk-sak";

    if (caseId) {
      const { data: caseItem, error: caseError } = await supabase
        .from("cases")
        .select("id,user_id,title")
        .eq("id", caseId)
        .maybeSingle();

      if (caseError || !caseItem) {
        return NextResponse.json({ error: "Fant ikke saken." }, { status: 404 });
      }

      if (caseItem.user_id !== user.id) {
        return NextResponse.json(
          { error: "Du har ikke tilgang til denne saken." },
          { status: 403 }
        );
      }

      caseTitle = caseItem.title || caseTitle;

      const { data: accessData } = await supabase
        .from("case_access")
        .select("package_id,status")
        .eq("case_id", caseId)
        .eq("status", "active")
        .maybeSingle();

      currentPackageId = (accessData?.package_id as PackagePlanId | null) ?? null;
    }

    const targetRank = packageRank(packageId);
    const currentRank = packageRank(currentPackageId);

    if (caseId && targetRank <= currentRank) {
      return NextResponse.json(
        {
          error:
            "Denne saken har allerede samme eller høyere pakke. Kontakt oss ved behov for endring.",
        },
        { status: 400 }
      );
    }

    const currentAmount = caseId ? getPackageAmount(currentPackageId) : 0;
    const amountToPay = Math.max(plan.amount - currentAmount, 0);

    if (amountToPay <= 0) {
      return NextResponse.json(
        { error: "Det er ikke noe mellomlegg å betale." },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";
    const stripe = getStripe();

    const isUpgrade = Boolean(currentPackageId && currentAmount > 0);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: plan.mode,
      success_url: caseId
        ? `${origin}/min-side/saker/${caseId}/pakke?checkout=success&session_id={CHECKOUT_SESSION_ID}`
        : `${origin}/min-side?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: caseId
        ? `${origin}/min-side/saker/${caseId}/pakke?checkout=cancelled`
        : `${origin}/priser?checkout=cancelled`,
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        case_id: caseId,
        package_id: plan.packageId,
        previous_package_id: currentPackageId ?? "",
        amount_to_pay: String(amountToPay),
        source: "stripe_checkout",
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: plan.currency,
            unit_amount: amountToPay,
            product_data: {
              name: isUpgrade
                ? `Oppgradering til ${plan.name}`
                : plan.name,
              description: isUpgrade
                ? `Mellomlegg for ${caseTitle}: ${packageLabel(currentPackageId)} → ${packageLabel(plan.packageId)}`
                : plan.description,
              metadata: {
                package_id: plan.packageId,
                previous_package_id: currentPackageId ?? "",
              },
            },
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
