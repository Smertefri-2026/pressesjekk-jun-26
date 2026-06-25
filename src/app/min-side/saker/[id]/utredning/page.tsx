"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { CaseWorkflowCard } from "@/components/cases/CaseWorkflowCard";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { supabase } from "@/lib/supabase/client";
import type { PackagePlanId } from "@/data/packagePlans";

type CaseAccessRow = {
  package_id: PackagePlanId;
  status: "active" | "pending" | "cancelled" | "expired";
};

type CaseRow = {
  id: string;
  title: string | null;
  status: string | null;
  media_name: string | null;
  article_title: string | null;
  short_description: string | null;
};

type CaseInputRow = {
  id: string;
};

type CaseReportRow = {
  id: string;
  report_type: "free_check" | "full_report" | "pfu_draft" | "police_draft";
};

type PfuDecisionRow = {
  decision_received: boolean | null;
  uploaded_file_name: string | null;
};

export default function InvestigationPage() {
  const params = useParams<{ id: string }>();

  const [user, setUser] = useState<User | null>(null);
  const [caseAccessPackageId, setCaseAccessPackageId] =
    useState<PackagePlanId | null>(null);
  const [workflowType, setWorkflowType] = useState<"standard" | "journalist">(
    "standard"
  );
  const [caseItem, setCaseItem] = useState<CaseRow | null>(null);
  const [caseInput, setCaseInput] = useState<CaseInputRow | null>(null);
  const [reports, setReports] = useState<CaseReportRow[]>([]);
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

      const { data: accessData } = await supabase
        .from("case_access")
        .select("package_id,status")
        .eq("case_id", params.id)
        .eq("status", "active")
        .maybeSingle();

      const caseAccess = accessData as CaseAccessRow | null;

      setCaseAccessPackageId(caseAccess?.package_id ?? null);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("role_type")
        .eq("id", user.id)
        .maybeSingle();

      setWorkflowType(
        profileData?.role_type === "journalist" ? "journalist" : "standard"
      );

      const { data: caseData, error: caseError } = await supabase
        .from("cases")
        .select("id,title,status,media_name,article_title,short_description")
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
        .select("id")
        .eq("case_id", params.id)
        .maybeSingle();

      setCaseInput((inputData as CaseInputRow | null) ?? null);

      const { data: reportsData } = await supabase
        .from("case_reports")
        .select("id,report_type")
        .eq("case_id", params.id);

      setReports((reportsData ?? []) as CaseReportRow[]);

      const { data: decisionData } = await supabase
        .from("pfu_decisions")
        .select("decision_received,uploaded_file_name")
        .eq("case_id", params.id)
        .maybeSingle();

      setPfuDecision((decisionData as PfuDecisionRow | null) ?? null);
      setIsLoading(false);
    }

    loadData();
  }, [params.id]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="font-semibold text-slate-600">Laster utredningspakke...</p>
        </section>
        <LightPublicFooter />
      </main>
    );
  }

  if (errorMessage || !caseItem || !user) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <LightPublicHeader />
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="font-semibold text-red-700">
            {errorMessage || "Fant ikke saken."}
          </p>
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

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Utredningspakke
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Komplett utredningsgrunnlag
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Utredningspakken brukes for større eller mer alvorlige mediesaker
              der saken bør settes sammen som et komplett, kronologisk og
              dokumentert grunnlag for videre vurdering.
            </p>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Utredningsgrunnlag
              </p>

              <h2 className="mt-3 text-4xl font-black text-slate-950">
                Start med vedleggene
              </h2>

              <p className="mt-4 max-w-3xl leading-8 text-slate-700">
                En god utredning bygges nedenfra. Først samles vedleggene,
                deretter settes saken i kronologisk rekkefølge, og til slutt
                lages forside, sammendrag og samlet PDF.
              </p>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-700">
                  Del 1
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">
                  Vedlegg og dokumentasjon
                </h3>
                <p className="mt-3 leading-8 text-slate-700">
                  Last opp dokumenter, artikler, e-poster, skjermbilder,
                  PFU-dokumenter og annen dokumentasjon. Hvert vedlegg bør få
                  nummer, dato, tittel og en kort forklaring på hvorfor det er
                  viktig.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-bold text-slate-800">
                      Vedleggstittel
                    </label>
                    <input
                      disabled
                      placeholder="F.eks. 01. NRK-artikkel 20.06.2026"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-800">
                      Dato
                    </label>
                    <input
                      disabled
                      placeholder="20.06.2026"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-800">
                      Vedleggstype
                    </label>
                    <input
                      disabled
                      placeholder="Artikkel, e-post, PFU, skjermbilde..."
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-800">
                      Sortering
                    </label>
                    <input
                      disabled
                      placeholder="Kronologisk eller etter vedleggsnummer"
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-500"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-sm font-bold text-slate-800">
                    Hva viser vedlegget?
                  </label>
                  <textarea
                    disabled
                    rows={4}
                    placeholder="Forklar kort hvilken betydning vedlegget har, og hva som bør vurderes..."
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-500"
                  />
                </div>

                <div className="mt-5 rounded-2xl border border-dashed border-cyan-300 bg-white p-5">
                  <p className="font-black text-slate-950">
                    Opplasting og vedleggsliste kommer her
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Neste versjon kan bruke samme opplastingslogikk som
                    dokumentdelen på saksopplysninger, men med vedleggsnummer,
                    dato, beskrivelse og sortering.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-700">
                  Del 2
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">
                  Kronologisk saksgjennomgang
                </h3>
                <p className="mt-3 leading-8 text-slate-700">
                  Når vedleggene er sortert, kan saken bygges som en tidslinje:
                  hva skjedde først, hvilke dokumenter viser det, og hva betyr
                  hvert punkt for saken.
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-700">
                  Del 3
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">
                  Forside, sammendrag og samlet PDF
                </h3>
                <p className="mt-3 leading-8 text-slate-700">
                  Til slutt kan PresseSjekk lage en profesjonell forside,
                  saksoversikt, sammendrag og en samlet PDF med utredning,
                  vedleggsliste og nummererte vedlegg.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/kontakt"
                  className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800"
                >
                  Be om utredningspakke
                </Link>
                <Link
                  href={`/min-side/saker/${params.id}`}
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-4 font-black text-slate-950 hover:bg-slate-100"
                >
                  Til saken
                </Link>
              </div>
            </div>
          </section>

          <aside className="grid gap-6">
            <CaseWorkflowCard
              caseId={params.id}
              statusLabel={caseItem.status === "ready" ? "Rapport klar" : "Utkast"}
              activeStep="utredning"
              workflowType={workflowType}
              currentPackageId={caseAccessPackageId ?? undefined}
              currentPackageId={caseAccessPackageId ?? undefined}
              stepsDone={{
                caseRegistered: true,
                caseInputs: Boolean(caseInput),
                report: reports.some(
                  (report) =>
                    report.report_type === "free_check" ||
                    report.report_type === "full_report"
                ),
                pfuDraft: reports.some((report) => report.report_type === "pfu_draft"),
                pfuDecision: Boolean(
                  pfuDecision?.decision_received || pfuDecision?.uploaded_file_name
                ),
                policeReport: reports.some(
                  (report) => report.report_type === "police_draft"
                ),
                investigation: false,
              }}
            />

            <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Din sak
              </p>
              <h2 className="mt-3 text-3xl font-black">
                Din mest komplette oversikt
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                Med eller uten PFU-klage og politianmeldelse er
                utredningspakken din samlede versjon av saken. Målet er å samle
                dokumentasjon, tidslinje, vurderinger og vedlegg i én
                profesjonell PDF.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <LightPublicFooter />
    </main>
  );
}
