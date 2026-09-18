import type { ReactNode } from "react";
import { Badge } from "./Badge";

export type DocumentationGapSuggestion = {
  label: string;
  description: string;
};

export type DocumentationGapCardProps = {
  typeLabel: string;
  description: string;
  suggestions?: DocumentationGapSuggestion[];
  isConfirmedNoEvidence?: boolean;
  action?: ReactNode;
  className?: string;
};

/**
 * Remøy AI Design System — DocumentationGapCard.
 * Et hull betyr aldri at brukerens opplysning er feil - kun at forholdet
 * foreløpig ikke er tilstrekkelig dokumentert. Rolig, ikke-anklagende tone;
 * hvis brukeren allerede har bekreftet at mer dokumentasjon ikke finnes,
 * vises det tydelig i stedet for forslag - systemet spør ikke igjen.
 */
export function DocumentationGapCard({
  typeLabel,
  description,
  suggestions,
  isConfirmedNoEvidence,
  action,
  className = "",
}: DocumentationGapCardProps) {
  return (
    <div className={`rounded-2xl border border-amber-200 bg-amber-50 p-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone="warning">{typeLabel}</Badge>
        {action}
      </div>

      <p className="mt-2 text-sm leading-6 text-amber-950">{description}</p>

      {isConfirmedNoEvidence ? (
        <p className="mt-3 text-xs italic leading-5 text-amber-800">
          Brukeren har bekreftet at mer dokumentasjon ikke finnes for dette forholdet.
        </p>
      ) : suggestions && suggestions.length > 0 ? (
        <div className="mt-3 space-y-1.5 border-t border-amber-200 pt-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-800">
            Kan være relevant å se etter
          </p>
          {suggestions.map((item, index) => (
            <p key={index} className="text-xs leading-5 text-amber-900">
              <span className="font-bold">{item.label}:</span> {item.description}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
