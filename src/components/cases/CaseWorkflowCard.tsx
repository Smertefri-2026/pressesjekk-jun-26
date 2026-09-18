"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  packageAccessSteps,
  singlePackages,
  type PackagePlanId,
} from "@/data/packagePlans";

export type CaseWorkflowStep =
  | "case"
  | "full-rapport"
  | "pfu"
  | "pfu-avgjorelse"
  | "politianmeldelse"
  | "utredning";

type CaseWorkflowCardProps = {
  caseId: string;
  statusLabel: string;
  activeStep?: CaseWorkflowStep;
  workflowType?: "standard" | "journalist";
  currentPackageId?: PackagePlanId;
  stepsDone?: {
    caseRegistered?: boolean;
    caseInputs?: boolean;
    report?: boolean;
    pfuDraft?: boolean;
    pfuDecision?: boolean;
    policeReport?: boolean;
    investigation?: boolean;
  };
};

type DoneKey =
  | "caseRegistered"
  | "caseInputs"
  | "report"
  | "pfuDraft"
  | "pfuDecision"
  | "policeReport"
  | "investigation";

type VisualStepKey = "enkel_rapport" | "full_rapport" | "pfu" | "politianmeldelse" | "utredning";

/**
 * Fase 6 — Saksgang samler de tidligere sju sidene i fem naturlige
 * arbeidssteg for brukeren. Hvert visuelt steg kan romme flere sider/URL-er
 * (ingen ruter er fjernet) og flere pakke-terskler (f.eks. PFU-klage krever
 * PFU-pakke, PFU-avgjørelse krever Full dokumentpakke - begge ligger nå i
 * samme steg "PFU", men beholder sine egne tilgangsgrenser).
 */
const visualSteps: {
  key: VisualStepKey;
  memberSteps: CaseWorkflowStep[];
  label: string;
  description: string;
  href: (caseId: string) => string;
  doneKeys: DoneKey[];
  /** Første numeriske adgangsposisjon (1-7, gammel granularitet) dette steget krever for i det hele tatt å være tilgjengelig. */
  accessPosition: number;
}[] = [
  {
    key: "enkel_rapport",
    memberSteps: ["case"],
    label: "Enkel rapport",
    description: "Grunnopplysninger om saken",
    href: (caseId) => `/min-side/saker/${caseId}`,
    doneKeys: ["caseRegistered"],
    accessPosition: 1,
  },
  {
    key: "full_rapport",
    memberSteps: ["full-rapport"],
    label: "Full rapport",
    description: "Saksopplysninger, dokumentasjon og KI-rapport",
    href: (caseId) => `/min-side/saker/${caseId}/full-rapport`,
    doneKeys: ["caseInputs", "report"],
    accessPosition: 2,
  },
  {
    key: "pfu",
    memberSteps: ["pfu", "pfu-avgjorelse"],
    label: "PFU",
    description: "Klage og avgjørelse",
    href: (caseId) => `/min-side/saker/${caseId}/pfu`,
    doneKeys: ["pfuDraft", "pfuDecision"],
    accessPosition: 4,
  },
  {
    key: "politianmeldelse",
    memberSteps: ["politianmeldelse"],
    label: "Politianmeldelse",
    description: "Anmeldelse og videre vurdering",
    href: (caseId) => `/min-side/saker/${caseId}/politianmeldelse`,
    doneKeys: ["policeReport"],
    accessPosition: 6,
  },
  {
    key: "utredning",
    memberSteps: ["utredning"],
    label: "Utredning",
    description: "Manuell gjennomgang",
    href: (caseId) => `/min-side/saker/${caseId}/utredning`,
    doneKeys: ["investigation"],
    accessPosition: 7,
  },
];

const journalistText: Partial<Record<VisualStepKey, { label: string; description: string }>> = {
  enkel_rapport: { label: "Sak opprettet", description: "Artikkelidé / publisering" },
  full_rapport: { label: "Redaksjonell sjekk", description: "Publiseringsgrunnlag og presseetisk rapport" },
};

function inferPackageFromAccessPosition(position: number): PackagePlanId {
  if (position >= 7) return "investigation_pack";
  if (position >= 6) return "full_pack";
  if (position >= 4) return "pfu_pack";
  return "report_pack";
}

function getUpgradePackage(currentPackageId: PackagePlanId) {
  if (currentPackageId === "report_pack") {
    return singlePackages.find((plan) => plan.id === "pfu_pack") ?? null;
  }

  if (currentPackageId === "pfu_pack") {
    return singlePackages.find((plan) => plan.id === "full_pack") ?? null;
  }

  if (currentPackageId === "full_pack") {
    return singlePackages.find((plan) => plan.id === "investigation_pack") ?? null;
  }

  return null;
}

function getPackageLabel(packageId: PackagePlanId) {
  return singlePackages.find((plan) => plan.id === packageId)?.name ?? "Pakke";
}

function getPackageAccessLabel(packageId: PackagePlanId) {
  const steps = packageAccessSteps[packageId] ?? [1, 2, 3];

  const reachedSteps = visualSteps.filter((step) => steps.includes(step.accessPosition));
  const lastReached = reachedSteps[reachedSteps.length - 1];

  return `Tilgang: til og med ${lastReached?.label ?? "Full rapport"}`;
}

export function CaseWorkflowCard({
  caseId,
  statusLabel,
  activeStep = "case",
  workflowType = "standard",
  currentPackageId,
  stepsDone,
}: CaseWorkflowCardProps) {
  const effectivePackageId =
    workflowType === "journalist"
      ? "report_pack"
      : (currentPackageId ?? inferPackageFromAccessPosition(
          visualSteps.find((step) => step.memberSteps.includes(activeStep))?.accessPosition ?? 1
        ));

  const accessSteps = packageAccessSteps[effectivePackageId] ?? [1, 2, 3];
  const upgradePackage = getUpgradePackage(effectivePackageId);

  const visibleSteps = useMemo(() => {
    if (workflowType === "journalist") {
      return visualSteps.filter((step) => step.key === "enkel_rapport" || step.key === "full_rapport");
    }

    return visualSteps;
  }, [workflowType]);

  const firstLockedStepKey = visibleSteps.find(
    (step) => workflowType !== "journalist" && !accessSteps.includes(step.accessPosition)
  )?.key;

  return (
    <aside className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-7">
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-800">Saksgang</p>

      <h2 className="mt-4 text-3xl font-black text-slate-950">{statusLabel}</h2>

      <div className="mt-5 rounded-2xl border border-red-200 bg-white/70 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-800">
          {workflowType === "journalist" ? "Arbeidsflyt" : "Valgt pakke"}
        </p>
        <p className="mt-2 text-lg font-black text-slate-950">
          {workflowType === "journalist" ? "Journalist / redaksjon" : getPackageLabel(effectivePackageId)}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          {workflowType === "journalist"
            ? "Publiseringsgrunnlag og redaksjonell sjekk"
            : getPackageAccessLabel(effectivePackageId)}
        </p>
      </div>

      <div className="mt-6 grid gap-3">
        {visibleSteps.map((step, index) => {
          const stepNumber = index + 1;
          const isDone = step.doneKeys.some((key) => (key === "caseRegistered" ? true : Boolean(stepsDone?.[key])));
          const isActive = step.memberSteps.includes(activeStep);
          const isLocked = workflowType !== "journalist" && !accessSteps.includes(step.accessPosition);
          const showUpgradeButton = isLocked && step.key === firstLockedStepKey && upgradePackage;

          const text = journalistText[step.key];
          const label = workflowType === "journalist" && text ? text.label : step.label;
          const description = workflowType === "journalist" && text ? text.description : step.description;

          const stepContent = (
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                  isActive
                    ? "bg-red-500 text-white"
                    : isLocked
                      ? "bg-slate-200 text-slate-500"
                      : isDone
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-500"
                }`}
              >
                {stepNumber}
              </span>

              <div className="min-w-0 flex-1">
                <p className="font-black">{label}</p>
                <p
                  className={`mt-0.5 text-xs leading-5 ${
                    isActive
                      ? "text-slate-200"
                      : isLocked
                        ? "text-slate-500"
                        : isDone
                          ? "text-slate-600"
                          : "text-slate-400"
                  }`}
                >
                  {isActive
                    ? "Aktiv side"
                    : isLocked
                      ? `Krever ${upgradePackage?.name ?? "oppgradering"}`
                      : isDone
                        ? "Utført / påbegynt"
                        : description}
                </p>

                {showUpgradeButton ? (
                  <a
                    href={`/min-side/saker/${caseId}/pakke`}
                    className="mt-3 inline-flex rounded-xl bg-red-500 px-4 py-2 text-xs font-black text-white hover:bg-red-600"
                  >
                    Oppgrader til {upgradePackage.name}
                  </a>
                ) : null}
              </div>
            </div>
          );

          if (isLocked) {
            return (
              <div key={step.key} className="rounded-2xl border border-red-100 bg-white/50 p-3 text-slate-500">
                {stepContent}
              </div>
            );
          }

          return (
            <Link
              key={step.key}
              href={step.href(caseId)}
              className={`rounded-2xl border p-3 transition ${
                isActive
                  ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                  : isDone
                    ? "border-red-300 bg-white text-slate-950 hover:bg-red-50"
                    : "border-red-100 bg-white/50 text-slate-400 hover:bg-white/70"
              }`}
            >
              {stepContent}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
