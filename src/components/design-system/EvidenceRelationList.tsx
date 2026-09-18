export type EvidenceRelationItem = {
  id: string;
  label: string;
};

export type EvidenceRelationGroup = {
  /** F.eks. "Dokumenter", "Hendelser", "Vitner", "Påstander". */
  label: string;
  items: EvidenceRelationItem[];
};

/**
 * Remøy AI Design System — EvidenceRelationList.
 * Viser "koblet til: X, Y, Z" på tvers av entitetstyper (dokument, hendelse,
 * påstand, vitne) i én konsekvent form. Rent presentasjonslag - vet
 * ingenting om hva slags produkt eller domene entitetene tilhører.
 */
export function EvidenceRelationList({
  groups,
  emptyLabel = "Ingen koblinger ennå.",
  className = "",
}: {
  groups: EvidenceRelationGroup[];
  emptyLabel?: string;
  className?: string;
}) {
  const nonEmptyGroups = groups.filter((group) => group.items.length > 0);

  if (nonEmptyGroups.length === 0) {
    return <p className={`text-sm text-slate-500 ${className}`}>{emptyLabel}</p>;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {nonEmptyGroups.map((group) => (
        <div key={group.label} className="flex flex-wrap items-start gap-2 text-sm">
          <span className="shrink-0 font-bold text-slate-500">{group.label}:</span>
          <div className="flex flex-wrap gap-1.5">
            {group.items.map((item) => (
              <span
                key={item.id}
                className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
