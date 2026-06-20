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
  media_name: string | null;
  article_title: string | null;
  short_description: string | null;
};

type CaseInputRow = {
  id: string;
  what_happened: string | null;
  your_role: string | null;
  reply_sent: boolean | null;
  legal_status: string | null;
  legal_status_details: string | null;
  documentation_summary: string | null;
  desired_outcome: string | null;
};

type PfuDecisionRow = {
  id: string;
  pfu_complaint_sent: boolean | null;
  pfu_case_number: string | null;
  decision_received: boolean | null;
  decision_result: string | null;
  decision_summary: string | null;
  uploaded_file_name: string | null;
  next_step_interest: string | null;
};

function legalStatusLabel(status: string | null) {
  if (!status) return "Ikke satt";
  if (status === "not_relevant") return "Ikke relevant";
  if (status === "unknown") return "Uavklart";
  if (status === "reported") return "Anmeldt";
  if (status === "dismissed") return "Henlagt";
  if (status === "court_case") return "Rettssak";
  if (status === "judgment") return "Dom/avgjørelse";
  if (status === "appeal") return "Klage/anke";
  return status;
}

function pfuDecisionResultLabel(status: string | null) {
  if (!status) return "Ikke satt";
  if (status === "upheld") return "Felt";
  if (status === "partly_upheld") return "Delvis felt";
  if (status === "not_upheld") return "Ikke felt";
  if (status === "dismissed") return "Avvist";
  if (status === "withdrawn") return "Trukket";
  if (status === "other") return "Annet";
  return status;
}

export default function PoliceReportPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [caseInput, setCaseInput] = useState<CaseInputRow | null>(null);
  const [pfuDecision, setPfuDecision] = useState<PfuDecisionRow | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadData() {
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

      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("id,title,media_name,article_title,short_description")
        .eq("id", params.id)
        .single();

      if (caseError) {
        setErrorMessage(caseError.message);
        setIsLoading(false);
        return;
      }

      setCaseItem(caseData as CaseRow);

      const { data: inputData } = await supabase
        .from("case_inputs")
        .select(
          "id,what_happened,your_role,reply_sent,legal_status,legal_status_details,documentation_summary,desired_outcome"
        )
        .eq("case_id", params.id)
        .maybeSingle();

      setCaseInput((inputData as CaseInputRow | null) ?? null);

      const { data: pfuData } = await supabase
        .from("pfu_decisions")
        .select(
          "id,pfu_complaint_sent,pfu_case_number,decision_received,decision_result,decision_summary,uploaded_file_name,next_step_interest"
        )
        .eq("case_id", params.id)
        .maybeSingle();

      setPfuDecision((pfuData as PfuDecisionRow | null) ?? null);

      setIsLoading(false);
    }

    if (params.id) {
      loadData();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              Laster neste steg...
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
              Kunne ikke åpne modulen
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
          href={`/min-side/saker/${params.id}`}
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til saken
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Neste steg
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Strukturert politianmeldelse.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Etter PFU kan noen saker være aktuelle å vurdere videre. Denne
              modulen skal senere hjelpe brukeren med å strukturere en mulig
              politianmeldelse basert på saken, dokumentasjonen og PFU-utfallet.
            </p>

            {user?.email ? (
              <p className="mt-5 text-sm font-semibold text-slate-500">
                Innlogget som:{" "}
                <span className="text-slate-950">{user.email}</span>
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/min-side/saker/${params.id}`}
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
              >
                Til saken
              </Link>

              <Link
                href={`/min-side/saker/${params.id}/pfu-avgjorelse`}
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
              >
                PFU-avgjørelse
              </Link>
            </div>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Sak
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              {caseItem.title}
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              {caseItem.media_name ?? "Ukjent medie"}
              {caseItem.article_title ? ` · ${caseItem.article_title}` : ""}
            </p>
          </aside>
        </div>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_390px]">
          <div className="grid gap-8">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
                Kommer senere
              </p>
              <h2 className="mt-3 text-4xl font-black text-slate-950">
                Denne modulen blir en betalt tilleggspakke.
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
                Før betaling kobles på, lager vi siden som en tydelig del av
                produkttrappen. Senere kan brukeren kjøpe tilgang til å lage et
                strukturert utkast til politianmeldelse.
              </p>

              <button
                type="button"
                disabled
                className="mt-8 cursor-not-allowed rounded-2xl bg-slate-950 px-6 py-4 font-black text-white opacity-60"
              >
                Kjøp politianmeldelse – kommer snart
              </button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Hva pakken bør inneholde
              </p>
              <h2 className="mt-3 text-4xl font-black text-slate-950">
                Strukturert grunnlag for anmeldelse
              </h2>

              <div className="mt-8 grid gap-4">
                {[
                  "Kort sammendrag av saken",
                  "Hendelsesforløp i kronologisk rekkefølge",
                  "Hvilke påstander som oppleves feil, skadelige eller udokumenterte",
                  "Hvilken dokumentasjon som finnes",
                  "Eventuell PFU-klage og PFU-avgjørelse",
                  "Rettsstatus og tidligere henvendelser",
                  "Forslag til anmeldelsestekst",
                  "Tydelig forbehold om at saken kan bli henlagt",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="font-bold leading-7 text-slate-800">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Saksgrunnlag
              </p>
              <h2 className="mt-3 text-4xl font-black text-slate-950">
                Dette finnes allerede i saken
              </h2>

              <div className="mt-8 grid gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    Rolle i saken
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {caseInput?.your_role || "Ikke satt"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    Rettsstatus
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {legalStatusLabel(caseInput?.legal_status ?? null)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    Dokumentasjon
                  </p>
                  <p className="mt-2 whitespace-pre-line leading-8 text-slate-700">
                    {caseInput?.documentation_summary ||
                      "Ingen dokumentasjonsoppsummering er lagt inn ennå."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
                    PFU-status
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {pfuDecision?.decision_received
                      ? pfuDecisionResultLabel(pfuDecision.decision_result)
                      : pfuDecision?.pfu_complaint_sent
                        ? "PFU-klage sendt"
                        : "Ikke registrert"}
                  </p>
                  <p className="mt-3 leading-8 text-slate-700">
                    {pfuDecision?.uploaded_file_name
                      ? `Opplastet fil: ${pfuDecision.uploaded_file_name}`
                      : "Ingen PFU-avgjørelse er lastet opp ennå."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="grid gap-6">
            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Viktig forbehold
              </p>
              <h2 className="mt-3 text-3xl font-black">
                En anmeldelse kan bli henlagt
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                En politianmeldelse gir ingen garanti for etterforskning eller
                resultat. Mange saker kan bli henlagt. Arbeidet kan likevel ha
                verdi som dokumentasjon, historikk og statistikkgrunnlag.
              </p>
            </div>

            <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
                PFU og neste steg
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                PFU er pressens egen ordning
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                PFU vurderer saken presseetisk. Det er ikke det samme som en
                juridisk avgjørelse fra politi eller domstol. Derfor kan noen
                brukere ønske å vurdere saken videre etter PFU.
              </p>
            </div>
          </aside>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}
