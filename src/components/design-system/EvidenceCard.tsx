import type { ReactNode } from "react";

export type EvidenceCardProps = {
  title: ReactNode;
  badge?: ReactNode;
  meta?: ReactNode;
  /** Handlingsknapper til høyre, for rader uten ekspander/toggle (f.eks. papirkurv). */
  actions?: ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
  children?: ReactNode;
  className?: string;
};

/**
 * Remøy AI Design System — EvidenceCard.
 * Generisk, ekspanderbar kort-rad for én entitet i Dokumentasjonssenteret
 * (påstand, dokument, hendelse eller vitne) - tittel + statusmerke + meta på
 * én linje, med valgfritt utvidbart innhold. Rent presentasjonslag, ingen
 * kobling til noen bestemt entitetstype.
 */
export function EvidenceCard({
  title,
  badge,
  meta,
  actions,
  isExpanded,
  onToggle,
  children,
  className = "",
}: EvidenceCardProps) {
  const isInteractive = typeof onToggle === "function";

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white ${className}`}>
      {isInteractive ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full flex-wrap items-start justify-between gap-3 p-4 text-left"
        >
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-950">{title}</p>
            {meta ? <p className="mt-1 text-xs font-semibold text-slate-500">{meta}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {badge}
            <span aria-hidden="true" className="text-slate-400">
              {isExpanded ? "−" : "+"}
            </span>
          </div>
        </button>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-950">{title}</p>
            {meta ? <p className="mt-1 text-xs font-semibold text-slate-500">{meta}</p> : null}
          </div>
          {badge ? <div className="shrink-0">{badge}</div> : null}
          {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
        </div>
      )}

      {children && (isExpanded || !isInteractive) ? (
        <div className="border-t border-slate-200 p-4">{children}</div>
      ) : null}
    </div>
  );
}
