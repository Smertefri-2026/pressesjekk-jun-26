"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { allPackagePlans, type PackagePlanId } from "@/data/packagePlans";
import { supabase } from "@/lib/supabase/client";

function isPackagePlanId(value: string | null): value is PackagePlanId {
  return Boolean(value && allPackagePlans.some((plan) => plan.id === value));
}

function packageTypeLabel(type: string) {
  if (type === "bundle") return "Sakspakke";
  if (type === "monthly") return "Abonnement";
  return "Enkeltkjøp";
}

function amountForPackage(packageId: PackagePlanId) {
  if (packageId === "report_pack") return 49000;
  if (packageId === "pfu_pack") return 149000;
  if (packageId === "full_pack") return 299000;
  if (packageId === "investigation_pack") return 10000000;
  if (packageId === "case_bundle_3") return 139000;
  if (packageId === "case_bundle_5") return 219000;
  if (packageId === "case_bundle_10") return 399000;
  if (packageId === "monthly_start") return 129000;
  if (packageId === "monthly_pro") return 499000;
  if (packageId === "monthly_agency") return 1499000;
  return 0;
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

function formatKrFromOre(amount: number) {
  return new Intl.NumberFormat("nb-NO").format(Math.round(amount / 100));
}

export default function BuyPackagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const rawPlan = searchParams.get("plan");
  const checkoutStatus = searchParams.get("checkout");

  const selectedPlan = useMemo(() => {
    if (!isPackagePlanId(rawPlan)) return null;
    return allPackagePlans.find((plan) => plan.id === rawPlan) ?? null;
  }, [rawPlan]);

  const selectedAmount = selectedPlan ? amountForPackage(selectedPlan.id) : 0;
  const amountToPay = Math.max(selectedAmount - discountAmount, 0);

  useEffect(() => {
    async function loadDiscount() {
      setDiscountAmount(0);

      if (!selectedPlan || selectedPlan.type === "monthly") {
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return;
      }

      const { data: entitlements } = await supabase
        .from("user_case_entitlements")
        .select("id, package_id, included_cases, used_cases, expires_at")
        .eq("status", "active")
        .order("created_at", { ascending: true });

      let nextDiscount = 0;

      for (const entitlement of entitlements ?? []) {
        const unusedCases =
          Number(entitlement.included_cases ?? 0) -
          Number(entitlement.used_cases ?? 0);

        if (unusedCases <= 0) continue;

        const expiresAt = entitlement.expires_at
          ? new Date(entitlement.expires_at).getTime()
          : null;

        if (expiresAt && expiresAt <= Date.now()) continue;

        const value =
          unusedCases *
          entitlementValue(entitlement.package_id as PackagePlanId);

        if (value <= 0) continue;

        if (nextDiscount + value > selectedAmount - 100) continue;

        nextDiscount += value;
      }

      setDiscountAmount(nextDiscount);
    }

    loadDiscount();
  }, [selectedAmount, selectedPlan]);

  async function startCheckout() {
    if (!selectedPlan) return;

    setIsLoading(true);
    setErrorMessage("");

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      const next = `/min-side/pakker/kjop?plan=${selectedPlan.id}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    const response = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        packageId: selectedPlan.id,
        source: "pricing_direct_purchase",
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setErrorMessage(
        payload?.error ??
          "Kunne ikke starte betaling. Prøv igjen, eller velg en annen pakke."
      );
      setIsLoading(false);
      return;
    }

    if (!payload?.url) {
      setErrorMessage("Stripe svarte ikke med betalingslenke.");
      setIsLoading(false);
      return;
    }

    window.location.href = payload.url;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/priser"
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til priser
        </Link>

        <div className="mt-8">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
            Kjøp pakke
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Fullfør kjøpet først.
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-700">
            Etter betaling får du ledige saker på Min Side. Deretter kan du
            opprette saken når du er klar.
          </p>
        </div>

        {checkoutStatus === "cancelled" ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            Betalingen ble avbrutt. Du kan prøve igjen når du er klar.
          </div>
        ) : null}

        {!selectedPlan ? (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-black text-slate-950">
              Fant ikke pakken.
            </h2>
            <p className="mt-3 leading-7 text-slate-700">
              Gå tilbake til prissiden og velg pakken du ønsker å kjøpe.
            </p>
            <Link
              href="/priser"
              className="mt-6 inline-flex rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950 hover:bg-cyan-400"
            >
              Se priser
            </Link>
          </section>
        ) : (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-cyan-800">
              {packageTypeLabel(selectedPlan.type)}
            </p>

            <h2 className="mt-5 text-3xl font-black text-slate-950">
              {selectedPlan.name}
            </h2>

            <p className="mt-3 text-4xl font-black text-slate-950">
              {selectedPlan.price}
            </p>

            {selectedAmount > 0 ? (
              <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
                <div className="flex justify-between gap-4 text-sm font-bold text-slate-300">
                  <span>Ordinær pris</span>
                  <span>{formatKrFromOre(selectedAmount)} kr</span>
                </div>

                {discountAmount > 0 ? (
                  <div className="mt-3 flex justify-between gap-4 text-sm font-bold text-cyan-200">
                    <span>Fradrag for ubrukte ledige saker</span>
                    <span>-{formatKrFromOre(discountAmount)} kr</span>
                  </div>
                ) : null}

                <div className="mt-4 border-t border-white/15 pt-4">
                  <div className="flex justify-between gap-4 text-lg font-black">
                    <span>Å betale nå</span>
                    <span>{formatKrFromOre(amountToPay)} kr</span>
                  </div>
                </div>
              </div>
            ) : null}

            <p className="mt-4 leading-8 text-slate-700">
              {selectedPlan.description}
            </p>

            <ul className="mt-6 grid gap-3 text-sm font-medium text-slate-700">
              {selectedPlan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="text-cyan-700">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-sm leading-7 text-slate-700">
              Når betalingen er fullført, blir pakken lagt på kontoen din som
              ledige saker. Du kan opprette saken etterpå fra Min Side.
            </div>

            {errorMessage ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="button"
              onClick={startCheckout}
              disabled={isLoading}
              className="mt-7 w-full rounded-xl bg-cyan-500 px-5 py-4 text-center font-black text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Sender deg til betaling ..." : "Gå til betaling"}
            </button>
          </section>
        )}
      </section>

      <LightPublicFooter />
    </main>
  );
}
