import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe/server";
import { getStripeCheckoutPlan } from "@/lib/stripe/plans";
import { isV1Purchasable, packagePlanRank, type PackagePlanId } from "@/data/packagePlans";

const paymentIntentPackageIds: PackagePlanId[] = [
  "report_pack",
  "pfu_pack",
  "full_pack",
  "investigation_pack",
  "case_bundle_3",
  "case_bundle_5",
  "case_bundle_10",
];

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

    // Server-side håndheving av v1-omfanget. UI kan foreslå andre pakker,
    // men manipulert frontend/direkte API-kall skal aldri kunne betale for
    // en pakke som ikke er en del av v1 sin offentlige checkout.
    if (!isV1Purchasable(packageId)) {
      return NextResponse.json(
        {
          error:
            "Denne pakken er ikke tilgjengelig for kjøp ennå. Ta kontakt for tilgang.",
        },
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

      const { data: accessData, error: accessError } = await supabase
        .from("case_access")
        .select("package_id,status")
        .eq("case_id", caseId)
        .eq("status", "active")
        .maybeSingle();

      if (accessError) {
        return NextResponse.json({ error: "Kunne ikke lese tilgangen for saken." }, { status: 500 });
      }

      currentPackageId = (accessData?.package_id as PackagePlanId | null) ?? null;

      if (packagePlanRank(packageId) <= packagePlanRank(currentPackageId)) {
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

      // Kanseller alle andre ubetalte PaymentIntents for denne saken før vi
      // lager en ny. Uten dette kan et gammelt, forlatt betalingsforsøk
      // (f.eks. fra en tidligere fane, eller et dobbeltklikk) stå betalbart
      // på ubestemt tid og senere bli bekreftet ved en feil - selv etter at
      // saken allerede har fått tilgangen gjennom et nyere kjøp. Dette er
      // hoved­sperren mot dobbeltbelastning; webhooken har i tillegg en
      // uavhengig kontroll rett før case_access oppdateres.
      //
      // Bruker paymentIntents.list (sterkt konsistent, direkte oppslag) i
      // stedet for Search-API-et - Search bruker en indeks som kan henge
      // noen sekunder etter en nyopprettet PaymentIntent, noe som ville gjort
      // denne sperren upålitelig akkurat i det tilfellet den skal dekke.
      const cancelableStatuses = new Set([
        "requires_payment_method",
        "requires_confirmation",
        "requires_action",
      ]);

      try {
        const ninetyDaysAgo = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60;
        const recentIntents = await stripe.paymentIntents.list({
          created: { gte: ninetyDaysAgo },
          limit: 100,
        });

        const staleForThisCase = recentIntents.data.filter(
          (pi) => pi.metadata?.case_id === caseId && cancelableStatuses.has(pi.status)
        );

        for (const stale of staleForThisCase) {
          try {
            await stripe.paymentIntents.cancel(stale.id, {
              cancellation_reason: "abandoned",
            });
          } catch (cancelError) {
            console.warn("Kunne ikke kansellere gammel PaymentIntent", {
              staleIntentId: stale.id,
              caseId,
              error: cancelError,
            });
          }
        }
      } catch (listError) {
        // Opprydningen skal aldri blokkere et legitimt kjøp - logg og fortsett.
        console.warn("Kunne ikke liste opp gamle PaymentIntents for saken", {
          caseId,
          error: listError,
        });
      }
    }

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
      amountToPay,
      originalAmount: plan.amount,
      currentAmount: caseId ? getPackageAmount(currentPackageId) : 0,
      currentPackageId,
      isUpgrade: Boolean(caseId),
      caseId,
      packageId: plan.packageId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kunne ikke starte betaling.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
