"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, LoadingState } from "@/components/design-system";
import { EvidenceStatusBadge } from "./EvidenceStatusBadge";
import { deriveDisplayStatus } from "@/lib/evidence/statusLogic";
import type { DocumentationGap, DocumentationStatus } from "@/lib/evidence/types";

type ClaimSummaryRow = {
  evidence: { documentId: string }[];
  latestAssessment: { status: Exclude<DocumentationStatus, "not_assessed"> } | null;
};

const GAP_LABELS: Record<DocumentationGap["type"], string> = {
  conflicting_claim: "Motstridende opplysninger",
  undocumented_claim: "Dokumentasjon mangler",
  unconfirmed_witness: "Vitne uten skriftlig erklæring",
  partially_documented_claim: "Kun delvis dokumentert",
  undocumented_event: "Hendelse uten dokumentasjon",
  unanchored_claim: "Ikke knyttet til en hendelse",
};

type Counts = Record<DocumentationStatus, number>;

const EMPTY_COUNTS: Counts = {
  well_documented: 0,
  partially_documented: 0,
  conflicting: 0,
  undocumented: 0,
  not_assessed: 0,
};

const STATUS_ORDER: DocumentationStatus[] = [
  "well_documented",
  "partially_documented",
  "conflicting",
  "undocumented",
  "not_assessed",
];

/**
 * Kompakt sakstyrke-oversikt. Frøet til det felles Dokumentasjonssenteret -
 * henter fra samme API som ClaimsPanel, saks-bredt, ikke steg-bredt. Skal
 * kunne erstattes/utvides til en full hub senere uten datamodellendring.
 */
export function DocumentationSummary({ caseId }: { caseId: string }) {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [totalClaims, setTotalClaims] = useState(0);
  const [gaps, setGaps] = useState<DocumentationGap[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [claimsResponse, gapsResponse] = await Promise.all([
        fetch(`/api/cases/${caseId}/claims`, { headers }),
        fetch(`/api/cases/${caseId}/documentation-gaps`, { headers }),
      ]);

      if (!claimsResponse.ok) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      const result = await claimsResponse.json();
      const claims = (result.claims ?? []) as ClaimSummaryRow[];

      const nextCounts: Counts = { ...EMPTY_COUNTS };
      for (const claim of claims) {
        const status = deriveDisplayStatus(claim.evidence.length, claim.latestAssessment?.status ?? null);
        nextCounts[status] += 1;
      }

      const gapsResult = gapsResponse.ok ? await gapsResponse.json() : { gaps: [] };

      if (!cancelled) {
        setCounts(nextCounts);
        setTotalClaims(claims.length);
        setGaps((gapsResult.gaps ?? []) as DocumentationGap[]);
        setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  if (isLoading) {
    return <LoadingState message="Laster dokumentasjonsstatus..." />;
  }

  if (!counts || totalClaims === 0) {
    return null;
  }

  return (
    <Card padding="md">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">
        Dokumentasjonsstatus
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {totalClaims} {totalClaims === 1 ? "opplysning" : "opplysninger"} registrert i saken.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_ORDER.filter((status) => counts[status] > 0).map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <EvidenceStatusBadge status={status} />
            <span className="text-xs font-bold text-slate-500">{counts[status]}</span>
          </div>
        ))}
      </div>

      {gaps.length > 0 ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-800">
            {gaps.length === 1 ? "1 forhold å se nærmere på" : `${gaps.length} forhold å se nærmere på`}
          </p>
          <p className="mt-1.5 text-sm leading-6 text-slate-700">
            <span className="font-bold">{GAP_LABELS[gaps[0].type]}:</span> {gaps[0].description}
          </p>
          {gaps.length > 1 ? (
            <p className="mt-1 text-xs text-slate-500">+ {gaps.length - 1} til, se opplysninger.</p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
