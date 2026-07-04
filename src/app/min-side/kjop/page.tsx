"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { allPackagePlans } from "@/data/packagePlans";
import { supabase } from "@/lib/supabase/client";

type PurchaseRow = {
  id: string;
  user_id: string;
  case_id: string | null;
  package_id: string;
  purchase_type: string;
  status: string;
  amount_paid: number;
  amount_original: number | null;
  amount_credit: number;
  currency: string;
  included_cases: number | null;
  used_cases: number;
  source: string;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_receipt_url: string | null;
  refund_status: string;
  refunded_amount: number;
  created_at: string;
};

type EntitlementRow = {
  id: string;
  package_id: string;
  status: string;
  included_cases: number;
  used_cases: number;
  source: string;
  stripe_checkout_session_id: string | null;
  created_at: string;
  updated_at: string;
};

type CaseAccessRow = {
  id: string;
  case_id: string;
  package_id: string;
  status: string;
  source: string;
  created_at: string;
  cases:
    | {
        title: string | null;
        media_name: string | null;
        article_title: string | null;
      }
    | {
        title: string | null;
        media_name: string | null;
        article_title: string | null;
      }[]
    | null;
};

function packageName(packageId: string) {
  return allPackagePlans.find((plan) => plan.id === packageId)?.name ?? packageId;
}

function packageDescription(packageId: string) {
  return (
    allPackagePlans.find((plan) => plan.id === packageId)?.description ??
    "PresseSjekk-pakke"
  );
}

function formatAmount(amount: number | null | undefined, currency = "nok") {
  const value = Number(amount ?? 0) / 100;

  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function purchaseTypeLabel(type: string) {
  if (type === "new_purchase") return "Nytt kjøp";
  if (type === "case_upgrade") return "Oppgradering";
  if (type === "subscription") return "Abonnement";
  if (type === "investigation") return "Utredningspakke";
  if (type === "manual") return "Manuelt";
  return type;
}

function statusLabel(status: string) {
  if (status === "paid") return "Betalt";
  if (status === "pending") return "Venter";
  if (status === "failed") return "Feilet";
  if (status === "cancelled") return "Kansellert";
  if (status === "refunded") return "Refundert";
  if (status === "partially_refunded") return "Delvis refundert";
  if (status === "active") return "Aktiv";
  if (status === "expired") return "Utløpt";
  return status;
}

function refundLabel(status: string) {
  if (status === "none") return "Ingen refusjon";
  if (status === "requested") return "Refusjon forespurt";
  if (status === "approved") return "Godkjent";
  if (status === "rejected") return "Avslått";
  if (status === "refunded") return "Refundert";
  if (status === "partially_refunded") return "Delvis refundert";
  return status;
}

function relatedCase(access: CaseAccessRow) {
  if (Array.isArray(access.cases)) return access.cases[0] ?? null;
  return access.cases;
}

function caseTitle(access: CaseAccessRow) {
  const item = relatedCase(access);

  return item?.title ?? item?.article_title ?? "Sak uten tittel";
}

function caseSubtitle(access: CaseAccessRow) {
  const item = relatedCase(access);

  return item?.media_name
    ? `Medium: ${item.media_name}`
    : "Aktiv sak i PresseSjekk";
}

export default function MinSideKjopPage() {
  const [user, setUser] = useState<User | null>(null);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [entitlements, setEntitlements] = useState<EntitlementRow[]>([]);
  const [caseAccess, setCaseAccess] = useState<CaseAccessRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadPurchases() {
      setIsLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);

      const [purchaseResult, entitlementResult, accessResult] = await Promise.all([
        supabase
          .from("user_purchases")
          .select(
            "id,user_id,case_id,package_id,purchase_type,status,amount_paid,amount_original,amount_credit,currency,included_cases,used_cases,source,stripe_payment_intent_id,stripe_checkout_session_id,stripe_receipt_url,refund_status,refunded_amount,created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),

        supabase
          .from("user_case_entitlements")
          .select(
            "id,package_id,status,included_cases,used_cases,source,stripe_checkout_session_id,created_at,updated_at"
          )
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(100),

        supabase
          .from("case_access")
          .select(
            "id,case_id,package_id,status,source,created_at,cases(title,media_name,article_title)"
          )
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (purchaseResult.error) {
        setErrorMessage(purchaseResult.error.message);
        setIsLoading(false);
        return;
      }

      if (entitlementResult.error) {
        setErrorMessage(entitlementResult.error.message);
        setIsLoading(false);
        return;
      }

      if (accessResult.error) {
        setErrorMessage(accessResult.error.message);
        setIsLoading(false);
        return;
      }

      setPurchases((purchaseResult.data ?? []) as PurchaseRow[]);
      setEntitlements((entitlementResult.data ?? []) as EntitlementRow[]);
      setCaseAccess((accessResult.data ?? []) as unknown as CaseAccessRow[]);
      setIsLoading(false);
    }

    loadPurchases();
  }, []);

  const availableCases = useMemo(() => {
    return entitlements.reduce((sum, entitlement) => {
      const included = Number(entitlement.included_cases ?? 0);
      const used = Number(entitlement.used_cases ?? 0);

      return sum + Math.max(0, included - used);
    }, 0);
  }, [entitlements]);

  const usedEntitlementCases = useMemo(() => {
    return entitlements.reduce((sum, entitlement) => {
      return sum + Number(entitlement.used_cases ?? 0);
    }, 0);
  }, [entitlements]);

  const totalPaid = useMemo(() => {
    return purchases
      .filter((purchase) => purchase.status === "paid")
      .reduce((sum, purchase) => sum + Number(purchase.amount_paid ?? 0), 0);
  }, [purchases]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
              Min Side
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              Kjøp og pakker
            </h1>
            <p className="mt-4 max-w-3xl leading-8 text-slate-700">
              Her finner du aktive pakker, ledige saker, brukte saker,
              oppgraderinger, kvitteringer og kjøpshistorikk for PresseSjekk.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/min-side"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-950 hover:bg-slate-100"
            >
              Til Min Side
            </Link>
            <Link
              href="/priser"
              className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white hover:bg-red-600"
            >
              Kjøp mer
            </Link>
            {user ? <SignOutButton /> : null}
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 font-semibold text-red-800">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-slate-700 shadow-sm">
            Laster kjøp og pakker...
          </div>
        ) : (
          <>
            <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
                  Kjøpshistorikk
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-950">
                  Betalinger og kvitteringer
                </h2>
              </div>

              <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
                {purchases.length === 0 ? (
                  <div className="bg-slate-50 p-5 text-slate-700">
                    Ingen kjøp er registrert ennå.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Dato</th>
                        <th className="px-5 py-4">Pakke</th>
                        <th className="px-5 py-4">Type</th>
                        <th className="px-5 py-4">Betalt</th>
                        <th className="px-5 py-4">Fradrag</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Refusjon</th>
                        <th className="px-5 py-4">Kvittering</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200 bg-white">
                      {purchases.map((purchase) => (
                        <tr key={purchase.id}>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            {formatDate(purchase.created_at)}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-black text-slate-950">
                              {packageName(purchase.package_id)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {purchase.package_id}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-700">
                            {purchaseTypeLabel(purchase.purchase_type)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 font-black text-slate-950">
                            {formatAmount(
                              purchase.amount_paid,
                              purchase.currency
                            )}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            {purchase.amount_credit > 0
                              ? formatAmount(
                                  purchase.amount_credit,
                                  purchase.currency
                                )
                              : "—"}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4">
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                              {statusLabel(purchase.status)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            {refundLabel(purchase.refund_status)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4">
                            {purchase.stripe_receipt_url ? (
                              <a
                                href={purchase.stripe_receipt_url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-bold text-red-700 hover:text-red-900"
                              >
                                Åpne
                              </a>
                            ) : (
                              <span className="text-slate-400">Ikke klar</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
                      Aktive pakker
                    </p>
                    <h2 className="mt-3 text-3xl font-black text-slate-950">
                      Pakker som kan brukes nå
                    </h2>
                    <p className="mt-3 max-w-3xl leading-8 text-slate-700">
                      Her ser du aktive pakker, hvor mange saker som er inkludert,
                      hvor mange som er brukt, og hvor mange som fortsatt kan
                      opprettes.
                    </p>
                  </div>

                  <Link
                    href="/min-side/saker/ny"
                    className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white hover:bg-red-600"
                  >
                    Opprett ny sak
                  </Link>
                </div>

                <div className="mt-6 space-y-4">
                  {entitlements.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
                      Du har ingen aktive sakspakker akkurat nå.
                    </div>
                  ) : (
                    entitlements.map((entitlement) => {
                      const included = Number(entitlement.included_cases ?? 0);
                      const used = Number(entitlement.used_cases ?? 0);
                      const available = Math.max(0, included - used);

                      return (
                        <article
                          key={entitlement.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <h3 className="text-xl font-black text-slate-950">
                                {packageName(entitlement.package_id)}
                              </h3>
                              <p className="mt-2 max-w-2xl leading-7 text-slate-600">
                                {packageDescription(entitlement.package_id)}
                              </p>
                            </div>

                            <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-800">
                              {statusLabel(entitlement.status)}
                            </span>
                          </div>

                          <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                Inkludert
                              </p>
                              <p className="mt-2 text-2xl font-black">
                                {included}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                Brukt
                              </p>
                              <p className="mt-2 text-2xl font-black">{used}</p>
                            </div>
                            <div className="rounded-2xl bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                Ledig
                              </p>
                              <p className="mt-2 text-2xl font-black">
                                {available}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                            <p>
                              <span className="font-bold text-slate-950">
                                Kilde:
                              </span>{" "}
                              {entitlement.source}
                            </p>
                            <p>
                              <span className="font-bold text-slate-950">
                                Opprettet:
                              </span>{" "}
                              {formatDate(entitlement.created_at)}
                            </p>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>

              <aside className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-800">
                  Refusjon og kvittering
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-950">
                  Kvitteringer ligger på kjøpene
                </h2>
                <p className="mt-4 leading-8 text-slate-700">
                  Når Stripe sender kvitteringslenke, vises den i
                  kjøpshistorikken. Refusjon håndteres manuelt i første versjon,
                  slik at ubrukte kjøp og sakspakker kan vurderes riktig.
                </p>

                <div className="mt-6 rounded-2xl border border-red-200 bg-white p-5 text-sm leading-7 text-slate-700">
                  <p className="font-black text-slate-950">
                    Foreløpig refusjonsregel
                  </p>
                  <p className="mt-2">
                    Ubrukte enkeltsaker kan normalt vurderes for refusjon.
                    Brukte saker og dokumentpakker vurderes manuelt.
                  </p>
                </div>
              </aside>
            </section>

            <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
                    Saker med aktiv tilgang
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-slate-950">
                    Aktive dokumentpakker
                  </h2>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                {caseAccess.length === 0 ? (
                  <div className="bg-slate-50 p-5 text-slate-700">
                    Ingen saker med aktiv tilgang ennå.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {caseAccess.map((access) => (
                      <article
                        key={access.id}
                        className="grid gap-4 bg-white p-5 md:grid-cols-[1fr_180px_140px]"
                      >
                        <div>
                          <h3 className="font-black text-slate-950">
                            {caseTitle(access)}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {caseSubtitle(access)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                            Pakke
                          </p>
                          <p className="mt-1 font-bold">
                            {packageName(access.package_id)}
                          </p>
                        </div>

                        <Link
                          href={`/min-side/saker/${access.case_id}`}
                          className="self-start rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-950 hover:bg-slate-100"
                        >
                          Åpne sak
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

          </>
        )}
      </section>

      <LightPublicFooter />
    </main>
  );
}
