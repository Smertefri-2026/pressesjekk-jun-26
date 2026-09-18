"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, LoadingState, StatusSummary, Button } from "@/components/design-system";
import { computeDocumentationCenterOverview } from "@/lib/evidence/documentationCenterOverview";

type ClaimSummaryRow = {
  evidence: { documentId: string }[];
  latestAssessment: { status: "well_documented" | "partially_documented" | "conflicting" | "undocumented" } | null;
};

/**
 * Kompakt, gjenbrukbar sidepanel-oppsummering av dokumentasjonstilstanden i
 * saken, ment for høyrekolonnen på eksisterende steg (opplysninger,
 * rapport, osv). Gjentar bevisst IKKE hele Dokumentasjonssenteret - kun
 * antall + snarvei dit. Produktnøytral utover selve API-kallene (caseId er
 * eneste input).
 */
export function EvidenceSidebar({ caseId }: { caseId: string }) {
  const [overview, setOverview] = useState<ReturnType<typeof computeDocumentationCenterOverview> | null>(null);
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

      const [claimsRes, documentsRes, witnessesRes, gapsRes] = await Promise.all([
        fetch(`/api/cases/${caseId}/claims`, { headers }),
        fetch(`/api/cases/${caseId}/documents`, { headers }),
        fetch(`/api/cases/${caseId}/witnesses`, { headers }),
        fetch(`/api/cases/${caseId}/documentation-gaps`, { headers }),
      ]);

      if (!claimsRes.ok || !documentsRes.ok || !witnessesRes.ok || !gapsRes.ok) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      const [claimsJson, documentsJson, witnessesJson, gapsJson] = await Promise.all([
        claimsRes.json(),
        documentsRes.json(),
        witnessesRes.json(),
        gapsRes.json(),
      ]);

      const claims = (claimsJson.claims ?? []) as ClaimSummaryRow[];

      if (!cancelled) {
        setOverview(
          computeDocumentationCenterOverview({
            documentCount: (documentsJson.documents ?? []).length,
            claims: claims.map((claim) => ({
              evidenceCount: claim.evidence.length,
              latestAssessmentStatus: claim.latestAssessment?.status ?? null,
            })),
            witnessCount: (witnessesJson.witnesses ?? []).length,
            gapCount: (gapsJson.gaps ?? []).length,
          })
        );
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

  if (!overview) {
    return null;
  }

  return (
    <Card padding="md">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-700">Dokumentasjon</p>

      <StatusSummary
        className="mt-4 grid-cols-2"
        items={[
          { label: "Dokumenter", count: overview.documentCount, tone: "neutral" },
          { label: "Påstander", count: overview.claimCount, tone: "neutral" },
          { label: "Vitner", count: overview.witnessCount, tone: "info" },
          { label: "Hull", count: overview.gapCount, tone: "warning" },
        ]}
      />

      <Button href={`/min-side/saker/${caseId}/full-rapport`} size="sm" variant="secondary" className="mt-4 w-full">
        Åpne dokumentasjon
      </Button>
    </Card>
  );
}
