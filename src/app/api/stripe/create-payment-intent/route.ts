import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/server";
import { getStripeCheckoutPlan } from "@/lib/stripe/plans";
import type { PackagePlanId } from "@/data/packagePlans";

const paymentIntentPackageIds: PackagePlanId[] = [
  "report_pack",
  "pfu_pack",
  "full_pack",
  "investigation_pack",
  "case_bundle_3",
  "case_bundle_5",
  "case_bundle_10",
];

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
  const plan = getStripeCheckoutPlan(packageId);
  return plan?.amount ?? 0;
}

function isPaymentIntentPackage(packageId: PackagePlanId) {
  return paymentIntentPackageIds.includes(packageId);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const packageId = String(body.packageId || "") as PackagePlanId;
    const url = body.url ? String(body.url) : "";
    const caseId = body.caseId ? String(body.caseId) : "";

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

    let amountToPay = plan.amount;
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

      if (packageRank(packageId) <= packageRank(currentPackageId)) {
        return NextResponse.json(
          {
            error:
              "Denne saken har allerede samme eller høyere pakke. Kontakt oss ved behov for endring.",
          },
          { status: 400 }
        );
      }

      amountToPay = Math.max(plan.amount - getPackageAmount(currentPackageId), 0);

      if (amountToPay <= 0) {
        return NextResponse.json(
          { error: "Det er ikke noe mellomlegg å betale." },
          { status: 400 }
        );
      }
    }

    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountToPay,
      currency: plan.currency,
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: user.email ?? undefined,
      metadata: {
        user_id: user.id,
        package_id: plan.packageId,
        case_id: caseId,
        previous_package_id: currentPackageId ?? "",
        amount_to_pay: String(amountToPay),
        source: "stripe_payment_element",
        url,
      },
      description: caseId
        ? `Oppgradering av ${caseTitle}: ${plan.description}`
        : plan.description,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: amountToPay,
      packageId: plan.packageId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kunne ikke starte betaling.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
