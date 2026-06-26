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

const packageOptions = [
  { id: "report_pack", label: "Rapportpakke" },
  { id: "pfu_pack", label: "PFU-pakke" },
  { id: "full_pack", label: "Full dokumentpakke" },
  { id: "investigation_pack", label: "Utredningspakke" },
  { id: "monthly_start", label: "Månedsavtale Start" },
  { id: "monthly_pro", label: "Månedsavtale Pro" },
  { id: "monthly_agency", label: "Månedsavtale Byrå" },
  { id: "monthly_enterprise", label: "Enterprise" },
];

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

  const [latestProfiles, setLatestProfiles] = useState<AdminProfile[]>([]);
  const [latestCases, setLatestCases] = useState<AdminCase[]>([]);
  const [latestReports, setLatestReports] = useState<AdminReport[]>([]);
  const [latestQuickChecks, setLatestQuickChecks] = useState<AdminQuickCheck[]>([]);
  const [latestAccess, setLatestAccess] = useState<AdminCaseAccess[]>([]);
  const [packageSelections, setPackageSelections] = useState<Record<string, string>>({});
  const [savingAccessCaseId, setSavingAccessCaseId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

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
      const accessRows = (accessResult.data ?? []) as AdminCaseAccess[];

      setLatestQuickChecks((quickChecksResult.data ?? []) as AdminQuickCheck[]);
      setLatestAccess(accessRows);
      setPackageSelections(
        accessRows.reduce<Record<string, string>>((current, access) => {
          current[access.case_id] = access.package_id;
          return current;
        }, {})
      );

      setIsLoading(false);
    }

    loadAdminData();
  }, []);

  function accessForCase(caseId: string) {
    return latestAccess.find((access) => access.case_id === caseId) ?? null;
  }

  async function handleSaveCaseAccess(caseItem: AdminCase) {
    if (!caseItem.user_id) {
      setErrorMessage("Saken mangler bruker-ID og kan ikke få pakke.");
      return;
    }

    const packageId = packageSelections[caseItem.id] || "report_pack";

    setSavingAccessCaseId(caseItem.id);
    setErrorMessage("");
    setSuccessMessage("");

    const { data, error } = await supabase
      .from("case_access")
      .upsert(
        {
          case_id: caseItem.id,
          user_id: caseItem.user_id,
          package_id: packageId,
          status: "active",
          source: "manual",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "case_id" }
      )
      .select("id,case_id,package_id,status,created_at")
      .single();

    if (error) {
      setErrorMessage(error.message);
      setSavingAccessCaseId(null);
      return;
    }

    const savedAccess = data as AdminCaseAccess;

    setLatestAccess((current) => {
      const withoutCurrent = current.filter(
        (access) => access.case_id !== savedAccess.case_id
      );
      return [savedAccess, ...withoutCurrent];
    });

    setSuccessMessage(
      `Tilgang lagret: ${caseItem.title} – ${packageLabel(packageId)}.`
    );
    setSavingAccessCaseId(null);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <LightPublicHeader />
          <div className="py-14">
            <p className="text-lg font-semibold text-slate-700">
              Laster adminpanel...
            </p>
          </div>
        </section>
        <LightPublicFooter />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <LightPublicHeader />
          <div className="py-14">
            <Link href="/" className="text-sm text-violet-700 hover:text-violet-800">
              ← Tilbake til forsiden
            </Link>

            <div className="mt-8 max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-8">
              <p className="text-sm uppercase tracking-[0.25em] text-red-700">
                Ingen tilgang
              </p>
              <h1 className="mt-3 text-4xl font-bold">
                Admin er kun for interne brukere
              </h1>
              <p className="mt-5 leading-8 text-red-800">
                Denne siden krever admin-tilgang.
              </p>
            </div>
          </div>
        </section>
        <LightPublicFooter />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <LightPublicHeader />

        <div className="py-14">
          <Link href="/" className="text-sm text-violet-700 hover:text-violet-800">
            ← Tilbake til forsiden
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_390px] lg:items-start">
            <section className="rounded-3xl border border-violet-200 bg-white p-6 shadow-sm ring-1 ring-violet-100 md:p-8">
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-violet-700">
                    Admin
                  </p>
                  <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
                    Drift og oversikt
                  </h1>
                  <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
                    Ekte adminoversikt for brukere, saker, rapporter, raske
                    sjekker og aktive pakker.
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-black text-amber-900 shadow-sm">
                  Admin V1 aktiv
                </div>
              </div>
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

          {successMessage ? (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              {successMessage}
            </div>
          ) : null}

          <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Brukere", userCount],
              ["Saker", caseCount],
              ["Rapporter", reportCount],
              ["Raske sjekker", quickCheckCount],
              ["Aktive pakker", accessCount],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-3xl border border-slate-200 bg-white p-6"
              >
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-3 text-4xl font-bold">{value}</p>
              </div>
            ))}
          </section>

          <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {[
              {
                title: "Brukere",
                text: "Søk etter kunder, roller og adminbrukere.",
                href: "/admin/brukere",
              },
              {
                title: "Saker",
                text: "Finn saker, status, mediehus og kunde.",
                href: "/admin/saker",
              },
              {
                title: "Rapporter",
                text: "Se genererte rapporter og dokumenter.",
                href: "/admin/rapporter",
              },
              {
                title: "Pakker",
                text: "Gi eller endre tilgang manuelt.",
                href: "/admin/pakker",
              },
              {
                title: "Raske sjekker",
                text: "Se URL-sjekker, roller og AI-status.",
                href: "/admin/raske-sjekker",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-3xl border border-violet-200 bg-violet-50 p-6 shadow-sm transition hover:-translate-y-1 hover:bg-violet-100 hover:shadow-md"
              >
                <p className="text-lg font-black text-slate-950">{item.title}</p>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                  {item.text}
                </p>
              </Link>
            ))}
          </section>

          <div className="mt-12 grid gap-8 xl:grid-cols-2">
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
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
                {latestCases.map((item) => {
                  const currentAccess = accessForCase(item.id);

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <Link
                        href={`/min-side/saker/${item.id}`}
                        className="block hover:text-violet-800"
                      >
                        <p className="font-bold">{item.title}</p>
                        <p className="mt-2 text-sm text-slate-500">
                          {item.media_name || "Ukjent medium"} ·{" "}
                          {item.status || "Ukjent status"} ·{" "}
                          {formatDateTime(item.created_at)}
                        </p>
                        {item.article_title ? (
                          <p className="mt-2 text-sm text-slate-700">
                            {item.article_title}
                          </p>
                        ) : null}
                      </Link>

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">
                          Pakke
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          Nåværende:{" "}
                          <span className="font-bold text-slate-200">
                            {currentAccess
                              ? packageLabel(currentAccess.package_id)
                              : "Ingen aktiv pakke"}
                          </span>
                        </p>

                        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                          <select
                            value={
                              packageSelections[item.id] ||
                              currentAccess?.package_id ||
                              "report_pack"
                            }
                            onChange={(event) =>
                              setPackageSelections((current) => ({
                                ...current,
                                [item.id]: event.target.value,
                              }))
                            }
                            className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-violet-500"
                          >
                            {packageOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleSaveCaseAccess(item)}
                            disabled={savingAccessCaseId === item.id}
                            className="rounded-xl bg-violet-700 px-4 py-3 text-sm font-black text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {savingAccessCaseId === item.id
                              ? "Lagrer..."
                              : "Lagre pakke"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {latestCases.length === 0 ? (
                  <p className="text-slate-500">Ingen saker ennå.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6">
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

            <section className="rounded-3xl border border-slate-200 bg-white p-6">
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

            <section className="rounded-3xl border border-slate-200 bg-white p-6">
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
                {latestAccess.slice(0, 10).map((item) => (
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

            <section className="rounded-3xl border border-slate-200 bg-white p-6 xl:col-span-2">
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
                <div className="hidden grid-cols-4 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 md:grid">
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
        </div>
      </section>

      <LightPublicFooter />
    </main>
  );
}
