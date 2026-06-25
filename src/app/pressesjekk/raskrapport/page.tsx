"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

type QuickCheck = {
  id: string;
  url: string;
  normalized_url: string;
  role: string;
  check_count: number;
  last_checked_at: string | null;
  created_at: string | null;
  ai_status: "not_started" | "ready" | "failed";
  ai_summary: string | null;
  ai_ethics_points: string[];
  ai_legal_points: string[];
  ai_missing_context: string[];
  ai_recommendation: string | null;
  ai_generated_at: string | null;
};

function getSearchParam(name: string) {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  return params.get(name) ?? "";
}

function getDomain(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Ukjent kilde";
  }
}

function formatDateTime(value: string | null) {
  if (!value) return "Ikke registrert";

  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function QuickReportPage() {
  const [url, setUrl] = useState("");
  const [quickCheck, setQuickCheck] = useState<QuickCheck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const domain = useMemo(() => getDomain(url), [url]);
  const encodedUrl = encodeURIComponent(url);

  useEffect(() => {
    async function loadQuickReport() {
      const incomingUrl = getSearchParam("url");

      if (!incomingUrl) {
        setErrorMessage("URL mangler.");
        setIsLoading(false);
        return;
      }

      setUrl(incomingUrl);
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/quick-check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: incomingUrl,
            role: "reader",
          }),
        });

        const payload = await response.json();

        if (!response.ok) {
          setErrorMessage(payload?.error ?? "Kunne ikke hente raskrapport.");
          return;
        }

        setQuickCheck(payload.quickCheck as QuickCheck);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Kunne ikke hente raskrapport."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadQuickReport();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/pressesjekk"
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til Start sjekk
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Raskrapport
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Foreløpig offentlig sjekk av mediesak.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Dette er en rask offentlig vurdering basert på URL og generelle
              presseetiske og juridiske rammer. Den erstatter ikke en lagret sak,
              full rapport, advokat, PFU eller domstolene.
            </p>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-7 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Søketeller
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              {quickCheck
                ? `${quickCheck.check_count} ${
                    quickCheck.check_count === 1 ? "sjekk" : "sjekker"
                  }`
                : "Laster..."}
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Denne telleren viser hvor mange ganger samme URL er sjekket i
              PresseSjekk.
            </p>

            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Sist sjekket
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {formatDateTime(quickCheck?.last_checked_at ?? null)}
              </p>
            </div>
          </aside>
        </div>

        {isLoading ? (
          <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Lager raskrapport...
            </p>
            <p className="mt-3 max-w-2xl leading-8 text-slate-600">
              Dette kan ta opptil 2 minutter første gang en artikkel sjekkes.
              Ikke oppdater siden mens rapporten lages.
            </p>
          </div>
        ) : errorMessage ? (
          <div className="mt-12 rounded-3xl border border-red-200 bg-red-50 p-8 shadow-sm">
            <h2 className="text-3xl font-black text-red-950">
              Kunne ikke vise raskrapport
            </h2>
            <p className="mt-4 leading-8 text-red-800">{errorMessage}</p>
          </div>
        ) : quickCheck ? (
          <>
            <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Artikkel
              </p>
              <h2 className="mt-3 text-4xl font-black text-slate-950">
                {domain}
              </h2>
              <p className="mt-4 break-words leading-8 text-slate-700">
                {quickCheck.url}
              </p>
            </section>

            <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_390px]">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                  KI-raskrapport
                </p>

                <h2 className="mt-3 text-4xl font-black text-slate-950">
                  Foreløpig vurdering
                </h2>

                <p className="mt-5 text-lg leading-9 text-slate-700">
                  {quickCheck.ai_summary ||
                    "Ingen KI-vurdering er tilgjengelig ennå."}
                </p>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-xl font-black text-slate-950">
                      Mulige VVP-punkter
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                      {(quickCheck.ai_ethics_points ?? []).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-xl font-black text-slate-950">
                      Mulige juridiske rammer
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                      {(quickCheck.ai_legal_points ?? []).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-cyan-200 bg-cyan-50 p-5">
                  <h3 className="text-xl font-black text-slate-950">
                    Hva mangler før reell vurdering?
                  </h3>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                    {(quickCheck.ai_missing_context ?? []).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <aside className="grid content-start gap-6">
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                  <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
                    Anbefaling
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-slate-950">
                    Neste steg
                  </h2>
                  <p className="mt-4 leading-8 text-slate-700">
                    {quickCheck.ai_recommendation ||
                      "Opprett en lagret sak dersom saken bør dokumenteres videre."}
                  </p>
                </div>

                <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
                  <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                    Lagret sak
                  </p>
                  <h2 className="mt-3 text-3xl font-black">
                    Bygg saken videre
                  </h2>
                  <p className="mt-4 leading-8 text-slate-300">
                    Er du omtalt, pårørende eller representerer en virksomhet,
                    bør du opprette en sak slik at dokumentasjon og tilsvar kan
                    lagres.
                  </p>

                  <Link
                    href={`/min-side/saker/ny?url=${encodedUrl}&role=mentioned`}
                    className="mt-6 block rounded-xl bg-cyan-400 px-5 py-4 text-center font-black text-slate-950 hover:bg-cyan-300"
                  >
                    Opprett lagret sak
                  </Link>
                </div>
              </aside>
            </section>
          </>
        ) : null}
      </section>

      <LightPublicFooter />
    </main>
  );
}
