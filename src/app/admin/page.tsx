"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { SignOutButton } from "@/components/auth/SignOutButton";
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

type AdminCase = {
  id: string;
  user_id: string | null;
  title: string;
  status: string | null;
  media_name: string | null;
  article_title: string | null;
  created_at: string | null;
};

type AdminReport = {
  id: string;
  case_id: string;
  version: number | null;
  report_type: string;
  status: string | null;
  created_at: string | null;
};

type AdminQuickCheck = {
  id: string;
  url: string;
  role: string | null;
  check_count: number | null;
  ai_status: string | null;
  created_at: string | null;
  last_checked_at: string | null;
};

type AdminCaseAccess = {
  id: string;
  case_id: string;
  package_id: string;
  status: string;
  created_at: string | null;
};

type AdminPurchase = {
  id: string;
  status: string;
  amount_paid: number;
  refunded_amount: number;
  currency: string;
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

function netAmount(purchase: AdminPurchase) {
  if (purchase.status === "failed" || purchase.status === "cancelled") return 0;
  return Math.max((purchase.amount_paid ?? 0) - (purchase.refunded_amount ?? 0), 0);
}

function isSameOrAfter(value: string, start: Date) {
  return new Date(value).getTime() >= start.getTime();
}

function reportTypeLabel(type: string) {
  if (type === "free_check") return "Regelbasert rapport";
  if (type === "full_report") return "KI-rapport";
  if (type === "pfu_draft") return "PFU-klage";
  if (type === "police_draft") return "Politianmeldelse";
  if (type === "investigation_draft") return "Utredning";
  return type;
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

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [userCount, setUserCount] = useState(0);
  const [caseCount, setCaseCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [quickCheckCount, setQuickCheckCount] = useState(0);
  const [accessCount, setAccessCount] = useState(0);
  const [refundCount, setRefundCount] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [yearRevenue, setYearRevenue] = useState(0);

  const [latestProfiles, setLatestProfiles] = useState<AdminProfile[]>([]);
  const [latestCases, setLatestCases] = useState<AdminCase[]>([]);
  const [latestReports, setLatestReports] = useState<AdminReport[]>([]);
  const [latestQuickChecks, setLatestQuickChecks] = useState<AdminQuickCheck[]>([]);
  const [latestAccess, setLatestAccess] = useState<AdminCaseAccess[]>([]);

  useEffect(() => {
    async function loadAdminData() {
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

      const [
        profilesCountResult,
        casesCountResult,
        reportsCountResult,
        quickChecksCountResult,
        accessCountResult,
        refundsResult,
        purchasesResult,
        profilesResult,
        casesResult,
        reportsResult,
        quickChecksResult,
        accessResult,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("cases").select("id", { count: "exact", head: true }),
        supabase.from("case_reports").select("id", { count: "exact", head: true }),
        supabase.from("quick_checks").select("id", { count: "exact", head: true }),
        supabase.from("case_access").select("id", { count: "exact", head: true }),
        supabase
          .from("user_purchases")
          .select("id,refund_status")
          .in("refund_status", ["requested", "processing"])
          .limit(100),
        supabase
          .from("user_purchases")
          .select("id,status,amount_paid,refunded_amount,currency,created_at")
          .in("status", ["paid", "refunded", "partially_refunded"])
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase
          .from("profiles")
          .select("id,full_name,email,role_type,is_admin,created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("cases")
          .select("id,user_id,title,status,media_name,article_title,created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("case_reports")
          .select("id,case_id,version,report_type,status,created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("quick_checks")
          .select("id,url,role,check_count,ai_status,created_at,last_checked_at")
          .order("last_checked_at", { ascending: false })
          .limit(5),
        supabase
          .from("case_access")
          .select("id,case_id,package_id,status,created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const firstError =
        profilesCountResult.error ||
        casesCountResult.error ||
        reportsCountResult.error ||
        quickChecksCountResult.error ||
        accessCountResult.error ||
        refundsResult.error ||
        purchasesResult.error ||
        profilesResult.error ||
        casesResult.error ||
        reportsResult.error ||
        quickChecksResult.error ||
        accessResult.error;

      if (firstError) {
        setErrorMessage(firstError.message);
        setIsLoading(false);
        return;
      }

      setUserCount(profilesCountResult.count ?? 0);
      setCaseCount(casesCountResult.count ?? 0);
      setReportCount(reportsCountResult.count ?? 0);
      setQuickCheckCount(quickChecksCountResult.count ?? 0);
      setAccessCount(accessCountResult.count ?? 0);
      setRefundCount((refundsResult.data ?? []).length);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      const purchases = (purchasesResult.data ?? []) as AdminPurchase[];

      setTodayRevenue(
        purchases
          .filter((purchase) => isSameOrAfter(purchase.created_at, todayStart))
          .reduce((total, purchase) => total + netAmount(purchase), 0)
      );

      setMonthRevenue(
        purchases
          .filter((purchase) => isSameOrAfter(purchase.created_at, monthStart))
          .reduce((total, purchase) => total + netAmount(purchase), 0)
      );

      setYearRevenue(
        purchases
          .filter((purchase) => isSameOrAfter(purchase.created_at, yearStart))
          .reduce((total, purchase) => total + netAmount(purchase), 0)
      );

      setLatestProfiles((profilesResult.data ?? []) as AdminProfile[]);
      setLatestCases((casesResult.data ?? []) as AdminCase[]);
      setLatestReports((reportsResult.data ?? []) as AdminReport[]);
      setLatestQuickChecks((quickChecksResult.data ?? []) as AdminQuickCheck[]);
      setLatestAccess((accessResult.data ?? []) as AdminCaseAccess[]);

      setIsLoading(false);
    }

    loadAdminData();
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-lg font-bold text-slate-700">Laster admin...</p>
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

  const statCards = [
    { label: "Brukere", value: userCount, href: "/admin/brukere" },
    { label: "Saker", value: caseCount, href: "/admin/saker" },
    { label: "Rapporter", value: reportCount, href: "/admin/rapporter" },
    { label: "Raske sjekker", value: quickCheckCount, href: "/admin/raske-sjekker" },
    { label: "Aktive pakker", value: accessCount, href: "/admin/pakker" },
    {
      label: "Refusjoner",
      value: refundCount,
      href: "/admin/refusjoner",
      note: refundCount > 0 ? "Til behandling" : "Ingen åpne",
    },
    { label: "Dagens omsetning", value: formatOre(todayRevenue), href: "/admin/stripe", note: "Netto" },
    { label: "Mnd. omsetning", value: formatOre(monthRevenue), href: "/admin/stripe", note: "Netto" },
    { label: "Årsomsetning", value: formatOre(yearRevenue), href: "/admin/stripe", note: "Netto" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-violet-700">
              Admin
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Oversikt
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Nøkkeltall, siste aktivitet og snarveier til drift av brukere,
              saker, rapporter, pakker og betaling.
            </p>
          </section>

          <aside className="rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-800">
              Konto
            </p>

            <h2 className="mt-4 text-3xl font-black text-slate-950">
              {adminProfile?.full_name?.trim() || "Admin"}
            </h2>

            {user?.email ? (
              <p className="mt-4 break-words text-sm font-semibold leading-6 text-slate-600">
                Innlogget som:{" "}
                <span className="text-slate-950">{user.email}</span>
              </p>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Link
                href="/min-side"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
              >
                Min Side
              </Link>

              <Link
                href="/min-side/profil"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
              >
                Profil
              </Link>

              <SignOutButton />
            </div>
          </aside>
        </div>

        {errorMessage ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
            {errorMessage}
          </div>
        ) : null}

        <section className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-violet-200 hover:bg-violet-50 hover:shadow-md"
            >
              <p className="font-bold text-slate-500">{item.label}</p>
              <p className="mt-4 text-5xl font-black text-slate-950">
                {item.value}
              </p>
              {item.note ? (
                <p className="mt-3 text-sm font-bold text-amber-700">
                  {item.note}
                </p>
              ) : (
                <p className="mt-3 text-sm font-bold text-violet-700">
                  Åpne
                </p>
              )}
            </Link>
          ))}
        </section>

        <div className="mt-12 grid gap-8 xl:grid-cols-2">
          <section className="rounded-3xl border border-violet-200 bg-white p-6 shadow-sm ring-1 ring-violet-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-700">
                  Siste 5
                </p>
                <h2 className="mt-2 text-2xl font-bold">Siste saker</h2>
              </div>
              <Link
                href="/admin/saker"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-950 hover:bg-slate-100"
              >
                Se alle
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {latestCases.map((item) => (
                <Link
                  key={item.id}
                  href={`/min-side/saker/${item.id}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:bg-violet-50"
                >
                  <p className="font-bold">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {item.media_name || "Ukjent medium"} · {item.status || "Ukjent status"} ·{" "}
                    {formatDateTime(item.created_at)}
                  </p>
                  {item.article_title ? (
                    <p className="mt-2 text-sm text-slate-700">
                      {item.article_title}
                    </p>
                  ) : null}
                </Link>
              ))}

              {latestCases.length === 0 ? (
                <p className="text-slate-500">Ingen saker ennå.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-violet-200 bg-white p-6 shadow-sm ring-1 ring-violet-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-700">
                  Siste 5
                </p>
                <h2 className="mt-2 text-2xl font-bold">Siste rapporter</h2>
              </div>
              <Link
                href="/admin/rapporter"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-950 hover:bg-slate-100"
              >
                Se alle
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {latestReports.map((item) => (
                <Link
                  key={item.id}
                  href={`/min-side/saker/${item.case_id}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:bg-violet-50"
                >
                  <p className="font-bold">
                    {reportTypeLabel(item.report_type)} v{item.version ?? "1"}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {item.status || "Ukjent status"} · {formatDateTime(item.created_at)}
                  </p>
                </Link>
              ))}

              {latestReports.length === 0 ? (
                <p className="text-slate-500">Ingen rapporter ennå.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-violet-200 bg-white p-6 shadow-sm ring-1 ring-violet-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-700">
                  Siste 5
                </p>
                <h2 className="mt-2 text-2xl font-bold">Raske sjekker</h2>
              </div>
              <Link
                href="/admin/raske-sjekker"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-950 hover:bg-slate-100"
              >
                Se alle
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {latestQuickChecks.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <p className="break-words font-bold">{item.url}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {item.role || "Ukjent rolle"} · {item.check_count ?? 1} sjekk ·{" "}
                    {item.ai_status || "Ingen AI-status"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Sist sjekket: {formatDateTime(item.last_checked_at)}
                  </p>
                </div>
              ))}

              {latestQuickChecks.length === 0 ? (
                <p className="text-slate-500">Ingen raske sjekker ennå.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-violet-200 bg-white p-6 shadow-sm ring-1 ring-violet-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-700">
                  Siste 5
                </p>
                <h2 className="mt-2 text-2xl font-bold">Siste pakker</h2>
              </div>
              <Link
                href="/admin/pakker"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-950 hover:bg-slate-100"
              >
                Endre
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {latestAccess.map((item) => (
                <Link
                  key={item.id}
                  href={`/min-side/saker/${item.case_id}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 hover:bg-violet-50"
                >
                  <p className="font-bold">{packageLabel(item.package_id)}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {item.status} · {formatDateTime(item.created_at)}
                  </p>
                </Link>
              ))}

              {latestAccess.length === 0 ? (
                <p className="text-slate-500">Ingen pakker ennå.</p>
              ) : null}
            </div>
          </section>

          <section className="rounded-3xl border border-violet-200 bg-white p-6 shadow-sm ring-1 ring-violet-100 xl:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-700">
                  Siste 5
                </p>
                <h2 className="mt-2 text-2xl font-bold">Siste brukere</h2>
              </div>
              <Link
                href="/admin/brukere"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-950 hover:bg-slate-100"
              >
                Se alle
              </Link>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <div className="hidden grid-cols-4 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-600 md:grid">
                <span>Navn</span>
                <span>E-post</span>
                <span>Rolle</span>
                <span>Opprettet</span>
              </div>

              {latestProfiles.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 border-t border-slate-200 px-5 py-4 text-sm md:grid-cols-4"
                >
                  <span className="font-semibold">
                    {item.full_name || "Navn ikke satt"}
                  </span>
                  <span className="break-words text-slate-700">{item.email}</span>
                  <span className="text-violet-700">
                    {item.is_admin ? "Admin" : item.role_type || "Privatperson"}
                  </span>
                  <span className="text-slate-500">
                    {formatDateTime(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <LightPublicFooter />
    </main>
  );
}
