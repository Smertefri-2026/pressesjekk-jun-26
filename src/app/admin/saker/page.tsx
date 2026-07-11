"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
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
  created_at: string | null;
};

const PAGE_SIZE = 10;

type AdminCase = {
  id: string;
  user_id: string | null;
  title: string;
  status: string | null;
  media_name: string | null;
  article_title: string | null;
  article_url: string | null;
  created_at: string | null;
};

type AdminCaseAccess = {
  id: string;
  case_id: string;
  package_id: string;
  status: string;
  source: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type AdminReport = {
  id: string;
  case_id: string;
  report_type: string;
};

const statusOptions = [
  { id: "", label: "Alle statuser" },
  { id: "draft", label: "Utkast" },
  { id: "in_progress", label: "Under arbeid" },
  { id: "report_ready", label: "Rapport klar" },
  { id: "closed", label: "Lukket" },
];

const packageLabels: Record<string, string> = {
  report_pack: "Rapportpakke",
  pfu_pack: "PFU-pakke",
  full_pack: "Full dokumentpakke",
  investigation_pack: "Utredningspakke",
};

function packageLabel(packageId: string) {
  return packageLabels[packageId] ?? packageId;
}

function statusLabel(status: string | null) {
  if (status === "draft") return "Utkast";
  if (status === "in_progress") return "Under arbeid";
  if (status === "report_ready") return "Rapport klar";
  if (status === "closed") return "Lukket";
  return status || "Ukjent";
}

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

export default function AdminCasesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, AdminProfile>>({});
  const [accessByCaseId, setAccessByCaseId] = useState<Record<string, AdminCaseAccess>>({});
  const [reportCountsByCaseId, setReportCountsByCaseId] = useState<Record<string, number>>({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  async function checkAdmin() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.href = "/login";
      return null;
    }

    setUser(user);

    const { data: ownProfile, error: ownProfileError } = await supabase
      .from("profiles")
      .select("id,full_name,email,role_type,is_admin,created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (ownProfileError) {
      setErrorMessage(ownProfileError.message);
      return null;
    }

    if (!ownProfile?.is_admin) {
      setIsAdmin(false);
      return null;
    }

    setAdminProfile(ownProfile as AdminProfile);
    setIsAdmin(true);
    return user;
  }

  async function loadCases(nextSearch = search, nextStatus = statusFilter) {
    setIsSearching(true);
    setErrorMessage("");

    const cleanSearch = nextSearch.trim();

    let caseRows: AdminCase[] = [];

    if (cleanSearch) {
      const { data: profileMatches, error: profileSearchError } = await supabase
        .from("profiles")
        .select("id,full_name,email,role_type,is_admin,created_at")
        .or(`full_name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%`)
        .limit(50);

      if (profileSearchError) {
        setErrorMessage(profileSearchError.message);
        setIsSearching(false);
        return;
      }

      const matchedUserIds = ((profileMatches ?? []) as AdminProfile[]).map(
        (profile) => profile.id
      );

      let textQuery = supabase
        .from("cases")
        .select("id,user_id,title,status,media_name,article_title,article_url,created_at")
        .or(
          `title.ilike.%${cleanSearch}%,media_name.ilike.%${cleanSearch}%,article_title.ilike.%${cleanSearch}%,article_url.ilike.%${cleanSearch}%`
        )
        .order("created_at", { ascending: false })
        .limit(25);

      if (nextStatus) {
        textQuery = textQuery.eq("status", nextStatus);
      }

      const { data: textCases, error: textCasesError } = await textQuery;

      if (textCasesError) {
        setErrorMessage(textCasesError.message);
        setIsSearching(false);
        return;
      }

      let userCases: AdminCase[] = [];

      if (matchedUserIds.length > 0) {
        let userQuery = supabase
          .from("cases")
          .select("id,user_id,title,status,media_name,article_title,article_url,created_at")
          .in("user_id", matchedUserIds)
          .order("created_at", { ascending: false })
          .limit(25);

        if (nextStatus) {
          userQuery = userQuery.eq("status", nextStatus);
        }

        const { data: userCasesData, error: userCasesError } = await userQuery;

        if (userCasesError) {
          setErrorMessage(userCasesError.message);
          setIsSearching(false);
          return;
        }

        userCases = (userCasesData ?? []) as AdminCase[];
      }

      const merged = new Map<string, AdminCase>();

      [...((textCases ?? []) as AdminCase[]), ...userCases].forEach((item) => {
        merged.set(item.id, item);
      });

      caseRows = Array.from(merged.values())
        .sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime()
        )
        .slice(0, 25);
    } else {
      let query = supabase
        .from("cases")
        .select("id,user_id,title,status,media_name,article_title,article_url,created_at")
        .order("created_at", { ascending: false })
        .limit(25);

      if (nextStatus) {
        query = query.eq("status", nextStatus);
      }

      const { data, error } = await query;

      if (error) {
        setErrorMessage(error.message);
        setIsSearching(false);
        return;
      }

      caseRows = (data ?? []) as AdminCase[];
    }

    const userIds = Array.from(
      new Set(caseRows.map((caseItem) => caseItem.user_id).filter(Boolean))
    ) as string[];

    const caseIds = caseRows.map((caseItem) => caseItem.id);

    const [profilesResult, accessResult, reportsResult] = await Promise.all([
      userIds.length > 0
        ? supabase
            .from("profiles")
            .select("id,full_name,email,role_type,is_admin,created_at")
            .in("id", userIds)
        : Promise.resolve({ data: [], error: null }),
      caseIds.length > 0
        ? supabase
            .from("case_access")
            .select("id,case_id,package_id,status,source,created_at,updated_at")
            .in("case_id", caseIds)
        : Promise.resolve({ data: [], error: null }),
      caseIds.length > 0
        ? supabase
            .from("case_reports")
            .select("id,case_id,report_type")
            .in("case_id", caseIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (profilesResult.error) {
      setErrorMessage(profilesResult.error.message);
      setIsSearching(false);
      return;
    }

    if (accessResult.error) {
      setErrorMessage(accessResult.error.message);
      setIsSearching(false);
      return;
    }

    if (reportsResult.error) {
      setErrorMessage(reportsResult.error.message);
      setIsSearching(false);
      return;
    }

    const profileMap = ((profilesResult.data ?? []) as AdminProfile[]).reduce<
      Record<string, AdminProfile>
    >((current, profile) => {
      current[profile.id] = profile;
      return current;
    }, {});

    const accessMap = ((accessResult.data ?? []) as AdminCaseAccess[]).reduce<
      Record<string, AdminCaseAccess>
    >((current, access) => {
      current[access.case_id] = access;
      return current;
    }, {});

    const reportCounts = ((reportsResult.data ?? []) as AdminReport[]).reduce<
      Record<string, number>
    >((current, report) => {
      current[report.case_id] = (current[report.case_id] ?? 0) + 1;
      return current;
    }, {});

    setCases(caseRows);
    setVisibleCount(PAGE_SIZE);
    setProfilesById(profileMap);
    setAccessByCaseId(accessMap);
    setReportCountsByCaseId(reportCounts);
    setIsSearching(false);
  }

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const checkedUser = await checkAdmin();

      if (checkedUser) {
        await loadCases("", "");
      }

      setIsLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadCases(search, statusFilter);
  }

  const visibleCases = cases.slice(0, visibleCount);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-lg font-bold text-slate-700">Laster saker...</p>
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
              Admin / saker
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Saker
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Finn saker på tvers av brukere. Bruk søk og statusfilter for å
              åpne sak, se kunde, rapportantall og aktiv pakke.
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
                href="/admin"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
              >
                Admin
              </Link>

              <Link
                href="/admin/pakker"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
              >
                Pakker
              </Link>

              <SignOutButton />
            </div>
          </aside>
        </div>

        <AdminNav />

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <form onSubmit={handleSearch} className="grid gap-4 lg:grid-cols-[1fr_240px_auto_auto]">
            <div>
              <label htmlFor="search" className="text-sm font-bold text-slate-800">
                Søk etter sak, mediehus, artikkel, URL, navn eller e-post
              </label>
              <input
                id="search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Skriv f.eks. NRK, Bane Nor eller kundens e-post"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-violet-500 focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="statusFilter"
                className="text-sm font-bold text-slate-800"
              >
                Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-violet-500 focus:bg-white"
              >
                {statusOptions.map((option) => (
                  <option key={option.id || "all"} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="self-end rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSearching ? "Søker..." : "Søk"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                loadCases("", "");
              }}
              disabled={isSearching}
              className="self-end rounded-2xl border border-slate-300 bg-white px-6 py-4 font-black text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Nullstill
            </button>
          </form>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {errorMessage}
            </div>
          ) : null}
        </section>

        <section className="mt-8 grid gap-5">
          {visibleCases.map((caseItem) => {
            const profile = caseItem.user_id ? profilesById[caseItem.user_id] : null;
            const access = accessByCaseId[caseItem.id];
            const reportCount = reportCountsByCaseId[caseItem.id] ?? 0;

            return (
              <article
                key={caseItem.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
              >
                <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-violet-700">
                        {statusLabel(caseItem.status)}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-600">
                        {access ? packageLabel(access.package_id) : "Ingen pakke"}
                      </span>

                      <span className="text-sm font-semibold text-slate-500">
                        {formatDateTime(caseItem.created_at)}
                      </span>
                    </div>

                    <h2 className="mt-4 text-3xl font-black text-slate-950">
                      {caseItem.title}
                    </h2>

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      {caseItem.media_name || "Ukjent medium"}
                      {caseItem.article_title ? ` · ${caseItem.article_title}` : ""}
                    </p>

                    {caseItem.article_url ? (
                      <p className="mt-2 break-words text-sm font-semibold text-slate-500">
                        {caseItem.article_url}
                      </p>
                    ) : null}

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-bold text-slate-500">Kunde</p>
                        <p className="mt-1 font-black text-slate-950">
                          {profile?.full_name || "Navn ikke satt"}
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-slate-600">
                          {profile?.email || "E-post ikke funnet"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-bold text-slate-500">
                          Rapporter
                        </p>
                        <p className="mt-1 text-3xl font-black text-slate-950">
                          {reportCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid content-start gap-3">
                    <Link
                      href={`/min-side/saker/${caseItem.id}`}
                      className="rounded-2xl bg-violet-700 px-5 py-4 text-center text-sm font-black text-white hover:bg-violet-800"
                    >
                      Åpne sak
                    </Link>

                    <Link
                      href={`/admin/pakker?search=${encodeURIComponent(caseItem.title)}`}
                      className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-center text-sm font-black text-violet-900 hover:bg-violet-100"
                    >
                      Endre pakke
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}

          {visibleCount < cases.length ? (
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
              className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm font-black text-violet-900 hover:bg-violet-100"
            >
              Vis flere saker
            </button>
          ) : null}

          {cases.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-slate-700">
              Ingen saker funnet.
            </div>
          ) : null}
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}
