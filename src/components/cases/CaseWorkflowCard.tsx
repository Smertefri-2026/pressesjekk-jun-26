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
  | "opplysninger"
  | "rapport"
  | "pfu"
  | "pfu-avgjorelse"
  | "politianmeldelse"
  | "utredning"
  | "rediger";

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

const workflowSteps: {
  key: CaseWorkflowStep;
  label: string;
  description: string;
  href: (caseId: string) => string;
  doneKey:
    | "caseRegistered"
    | "caseInputs"
    | "report"
    | "pfuDraft"
    | "pfuDecision"
    | "policeReport"
    | "investigation";
}[] = [
  {
    key: "case",
    label: "Sak registrert",
    description: "Grunnsiden for saken",
    href: (caseId) => `/min-side/saker/${caseId}`,
    doneKey: "caseRegistered",
  },
  {
    key: "opplysninger",
    label: "Saksopplysninger",
    description: "Fakta, tilsvar og dokumentasjon",
    href: (caseId) => `/min-side/saker/${caseId}/opplysninger`,
    doneKey: "caseInputs",
  },
  {
    key: "rapport",
    label: "Rapport",
    description: "Rapportutkast og vurdering",
    href: (caseId) => `/min-side/saker/${caseId}/rapport`,
    doneKey: "report",
  },
  {
    key: "pfu",
    label: "PFU-klage",
    description: "Utkast til PFU-klage",
    href: (caseId) => `/min-side/saker/${caseId}/pfu`,
    doneKey: "pfuDraft",
  },
  {
    key: "pfu-avgjorelse",
    label: "PFU-avgjørelse",
    description: "Resultat og dokumentasjon",
    href: (caseId) => `/min-side/saker/${caseId}/pfu-avgjorelse`,
    doneKey: "pfuDecision",
  },
  {
    key: "politianmeldelse",
    label: "Politianmeldelse",
    description: "Videre vurdering",
    href: (caseId) => `/min-side/saker/${caseId}/politianmeldelse`,
    doneKey: "policeReport",
  },
  {
    key: "utredning",
    label: "Utredningspakke",
    description: "Manuell gjennomgang",
    href: (caseId) => `/min-side/saker/${caseId}/utredning`,
    doneKey: "investigation",
  },
];

function inferPackageFromActiveStep(activeStep: CaseWorkflowStep): PackagePlanId {
  if (activeStep === "pfu") {
    return "pfu_pack";
  }

  if (activeStep === "utredning") {
    return "investigation_pack";
  }

  if (activeStep === "pfu-avgjorelse" || activeStep === "politianmeldelse") {
    return "full_pack";
  }

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

  if (steps.length >= 6) {
    return "Tilgang: steg 1–6";
  }

  return `Tilgang: steg 1–${steps[steps.length - 1]}`;
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
      : currentPackageId ?? "investigation_pack";

  const accessSteps = packageAccessSteps[effectivePackageId] ?? [1, 2, 3];
  const upgradePackage = getUpgradePackage(effectivePackageId);

  const visibleWorkflowSteps = useMemo(() => {
    if (workflowType === "journalist") {
      return workflowSteps.filter((step) =>
        ["case", "opplysninger", "rapport"].includes(step.key)
      );
    }

    return workflowSteps;
  }, [workflowType]);

  const firstLockedStepKey = visibleWorkflowSteps.find((_, index) => {
    const stepNumber = index + 1;
    return !accessSteps.includes(stepNumber);
  })?.key;

  function getStepText(step: (typeof workflowSteps)[number]) {
    if (workflowType !== "journalist") {
      return {
        label: step.label,
        description: step.description,
      };
    }

    if (step.key === "case") {
      return {
        label: "Sak opprettet",
        description: "Artikkelidé / publisering",
      };
    }

    if (step.key === "opplysninger") {
      return {
        label: "Publiseringsgrunnlag",
        description: "Fakta, kilder og tilsvar",
      };
    }

    if (step.key === "rapport") {
      return {
        label: "Redaksjonell sjekk",
        description: "Presseetisk rapport",
      };
    }

    return {
      label: step.label,
      description: step.description,
    };
  }

  return (
    <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-7">
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
        Saksgang
      </p>

      <h2 className="mt-4 text-3xl font-black text-slate-950">
        {statusLabel}
      </h2>

      <div className="mt-5 rounded-2xl border border-cyan-200 bg-white/70 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">
          {workflowType === "journalist" ? "Arbeidsflyt" : "Valgt pakke"}
        </p>
        <p className="mt-2 text-lg font-black text-slate-950">
          {workflowType === "journalist"
            ? "Journalist / redaksjon"
            : getPackageLabel(effectivePackageId)}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          {workflowType === "journalist"
            ? "Publiseringsgrunnlag og redaksjonell sjekk"
            : getPackageAccessLabel(effectivePackageId)}
        </p>
      </div>

      <div className="mt-6 grid gap-3">
        {visibleWorkflowSteps.map((step, index) => {
          const stepNumber = index + 1;
          const isDone =
            step.doneKey === "caseRegistered"
              ? true
              : Boolean(stepsDone?.[step.doneKey]);

          const isActive = activeStep === step.key;
          const isLocked =
            workflowType !== "journalist" && !accessSteps.includes(stepNumber);

          const showUpgradeButton =
            isLocked && step.key === firstLockedStepKey && upgradePackage;

          const stepContent = (
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                  isActive
                    ? "bg-cyan-300 text-slate-950"
                    : isLocked
                      ? "bg-slate-200 text-slate-500"
                      : isDone
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-slate-200 text-slate-500"
                }`}
              >
                {stepNumber}
              </span>

              <div className="min-w-0 flex-1">
                <p className="font-black">{getStepText(step).label}</p>
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
                        : getStepText(step).description}
                </p>

                {showUpgradeButton ? (
                  <Link
                    href="/priser"
                    className="mt-3 inline-flex rounded-xl bg-cyan-500 px-4 py-2 text-xs font-black text-slate-950 hover:bg-cyan-400"
                  >
                    Oppgrader til {upgradePackage.name}
                  </Link>
                ) : null}
              </div>
            </div>
          );

          if (isLocked) {
            return (
              <div
                key={step.key}
                className="rounded-2xl border border-cyan-100 bg-white/50 p-3 text-slate-500"
              >
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
                    ? "border-cyan-300 bg-white text-slate-950 hover:bg-cyan-50"
                    : "border-cyan-100 bg-white/50 text-slate-400 hover:bg-white/70"
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
