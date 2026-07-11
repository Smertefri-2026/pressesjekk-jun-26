"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { AdminNav } from "@/components/admin/AdminNav";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";

type AdminProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role_type: string | null;
  is_admin: boolean | null;
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
  included_cases: number;
  used_cases: number;
  source: string | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_charge_id: string | null;
  stripe_receipt_url: string | null;
  refund_status: string;
  refunded_amount: number;
  refund_requested_at: string | null;
  refund_note: string | null;
  created_at: string;
};

type CaseRow = {
  id: string;
  title: string;
};

const refundStatuses = [
  { id: "requested", label: "Forespurt" },
  { id: "approved", label: "Godkjent / behandles" },
  { id: "rejected", label: "Avvist" },
  { id: "refunded", label: "Refundert" },
];

const PAGE_SIZE = 10;

function packageLabel(packageId: string) {
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
  return packageId;
}

function refundLabel(status: string) {
  return refundStatuses.find((item) => item.id === status)?.label ?? status;
}

function formatOre(amount: number | null | undefined, currency = "nok") {
  const value = amount ?? 0;

  return `${new Intl.NumberFormat("nb-NO").format(Math.round(value / 100))} ${
    currency.toUpperCase() === "NOK" ? "kr" : currency.toUpperCase()
  }`;
}

function formatDate(value: string | null) {
  if (!value) return "Ukjent";

  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function stripeDashboardUrl(purchase: PurchaseRow) {
  if (purchase.stripe_charge_id) {
    return `https://dashboard.stripe.com/test/payments/${purchase.stripe_charge_id}`;
  }

  if (purchase.stripe_payment_intent_id) {
    return `https://dashboard.stripe.com/test/payments/${purchase.stripe_payment_intent_id}`;
  }

  if (purchase.stripe_checkout_session_id) {
    return `https://dashboard.stripe.com/test/checkout/sessions/${purchase.stripe_checkout_session_id}`;
  }

  return null;
}

export default function AdminRefundsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, AdminProfile>>({});
  const [casesById, setCasesById] = useState<Record<string, CaseRow>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  async function loadRefunds() {
    setErrorMessage("");
    setSuccessMessage("");

    const { data, error } = await supabase
      .from("user_purchases")
      .select(
        "id,user_id,case_id,package_id,purchase_type,status,amount_paid,amount_original,amount_credit,currency,included_cases,used_cases,source,stripe_payment_intent_id,stripe_checkout_session_id,stripe_charge_id,stripe_receipt_url,refund_status,refunded_amount,refund_requested_at,refund_note,created_at"
      )
      .neq("refund_status", "none")
      .order("refund_requested_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const rows = (data ?? []) as PurchaseRow[];
    setPurchases(rows);

    const userIds = Array.from(new Set(rows.map((purchase) => purchase.user_id)));
    const caseIds = Array.from(
      new Set(rows.map((purchase) => purchase.case_id).filter(Boolean))
    ) as string[];

    const [profilesResult, casesResult] = await Promise.all([
      userIds.length > 0
        ? supabase
            .from("profiles")
            .select("id,full_name,email,role_type,is_admin")
            .in("id", userIds)
        : Promise.resolve({ data: [], error: null }),
      caseIds.length > 0
        ? supabase.from("cases").select("id,title").in("id", caseIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (profilesResult.error) {
      setErrorMessage(profilesResult.error.message);
      return;
    }

    if (casesResult.error) {
      setErrorMessage(casesResult.error.message);
      return;
    }

    setProfilesById(
      ((profilesResult.data ?? []) as AdminProfile[]).reduce<
        Record<string, AdminProfile>
      >((current, profile) => {
        current[profile.id] = profile;
        return current;
      }, {})
    );

    setCasesById(
      ((casesResult.data ?? []) as CaseRow[]).reduce<Record<string, CaseRow>>(
        (current, caseItem) => {
          current[caseItem.id] = caseItem;
          return current;
        },
        {}
      )
    );
  }

  useEffect(() => {
    async function init() {
      setIsLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id,is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setErrorMessage(profileError.message);
        setIsLoading(false);
        return;
      }

      if (!profile?.is_admin) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setIsAdmin(true);
      await loadRefunds();
      setIsLoading(false);
    }

    init();
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeTab, search]);

  const filteredPurchases = purchases.filter((purchase) => {
    const isOpen =
      purchase.refund_status === "requested" ||
      purchase.refund_status === "approved";

    if (activeTab === "open" && !isOpen) return false;
    if (activeTab === "closed" && isOpen) return false;

    const profile = profilesById[purchase.user_id];
    const caseItem = purchase.case_id ? casesById[purchase.case_id] : null;
    const cleanSearch = search.trim().toLowerCase();

    if (!cleanSearch) return true;

    const haystack = [
      profile?.full_name,
      profile?.email,
      purchase.user_id,
      packageLabel(purchase.package_id),
      caseItem?.title,
      purchase.stripe_payment_intent_id,
      purchase.stripe_checkout_session_id,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(cleanSearch);
  });

  const visiblePurchases = filteredPurchases.slice(0, visibleCount);
  const openCount = purchases.filter(
    (purchase) =>
      purchase.refund_status === "requested" ||
      purchase.refund_status === "approved"
  ).length;
  const closedCount = purchases.length - openCount;

  async function updateRefundStatus(purchase: PurchaseRow, nextStatus: string) {
    setIsUpdatingId(purchase.id);
    setErrorMessage("");
    setSuccessMessage("");

    const updatePayload: Record<string, string | number | null> = {
      refund_status: nextStatus,
    };

    if (nextStatus === "refunded") {
      updatePayload.refunded_amount = purchase.amount_paid;
    }

    if (nextStatus === "rejected") {
      updatePayload.refunded_amount = 0;
    }

    const { error } = await supabase
      .from("user_purchases")
      .update(updatePayload)
      .eq("id", purchase.id);

    if (error) {
      setErrorMessage(error.message);
      setIsUpdatingId(null);
      return;
    }

    setPurchases((current) =>
      current.map((item) =>
        item.id === purchase.id
          ? {
              ...item,
              refund_status: nextStatus,
              refunded_amount:
                nextStatus === "refunded"
                  ? purchase.amount_paid
                  : nextStatus === "rejected"
                    ? 0
                    : item.refunded_amount,
            }
          : item
      )
    );

    setSuccessMessage(
      `Refusjon for ${packageLabel(purchase.package_id)} er markert som ${refundLabel(
        nextStatus
      ).toLowerCase()}.`
    );
    setIsUpdatingId(null);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-lg font-bold text-slate-700">
            Laster refusjoner...
          </p>
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
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-700">
              Ingen tilgang
            </p>
            <h1 className="mt-3 text-3xl font-black text-red-950">
              Du må være admin for å se refusjoner.
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
        <Link href="/admin" className="text-sm font-bold text-violet-700">
          ← Tilbake til admin
        </Link>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-700">
              Admin
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              Refusjoner
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              Her ser du kjøp der kunden har bedt om refusjon eller der refusjon
              er under behandling. Selve tilbakebetalingen gjøres manuelt i
              Stripe. Oppdater status her etter at refusjonen er behandlet.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadRefunds}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100"
            >
              Oppdater
            </button>
            {user ? <SignOutButton /> : null}
          </div>
        </div>

        <AdminNav />

        <div className="mt-8 rounded-3xl border border-violet-200 bg-violet-50 p-5 text-sm font-semibold leading-7 text-violet-950">
          <p className="font-black">Viktig:</p>
          <p className="mt-1">
            Refusjon må gjennomføres i Stripe Dashboard før kjøpet markeres som
            refundert her. Denne siden brukes til intern status, oppfølging og
            dokumentasjon.
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 font-semibold text-red-800">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 font-semibold text-emerald-900">
            {successMessage}
          </div>
        ) : null}

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-700">
              Refusjonsliste
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Forespørsler og behandlede refusjoner
            </h2>
          </div>

          <div className="border-b border-slate-200 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setActiveTab("open")}
                className={`rounded-2xl px-5 py-4 text-left text-sm font-black ${
                  activeTab === "open"
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Til behandling
                <span className="ml-2 rounded-full bg-white/20 px-2 py-1 text-xs">
                  {openCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("closed")}
                className={`rounded-2xl px-5 py-4 text-left text-sm font-black ${
                  activeTab === "closed"
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Ferdig behandlet
                <span className="ml-2 rounded-full bg-white/20 px-2 py-1 text-xs">
                  {closedCount}
                </span>
              </button>
            </div>

            <label
              htmlFor="refund-search"
              className="mt-6 block text-sm font-bold text-slate-800"
            >
              Søk
            </label>
            <input
              id="refund-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Søk på navn, e-post, pakke, sak eller Stripe-ID"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-base font-semibold text-slate-950 outline-none focus:border-violet-500 focus:bg-white"
            />

            <p className="mt-4 text-sm font-semibold text-slate-600">
              Viser {Math.min(visibleCount, filteredPurchases.length)} av{" "}
              {filteredPurchases.length} treff.
            </p>
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="p-6 text-slate-700">
              {activeTab === "open"
                ? "Det finnes ingen refusjoner til behandling akkurat nå."
                : "Det finnes ingen ferdig behandlede refusjoner akkurat nå."}
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-200">
                {visiblePurchases.map((purchase) => {
                const profile = profilesById[purchase.user_id];
                const caseItem = purchase.case_id
                  ? casesById[purchase.case_id]
                  : null;

                return (
                  <article key={purchase.id} className="grid gap-5 p-6 xl:grid-cols-[1.2fr_1fr_1fr_180px]">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Kunde
                      </p>
                      <h3 className="mt-2 text-xl font-black text-slate-950">
                        {profile?.full_name || profile?.email || "Ukjent kunde"}
                      </h3>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        {profile?.email || purchase.user_id}
                      </p>
                      {caseItem ? (
                        <Link
                          href={`/min-side/saker/${caseItem.id}`}
                          className="mt-3 inline-flex text-sm font-bold text-violet-700"
                        >
                          {caseItem.title}
                        </Link>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Kjøp
                      </p>
                      <p className="mt-2 font-black text-slate-950">
                        {packageLabel(purchase.package_id)}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-600">
                        Betalt: {formatOre(purchase.amount_paid, purchase.currency)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Ordinær pris:{" "}
                        {formatOre(
                          purchase.amount_original ?? purchase.amount_paid,
                          purchase.currency
                        )}
                      </p>
                      {purchase.amount_credit > 0 ? (
                        <p className="mt-1 text-sm font-semibold text-emerald-700">
                          Fradrag: -{formatOre(purchase.amount_credit, purchase.currency)}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        Refusjon
                      </p>
                      <p className="mt-2 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-900">
                        {refundLabel(purchase.refund_status)}
                      </p>
                      <p className="mt-3 text-sm font-semibold text-slate-600">
                        Kjøpt: {formatDate(purchase.created_at)}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">
                        Forespurt: {formatDate(purchase.refund_requested_at)}
                      </p>
                      {purchase.refund_note ? (
                        <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                          {purchase.refund_note}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid content-start gap-2">
                      {stripeDashboardUrl(purchase) ? (
                        <a
                          href={stripeDashboardUrl(purchase) ?? undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-violet-300 bg-violet-50 px-4 py-3 text-center text-sm font-black text-violet-900 hover:bg-violet-100"
                        >
                          Åpne i Stripe
                        </a>
                      ) : null}

                      {purchase.stripe_receipt_url ? (
                        <a
                          href={purchase.stripe_receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
                        >
                          Åpne kvittering
                        </a>
                      ) : (
                        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-bold text-slate-500">
                          Mangler kvittering
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => updateRefundStatus(purchase, "approved")}
                        disabled={isUpdatingId === purchase.id}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Behandles
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRefundStatus(purchase, "rejected")}
                        disabled={isUpdatingId === purchase.id}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-800 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Avvis
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRefundStatus(purchase, "refunded")}
                        disabled={isUpdatingId === purchase.id}
                        className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Marker refundert
                      </button>
                    </div>
                  </article>
                );
                })}
              </div>

              {visibleCount < filteredPurchases.length ? (
                <div className="border-t border-slate-200 p-6">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((current) => current + PAGE_SIZE)
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm font-black text-slate-950 hover:bg-slate-100"
                  >
                    Vis flere
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}
