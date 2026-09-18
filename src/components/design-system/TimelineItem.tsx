import type { ReactNode } from "react";
import { Badge } from "./Badge";
import { EvidenceRelationList, type EvidenceRelationGroup } from "./EvidenceRelationList";

export type TimelineItemProps = {
  dateLabel: string;
  title: string;
  description?: string | null;
  relations: EvidenceRelationGroup[];
  hasConflict?: boolean;
  conflictNote?: ReactNode;
  isUnknownDate?: boolean;
};

/**
 * Remøy AI Design System — TimelineItem.
 * Én rad i en kronologisk visning. Ukjent dato markeres tydelig i stedet
 * for å late som om det er en reell tidlig dato (håndteres av kalleren via
 * isUnknownDate + sortering - denne komponenten bare viser det som er gitt).
 */
export function TimelineItem({
  dateLabel,
  title,
  description,
  relations,
  hasConflict,
  conflictNote,
  isUnknownDate,
}: TimelineItemProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={`text-xs font-bold uppercase tracking-[0.14em] ${isUnknownDate ? "text-slate-400" : "text-red-700"}`}
        >
          {dateLabel}
        </p>
        {hasConflict ? <Badge tone="warning">Ulike datoer oppgitt</Badge> : null}
      </div>

      <p className="mt-1 font-bold text-slate-950">{title}</p>
      {description ? <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p> : null}

      <div className="mt-3">
        <EvidenceRelationList groups={relations} />
      </div>

      {hasConflict && conflictNote ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          {conflictNote}
        </div>
      ) : null}
    </div>
  );
}
