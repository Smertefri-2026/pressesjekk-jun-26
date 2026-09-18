import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { CaseSidebar } from "@/components/cases/CaseSidebar";
import type { PackagePlanId } from "@/data/packagePlans";

type StepsDone = {
  caseRegistered?: boolean;
  caseInputs?: boolean;
  report?: boolean;
  pfuDraft?: boolean;
  pfuDecision?: boolean;
  policeReport?: boolean;
  investigation?: boolean;
};

type JournalistWorkflowGateProps = {
  caseId: string;
  heading: string;
  description: string;
  statusLabel: string;
  currentPackageId?: PackagePlanId;
  stepsDone: StepsDone;
};

/**
 * Remøy AI Design System / Platform — JournalistWorkflowGate.
 *
 * Delt "riktig arbeidsflyt"-sperre for de fire etter-publisering-stegene
 * (PFU-klage, PFU-avgjørelse, politianmeldelse, utredning) når brukeren er
 * journalist/redaksjon. Overskrift og beskrivelse er det eneste som varierer
 * mellom stegene - resten var identisk kopiert fire ganger (jf. "Rødstreken"
 * punkt 05).
 */
export function JournalistWorkflowGate({
  caseId,
  heading,
  description,
  statusLabel,
  currentPackageId,
  stepsDone,
}: JournalistWorkflowGateProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href={`/min-side/saker/${caseId}`}
          className="text-sm font-semibold text-red-700 hover:text-red-900"
        >
          ← Tilbake til saken
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <section className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-800">
              Redaksjonell sjekk
            </p>

            <h1 className="mt-4 max-w-4xl [text-wrap:balance] text-4xl font-black sm:text-5xl tracking-tight text-slate-950 md:text-6xl">
              {heading}
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">{description}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={`/min-side/saker/${caseId}/full-rapport`}
                className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white hover:bg-slate-800"
              >
                Gå til redaksjonell sjekk
              </Link>

              <Link
                href={`/min-side/saker/${caseId}/pakke`}
                className="rounded-2xl border border-slate-300 bg-white px-6 py-4 font-black text-slate-950 hover:bg-slate-100"
              >
                Se redaksjonelle pakker
              </Link>
            </div>
          </section>

          <CaseSidebar
            caseId={caseId}
            statusLabel={statusLabel}
            activeStep="full-rapport"
            workflowType="journalist"
            currentPackageId={currentPackageId}
            stepsDone={stepsDone}
          />
        </div>
      </section>

      <LightPublicFooter />
    </main>
  );
}
