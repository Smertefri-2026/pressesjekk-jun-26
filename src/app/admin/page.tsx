"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  return packageId;
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [refundCount, setRefundCount] = useState(0);

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
        refundsResult,
        profilesResult,
        casesResult,
        reportsResult,
        quickChecksResult,
        accessResult,
      ] = await Promise.all([
        supabase
          .from("user_purchases")
          .select("id,refund_status")
          .in("refund_status", ["requested", "approved"])
          .limit(100),
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
        refundsResult.error ||
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

      setRefundCount((refundsResult.data ?? []).length);

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
              Kontrollpanel for brukere, saker, pakker, rapporter, raske sjekker,
              refusjoner og Stripe-betalinger.
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

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/admin/refusjoner"
            className="rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm transition hover:-translate-y-1 hover:bg-violet-100"
          >
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">
              Viktig drift
            </p>
            <h2 className="mt-3 text-2xl font-black text-slate-950">
              Refusjoner
            </h2>
            <p className="mt-3 text-sm font-bold text-violet-900">
              {refundCount > 0 ? `${refundCount} til behandling` : "Ingen åpne refusjoner"}
            </p>
          </Link>

          <Link
            href="/admin/stripe"
            className="rounded-3xl border border-violet-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:bg-violet-50"
          >
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">
              Betaling
            </p>
            <h2 className="mt-3 text-2xl font-black text-slate-950">
              Stripe
            </h2>
            <p className="mt-3 text-sm font-bold text-violet-700">
              Omsetning, abonnement og kvitteringer
            </p>
          </Link>

          <Link
            href="/admin/pakker"
            className="rounded-3xl border border-violet-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:bg-violet-50"
          >
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">
              Tilgang
            </p>
            <h2 className="mt-3 text-2xl font-black text-slate-950">
              Pakker
            </h2>
            <p className="mt-3 text-sm font-bold text-violet-700">
              Manuell tilgang og kompensasjon
            </p>
          </Link>

          <Link
            href="/admin/raske-sjekker"
            className="rounded-3xl border border-violet-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:bg-violet-50"
          >
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">
              Inngang
            </p>
            <h2 className="mt-3 text-2xl font-black text-slate-950">
              Raske sjekker
            </h2>
            <p className="mt-3 text-sm font-bold text-violet-700">
              URL-er, AI-status og feilkall
            </p>
          </Link>
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
