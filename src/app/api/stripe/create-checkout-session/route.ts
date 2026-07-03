import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/server";
import {
  getStripeCheckoutPlan,
  stripeCheckoutPlans,
} from "@/lib/stripe/plans";
import type { PackagePlanId } from "@/data/packagePlans";

type EntitlementRow = {
  id: string;
  package_id: PackagePlanId;
  included_cases: number;
  used_cases: number;
  expires_at: string | null;
};

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
  if (packageId === "case_bundle_3") return "3 saker";
  if (packageId === "case_bundle_5") return "5 saker";
  if (packageId === "case_bundle_10") return "10 saker";
  if (packageId === "monthly_start") return "Månedsavtale Start";
  if (packageId === "monthly_pro") return "Månedsavtale Pro";
  if (packageId === "monthly_agency") return "Månedsavtale Byrå";
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

function canBuyWithoutCase(packageId: PackagePlanId) {
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
    packageId === "monthly_agency"
  );
}

function entitlementValue(packageId: PackagePlanId) {
  if (packageId === "report_pack") return 49000;
  if (packageId === "pfu_pack") return 149000;
  if (packageId === "full_pack") return 299000;
  if (packageId === "investigation_pack") return 10000000;

  if (packageId === "case_bundle_3") return 49000;
  if (packageId === "case_bundle_5") return 49000;
  if (packageId === "case_bundle_10") return 49000;

  return 0;
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

function calculateEntitlementCredit(
  entitlements: EntitlementRow[],
  targetAmount: number
) {
  let creditAmount = 0;
  const creditEntitlementIds: string[] = [];

  for (const entitlement of entitlements) {
    const unusedCases =
      Number(entitlement.included_cases ?? 0) -
      Number(entitlement.used_cases ?? 0);

    if (unusedCases <= 0 || isExpired(entitlement.expires_at)) {
      continue;
    }

    const valuePerCase = entitlementValue(entitlement.package_id);
    const rowValue = unusedCases * valuePerCase;

    if (rowValue <= 0) {
      continue;
    }

    if (creditAmount + rowValue > targetAmount - 100) {
      continue;
    }

    creditAmount += rowValue;
    creditEntitlementIds.push(entitlement.id);
  }

  return {
    creditAmount,
    creditEntitlementIds,
  };
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

    if (!caseId && !canBuyWithoutCase(packageId)) {
      return NextResponse.json(
        { error: "Denne pakken kan ikke kjøpes direkte ennå." },
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

    let creditAmount = 0;
    let creditEntitlementIds: string[] = [];

    if (!caseId && plan.mode === "payment") {
      const { data: entitlementData } = await supabase
        .from("user_case_entitlements")
        .select("id, package_id, included_cases, used_cases, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: true });

      const credit = calculateEntitlementCredit(
        (entitlementData as EntitlementRow[] | null) ?? [],
        plan.amount
      );

      creditAmount = credit.creditAmount;
      creditEntitlementIds = credit.creditEntitlementIds;
    }

    const amountToPay = Math.max(plan.amount - currentAmount - creditAmount, 0);

    if (amountToPay <= 0) {
      return NextResponse.json(
        { error: "Det er ikke noe mellomlegg å betale." },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";
    const stripe = getStripe();

    const isUpgrade = Boolean(currentPackageId && currentAmount > 0);
    const isDirectPurchaseWithCredit = !caseId && creditAmount > 0;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: plan.mode,
      success_url: caseId
        ? `${origin}/min-side/saker/${caseId}/pakke?checkout=success&session_id={CHECKOUT_SESSION_ID}`
        : `${origin}/min-side?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: caseId
        ? `${origin}/min-side/saker/${caseId}/pakke?checkout=cancelled`
        : `${origin}/min-side/pakker/kjop?plan=${packageId}&checkout=cancelled`,
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        case_id: caseId,
        package_id: plan.packageId,
        previous_package_id: currentPackageId ?? "",
        amount_to_pay: String(amountToPay),
        credit_amount: String(creditAmount),
        credit_entitlement_ids: creditEntitlementIds.join(","),
        source: "stripe_checkout",
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: plan.currency,
            unit_amount: amountToPay,
            ...(plan.mode === "subscription"
              ? { recurring: { interval: "month" as const } }
              : {}),
            product_data: {
              name: isUpgrade
                ? `Oppgradering til ${plan.name}`
                : isDirectPurchaseWithCredit
                  ? `${plan.name} med fradrag`
                  : plan.name,
              description: isUpgrade
                ? `Mellomlegg for ${caseTitle}: ${packageLabel(currentPackageId)} → ${packageLabel(plan.packageId)}`
                : isDirectPurchaseWithCredit
                  ? `${plan.description} Fradrag for ubrukte ledige saker: ${creditAmount / 100} kr.`
                  : plan.description,
              metadata: {
                package_id: plan.packageId,
                previous_package_id: currentPackageId ?? "",
                credit_amount: String(creditAmount),
              },
            },
          },
        },
      ],
    });

    return NextResponse.json({
      url: checkoutSession.url,
      amountToPay,
      creditAmount,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kunne ikke starte betaling.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
