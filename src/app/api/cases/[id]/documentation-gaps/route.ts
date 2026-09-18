import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { assertOwnsCase } from "@/lib/access/assertOwnsCase";
import { identifyDocumentationGaps, sortGapsByPriority } from "@/lib/evidence/documentationGaps";
import type { DocumentationStatus } from "@/lib/evidence/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function countBy<T>(rows: T[], key: (row: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const k = key(row);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

/**
 * Saksbredt, uavhengig av hvilket steg brukeren står på - klargjort for det
 * fremtidige Dokumentasjonssenteret/Evidence Map (bygges ikke nå, men
 * denne ruten er allerede hub-klar per design).
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId } = await context.params;

  const caseCheck = await assertOwnsCase(auth.supabase, caseId);
  if (!caseCheck.ok) return jsonError(caseCheck.error, 404);

  const [claimsResult, eventsResult, witnessesResult] = await Promise.all([
    auth.supabase
      .from("claims")
      .select("id,text,no_evidence_confirmed_at")
      .eq("case_id", caseId)
      .is("deleted_at", null),
    auth.supabase.from("events").select("id,title").eq("case_id", caseId).is("deleted_at", null),
    auth.supabase
      .from("witnesses")
      .select("id,name,witness_accounts(id,deleted_at)")
      .eq("case_id", caseId)
      .is("deleted_at", null),
  ]);

  if (claimsResult.error) return jsonError(claimsResult.error.message, 500);
  if (eventsResult.error) return jsonError(eventsResult.error.message, 500);
  if (witnessesResult.error) return jsonError(witnessesResult.error.message, 500);

  const claims = claimsResult.data ?? [];
  const events = eventsResult.data ?? [];
  const claimIds = claims.map((c) => c.id);
  const eventIds = events.map((e) => e.id);

  type WitnessRow = { id: string; name: string | null; witness_accounts: { id: string; deleted_at: string | null }[] | null };
  const witnessAccountEntries = ((witnessesResult.data ?? []) as WitnessRow[]).flatMap((witness) =>
    (witness.witness_accounts ?? [])
      .filter((account) => !account.deleted_at)
      .map((account) => ({ id: account.id, witnessName: witness.name }))
  );
  const witnessAccountIds = witnessAccountEntries.map((a) => a.id);

  const [evidenceLinksResult, eventClaimLinksResult, assessmentsResult, eventDocLinksResult, witnessDocLinksResult] =
    await Promise.all([
      claimIds.length
        ? auth.supabase.from("claim_evidence_links").select("claim_id").in("claim_id", claimIds)
        : Promise.resolve({ data: [], error: null }),
      claimIds.length
        ? auth.supabase.from("event_claim_links").select("claim_id").in("claim_id", claimIds)
        : Promise.resolve({ data: [], error: null }),
      claimIds.length
        ? auth.supabase
            .from("claim_assessments")
            .select("claim_id,status,created_at")
            .in("claim_id", claimIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      eventIds.length
        ? auth.supabase.from("event_document_links").select("event_id").in("event_id", eventIds)
        : Promise.resolve({ data: [], error: null }),
      witnessAccountIds.length
        ? auth.supabase
            .from("witness_account_document_links")
            .select("witness_account_id")
            .in("witness_account_id", witnessAccountIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (evidenceLinksResult.error) return jsonError(evidenceLinksResult.error.message, 500);
  if (eventClaimLinksResult.error) return jsonError(eventClaimLinksResult.error.message, 500);
  if (assessmentsResult.error) return jsonError(assessmentsResult.error.message, 500);
  if (eventDocLinksResult.error) return jsonError(eventDocLinksResult.error.message, 500);
  if (witnessDocLinksResult.error) return jsonError(witnessDocLinksResult.error.message, 500);

  const evidenceCounts = countBy(
    (evidenceLinksResult.data ?? []) as { claim_id: string }[],
    (r) => r.claim_id
  );
  const eventClaimCounts = countBy(
    (eventClaimLinksResult.data ?? []) as { claim_id: string }[],
    (r) => r.claim_id
  );
  const eventDocCounts = countBy(
    (eventDocLinksResult.data ?? []) as { event_id: string }[],
    (r) => r.event_id
  );
  const witnessDocCounts = countBy(
    (witnessDocLinksResult.data ?? []) as { witness_account_id: string }[],
    (r) => r.witness_account_id
  );

  const latestStatusByClaim = new Map<string, Exclude<DocumentationStatus, "not_assessed">>();
  for (const row of (assessmentsResult.data ?? []) as { claim_id: string; status: Exclude<DocumentationStatus, "not_assessed"> }[]) {
    if (!latestStatusByClaim.has(row.claim_id)) latestStatusByClaim.set(row.claim_id, row.status);
  }

  const gaps = identifyDocumentationGaps({
    claims: claims.map((claim) => ({
      id: claim.id,
      text: claim.text,
      noEvidenceConfirmedAt: claim.no_evidence_confirmed_at,
      evidenceCount: evidenceCounts.get(claim.id) ?? 0,
      eventCount: eventClaimCounts.get(claim.id) ?? 0,
      latestAssessmentStatus: latestStatusByClaim.get(claim.id) ?? null,
    })),
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      documentCount: eventDocCounts.get(event.id) ?? 0,
    })),
    witnessAccounts: witnessAccountEntries.map((account) => ({
      id: account.id,
      witnessName: account.witnessName,
      documentCount: witnessDocCounts.get(account.id) ?? 0,
    })),
  });

  return jsonOk({ gaps: sortGapsByPriority(gaps) });
}
