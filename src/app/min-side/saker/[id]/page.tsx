"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";

type CaseRow = {
  id: string;
  title: string;
  status: "draft" | "in_progress" | "report_ready" | "closed";
  media_name: string | null;
  article_title: string | null;
  article_url: string | null;
  published_date: string | null;
  short_description: string | null;
  created_at: string;
  updated_at: string;
};

function statusLabel(status: CaseRow["status"]) {
  if (status === "draft") return "Utkast";
  if (status === "in_progress") return "Under arbeid";
  if (status === "report_ready") return "Rapport klar";
  if (status === "closed") return "Lukket";
  return status;
}

function formatDate(date: string | null) {
  if (!date) return "Ikke satt";

  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadCase() {
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
        .from("cases")
        .select(
          "id,title,status,media_name,article_title,article_url,published_date,short_description,created_at,updated_at"
        )
        .eq("id", params.id)
        .single();

      if (error) {
        setErrorMessage(error.message);
      } else {
        setCaseItem(data as CaseRow);
      }

      setIsLoading(false);
    }

    if (params.id) {
      loadCase();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Laster saken...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (errorMessage || !caseItem) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Link
            href="/min-side"
            className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
          >
            ← Tilbake til Min Side
          </Link>

          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
              Feil
            </p>
            <h1 className="mt-3 text-3xl font-black text-red-950">
              Fant ikke saken
            </h1>
            <p className="mt-4 leading-8 text-red-800">
              {errorMessage || "Saken finnes ikke, eller du har ikke tilgang."}
            </p>
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
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til Min Side
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              PresseSjekk-sak
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              {caseItem.title}
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Dette er første versjon av sakssiden. Her vises grunninformasjon
              fra databasen. Neste steg blir å legge til redigering, tilsvar,
              rettsstatus og dokumentasjon.
            </p>

            {user?.email ? (
              <p className="mt-5 text-sm font-semibold text-slate-500">
                Innlogget som:{" "}
                <span className="text-slate-950">{user.email}</span>
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/min-side"
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
              >
                Til Min Side
              </Link>

              <Link
                href={`/min-side/saker/${params.id}/rediger`}
                className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800"
              >
                Rediger sak
              </Link>

              <Link
                href={`/min-side/saker/${params.id}/opplysninger`}
                className="rounded-xl bg-cyan-500 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-400"
              >
                Legg til opplysninger
              </Link>
            </div>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Status
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              {statusLabel(caseItem.status)}
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Saken er lagret i Supabase og vises kun for brukeren som eier
              saken.
            </p>
          </aside>
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_390px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Grunninformasjon
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Artikkel og sak
            </h2>

            <div className="mt-8 grid gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                  Mediehus
                </p>
                <p className="mt-2 text-xl font-black text-slate-950">
                  {caseItem.media_name || "Ikke satt"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                  Publiseringsdato
                </p>
                <p className="mt-2 text-xl font-black text-slate-950">
                  {formatDate(caseItem.published_date)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                  Artikkeloverskrift
                </p>
                <p className="mt-2 text-xl font-black text-slate-950">
                  {caseItem.article_title || "Ikke satt"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                  Lenke
                </p>
                {caseItem.article_url ? (
                  <a
                    href={caseItem.article_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block break-words text-lg font-bold text-cyan-700 hover:text-cyan-900"
                  >
                    {caseItem.article_url}
                  </a>
                ) : (
                  <p className="mt-2 text-xl font-black text-slate-950">
                    Ikke satt
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                  Kort beskrivelse
                </p>
                <p className="mt-3 whitespace-pre-line leading-8 text-slate-700">
                  {caseItem.short_description || "Ikke lagt inn ennå."}
                </p>
              </div>
            </div>
          </div>

          <aside className="grid gap-6">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
                Neste
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Legg til mer dokumentasjon
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Neste versjon bør la deg lagre tilsvar, redaktørsvar,
                rettsstatus og dokumentasjon knyttet til denne saken.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Rapport
              </p>
              <h2 className="mt-3 text-3xl font-black">
                Rapport kommer senere
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                Når analyse og rapportgenerering kobles på, vil rapporter og
                rapportversjoner vises her.
              </p>
            </div>
          </aside>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}
