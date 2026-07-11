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

type AdminQuickCheck = {
  id: string;
  url: string;
  role: string | null;
  check_count: number | null;
  ai_status: string | null;
  ai_summary: string | null;
  ai_risk_level: string | null;
  ai_recommended_next_step: string | null;
  created_at: string | null;
  last_checked_at: string | null;
};

const statusOptions = [
  { id: "", label: "Alle statuser" },
  { id: "ready", label: "Klar" },
  { id: "pending", label: "Venter" },
  { id: "error", label: "Feil" },
];

const PAGE_SIZE = 10;

function roleLabel(role: string | null) {
  if (role === "reader") return "Leser/privatperson";
  if (role === "mentioned") return "Omtalt person";
  if (role === "journalist") return "Journalist/redaksjon";
  if (role === "lawyer") return "Advokat/rådgiver";
  return role || "Ukjent rolle";
}

function riskLabel(risk: string | null) {
  if (risk === "low") return "Lav";
  if (risk === "medium") return "Middels";
  if (risk === "high") return "Høy";
  return risk || "Ikke satt";
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

export default function AdminQuickChecksPage() {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [quickChecks, setQuickChecks] = useState<AdminQuickCheck[]>([]);
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

  async function loadQuickChecks(nextSearch = search, nextStatus = statusFilter) {
    setIsSearching(true);
    setErrorMessage("");

    const cleanSearch = nextSearch.trim();

    let query = supabase
      .from("quick_checks")
      .select(
        "id,url,role,check_count,ai_status,ai_summary,ai_risk_level,ai_recommended_next_step,created_at,last_checked_at"
      )
      .order("last_checked_at", { ascending: false })
      .limit(25);

    if (cleanSearch) {
      query = query.or(
        `url.ilike.%${cleanSearch}%,role.ilike.%${cleanSearch}%,ai_summary.ilike.%${cleanSearch}%`
      );
    }

    if (nextStatus) {
      query = query.eq("ai_status", nextStatus);
    }

    const { data, error } = await query;

    if (error) {
      setErrorMessage(error.message);
      setIsSearching(false);
      return;
    }

    setQuickChecks((data ?? []) as AdminQuickCheck[]);
    setVisibleCount(PAGE_SIZE);
    setIsSearching(false);
  }

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const checkedUser = await checkAdmin();

      if (checkedUser) {
        await loadQuickChecks("", "");
      }

      setIsLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadQuickChecks(search, statusFilter);
  }

  const visibleQuickChecks = quickChecks.slice(0, visibleCount);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-lg font-bold text-slate-700">
            Laster raske sjekker...
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
              Admin / raske sjekker
            </p>

            <h1 className="mt-4 max-w-4xl break-words hyphens-auto text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Raske sjekker
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Se URL-er som er testet før sak opprettes. Bruk dette til å se
              interesse, gjentatte artikler, AI-status og mulige feilkall.
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
          <form onSubmit={handleSearch} className="grid gap-4 lg:grid-cols-[1fr_240px_auto_auto]">
            <div>
              <label htmlFor="search" className="text-sm font-bold text-slate-800">
                Søk etter URL, rolle eller AI-oppsummering
              </label>
              <input
                id="search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Skriv f.eks. nrk.no, Bane Nor eller journalist"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-violet-500 focus:bg-white"
              />
            </div>

            <div>
              <label
                htmlFor="statusFilter"
                className="text-sm font-bold text-slate-800"
              >
                AI-status
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
              className="self-end rounded-2xl bg-violet-700 px-6 py-4 font-black text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSearching ? "Søker..." : "Søk"}
            </button>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                loadQuickChecks("", "");
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
          {visibleQuickChecks.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
            >
              <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-violet-700">
                      {roleLabel(item.role)}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-600">
                      {item.ai_status || "Ingen AI-status"}
                    </span>

                    <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-violet-900">
                      Risiko: {riskLabel(item.ai_risk_level)}
                    </span>
                  </div>

                  <h2 className="mt-4 break-words text-xl font-black text-slate-950">
                    {item.url}
                  </h2>

                  <p className="mt-3 text-sm font-semibold text-slate-500">
                    Sjekket {item.check_count ?? 1} gang(er) · Sist sjekket{" "}
                    {formatDateTime(item.last_checked_at)}
                  </p>

                  {item.ai_summary ? (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-bold text-slate-500">
                        AI-oppsummering
                      </p>
                      <p className="mt-2 leading-7 text-slate-700">
                        {item.ai_summary}
                      </p>
                    </div>
                  ) : null}

                  {item.ai_recommended_next_step ? (
                    <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                      <p className="text-sm font-bold text-violet-800">
                        Anbefalt neste steg
                      </p>
                      <p className="mt-2 leading-7 text-slate-700">
                        {item.ai_recommended_next_step}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="grid content-start gap-3">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl bg-violet-700 px-5 py-4 text-center text-sm font-black text-white hover:bg-violet-800"
                  >
                    Åpne URL
                  </a>

                  <Link
                    href={`/min-side/saker/ny?url=${encodeURIComponent(item.url)}&role=${encodeURIComponent(item.role || "reader")}`}
                    className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-center text-sm font-black text-violet-900 hover:bg-violet-100"
                  >
                    Opprett sak
                  </Link>
                </div>
              </div>
            </article>
          ))}

          {visibleCount < quickChecks.length ? (
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
              className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm font-black text-violet-900 hover:bg-violet-100"
            >
              Vis flere raske sjekker
            </button>
          ) : null}

          {quickChecks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-slate-700">
              Ingen raske sjekker funnet.
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
