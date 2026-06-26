"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";
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
  if (packageId === "monthly_start") return "Månedsavtale Start";
  if (packageId === "monthly_pro") return "Månedsavtale Pro";
  if (packageId === "monthly_agency") return "Månedsavtale Byrå";
  if (packageId === "monthly_enterprise") return "Enterprise";
  return packageId;
}

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [userCount, setUserCount] = useState(0);
  const [caseCount, setCaseCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);
  const [quickCheckCount, setQuickCheckCount] = useState(0);
  const [accessCount, setAccessCount] = useState(0);

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

      const { data: ownProfile, error: ownProfileError } = await supabase
        .from("profiles")
        .select("id,email,is_admin")
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

      setIsAdmin(true);

      const [
        profilesCountResult,
        casesCountResult,
        reportsCountResult,
        quickChecksCountResult,
        accessCountResult,
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
          .from("profiles")
          .select("id,full_name,email,role_type,is_admin,created_at")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("cases")
          .select("id,user_id,title,status,media_name,article_title,created_at")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("case_reports")
          .select("id,case_id,version,report_type,status,created_at")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("quick_checks")
          .select("id,url,role,check_count,ai_status,created_at,last_checked_at")
          .order("last_checked_at", { ascending: false })
          .limit(10),
        supabase
          .from("case_access")
          .select("id,case_id,package_id,status,created_at")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const firstError =
        profilesCountResult.error ||
        casesCountResult.error ||
        reportsCountResult.error ||
        quickChecksCountResult.error ||
        accessCountResult.error ||
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
      <main className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <PublicHeader />
          <div className="py-14">
            <p className="text-lg font-semibold text-slate-300">
              Laster adminpanel...
            </p>
          </div>
        </section>
        <PublicFooter />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <PublicHeader />
          <div className="py-14">
            <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
              ← Tilbake til forsiden
            </Link>

            <div className="mt-8 max-w-3xl rounded-3xl border border-red-300/30 bg-red-300/10 p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-red-200">
                Ingen tilgang
              </p>
              <h1 className="mt-3 text-4xl font-bold">
                Admin er kun for interne brukere
              </h1>
              <p className="mt-5 leading-8 text-red-100">
                Denne siden krever admin-tilgang.
              </p>
            </div>
          </div>
        </section>
        <PublicFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <PublicHeader />

        <div className="py-14">
          <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
            ← Tilbake til forsiden
          </Link>

          <div className="mt-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                Admin
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
                Drift og oversikt
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                Ekte adminoversikt for brukere, saker, rapporter, raske
                sjekker og aktive pakker.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-5 py-4 text-sm font-semibold text-emerald-100">
              Admin V1 aktiv
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-8 rounded-2xl border border-red-300/30 bg-red-300/10 p-5 text-red-100">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Brukere", userCount],
              ["Saker", caseCount],
              ["Rapporter", reportCount],
              ["Raske sjekker", quickCheckCount],
              ["Aktive pakker", accessCount],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
              >
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-3 text-4xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-8 xl:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-2xl font-bold">Siste saker</h2>
              <div className="mt-5 grid gap-3">
                {latestCases.map((item) => (
                  <Link
                    key={item.id}
                    href={`/min-side/saker/${item.id}`}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-5 hover:bg-slate-800"
                  >
                    <p className="font-bold">{item.title}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      {item.media_name || "Ukjent medium"} · {item.status || "Ukjent status"} ·{" "}
                      {formatDateTime(item.created_at)}
                    </p>
                    {item.article_title ? (
                      <p className="mt-2 text-sm text-slate-300">
                        {item.article_title}
                      </p>
                    ) : null}
                  </Link>
                ))}

                {latestCases.length === 0 ? (
                  <p className="text-slate-400">Ingen saker ennå.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-2xl font-bold">Siste rapporter</h2>
              <div className="mt-5 grid gap-3">
                {latestReports.map((item) => (
                  <Link
                    key={item.id}
                    href={`/min-side/saker/${item.case_id}`}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-5 hover:bg-slate-800"
                  >
                    <p className="font-bold">
                      {reportTypeLabel(item.report_type)} v{item.version ?? "1"}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      {item.status || "Ukjent status"} · {formatDateTime(item.created_at)}
                    </p>
                  </Link>
                ))}

                {latestReports.length === 0 ? (
                  <p className="text-slate-400">Ingen rapporter ennå.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-2xl font-bold">Raske sjekker</h2>
              <div className="mt-5 grid gap-3">
                {latestQuickChecks.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-5"
                  >
                    <p className="break-words font-bold">{item.url}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      {item.role || "Ukjent rolle"} · {item.check_count ?? 1} sjekk ·{" "}
                      {item.ai_status || "Ingen AI-status"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Sist sjekket: {formatDateTime(item.last_checked_at)}
                    </p>
                  </div>
                ))}

                {latestQuickChecks.length === 0 ? (
                  <p className="text-slate-400">Ingen raske sjekker ennå.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-2xl font-bold">Siste pakker</h2>
              <div className="mt-5 grid gap-3">
                {latestAccess.map((item) => (
                  <Link
                    key={item.id}
                    href={`/min-side/saker/${item.case_id}`}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-5 hover:bg-slate-800"
                  >
                    <p className="font-bold">{packageLabel(item.package_id)}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      {item.status} · {formatDateTime(item.created_at)}
                    </p>
                  </Link>
                ))}

                {latestAccess.length === 0 ? (
                  <p className="text-slate-400">Ingen pakker ennå.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 xl:col-span-2">
              <h2 className="text-2xl font-bold">Siste brukere</h2>
              <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
                <div className="hidden grid-cols-4 bg-slate-900 px-5 py-3 text-sm font-semibold text-slate-300 md:grid">
                  <span>Navn</span>
                  <span>E-post</span>
                  <span>Rolle</span>
                  <span>Opprettet</span>
                </div>

                {latestProfiles.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-2 border-t border-white/10 px-5 py-4 text-sm md:grid-cols-4"
                  >
                    <span className="font-semibold">
                      {item.full_name || "Navn ikke satt"}
                    </span>
                    <span className="break-words text-slate-300">{item.email}</span>
                    <span className="text-cyan-300">
                      {item.is_admin ? "Admin" : item.role_type || "Privatperson"}
                    </span>
                    <span className="text-slate-400">
                      {formatDateTime(item.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
