"use client";

import { Badge, Card, EvidenceRelationList, TimelineItem, WitnessCard, DocumentationGapCard, type EvidenceRelationGroup } from "@/components/design-system";
import type { DocumentationGapType } from "@/lib/evidence/types";
import type { ReportBuiltFrom, ReportClaimFinding, ReportSection } from "@/lib/report/types";

const STATUS_LABELS: Record<string, string> = {
  well_documented: "Godt dokumentert",
  partially_documented: "Delvis dokumentert",
  conflicting: "Motstridende dokumentasjon",
  undocumented: "Ikke dokumentert",
};

const CONFIDENCE_LABELS: Record<string, string> = { high: "Høy", medium: "Middels", low: "Lav" };

const GAP_TYPE_LABELS: Record<DocumentationGapType, string> = {
  undocumented_claim: "Dokumentasjon mangler",
  partially_documented_claim: "Kun delvis dokumentert",
  conflicting_claim: "Motstridende opplysninger",
  unanchored_claim: "Ikke knyttet til tidslinjen",
  undocumented_event: "Hendelse uten dokumentasjon",
  unconfirmed_witness: "Vitne uten skriftlig erklæring",
};

function ClaimFindingCard({ finding }: { finding: ReportClaimFinding }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-bold text-slate-950">«{finding.claimText}»</p>
        <Badge tone={finding.status === "well_documented" ? "success" : finding.status === "conflicting" ? "danger" : "warning"}>
          {STATUS_LABELS[finding.status] ?? finding.status}
        </Badge>
      </div>

      <div className="mt-3 space-y-2 text-sm leading-6 text-slate-800">
        {finding.whatItShows ? (
          <p>
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Hva dokumentasjonen viser: </span>
            {finding.whatItShows}
          </p>
        ) : null}
        {finding.supportsSummary ? (
          <p>
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-700">Støtter: </span>
            {finding.supportsSummary}
          </p>
        ) : null}
        {finding.contradictsSummary ? (
          <p>
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-red-700">Motsier: </span>
            {finding.contradictsSummary}
          </p>
        ) : null}
        {finding.conflictsBetweenEvidence ? (
          <p>
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-red-700">Konflikt: </span>
            {finding.conflictsBetweenEvidence}
          </p>
        ) : null}
        {finding.notDocumentedSummary ? (
          <p>
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Ikke dokumentert: </span>
            {finding.notDocumentedSummary}
          </p>
        ) : null}
        {finding.timelineNote ? (
          <p>
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Tidslinje: </span>
            {finding.timelineNote}
          </p>
        ) : null}
        {finding.corroborationNote ? (
          <p>
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-700">Samlet støtte: </span>
            {finding.corroborationNote}
          </p>
        ) : null}
        {finding.confidence ? (
          <p className="text-xs font-semibold text-violet-800">
            Sikkerhet: {CONFIDENCE_LABELS[finding.confidence] ?? finding.confidence} — {finding.confidenceReasoning}
          </p>
        ) : null}
      </div>

      {finding.documentRefs.length > 0 ? (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <EvidenceRelationList groups={[{ label: "Dokumentreferanser", items: finding.documentRefs.map((ref) => ({ id: ref.documentId, label: ref.label })) }]} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Renderer en strukturert rapport (report_kind === "structured") seksjon
 * for seksjon. Gjenbruker Design System-komponentene fra Dokumentasjons-
 * senteret (fase 3) for et konsekvent uttrykk mellom senteret og den
 * ferdige rapporten. Eldre, ikke-strukturerte rapporter bruker fortsatt
 * den opprinnelige flate tekstvisningen andre steder på siden - denne
 * komponenten brukes KUN når report_kind er "structured".
 */
export function StructuredReportView({ sections, builtFrom }: { sections: ReportSection[]; builtFrom: ReportBuiltFrom | null }) {
  return (
    <div className="space-y-5">
      {builtFrom ? (
        <Card padding="sm" className="text-xs text-slate-500">
          Bygget på {builtFrom.claimCount} {builtFrom.claimCount === 1 ? "påstand" : "påstander"} ({builtFrom.documentedCount} godt dokumentert,{" "}
          {builtFrom.partiallyDocumentedCount} delvis, {builtFrom.conflictingCount} motstridende, {builtFrom.undocumentedCount} udokumentert),{" "}
          {builtFrom.witnessCount} {builtFrom.witnessCount === 1 ? "vitne" : "vitner"} og {builtFrom.gapCount} {builtFrom.gapCount === 1 ? "dokumentasjonshull" : "dokumentasjonshull"}.
        </Card>
      ) : null}

      {sections.map((section, index) => {
        switch (section.kind) {
          case "summary":
          case "background":
          case "conclusion":
            return (
              <Card key={index} padding="md">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">{section.heading}</p>
                <p className="mt-3 text-sm leading-7 text-slate-800">{section.text}</p>
              </Card>
            );

          case "timeline":
            return (
              <div key={index}>
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-red-700">{section.heading}</p>
                <div className="space-y-3">
                  {section.entries.map((entry) => {
                    const relations: EvidenceRelationGroup[] = [
                      { label: "Dokumenter", items: entry.documentRefs.map((ref) => ({ id: ref.documentId, label: ref.label })) },
                      { label: "Vitner", items: entry.witnessLabels.map((label, i) => ({ id: `${entry.eventId}-witness-${i}`, label })) },
                    ];
                    return (
                      <TimelineItem
                        key={entry.eventId}
                        dateLabel={entry.dateLabel}
                        title={entry.title}
                        description={entry.description}
                        relations={relations}
                        hasConflict={entry.hasDateConflict}
                        conflictNote={entry.conflictNote}
                        isUnknownDate={entry.datePrecision === "unknown"}
                      />
                    );
                  })}
                </div>
              </div>
            );

          case "key_user_statements":
            return (
              <Card key={index} padding="md">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">{section.heading}</p>
                <div className="mt-3 space-y-2">
                  {section.statements.map((statement) => (
                    <p key={statement.claimId} className="text-sm italic leading-6 text-slate-700">
                      Brukeren opplyser: «{statement.text}»
                    </p>
                  ))}
                </div>
              </Card>
            );

          case "documented_findings":
          case "partially_documented":
          case "conflicts":
            return (
              <div key={index}>
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-red-700">{section.heading}</p>
                <div className="space-y-3">
                  {section.findings.map((finding) => (
                    <ClaimFindingCard key={finding.claimId} finding={finding} />
                  ))}
                </div>
              </div>
            );

          case "witnesses":
            return (
              <div key={index}>
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-red-700">{section.heading}</p>
                <div className="space-y-3">
                  {section.witnesses.map((witness) => (
                    <WitnessCard
                      key={witness.witnessId}
                      name={witness.name}
                      identityStatus={witness.identityStatus}
                      relationshipToCase={witness.relationshipToCase}
                      accounts={witness.accounts.map((account, i) => ({
                        id: `${witness.witnessId}-${i}`,
                        description: account.description,
                        observationType: account.observationType,
                        hasWrittenStatement: account.hasWrittenStatement,
                        eventTitle: account.linkedClaimTexts.length > 0 ? account.linkedClaimTexts.join(" / ") : null,
                      }))}
                    />
                  ))}
                </div>
              </div>
            );

          case "documentation_gaps":
            return (
              <div key={index}>
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-red-700">{section.heading}</p>
                <div className="space-y-3">
                  {section.gaps.map((gap, gapIndex) => (
                    <DocumentationGapCard key={gapIndex} typeLabel={GAP_TYPE_LABELS[gap.type]} description={gap.description} />
                  ))}
                  {section.confirmedNoEvidenceCount > 0 ? (
                    <p className="text-xs italic text-slate-500">
                      {section.confirmedNoEvidenceCount} {section.confirmedNoEvidenceCount === 1 ? "forhold er" : "forhold er"} bekreftet av brukeren å ikke ha mer
                      tilgjengelig dokumentasjon.
                    </p>
                  ) : null}
                </div>
              </div>
            );

          case "legal_assessment":
            return (
              <div key={index}>
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-red-700">{section.heading}</p>
                <div className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <Card key={itemIndex} padding="sm">
                      <p className="font-bold text-slate-950">{item.ruleTitle}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{item.commentary}</p>
                      {item.documentRefs.length > 0 ? (
                        <div className="mt-2">
                          <EvidenceRelationList groups={[{ label: "Se", items: item.documentRefs.map((ref) => ({ id: ref.documentId, label: ref.label })) }]} />
                        </div>
                      ) : null}
                    </Card>
                  ))}
                </div>
              </div>
            );

          case "ai_assessment":
            return (
              <Card key={index} padding="md" tone="admin">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">{section.heading}</p>
                <div className="mt-3 space-y-3 text-sm leading-6 text-slate-800">
                  {section.bestDocumented ? (
                    <p>
                      <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Best dokumentert: </span>
                      {section.bestDocumented}
                    </p>
                  ) : null}
                  {section.partiallyDocumented ? (
                    <p>
                      <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Delvis dokumentert: </span>
                      {section.partiallyDocumented}
                    </p>
                  ) : null}
                  {section.conflicts ? (
                    <p>
                      <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Konflikter: </span>
                      {section.conflicts}
                    </p>
                  ) : null}
                  {section.keyGaps ? (
                    <p>
                      <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Sentrale hull: </span>
                      {section.keyGaps}
                    </p>
                  ) : null}
                  {section.strengthenAreas ? (
                    <p>
                      <span className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Kan styrkes: </span>
                      {section.strengthenAreas}
                    </p>
                  ) : null}
                </div>
              </Card>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
