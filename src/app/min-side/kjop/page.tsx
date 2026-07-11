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
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

type SubscriptionRow = {
  id: string;
  package_id: string;
  status: string;
  included_cases_per_month: number;
  used_cases_current_period: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_checkout_session_id: string | null;
  created_at: string;
};

type SubscriptionPeriodRow = {
  id: string;
  subscription_id: string;
  package_id: string;
  period_start: string;
  period_end: string;
  included_cases: number;
  rollover_cases: number;
  used_cases: number;
  rollover_expires_at: string | null;
  status: string;
  stripe_subscription_id: string | null;
  created_at: string;
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

type CaseRow = {
  id: string;
  title: string | null;
  media_name: string | null;
  article_title: string | null;
  created_at: string;
};

const CASE_PAGE_SIZE = 10;

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

function formatDateOnly(date: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
  if (status === "trialing") return "Prøveperiode";
  if (status === "past_due") return "Betaling mangler";
  if (status === "unpaid") return "Ubetalt";
  if (status === "expired") return "Utløpt";
  return status;
}

function subscriptionStatusLabel(subscription: SubscriptionRow) {
  if (subscription.cancel_at_period_end) {
    return "Kanselleres";
  }

  return statusLabel(subscription.status);
}

function subscriptionStatusDescription(subscription: SubscriptionRow) {
  if (subscription.cancel_at_period_end) {
    return subscription.current_period_end
      ? `Avsluttes ${formatDate(subscription.current_period_end)}`
      : "Avsluttes ved periodens slutt";
  }

  if (subscription.status === "active") return "Løpende abonnement";
  if (subscription.status === "past_due") return "Betaling mangler";
  if (subscription.status === "unpaid") return "Ubetalt";
  if (subscription.status === "trialing") return "Prøveperiode";

  return statusLabel(subscription.status);
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

function sourceLabel(source: string) {
  if (source.includes("subscription")) return "Abonnement";
  if (source.includes("stripe_checkout")) return "Stripe-kjøp";
  if (source.includes("stripe_payment")) return "Kortbetaling";
  if (source.includes("manual")) return "Manuelt";
  return source || "Ikke oppgitt";
}

function caseDisplayTitle(caseItem: CaseRow) {
  return caseItem.title ?? caseItem.article_title ?? "Sak uten tittel";
}

function caseDisplaySubtitle(caseItem: CaseRow) {
  return caseItem.media_name ? `Medium: ${caseItem.media_name}` : "PresseSjekk-sak";
}

export default function MinSideKjopPage() {
  const [user, setUser] = useState<User | null>(null);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [entitlements, setEntitlements] = useState<EntitlementRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [subscriptionPeriods, setSubscriptionPeriods] = useState<
    SubscriptionPeriodRow[]
  >([]);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [caseAccess, setCaseAccess] = useState<CaseAccessRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refundRequestId, setRefundRequestId] = useState<string | null>(null);
  const [refundMessage, setRefundMessage] = useState("");
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [portalMessage, setPortalMessage] = useState("");
  const [showAllSubscriptionPayments, setShowAllSubscriptionPayments] =
    useState(false);
  const [showAllOneTimeProducts, setShowAllOneTimeProducts] = useState(false);
  const [showAllCases, setShowAllCases] = useState(false);

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

      const [
        purchaseResult,
        entitlementResult,
        subscriptionResult,
        subscriptionPeriodResult,
        casesResult,
        accessResult,
      ] = await Promise.all([
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
            "id,package_id,status,included_cases,used_cases,source,stripe_checkout_session_id,expires_at,created_at,updated_at"
          )
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(100),

        supabase
          .from("user_subscriptions")
          .select(
            "id,package_id,status,included_cases_per_month,used_cases_current_period,current_period_start,current_period_end,cancel_at_period_end,stripe_customer_id,stripe_subscription_id,stripe_checkout_session_id,created_at"
          )
          .eq("user_id", user.id)
          .in("status", ["active", "trialing", "past_due"])
          .order("created_at", { ascending: false })
          .limit(20),

        supabase
          .from("subscription_case_periods")
          .select(
            "id,subscription_id,package_id,period_start,period_end,included_cases,rollover_cases,used_cases,rollover_expires_at,status,stripe_subscription_id,created_at"
          )
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("period_start", { ascending: false })
          .limit(50),

        supabase
          .from("cases")
          .select("id,title,media_name,article_title,created_at")
          .eq("user_id", user.id)
          .is("deleted_at", null)
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

      if (subscriptionResult.error) {
        setErrorMessage(subscriptionResult.error.message);
        setIsLoading(false);
        return;
      }

      if (subscriptionPeriodResult.error) {
        setErrorMessage(subscriptionPeriodResult.error.message);
        setIsLoading(false);
        return;
      }

      if (casesResult.error) {
        setErrorMessage(casesResult.error.message);
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
      setSubscriptions((subscriptionResult.data ?? []) as SubscriptionRow[]);
      setSubscriptionPeriods(
        (subscriptionPeriodResult.data ?? []) as SubscriptionPeriodRow[]
      );
      setCases((casesResult.data ?? []) as CaseRow[]);
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

  const visibleEntitlements = useMemo(() => {
    return entitlements.filter(
      (entitlement) => !entitlement.package_id.startsWith("monthly_")
    );
  }, [entitlements]);

  const subscriptionPurchases = useMemo(() => {
    return purchases.filter(
      (purchase) =>
        purchase.purchase_type === "subscription" ||
        purchase.package_id.startsWith("monthly_")
    );
  }, [purchases]);

  const visibleSubscriptionPurchases = useMemo(() => {
    return showAllSubscriptionPayments
      ? subscriptionPurchases
      : subscriptionPurchases.slice(0, 5);
  }, [subscriptionPurchases, showAllSubscriptionPayments]);

  const oneTimePurchases = useMemo(() => {
    return purchases.filter(
      (purchase) =>
        purchase.purchase_type !== "subscription" &&
        !purchase.package_id.startsWith("monthly_")
    );
  }, [purchases]);

  const visibleOneTimeEntitlements = useMemo(() => {
    return showAllOneTimeProducts
      ? visibleEntitlements
      : visibleEntitlements.slice(0, 5);
  }, [visibleEntitlements, showAllOneTimeProducts]);

  const caseAccessByCaseId = useMemo(() => {
    return new Map(caseAccess.map((access) => [access.case_id, access]));
  }, [caseAccess]);

  const activePeriodBySubscriptionId = useMemo(() => {
    return new Map(
      subscriptionPeriods.map((period) => [period.subscription_id, period])
    );
  }, [subscriptionPeriods]);

  const totalPaid = useMemo(() => {
    return purchases
      .filter((purchase) => purchase.status === "paid")
      .reduce((sum, purchase) => sum + Number(purchase.amount_paid ?? 0), 0);
  }, [purchases]);

  async function openCustomerPortal() {
    setIsOpeningPortal(true);
    setPortalMessage("");
    setErrorMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setErrorMessage("Du må være innlogget for å administrere abonnement.");
      setIsOpeningPortal(false);
      return;
    }

    const response = await fetch("/api/stripe/create-customer-portal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        returnPath: "/min-side/kjop",
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.url) {
      setPortalMessage(
        payload?.error ?? "Kunne ikke åpne abonnementportalen akkurat nå."
      );
      setIsOpeningPortal(false);
      return;
    }

    window.location.href = payload.url;
  }

  const visibleCases = showAllCases ? cases : cases.slice(0, CASE_PAGE_SIZE);

  async function requestRefund(purchaseId: string) {
    setRefundRequestId(purchaseId);
    setRefundMessage("");
    setErrorMessage("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    if (!token) {
      setErrorMessage("Du må være innlogget for å be om refusjon.");
      setRefundRequestId(null);
      return;
    }

    try {
      const response = await fetch("/api/purchases/request-refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ purchaseId }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(
          payload?.error ?? "Kunne ikke registrere refusjonsforespørsel."
        );
        return;
      }

      setPurchases((currentPurchases) =>
        currentPurchases.map((purchase) =>
          purchase.id === purchaseId
            ? { ...purchase, refund_status: "requested" }
            : purchase
        )
      );

      setRefundMessage(
        "Refusjonsforespørselen er registrert. Den behandles manuelt."
      );
    } finally {
      setRefundRequestId(null);
    }
  }


  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/min-side"
          className="text-sm font-bold text-red-700"
        >
          ← Tilbake til Min Side
        </Link>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-red-700">
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
              href="#saker-og-dokumentpakker"
              className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white hover:bg-red-600"
            >
              Velg sak eller pakke
            </Link>
            {user ? <SignOutButton /> : null}
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 font-semibold text-red-800">
            {errorMessage}
          </div>
        ) : null}

        {refundMessage ? (
          <div className="mt-8 rounded-3xl border border-green-200 bg-green-50 p-6 font-semibold text-green-800">
            {refundMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-slate-700 shadow-sm">
            Laster kjøp og pakker...
          </div>
        ) : (
          <>
            <section className="mt-10">
              <div className="mb-5">
                <p className="text-sm font-bold text-red-700">
                  Produkter og betaling
                </p>
                <h2 className="mt-3 text-3xl font-black text-slate-950">
                  Kjøp, pakker og kvitteringer
                </h2>
                <p className="mt-3 max-w-3xl leading-8 text-slate-700">
                  Hvert produkt vises separat, slik at abonnement,
                  engangspakker, kvitteringer og aktive saker blir enklere å
                  forstå.
                </p>
              </div>

              {subscriptions.length > 0 ? (
                <div className="grid gap-6">
                  {subscriptions.map((subscription) => {
                    const activePeriod = activePeriodBySubscriptionId.get(
                      subscription.id
                    );
                    const included = Number(
                      activePeriod?.included_cases ??
                        subscription.included_cases_per_month ??
                        0
                    );
                    const rollover = Number(activePeriod?.rollover_cases ?? 0);
                    const used = Number(
                      activePeriod?.used_cases ??
                        subscription.used_cases_current_period ??
                        0
                    );
                    const available = Math.max(0, included + rollover - used);

                    return (
                      <article
                        key={subscription.id}
                        className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-bold text-emerald-700">
                              Abonnement
                            </p>
                            <h3 className="mt-3 text-3xl font-black text-slate-950">
                              {packageName(subscription.package_id)}
                            </h3>
                            <p className="mt-3 max-w-3xl leading-8 text-slate-700">
                              {packageDescription(subscription.package_id)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`rounded-full px-4 py-2 text-sm font-bold ${
                                subscription.cancel_at_period_end
                                  ? "bg-amber-100 text-amber-900"
                                  : subscription.status === "past_due" ||
                                      subscription.status === "unpaid"
                                    ? "bg-red-100 text-red-900"
                                    : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {subscriptionStatusLabel(subscription)}
                            </span>

                            <button
                              type="button"
                              onClick={openCustomerPortal}
                              disabled={isOpeningPortal}
                              className="rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isOpeningPortal
                                ? "Åpner portal ..."
                                : "Administrer abonnement"}
                            </button>
                          </div>
                        </div>

                        {portalMessage ? (
                          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                            {portalMessage}
                          </div>
                        ) : null}

                        <div className="mt-6 grid gap-3 md:grid-cols-5">
                          <div className="rounded-2xl bg-emerald-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                              Inkludert per måned
                            </p>
                            <p className="mt-2 text-3xl font-black text-slate-950">
                              {included}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-emerald-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                              Rollover
                            </p>
                            <p className="mt-2 text-3xl font-black text-slate-950">
                              {rollover}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                              Brukt
                            </p>
                            <p className="mt-2 text-3xl font-black text-slate-950">
                              {used}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                              Ledig
                            </p>
                            <p className="mt-2 text-3xl font-black text-slate-950">
                              {available}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                              Status
                            </p>
                            <p className="mt-2 text-sm font-black leading-6 text-slate-950">
                              {subscriptionStatusDescription(subscription)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                          <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                              <h4 className="text-xl font-black text-slate-950">
                                Betalinger og kvitteringer
                              </h4>
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                Viser{" "}
                                {Math.min(
                                  visibleSubscriptionPurchases.length,
                                  subscriptionPurchases.length
                                )}{" "}
                                av {subscriptionPurchases.length} betalinger for
                                abonnement.
                              </p>
                            </div>

                            {subscriptionPurchases.length > 5 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setShowAllSubscriptionPayments((value) => !value)
                                }
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-950 hover:bg-slate-100"
                              >
                                {showAllSubscriptionPayments
                                  ? "Vis færre"
                                  : "Vis alle"}
                              </button>
                            ) : null}
                          </div>

                          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                            {subscriptionPurchases.length === 0 ? (
                              <div className="p-5 text-sm text-slate-600">
                                Ingen betalinger registrert for abonnement ennå.
                              </div>
                            ) : (
                              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                                  <tr>
                                    <th className="px-5 py-4">Dato</th>
                                    <th className="px-5 py-4">Pakke</th>
                                    <th className="px-5 py-4">Pris</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4">Kvittering</th>
                                    <th className="px-5 py-4">Refusjon</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  {visibleSubscriptionPurchases.map((purchase) => (
                                    <tr key={purchase.id}>
                                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                        {formatDate(purchase.created_at)}
                                      </td>
                                      <td className="px-5 py-4 font-black text-slate-950">
                                        {packageName(purchase.package_id)}
                                      </td>
                                      <td className="whitespace-nowrap px-5 py-4 font-black text-slate-950">
                                        {formatAmount(
                                          purchase.amount_paid,
                                          purchase.currency
                                        )}
                                      </td>
                                      <td className="whitespace-nowrap px-5 py-4">
                                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                                          {statusLabel(purchase.status)}
                                        </span>
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
                                          <span className="text-slate-400">
                                            Ikke klar
                                          </span>
                                        )}
                                      </td>
                                      <td className="whitespace-nowrap px-5 py-4">
                                        {purchase.status === "paid" &&
                                        purchase.refund_status === "none" ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              requestRefund(purchase.id)
                                            }
                                            disabled={
                                              refundRequestId === purchase.id
                                            }
                                            className="text-xs font-bold text-red-700 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-60"
                                          >
                                            {refundRequestId === purchase.id
                                              ? "Sender..."
                                              : "Be om refusjon"}
                                          </button>
                                        ) : purchase.refund_status ===
                                          "requested" ? (
                                          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                                            Forespurt
                                          </span>
                                        ) : (
                                          <span className="text-slate-400">
                                            —
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>

                        <p className="mt-5 text-sm leading-7 text-slate-600">
                          Rollover: ubrukte saker kan rulles videre i inntil 3
                          måneder så lenge abonnementet er aktivt.
                          {activePeriod?.rollover_expires_at
                            ? ` Rollover for denne perioden utløper ${formatDate(
                                activePeriod.rollover_expires_at
                              )}.`
                            : ""}
                        </p>
                      </article>
                    );
                  })}
                </div>
              ) : null}

              <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-red-700">
                      Engangspakker og rapportpakker
                    </p>
                    <h3 className="mt-3 text-3xl font-black text-slate-950">
                      Produkter utenom abonnement
                    </h3>
                    <p className="mt-3 max-w-3xl leading-8 text-slate-700">
                      Her vises rapportpakker, PFU-pakker, fullpakker og
                      andre dokumentpakker som er kjøpt separat.
                    </p>
                  </div>

                  <Link
                    href="#saker-og-dokumentpakker"
                    className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white hover:bg-red-600"
                  >
                    Velg sak eller pakke
                  </Link>
                </div>

                <div className="mt-6 grid gap-4">
                  {visibleEntitlements.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
                      Du har ingen aktive engangspakker akkurat nå.
                    </div>
                  ) : (
                    visibleOneTimeEntitlements.map((entitlement) => {
                      const included = Number(entitlement.included_cases ?? 0);
                      const used = Number(entitlement.used_cases ?? 0);
                      const available = Math.max(0, included - used);
                      const relatedPurchase = oneTimePurchases.find(
                        (purchase) =>
                          purchase.package_id === entitlement.package_id
                      );

                      return (
                        <article
                          key={entitlement.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                                Produkt
                              </p>
                              <h4 className="mt-2 text-2xl font-black text-slate-950">
                                {packageName(entitlement.package_id)}
                              </h4>
                              <p className="mt-2 max-w-2xl leading-7 text-slate-600">
                                {packageDescription(entitlement.package_id)}
                              </p>
                            </div>

                            <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-800">
                              {statusLabel(entitlement.status)}
                            </span>
                          </div>

                          <div className="mt-5 grid gap-3 md:grid-cols-6">
                            <div className="rounded-2xl bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                Kjøpt
                              </p>
                              <p className="mt-2 text-sm font-black leading-6">
                                {formatDate(
                                  relatedPurchase?.created_at ??
                                    entitlement.created_at
                                )}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                Gyldig til
                              </p>
                              <p className="mt-2 text-sm font-black leading-6">
                                {entitlement.expires_at
                                  ? formatDateOnly(entitlement.expires_at)
                                  : "Ingen utløpsdato"}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                Betalt
                              </p>
                              <p className="mt-2 text-sm font-black leading-6">
                                {relatedPurchase
                                  ? formatAmount(
                                      relatedPurchase.amount_paid,
                                      relatedPurchase.currency
                                    )
                                  : "—"}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                Brukt
                              </p>
                              <p className="mt-2 text-2xl font-black">
                                {used}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                Ledig
                              </p>
                              <p className="mt-2 text-2xl font-black">
                                {available}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                Kvittering
                              </p>
                              <p className="mt-2 text-sm font-black leading-6">
                                {relatedPurchase?.stripe_receipt_url ? (
                                  <a
                                    href={relatedPurchase.stripe_receipt_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-red-700 hover:text-red-900"
                                  >
                                    Åpne
                                  </a>
                                ) : (
                                  <span className="text-slate-400">
                                    Ikke klar
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {relatedPurchase ? (
                            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                              <span className="font-bold text-slate-700">
                                Betalingsstatus:
                              </span>
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                                {statusLabel(relatedPurchase.status)}
                              </span>

                              {relatedPurchase.status === "paid" &&
                              relatedPurchase.refund_status === "none" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    requestRefund(relatedPurchase.id)
                                  }
                                  disabled={
                                    refundRequestId === relatedPurchase.id
                                  }
                                  className="text-xs font-bold text-red-700 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {refundRequestId === relatedPurchase.id
                                    ? "Sender..."
                                    : "Be om refusjon"}
                                </button>
                              ) : relatedPurchase.refund_status ===
                                "requested" ? (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                                  Refusjon forespurt
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </article>
                      );
                    })
                  )}
                </div>

                {visibleEntitlements.length > 5 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllOneTimeProducts((value) => !value)}
                    className="mt-5 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100"
                  >
                    {showAllOneTimeProducts ? "Vis færre" : "Vis alle pakker"}
                  </button>
                ) : null}
              </section>
            </section>

            <section id="saker-og-dokumentpakker" className="mt-10 scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-red-700">
                    Saker og dokumentpakker
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-slate-950">
                    Status per sak
                  </h2>
                  <p className="mt-3 max-w-3xl leading-8 text-slate-700">
                    Her ser du alle sakene dine, hvilken dokumentpakke hver sak
                    har, og om saken kan oppgraderes videre.
                  </p>
                </div>

                <Link
                  href="/min-side/saker/ny"
                  className="rounded-xl bg-red-500 px-5 py-3 font-bold text-white hover:bg-red-600"
                >
                  Opprett ny sak
                </Link>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                {cases.length === 0 ? (
                  <div className="bg-slate-50 p-5 text-slate-700">
                    Ingen saker opprettet ennå.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {visibleCases.map((caseItem) => {
                      const access = caseAccessByCaseId.get(caseItem.id);
                      const packageId = access?.package_id ?? null;
                      const hasPackage = Boolean(packageId);
                      const isFullPackage = packageId === "full_pack";
                      const isInvestigation = packageId === "investigation_pack";

                      return (
                        <article
                          key={caseItem.id}
                          className="grid gap-4 bg-white p-5 lg:grid-cols-[1.5fr_220px_180px_220px]"
                        >
                          <div>
                            <h3 className="font-black text-slate-950">
                              {caseDisplayTitle(caseItem)}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {caseDisplaySubtitle(caseItem)}
                            </p>
                            <p className="mt-2 text-xs font-semibold text-slate-500">
                              Opprettet {formatDate(caseItem.created_at)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                              Nåværende pakke
                            </p>
                            <p className="mt-2 font-black text-slate-950">
                              {packageId ? packageName(packageId) : "Ingen pakke"}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {access ? sourceLabel(access.source) : "Ikke kjøpt"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                              Status
                            </p>
                            {hasPackage ? (
                              <span className="mt-2 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                                {statusLabel(access?.status ?? "active")}
                              </span>
                            ) : (
                              <span className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                                Mangler pakke
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                            <Link
                              href={`/min-side/saker/${caseItem.id}`}
                              className="rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-950 hover:bg-slate-100"
                            >
                              Åpne sak
                            </Link>

                            {!isInvestigation ? (
                              <Link
                                href={`/min-side/saker/${caseItem.id}/pakke`}
                                className={`rounded-xl px-4 py-3 text-center text-sm font-bold ${
                                  isFullPackage
                                    ? "border border-slate-300 text-slate-500 hover:bg-slate-100"
                                    : "bg-slate-950 text-white hover:bg-slate-800"
                                }`}
                              >
                                {hasPackage
                                  ? isFullPackage
                                    ? "Se pakke"
                                    : "Oppgrader"
                                  : "Velg pakke"}
                              </Link>
                            ) : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              {cases.length > CASE_PAGE_SIZE ? (
                <button
                  type="button"
                  onClick={() => setShowAllCases((value) => !value)}
                  className="mt-5 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100"
                >
                  {showAllCases ? "Vis færre saker" : "Vis alle saker"}
                </button>
              ) : null}
            </section>

          </>
        )}
      </section>

      <LightPublicFooter />
    </main>
  );
}
