"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CaseWorkflowCard, type CaseWorkflowStep } from "./CaseWorkflowCard";
import { EvidenceSidebar } from "@/components/evidence/EvidenceSidebar";
import { Card } from "@/components/design-system";
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

export type CaseSidebarStatusItem = {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning";
  /** Gjør raden klikkbar - status skal alltid kunne åpne det den viser (jf. Fase 6). */
  href?: string;
};

type CaseSidebarNextStepAction = { label: string; href: string };

export type CaseSidebarNextStep = {
  title: string;
  description: string;
  primary: CaseSidebarNextStepAction;
  secondary?: CaseSidebarNextStepAction;
};

type CaseSidebarProps = {
  caseId: string;
  statusLabel: string;
  activeStep?: CaseWorkflowStep;
  workflowType?: "standard" | "journalist";
  currentPackageId?: PackagePlanId;
  stepsDone?: StepsDone;
  /** Overstyrer standard dokumentasjons-oppsummeringen (EvidenceSidebar). Brukes av
   * saksopplysninger, som viser hele EvidenceWorkspacePanel i stedet - der ER siden
   * arbeidsflaten for dokumentasjon. Andre steg skal ikke bygge egne dokumentlister. */
  documentation?: ReactNode;
  statusTitle?: string;
  statusItems?: CaseSidebarStatusItem[];
  statusContent?: ReactNode;
  nextStep?: CaseSidebarNextStep | null;
};

const toneTextClass: Record<NonNullable<CaseSidebarStatusItem["tone"]>, string> = {
  neutral: "text-slate-950",
  success: "text-emerald-700",
  warning: "text-amber-700",
};

/**
 * Remøy AI Design System / Platform — CaseSidebar.
 *
 * Standardisert høyreside for arbeidssteg: Saksgang → Dokumentasjon → Status
 * → Neste steg (jf. UX-rapporten "Rødstreken", fase 5.2/5.3). Erstatter sju
 * bespoke høyreside-implementasjoner med én gjenbrukbar layout. "order-first"
 * på mobil sikrer at brukeren ser hvor han er i saken og hva som er neste
 * steg uten å måtte scrolle forbi hele hovedinnholdet først.
 */
export function CaseSidebar({
  caseId,
  statusLabel,
  activeStep = "case",
  workflowType = "standard",
  currentPackageId,
  stepsDone,
  documentation,
  statusTitle = "Status",
  statusItems,
  statusContent,
  nextStep,
}: CaseSidebarProps) {
  const hasStatus = Boolean(statusItems?.length) || Boolean(statusContent);

  return (
    <aside className="order-first grid content-start gap-6 lg:order-none">
      <CaseWorkflowCard
        caseId={caseId}
        statusLabel={statusLabel}
        activeStep={activeStep}
        workflowType={workflowType}
        currentPackageId={currentPackageId}
        stepsDone={stepsDone}
      />

      {documentation ?? <EvidenceSidebar caseId={caseId} />}

      {hasStatus ? (
        <Card padding="md">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">
            {statusTitle}
          </p>

          {statusItems?.length ? (
            <div className="mt-4 grid gap-2.5">
              {statusItems.map((item) =>
                item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between gap-3 rounded-xl text-sm transition hover:bg-slate-50"
                  >
                    <span className="font-semibold text-slate-600">{item.label}</span>
                    <span className="flex items-center gap-1">
                      <span className={`font-black ${toneTextClass[item.tone ?? "neutral"]}`}>
                        {item.value}
                      </span>
                      <span aria-hidden className="text-slate-400">→</span>
                    </span>
                  </Link>
                ) : (
                  <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-600">{item.label}</span>
                    <span className={`font-black ${toneTextClass[item.tone ?? "neutral"]}`}>
                      {item.value}
                    </span>
                  </div>
                )
              )}
            </div>
          ) : null}

          {statusContent ? (
            <div className={statusItems?.length ? "mt-4" : ""}>{statusContent}</div>
          ) : null}
        </Card>
      ) : null}

      {nextStep ? (
        <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-7">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-300">
            Neste steg
          </p>
          <h2 className="mt-3 text-3xl font-black">{nextStep.title}</h2>
          <p className="mt-4 leading-8 text-slate-300">{nextStep.description}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={nextStep.primary.href}
              className="rounded-xl bg-red-500 px-5 py-4 text-sm font-black text-white hover:bg-red-600"
            >
              {nextStep.primary.label}
            </Link>

            {nextStep.secondary ? (
              <Link
                href={nextStep.secondary.href}
                className="rounded-xl border border-white/30 px-5 py-4 text-sm font-black text-white hover:bg-white/10"
              >
                {nextStep.secondary.label}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
