"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminAccountBox } from "@/components/admin/AdminAccountBox";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";

type AdminProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role_type: string | null;
  is_admin: boolean | null;
  created_at: string | null;
};

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
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_invoice_id: string | null;
  stripe_receipt_url: string | null;
  refund_status: string;
  refunded_amount: number;
  created_at: string;
};

type SubscriptionRow = {
  id: string;
  user_id: string;
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

function formatDateTime(value: string | null) {
  if (!value) return "Ukjent";

  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatOre(amount: number | null | undefined, currency = "nok") {
  const value = (amount ?? 0) / 100;

  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(value);
}

function packageLabel(packageId: string) {
  if (packageId === "report_pack") return "Rapportpakke";
  if (packageId === "pfu_pack") return "PFU-pakke";
  if (packageId === "full_pack") return "Full dokumentpakke";
  if (packageId === "investigation_pack") return "Utredningspakke";
  if (packageId === "monthly_start") return "Månedsavtale Start";
  if (packageId === "monthly_pro") return "Månedsavtale Pro";
  if (packageId === "monthly_agency") return "Månedsavtale Byrå";
  if (packageId === "monthly_enterprise") return "Enterprise";
  return packageId;
}

function purchaseTypeLabel(type: string) {
  if (type === "new_purchase") return "Nytt kjøp";
  if (type === "case_upgrade") return "Oppgradering";
  if (type === "subscription") return "Abonnement";
  if (type === "investigation") return "Utredning";
  if (type === "manual") return "Manuell";
  return type;
}

function statusLabel(status: string) {
  if (status === "pending") return "Venter";
  if (status === "paid") return "Betalt";
  if (status === "failed") return "Feilet";
  if (status === "cancelled") return "Kansellert";
  if (status === "refunded") return "Refundert";
  if (status === "partially_refunded") return "Delvis refundert";
  if (status === "active") return "Aktiv";
  if (status === "trialing") return "Prøveperiode";
  if (status === "past_due") return "Forfalt";
  if (status === "unpaid") return "Ubetalt";
  if (status === "incomplete") return "Ufullstendig";
  if (status === "incomplete_expired") return "Utløpt";
  return status;
}

function refundLabel(status: string) {
  if (status === "none") return "Ingen refusjon";
  if (status === "requested") return "Forespurt";
  if (status === "approved") return "Godkjent";
  if (status === "rejected") return "Avslått";
  if (status === "refunded") return "Refundert";
  if (status === "partially_refunded") return "Delvis refundert";
  return status;
}

function netAmount(purchase: PurchaseRow) {
  if (purchase.status === "failed" || purchase.status === "cancelled") return 0;
  return Math.max((purchase.amount_paid ?? 0) - (purchase.refunded_amount ?? 0), 0);
}

function isSameOrAfter(value: string, start: Date) {
  return new Date(value).getTime() >= start.getTime();
}

export default function AdminStripePage() {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);

  useEffect(() => {
    async function loadAdmin() {
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

      const { data: ownProfile, error: ownProfileError } = await supabase
        .from("profiles")
        .select("id,full_name,email,role_type,is_admin,created_at")
        .eq("id", user.id)
        .maybeSingle();

      if (ownProfileError) {
        setErrorMessage(ownProfileError.message);
        setIsLoading(false);
        return;
      }

      if (!ownProfile?.is_admin) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setAdminProfile(ownProfile as AdminProfile);
      setIsAdmin(true);

      const [purchasesResult, subscriptionsResult] = await Promise.all([
        supabase
          .from("user_purchases")
          .select(
            "id,user_id,case_id,package_id,purchase_type,status,amount_paid,amount_original,amount_credit,currency,included_cases,used_cases,source,stripe_payment_intent_id,stripe_checkout_session_id,stripe_customer_id,stripe_subscription_id,stripe_invoice_id,stripe_receipt_url,refund_status,refunded_amount,created_at"
          )
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase
          .from("user_subscriptions")
          .select(
            "id,user_id,package_id,status,included_cases_per_month,used_cases_current_period,current_period_start,current_period_end,cancel_at_period_end,stripe_customer_id,stripe_subscription_id,stripe_checkout_session_id,created_at"
          )
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);

      if (purchasesResult.error || subscriptionsResult.error) {
        setErrorMessage(
          purchasesResult.error?.message ??
            subscriptionsResult.error?.message ??
            "Kunne ikke laste Stripe-data."
        );
        setIsLoading(false);
        return;
      }

      setPurchases((purchasesResult.data ?? []) as PurchaseRow[]);
      setSubscriptions((subscriptionsResult.data ?? []) as SubscriptionRow[]);
      setIsLoading(false);
    }

    loadAdmin();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const paidPurchases = purchases.filter(
      (purchase) =>
        purchase.status === "paid" ||
        purchase.status === "partially_refunded" ||
        purchase.status === "refunded"
    );

    const sum = (items: PurchaseRow[]) =>
      items.reduce((total, purchase) => total + netAmount(purchase), 0);

    const activeSubscriptions = subscriptions.filter(
      (subscription) =>
        subscription.status === "active" ||
        subscription.status === "trialing" ||
        subscription.status === "past_due"
    );

    const openRefunds = purchases.filter(
      (purchase) =>
        purchase.refund_status === "requested" ||
        purchase.refund_status === "approved"
    );

    return {
      todayRevenue: sum(
        paidPurchases.filter((purchase) => isSameOrAfter(purchase.created_at, todayStart))
      ),
      monthRevenue: sum(
        paidPurchases.filter((purchase) => isSameOrAfter(purchase.created_at, monthStart))
      ),
      yearRevenue: sum(
        paidPurchases.filter((purchase) => isSameOrAfter(purchase.created_at, yearStart))
      ),
      totalRevenue: sum(paidPurchases),
      paidCount: paidPurchases.length,
      activeSubscriptionCount: activeSubscriptions.length,
      openRefundCount: openRefunds.length,
      latestPurchases: purchases.slice(0, 12),
      latestSubscriptions: subscriptions.slice(0, 6),
    };
  }, [purchases, subscriptions]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-lg font-bold text-slate-700">Laster Stripe...</p>
        </section>
        <LightPublicFooter />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Link href="/" className="text-sm font-semibold text-violet-700">
            ← Tilbake til forsiden
          </Link>

          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
              Ingen tilgang
            </p>
            <h1 className="mt-3 text-4xl font-black text-red-950">
              Admin er kun for interne brukere
            </h1>
          </div>
        </section>
        <LightPublicFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link href="/admin" className="text-sm font-semibold text-violet-700">
          ← Tilbake til admin
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-violet-700">
              Admin / Stripe
            </p>

            <h1 className="mt-4 max-w-4xl [text-wrap:balance] text-4xl font-black sm:text-5xl tracking-tight text-slate-950 md:text-7xl">
              Stripe og omsetning
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Oversikt over betalinger, abonnementer, kvitteringer og refusjoner
              registrert via Stripe og lagret i PresseSjekk.
            </p>
          </section>

          <AdminAccountBox
            adminName={adminProfile?.full_name}
            user={user}
            className="hidden lg:block"
          />
        </div>

        <AdminNav />

        {errorMessage ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
            {errorMessage}
          </div>
        ) : null}

        <section className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Dagens omsetning", formatOre(stats.todayRevenue), "Netto etter refusjon"],
            ["Mnd. omsetning", formatOre(stats.monthRevenue), "Registrert i databasen"],
            ["Årsomsetning", formatOre(stats.yearRevenue), "Registrert i databasen"],
            ["Total omsetning", formatOre(stats.totalRevenue), "Alle registrerte kjøp"],
            ["Betalte kjøp", String(stats.paidCount), "Paid / refundert"],
            ["Aktive abonnement", String(stats.activeSubscriptionCount), "Active / trialing / past due"],
            ["Åpne refusjoner", String(stats.openRefundCount), "Krever oppfølging"],
            ["Stripe-rader", String(purchases.length), "Siste 1000 kjøp"],
          ].map(([label, value, note]) => (
            <div
              key={label}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="font-bold text-slate-500">{label}</p>
              <p className="mt-4 text-4xl font-black text-slate-950">
                {value}
              </p>
              <p className="mt-3 text-sm font-bold text-violet-700">{note}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-violet-200 bg-white p-6 shadow-sm ring-1 ring-violet-100">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-700">
                Siste betalinger
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Kjøp og betalinger
              </h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-700">
                Tallene kommer fra user_purchases. Stripe Dashboard er fortsatt
                fasit for faktisk utbetaling, gebyrer og manuell refusjon.
              </p>
            </div>

            <Link
              href="/admin/refusjoner"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100"
            >
              Refusjoner
            </Link>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="hidden grid-cols-[1.2fr_1fr_110px_110px_1.2fr_160px] bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-600 lg:grid">
              <span>Pakke</span>
              <span>Type</span>
              <span>Beløp</span>
              <span>Status</span>
              <span>Stripe</span>
              <span>Dato</span>
            </div>

            {stats.latestPurchases.length === 0 ? (
              <div className="bg-slate-50 p-6 text-slate-700">
                Ingen betalinger registrert ennå.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {stats.latestPurchases.map((purchase) => (
                  <article
                    key={purchase.id}
                    className="grid gap-4 bg-white px-5 py-5 lg:grid-cols-[1.2fr_1fr_110px_110px_1.2fr_160px] lg:items-center"
                  >
                    <div>
                      <p className="font-black text-slate-950">
                        {packageLabel(purchase.package_id)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {purchase.case_id ? `Sak: ${purchase.case_id}` : "Ikke koblet til sak"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {purchaseTypeLabel(purchase.purchase_type)}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {purchase.source}
                      </p>
                    </div>

                    <div>
                      <p className="font-black text-slate-950">
                        {formatOre(netAmount(purchase), purchase.currency)}
                      </p>
                      {purchase.refunded_amount > 0 ? (
                        <p className="mt-1 text-xs font-bold text-amber-700">
                          Refundert: {formatOre(purchase.refunded_amount, purchase.currency)}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {statusLabel(purchase.status)}
                      </p>
                      <p className="mt-1 text-xs font-bold text-amber-700">
                        {refundLabel(purchase.refund_status)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      {purchase.stripe_receipt_url ? (
                        <a
                          href={purchase.stripe_receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-black text-violet-700 hover:text-violet-900"
                        >
                          Åpne kvittering
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-slate-500">
                          Ingen kvitteringslenke
                        </p>
                      )}
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                        {purchase.stripe_payment_intent_id ||
                          purchase.stripe_checkout_session_id ||
                          purchase.stripe_subscription_id ||
                          "Ingen Stripe-ID"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {formatDateTime(purchase.created_at)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-violet-200 bg-white p-6 shadow-sm ring-1 ring-violet-100">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-700">
            Abonnement
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-950">
            Siste abonnementer
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {stats.latestSubscriptions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-slate-600">
                Ingen abonnementer registrert ennå.
              </p>
            ) : (
              stats.latestSubscriptions.map((subscription) => (
                <article
                  key={subscription.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="font-black text-slate-950">
                    {packageLabel(subscription.package_id)}
                  </p>
                  <p className="mt-2 text-sm font-bold text-violet-700">
                    {statusLabel(subscription.status)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Brukt {subscription.used_cases_current_period} av{" "}
                    {subscription.included_cases_per_month} saker i perioden.
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Periode: {formatDateTime(subscription.current_period_start)} –{" "}
                    {formatDateTime(subscription.current_period_end)}
                  </p>
                  {subscription.cancel_at_period_end ? (
                    <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">
                      Avsluttes ved periodeslutt
                    </p>
                  ) : null}
                  <p className="mt-3 truncate text-xs font-semibold text-slate-500">
                    {subscription.stripe_subscription_id || "Ingen Stripe subscription-ID"}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
        <AdminAccountBox
          adminName={adminProfile?.full_name}
          user={user}
          className="mt-8 lg:hidden"
        />
      </section>

      <LightPublicFooter />
    </main>
  );
}
