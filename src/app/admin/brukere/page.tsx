"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
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
};

type AdminCaseAccess = {
  id: string;
  user_id: string;
};

function roleLabel(roleType: string | null) {
  if (roleType === "advisor") return "Rådgiver";
  if (roleType === "lawyer") return "Advokat";
  if (roleType === "journalist") return "Journalist/redaksjon";
  if (roleType === "organization") return "Organisasjon/bedrift";
  if (roleType === "private_person") return "Privatperson";
  return "Ikke satt";
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

export default function AdminUsersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [caseCountsByUserId, setCaseCountsByUserId] = useState<Record<string, number>>({});
  const [packageCountsByUserId, setPackageCountsByUserId] = useState<Record<string, number>>({});

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

  async function loadUsers(nextSearch = search) {
    setIsSearching(true);
    setErrorMessage("");

    const cleanSearch = nextSearch.trim();

    let query = supabase
      .from("profiles")
      .select("id,full_name,email,role_type,is_admin,created_at")
      .order("created_at", { ascending: false })
      .limit(25);

    if (cleanSearch) {
      query = query.or(`full_name.ilike.%${cleanSearch}%,email.ilike.%${cleanSearch}%`);
    }

    const { data, error } = await query;

    if (error) {
      setErrorMessage(error.message);
      setIsSearching(false);
      return;
    }

    const profileRows = (data ?? []) as AdminProfile[];
    const userIds = profileRows.map((profile) => profile.id);

    const [casesResult, accessResult] = await Promise.all([
      userIds.length > 0
        ? supabase.from("cases").select("id,user_id").in("user_id", userIds)
        : Promise.resolve({ data: [], error: null }),
      userIds.length > 0
        ? supabase.from("case_access").select("id,user_id").in("user_id", userIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (casesResult.error) {
      setErrorMessage(casesResult.error.message);
      setIsSearching(false);
      return;
    }

    if (accessResult.error) {
      setErrorMessage(accessResult.error.message);
      setIsSearching(false);
      return;
    }

    const caseCounts = ((casesResult.data ?? []) as AdminCase[]).reduce<
      Record<string, number>
    >((current, caseItem) => {
      if (caseItem.user_id) {
        current[caseItem.user_id] = (current[caseItem.user_id] ?? 0) + 1;
      }
      return current;
    }, {});

    const packageCounts = ((accessResult.data ?? []) as AdminCaseAccess[]).reduce<
      Record<string, number>
    >((current, access) => {
      current[access.user_id] = (current[access.user_id] ?? 0) + 1;
      return current;
    }, {});

    setProfiles(profileRows);
    setCaseCountsByUserId(caseCounts);
    setPackageCountsByUserId(packageCounts);
    setIsSearching(false);
  }

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const checkedUser = await checkAdmin();

      if (checkedUser) {
        await loadUsers("");
      }

      setIsLoading(false);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadUsers(search);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-lg font-bold text-slate-700">Laster brukere...</p>
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
              Admin / brukere
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Brukere
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Søk etter kunder og interne brukere. Se rolle, adminstatus,
              antall saker og aktive pakker.
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
                href="/admin/saker"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
              >
                Saker
              </Link>

              <SignOutButton />
            </div>
          </aside>
        </div>

        <section className="mt-12 rounded-3xl border border-violet-200 bg-white p-5 shadow-sm ring-1 ring-violet-100 sm:p-7">
          <form onSubmit={handleSearch} className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
            <div>
              <label htmlFor="search" className="text-sm font-bold text-slate-800">
                Søk etter navn eller e-post
              </label>
              <input
                id="search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Skriv navn eller e-post"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-violet-500 focus:bg-white"
              />
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
                loadUsers("");
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
          {profiles.map((profile) => {
            const caseCount = caseCountsByUserId[profile.id] ?? 0;
            const packageCount = packageCountsByUserId[profile.id] ?? 0;
            const searchValue = profile.email || profile.full_name || "";

            return (
              <article
                key={profile.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
              >
                <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-violet-700">
                        {roleLabel(profile.role_type)}
                      </span>

                      {profile.is_admin ? (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-amber-800">
                          Admin
                        </span>
                      ) : null}

                      <span className="text-sm font-semibold text-slate-500">
                        Opprettet {formatDateTime(profile.created_at)}
                      </span>
                    </div>

                    <h2 className="mt-4 text-3xl font-black text-slate-950">
                      {profile.full_name || "Navn ikke satt"}
                    </h2>

                    <p className="mt-2 break-words text-sm font-semibold text-slate-600">
                      {profile.email || "E-post ikke funnet"}
                    </p>

                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-bold text-slate-500">Saker</p>
                        <p className="mt-1 text-3xl font-black text-slate-950">
                          {caseCount}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-bold text-slate-500">
                          Aktive pakker
                        </p>
                        <p className="mt-1 text-3xl font-black text-slate-950">
                          {packageCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid content-start gap-3">
                    <Link
                      href={`/admin/saker?search=${encodeURIComponent(searchValue)}`}
                      className="rounded-2xl bg-violet-700 px-5 py-4 text-center text-sm font-black text-white hover:bg-violet-800"
                    >
                      Se saker
                    </Link>

                    <Link
                      href={`/admin/pakker?search=${encodeURIComponent(searchValue)}`}
                      className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-center text-sm font-black text-violet-900 hover:bg-violet-100"
                    >
                      Se pakker
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}

          {profiles.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-slate-700">
              Ingen brukere funnet.
            </div>
          ) : null}
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}
