"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
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

const reportTypeOptions = [
  { id: "", label: "Alle dokumenter" },
  { id: "free_check", label: "Regelbasert rapport" },
  { id: "full_report", label: "KI-rapport" },
  { id: "pfu_draft", label: "PFU-klage" },
  { id: "police_draft", label: "Politianmeldelse" },
  { id: "investigation_draft", label: "Utredning" },
];

const PAGE_SIZE = 10;

function reportTypeLabel(type: string) {
  if (type === "free_check") return "Regelbasert rapport";
  if (type === "full_report") return "KI-rapport";
  if (type === "pfu_draft") return "PFU-klage";
  if (type === "police_draft") return "Politianmeldelse";
  if (type === "investigation_draft") return "Utredning";
  return type;
}

function reportHref(report: AdminReport) {
  if (report.report_type === "pfu_draft") {
    return `/min-side/saker/${report.case_id}/pfu`;
  }

  if (report.report_type === "police_draft") {
    return `/min-side/saker/${report.case_id}/politianmeldelse`;
  }

  if (report.report_type === "investigation_draft") {
    return `/min-side/saker/${report.case_id}/utredning`;
  }

  return `/min-side/saker/${report.case_id}/rapport`;
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

export default function AdminReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [reportTypeFilter, setReportTypeFilter] = useState("");
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [casesById, setCasesById] = useState<Record<string, AdminCase>>({});
  const [profilesById, setProfilesById] = useState<Record<string, AdminProfile>>({});
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

  async function loadReports(nextSearch = search, nextType = reportTypeFilter) {
    setIsSearching(true);
    setErrorMessage("");

    const cleanSearch = nextSearch.trim();

    let reportRows: AdminReport[] = [];

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

      let matchedCases: AdminCase[] = [];

      const { data: textCases, error: textCasesError } = await supabase
        .from("cases")
        .select("id,user_id,title,status,media_name,article_title,created_at")
        .or(
          `title.ilike.%${cleanSearch}%,media_name.ilike.%${cleanSearch}%,article_title.ilike.%${cleanSearch}%`
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (textCasesError) {
        setErrorMessage(textCasesError.message);
        setIsSearching(false);
        return;
      }

      matchedCases = [...((textCases ?? []) as AdminCase[])];

      if (matchedUserIds.length > 0) {
        const { data: userCases, error: userCasesError } = await supabase
          .from("cases")
          .select("id,user_id,title,status,media_name,article_title,created_at")
          .in("user_id", matchedUserIds)
          .order("created_at", { ascending: false })
          .limit(50);

        if (userCasesError) {
          setErrorMessage(userCasesError.message);
          setIsSearching(false);
          return;
        }

        matchedCases = [...matchedCases, ...((userCases ?? []) as AdminCase[])];
      }

      const mergedCases = new Map<string, AdminCase>();
      matchedCases.forEach((caseItem) => mergedCases.set(caseItem.id, caseItem));

      const caseIds = Array.from(mergedCases.keys());

      if (caseIds.length === 0) {
        setReports([]);
        setCasesById({});
        setProfilesById({});
        setIsSearching(false);
        return;
      }

      let reportQuery = supabase
        .from("case_reports")
        .select("id,case_id,version,report_type,status,created_at")
        .in("case_id", caseIds)
        .order("created_at", { ascending: false })
        .limit(25);

      if (nextType) {
        reportQuery = reportQuery.eq("report_type", nextType);
      }

      const { data, error } = await reportQuery;

      if (error) {
        setErrorMessage(error.message);
        setIsSearching(false);
        return;
      }

      reportRows = (data ?? []) as AdminReport[];
    } else {
      let reportQuery = supabase
        .from("case_reports")
        .select("id,case_id,version,report_type,status,created_at")
        .order("created_at", { ascending: false })
        .limit(25);

      if (nextType) {
        reportQuery = reportQuery.eq("report_type", nextType);
      }

      const { data, error } = await reportQuery;

      if (error) {
        setErrorMessage(error.message);
        setIsSearching(false);
        return;
      }

      reportRows = (data ?? []) as AdminReport[];
    }

    const caseIds = Array.from(new Set(reportRows.map((report) => report.case_id)));

    const casesResult =
      caseIds.length > 0
        ? await supabase
            .from("cases")
            .select("id,user_id,title,status,media_name,article_title,created_at")
            .in("id", caseIds)
        : { data: [], error: null };

    if (casesResult.error) {
      setErrorMessage(casesResult.error.message);
      setIsSearching(false);
      return;
    }

    const caseRows = (casesResult.data ?? []) as AdminCase[];

    const userIds = Array.from(
      new Set(caseRows.map((caseItem) => caseItem.user_id).filter(Boolean))
    ) as string[];

    const profilesResult =
      userIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id,full_name,email,role_type,is_admin,created_at")
            .in("id", userIds)
        : { data: [], error: null };

    if (profilesResult.error) {
      setErrorMessage(profilesResult.error.message);
      setIsSearching(false);
      return;
    }

    const caseMap = caseRows.reduce<Record<string, AdminCase>>(
      (current, caseItem) => {
        current[caseItem.id] = caseItem;
        return current;
      },
      {}
    );

    const profileMap = ((profilesResult.data ?? []) as AdminProfile[]).reduce<
      Record<string, AdminProfile>
    >((current, profile) => {
      current[profile.id] = profile;
      return current;
    }, {});

    setReports(reportRows);
    setVisibleCount(PAGE_SIZE);
    setCasesById(caseMap);
    setProfilesById(profileMap);
    setIsSearching(false);
  }

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const checkedUser = await checkAdmin();

      if (checkedUser) {
        await loadReports("", "");
      }

      setIsLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadReports(search, reportTypeFilter);
  }

  const visibleReports = reports.slice(0, visibleCount);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-lg font-bold text-slate-700">Laster rapporter...</p>
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
              Admin / rapporter
            </p>

            <h1 className="mt-4 max-w-4xl break-words hyphens-auto text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Rapporter
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Finn genererte rapporter og dokumenter på tvers av saker. Filtrer
              på type og åpne riktig del av saken direkte.
            </p>
          </section>

          <AdminAccountBox
            adminName={adminProfile?.full_name}
            user={user}
            className="hidden lg:block"
          />
        </div>

        <AdminNav />

        <section className="mt-8 rounded-3xl border border-violet-200 bg-white p-5 shadow-sm ring-1 ring-violet-100 sm:p-7">
          <form onSubmit={handleSearch} className="grid gap-4 lg:grid-cols-[1fr_260px_auto_auto]">
            <div>
              <label htmlFor="search" className="text-sm font-bold text-slate-800">
                Søk etter sak, mediehus, artikkel, navn eller e-post
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
                htmlFor="reportTypeFilter"
                className="text-sm font-bold text-slate-800"
              >
                Type
              </label>
              <select
                id="reportTypeFilter"
                value={reportTypeFilter}
                onChange={(event) => setReportTypeFilter(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-violet-500 focus:bg-white"
              >
                {reportTypeOptions.map((option) => (
                  <option key={option.id || "all"} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="self-end rounded-2xl bg-violet-700 px-6 py-4 font-black text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSearching ? "Søker..." : "Søk"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setReportTypeFilter("");
                loadReports("", "");
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
          {visibleReports.map((report) => {
            const caseItem = casesById[report.case_id];
            const profile =
              caseItem?.user_id ? profilesById[caseItem.user_id] : null;

            return (
              <article
                key={report.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
              >
                <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-violet-700">
                        {reportTypeLabel(report.report_type)}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-600">
                        v{report.version ?? "1"}
                      </span>

                      <span className="text-sm font-semibold text-slate-500">
                        {formatDateTime(report.created_at)}
                      </span>
                    </div>

                    <h2 className="mt-4 text-3xl font-black text-slate-950">
                      {caseItem?.title || "Ukjent sak"}
                    </h2>

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      {caseItem?.media_name || "Ukjent medium"}
                      {caseItem?.article_title ? ` · ${caseItem.article_title}` : ""}
                    </p>

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
                          Status
                        </p>
                        <p className="mt-1 font-black text-slate-950">
                          {report.status || "Ukjent"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid content-start gap-3">
                    <Link
                      href={reportHref(report)}
                      className="rounded-2xl bg-violet-700 px-5 py-4 text-center text-sm font-black text-white hover:bg-violet-800"
                    >
                      Åpne dokument
                    </Link>

                    <Link
                      href={`/min-side/saker/${report.case_id}`}
                      className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-center text-sm font-black text-violet-900 hover:bg-violet-100"
                    >
                      Åpne sak
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}

          {visibleCount < reports.length ? (
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
              className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm font-black text-violet-900 hover:bg-violet-100"
            >
              Vis flere rapporter
            </button>
          ) : null}

          {reports.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-slate-700">
              Ingen rapporter funnet.
            </div>
          ) : null}
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
