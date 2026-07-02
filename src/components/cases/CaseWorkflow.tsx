import Link from "next/link";

type CaseWorkflowProps = {
  caseId: string;
  hasCaseInput: boolean;
  hasReport: boolean;
  hasPfuDraft: boolean;
  hasPfuDecision: boolean;
  hasPoliceReport?: boolean;
  compact?: boolean;
};

export function CaseWorkflow({
  caseId,
  hasCaseInput,
  hasReport,
  hasPfuDraft,
  hasPfuDecision,
  hasPoliceReport = false,
  compact = false,
}: CaseWorkflowProps) {
  const steps = [
    {
      label: "Sak registrert",
      done: true,
      href: `/min-side/saker/${caseId}/rediger`,
    },
    {
      label: "Saksopplysninger",
      done: hasCaseInput,
      href: `/min-side/saker/${caseId}/opplysninger`,
    },
    {
      label: "Rapport",
      done: hasReport,
      href: `/min-side/saker/${caseId}/rapport`,
    },
    {
      label: "PFU-klage",
      done: hasPfuDraft,
      href: `/min-side/saker/${caseId}/pfu`,
    },
    {
      label: "PFU-avgjørelse",
      done: hasPfuDecision,
      href: `/min-side/saker/${caseId}/pfu-avgjorelse`,
    },
    {
      label: "Politianmeldelse",
      done: hasPoliceReport,
      href: `/min-side/saker/${caseId}/politianmeldelse`,
    },
  ];

  return (
    <aside className="rounded-3xl border border-blue-200 bg-blue-50 p-5 shadow-sm sm:p-7">
      <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-800">
        Saksgang
      </p>

      <h2 className="mt-4 text-3xl font-black text-slate-950">
        {hasPoliceReport
          ? "Politianmeldelse"
          : hasPfuDecision
            ? "PFU-avgjørelse"
            : hasPfuDraft
              ? "PFU-klage"
              : hasReport
                ? "Rapport"
                : hasCaseInput
                  ? "Saksopplysninger"
                  : "Sak registrert"}
      </h2>

      <div className={compact ? "mt-5 grid gap-2" : "mt-6 grid gap-3"}>
        {steps.map((step, index) => (
          <Link
            key={step.label}
            href={step.href}
            className={`rounded-2xl border transition ${
              compact ? "p-3" : "p-4"
            } ${
              step.done
                ? "border-blue-300 bg-white text-slate-950 hover:bg-blue-50"
                : "border-blue-100 bg-white/50 text-slate-400 hover:bg-white/70"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex shrink-0 items-center justify-center rounded-full font-black ${
                  compact ? "h-6 w-6 text-[11px]" : "h-7 w-7 text-xs"
                } ${
                  step.done
                    ? "bg-blue-500 text-slate-950"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {index + 1}
              </span>

              <div>
                <p className="font-black">{step.label}</p>
                <p
                  className={
                    compact
                      ? "mt-0.5 text-xs leading-5"
                      : "mt-1 text-sm leading-6"
                  }
                >
                  {step.done ? "Utført / påbegynt" : "Ikke påbegynt"}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
