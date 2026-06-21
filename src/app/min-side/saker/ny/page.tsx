"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";

export default function NewCasePage() {
  const [folderId, setFolderId] = useState<string | null>(null);

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
    setFolderId(new URLSearchParams(window.location.search).get("folderId"));

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

    const { data, error } = await supabase
      .from("cases")
      .insert({
        user_id: user.id,
        title: caseTitle,
        status: "draft",
        folder_id: folderId || null,
        media_name: mediaName.trim() || null,
        article_title: articleTitle.trim() || null,
        article_url: articleUrl.trim() || null,
        published_date: publishedDate || null,
        short_description: shortDescription.trim() || null,
      })
      .select("id")
      .single();

    if (error) {
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    if (!data?.id) {
      setErrorMessage("Saken ble lagret, men vi fant ikke saks-ID.");
      setIsSaving(false);
      return;
    }

    if (folderId) {
      sessionStorage.setItem("pressesjekkSelectedFolderId", folderId);
    }

    window.location.href = `/min-side/saker/${data.id}`;
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
              Ny sak
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Ny sak
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Start med grunninformasjonen om artikkelen eller mediesaken.
              Når saken er opprettet, kan du bygge den videre med opplysninger,
              rapport, PFU-utkast og annen dokumentasjon.
              {folderId ? " Saken lagres i valgt mappe." : ""}
            </p>

            {user?.email ? (
              <p className="mt-5 text-sm font-semibold text-slate-500">
                Innlogget som:{" "}
                <span className="text-slate-950">{user.email}</span>
              </p>
            ) : null}
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Tips
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Start enkelt
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Du trenger ikke fylle inn alt med en gang. Opprett saken først,
              og fyll heller på med flere opplysninger etter hvert.
            </p>
          </aside>
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_390px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
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
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
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
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
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
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
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
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
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
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
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
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500 focus:bg-white"
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
            <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
                Arbeidsflyt
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Opprett først, bygg videre etterpå
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Når saken er opprettet, får du en egen saksside hvor du kan
                legge til flere opplysninger, skrive rapport og jobbe videre
                med PFU-utkast eller annen dokumentasjon.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Neste versjon
              </p>
              <h2 className="mt-3 text-3xl font-black">
                Tilsvar og dokumentasjon
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                Etter opprettelse åpnes saken automatisk, slik at du kan
                fortsette arbeidet direkte.
              </p>
            </div>
          </aside>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}
