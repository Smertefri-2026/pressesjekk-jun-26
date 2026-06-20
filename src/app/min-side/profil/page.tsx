"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role_type: string | null;
  created_at: string;
  updated_at: string;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const [fullName, setFullName] = useState("");
  const [roleType, setRoleType] = useState("private_person");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
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

      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,email,role_type,created_at,updated_at")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (data) {
        const profileData = data as ProfileRow;
        setProfile(profileData);
        setFullName(profileData.full_name ?? "");
        setRoleType(profileData.role_type ?? "private_person");
      } else {
        const metadataName =
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : "";

        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            full_name: metadataName || null,
            email: user.email ?? null,
            role_type: "private_person",
          })
          .select("id,full_name,email,role_type,created_at,updated_at")
          .single();

        if (createError) {
          setErrorMessage(createError.message);
          setIsLoading(false);
          return;
        }

        const profileData = createdProfile as ProfileRow;
        setProfile(profileData);
        setFullName(profileData.full_name ?? "");
        setRoleType(profileData.role_type ?? "private_person");
      }

      setIsLoading(false);
    }

    loadProfile();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setErrorMessage("Du må være innlogget for å oppdatere profilen.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName.trim() || null,
        email: user.email ?? null,
        role_type: roleType,
      })
      .select("id,full_name,email,role_type,created_at,updated_at")
      .single();

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    setProfile(data as ProfileRow);
    setSuccessMessage("Profilen er lagret.");
    setIsSaving(false);
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Laster profil...
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/min-side"
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til Min Side
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Profil
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Din PresseSjekk-profil.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Profilen brukes senere i rapporter, PFU-utkast, fakturering og
              profftilgang. Foreløpig lagrer vi navn og rolle.
            </p>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Neste
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Brukes i PFU-utkast
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Når profilen er lagret, kan vi hente navn og rolle automatisk inn
              i PFU-klageutkastet.
            </p>
          </aside>
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_390px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Kontoinformasjon
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Profilopplysninger
            </h2>

            <div className="mt-8 grid gap-5">
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-bold text-slate-800"
                >
                  E-post
                </label>
                <input
                  id="email"
                  type="email"
                  value={user?.email ?? profile?.email ?? ""}
                  disabled
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-4 text-slate-500"
                />
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  E-post hentes fra innloggingen og kan ikke endres her ennå.
                </p>
              </div>

              <div>
                <label
                  htmlFor="fullName"
                  className="text-sm font-bold text-slate-800"
                >
                  Navn
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Ditt navn"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="roleType"
                  className="text-sm font-bold text-slate-800"
                >
                  Rolle
                </label>
                <select
                  id="roleType"
                  value={roleType}
                  onChange={(event) => setRoleType(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
                >
                  <option value="private_person">Privatperson</option>
                  <option value="mentioned_person">Omtalt person</option>
                  <option value="advisor">Rådgiver</option>
                  <option value="lawyer">Advokat</option>
                  <option value="journalist">Journalist/redaksjon</option>
                  <option value="organization">Organisasjon/bedrift</option>
                </select>
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">
                  {errorMessage}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-800">
                  {successMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Lagrer..." : "Lagre profil"}
              </button>
            </div>
          </form>

          <aside className="grid gap-6">
            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Konto
              </p>
              <h2 className="mt-3 text-3xl font-black">
                {profile?.full_name || "Navn ikke satt"}
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                {user?.email}
              </p>
            </div>
          </aside>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}
