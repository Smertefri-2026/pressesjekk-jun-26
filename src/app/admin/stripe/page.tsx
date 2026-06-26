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
  created_at: string | null;
};

export default function AdminStripePage() {
  const [user, setUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadAdmin() {
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
      setIsLoading(false);
    }

    loadAdmin();
  }, []);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-lg font-bold text-slate-700">Laster Stripe...</p>
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
              Admin / Stripe
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Stripe og omsetning
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Her kobles betalinger, testmodus, produkter, abonnementer,
              webhooks og omsetningstall når Stripe-integrasjonen er klar.
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
                href="/min-side"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-slate-100"
              >
                Min Side
              </Link>

              <SignOutButton />
            </div>
          </aside>
        </div>

        <AdminNav />

        {errorMessage ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
            {errorMessage}
          </div>
        ) : null}

        <section className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            ["Dagens omsetning", "0 kr", "Kobles til Stripe senere"],
            ["Mnd. omsetning", "0 kr", "Kobles til Stripe senere"],
            ["Årsomsetning", "0 kr", "Kobles til Stripe senere"],
          ].map(([label, value, note]) => (
            <div
              key={label}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="font-bold text-slate-500">{label}</p>
              <p className="mt-4 text-5xl font-black text-slate-950">
                {value}
              </p>
              <p className="mt-3 text-sm font-bold text-amber-700">{note}</p>
            </div>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-violet-200 bg-white p-6 shadow-sm ring-1 ring-violet-100">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-700">
            Neste steg
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-950">
            Stripe testmodus
          </h2>

          <div className="mt-5 grid gap-4 text-sm font-semibold leading-7 text-slate-700 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-black text-slate-950">1. Stripe Dashboard</p>
              <p className="mt-2">
                Sett offentlig navn til PresseSjekk, support-e-post,
                statement descriptor og branding.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-black text-slate-950">2. Testnøkler</p>
              <p className="mt-2">
                Legg inn STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
                og webhook secret i .env.local.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-black text-slate-950">3. Checkout</p>
              <p className="mt-2">
                Koble priskort og pakker til Stripe Checkout i testmodus.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-black text-slate-950">4. Webhook</p>
              <p className="mt-2">
                Når betaling er fullført, skal case_access opprettes eller
                oppdateres automatisk.
              </p>
            </div>
          </div>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}
