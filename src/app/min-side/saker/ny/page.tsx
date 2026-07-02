"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";
import { isV1Purchasable } from "@/data/packagePlans";

export default function NewCasePage() {
  const [folderId, setFolderId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [availableCaseCount, setAvailableCaseCount] = useState(0);

  const [user, setUser] = useState<User | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [title, setTitle] = useState("");
  const [mediaName, setMediaName] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [shortDescription, setShortDescription] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextFolderId = params.get("folderId");
    const urlFromQuickCheck = params.get("url");
    const roleFromQuickCheck = params.get("role");
    const packageFromQuery = params.get("package");

    setFolderId(nextFolderId);

    if (packageFromQuery && isV1Purchasable(packageFromQuery)) {
      setSelectedPackage(packageFromQuery);
    }

    if (urlFromQuickCheck) {
      setArticleUrl(urlFromQuickCheck);
    }

    if (roleFromQuickCheck === "mentioned") {
      setShortDescription(
        "Jeg er omtalt i saken og ønsker å vurdere om artikkelen bør følges opp."
      );
    } else if (roleFromQuickCheck === "company") {
      setShortDescription(
        "Saken gjelder en virksomhet eller organisasjon som er omtalt i media."
      );
    } else if (roleFromQuickCheck === "family") {
      setShortDescription(
        "Jeg er pårørende eller nærstående til noen som er omtalt i saken."
      );
    } else if (roleFromQuickCheck === "pro") {
      setShortDescription(
        "Jeg vurderer saken som profesjonell bruker på vegne av en klient, virksomhet eller redaksjon."
      );
    }

    async function checkUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        window.location.href = "/login";
        return;
      }

      setUser(user);

      const { data: entitlements, error: entitlementError } = await supabase
        .from("user_case_entitlements")
        .select("included_cases, used_cases, expires_at")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (!entitlementError && entitlements) {
        const available = entitlements.reduce((sum, entitlement) => {
          const includedCases = Number(entitlement.included_cases ?? 0);
          const usedCases = Number(entitlement.used_cases ?? 0);
          const expiresAt = entitlement.expires_at
            ? new Date(entitlement.expires_at).getTime()
            : null;

          if (expiresAt && expiresAt <= Date.now()) {
            return sum;
          }

          return sum + Math.max(0, includedCases - usedCases);
        }, 0);

        setAvailableCaseCount(available);
      }

      setIsCheckingUser(false);
    }

    checkUser();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setErrorMessage("Du må være innlogget for å opprette en sak.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    const caseTitle =
      title.trim() ||
      articleTitle.trim() ||
      `PresseSjekk-sak${mediaName.trim() ? ` – ${mediaName.trim()}` : ""}`;

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      setErrorMessage("Du må være innlogget for å opprette en sak.");
      setIsSaving(false);
      return;
    }

    const response = await fetch("/api/cases/create-with-entitlement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        folderId,
        title: caseTitle,
        mediaName,
        articleTitle,
        articleUrl,
        publishedDate,
        shortDescription,
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setErrorMessage(
        payload?.error ?? "Kunne ikke opprette saken. Prøv igjen."
      );
      setIsSaving(false);
      return;
    }

    if (!payload?.caseId) {
      setErrorMessage("Saken ble lagret, men vi fant ikke saks-ID.");
      setIsSaving(false);
      return;
    }

    if (folderId) {
      sessionStorage.setItem("pressesjekkSelectedFolderId", folderId);
    }

    window.location.href = selectedPackage
      ? `/min-side/saker/${payload.caseId}?package=${selectedPackage}`
      : `/min-side/saker/${payload.caseId}`;
  }

  if (isCheckingUser) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Sjekker innlogging...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (availableCaseCount <= 0) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />

        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <Link
            href="/min-side"
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            ← Tilbake til Min Side
          </Link>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-700">
              Kjøp først
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Du trenger en ledig sak før du kan opprette ny sak.
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-700">
              Kjøp en enkeltpakke, sakspakke eller abonnement først. Etter
              betaling får du ledige saker på Min Side, og kan opprette saken
              når du er klar.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/priser"
                className="rounded-xl bg-blue-500 px-6 py-4 font-black text-slate-950 hover:bg-blue-500"
              >
                Se priser og kjøp
              </Link>

              <Link
                href="/min-side"
                className="rounded-xl border border-slate-300 px-6 py-4 font-black text-slate-950 hover:bg-slate-100"
              >
                Til Min Side
              </Link>
            </div>
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
        <Link
          href="/min-side"
          className="text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          ← Tilbake til Min Side
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-700">
              Ny sak
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Ny sak
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Start med grunninformasjonen om artikkelen eller mediesaken.
              Når saken er opprettet, kan du bygge den videre med opplysninger,
              rapport, PFU-klage, politianmeldelse, utredning og annen
              dokumentasjon.
              {folderId ? " Saken lagres i valgt mappe." : ""}
            </p>

            {user?.email ? (
              <p className="mt-5 text-sm font-semibold text-slate-500">
                Innlogget som:{" "}
                <span className="text-slate-950">{user.email}</span>
              </p>
            ) : null}
          </section>

          <aside className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-800">
              Tips
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Start enkelt
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Du har ledige saker på kontoen. Du trenger ikke fylle inn alt med
              en gang. Opprett saken først, og fyll heller på med flere
              opplysninger etter hvert.
            </p>
          </aside>
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_390px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">
              Saksinformasjon
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              <span className="sm:hidden">Opplysninger</span>
              <span className="hidden sm:inline">Grunnopplysninger</span>
            </h2>

            <div className="mt-8 grid gap-5">
              <div>
                <label
                  htmlFor="title"
                  className="text-sm font-bold text-slate-800"
                >
                  Tittel på saken
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="F.eks. VG-artikkel om større mediesak"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="mediaName"
                    className="text-sm font-bold text-slate-800"
                  >
                    Mediehus
                  </label>
                  <input
                    id="mediaName"
                    type="text"
                    value={mediaName}
                    onChange={(event) => setMediaName(event.target.value)}
                    placeholder="VG, NRK, TV 2, lokalavis..."
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="publishedDate"
                    className="text-sm font-bold text-slate-800"
                  >
                    Publiseringsdato
                  </label>
                  <input
                    id="publishedDate"
                    type="date"
                    value={publishedDate}
                    onChange={(event) => setPublishedDate(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="articleTitle"
                  className="text-sm font-bold text-slate-800"
                >
                  Artikkeloverskrift
                </label>
                <input
                  id="articleTitle"
                  type="text"
                  value={articleTitle}
                  onChange={(event) => setArticleTitle(event.target.value)}
                  placeholder="Skriv overskriften slik den står i artikkelen"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="articleUrl"
                  className="text-sm font-bold text-slate-800"
                >
                  Lenke til artikkel
                </label>
                <input
                  id="articleUrl"
                  type="url"
                  value={articleUrl}
                  onChange={(event) => setArticleUrl(event.target.value)}
                  placeholder="https://..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="shortDescription"
                  className="text-sm font-bold text-slate-800"
                >
                  Kort beskrivelse
                </label>
                <textarea
                  id="shortDescription"
                  rows={6}
                  value={shortDescription}
                  onChange={(event) => setShortDescription(event.target.value)}
                  placeholder="Skriv kort hva saken handler om, og hvorfor du ønsker å sjekke den..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Oppretter..." : "Opprett sak"}
              </button>
            </div>
          </form>

          <aside className="grid content-start gap-6">
            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-800">
                Arbeidsflyt
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Opprett først, bygg videre etterpå
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Når saken er opprettet, får du en egen saksside hvor du kan
                legge til flere opplysninger, lage rapport og jobbe videre med
                PFU-klage, politianmeldelse eller utredning.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-300">
                Etter opprettelse
              </p>
              <h2 className="mt-3 text-3xl font-black">
                Bygg saken steg for steg
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                Etter opprettelse åpnes saken automatisk. Der kan du fylle inn
                saksopplysninger, generere rapport og gå videre til PFU,
                politianmeldelse eller utredning ved behov.
              </p>
            </div>
          </aside>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}
