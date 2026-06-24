"use client";

import { useMemo } from "react";
import Link from "next/link";

export type CaseWorkflowStep =
  | "case"
  | "opplysninger"
  | "rapport"
  | "pfu"
  | "pfu-avgjorelse"
  | "politianmeldelse"
  | "rediger";

type CaseWorkflowCardProps = {
  caseId: string;
  statusLabel: string;
  activeStep?: CaseWorkflowStep;
  workflowType?: "standard" | "journalist";
  stepsDone?: {
    caseRegistered?: boolean;
    caseInputs?: boolean;
    report?: boolean;
    pfuDraft?: boolean;
    pfuDecision?: boolean;
    policeReport?: boolean;
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
    | "policeReport";
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
];

export function CaseWorkflowCard({
  caseId,
  statusLabel,
  activeStep = "case",
  workflowType = "standard",
  stepsDone,
}: CaseWorkflowCardProps) {
  const visibleWorkflowSteps = useMemo(() => {
    if (workflowType === "journalist") {
      return workflowSteps.filter((step) =>
        ["case", "opplysninger", "rapport"].includes(step.key)
      );
    }

    return workflowSteps;
  }, [workflowType]);

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

      <div className="mt-6 grid gap-3">
        {visibleWorkflowSteps.map((step, index) => {
          const isDone =
            step.doneKey === "caseRegistered"
              ? true
              : Boolean(stepsDone?.[step.doneKey]);

          const isActive = activeStep === step.key;

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
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                    isActive
                      ? "bg-cyan-300 text-slate-950"
                      : isDone
                        ? "bg-cyan-500 text-slate-950"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {index + 1}
                </span>

                <div>
                  <p className="font-black">{getStepText(step).label}</p>
                  <p
                    className={`mt-0.5 text-xs leading-5 ${
                      isActive
                        ? "text-slate-200"
                        : isDone
                          ? "text-slate-600"
                          : "text-slate-400"
                    }`}
                  >
                    {isActive
                      ? "Aktiv side"
                      : isDone
                        ? "Utført / påbegynt"
                        : getStepText(step).description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
