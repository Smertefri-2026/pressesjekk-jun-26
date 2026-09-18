import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { assertOwnsCase } from "@/lib/access/assertOwnsCase";
import { checkRateLimit } from "@/lib/rateLimit";
import { callAiJson, CASE_SUMMARY_INSTRUCTIONS } from "@/lib/ai/openai";
import { buildCaseSummaryPrompt, type CaseSummaryClaimInput, type CaseSummaryGapInput } from "@/lib/evidence/buildCaseSummaryPrompt";
import { validateCaseSummaryPayload } from "@/lib/evidence/caseSummaryValidation";
import { identifyDocumentationGaps } from "@/lib/evidence/documentationGaps";
import { deriveDisplayStatus } from "@/lib/evidence/statusLogic";
import { mapCaseSummaryRow, type CaseSummaryRow } from "@/lib/evidence/mappers";
import type { DocumentationStatus } from "@/lib/evidence/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Saksbred oppsummering er dyrere å beregne enn en enkelt-påstand-vurdering
// (leser hele saken), og trengs sjeldnere - strammere tak enn per-claim-kallene.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const SUMMARY_COLUMNS =
  "id,case_id,best_documented_summary,partially_documented_summary,conflicts_summary,key_gaps_summary,strengthen_areas_summary,model,created_at";

function countBy<T>(rows: T[], key: (row: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const k = key(row);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

async function loadCaseSummaryInput(supabase: SupabaseClient, caseId: string) {
  // Gjenbruker samme rå-hentemønster som documentation-gaps/route.ts og
  // claims/route.ts - ingen delt intern funksjon, siden disse rutene
  // bevisst ikke skal endres i denne fasen ("ikke bygg om fungerende
  // kjernelogikk"). Duplisering her er en bevisst, isolert avveining.
  const [claimsResult, eventsResult, witnessesResult] = await Promise.all([
    supabase.from("claims").select("id,text,no_evidence_confirmed_at").eq("case_id", caseId).is("deleted_at", null),
    supabase.from("events").select("id,title").eq("case_id", caseId).is("deleted_at", null),
    supabase
      .from("witnesses")
      .select("id,name,witness_accounts(id,deleted_at)")
      .eq("case_id", caseId)
      .is("deleted_at", null),
  ]);

  if (claimsResult.error) throw new Error(claimsResult.error.message);
  if (eventsResult.error) throw new Error(eventsResult.error.message);
  if (witnessesResult.error) throw new Error(witnessesResult.error.message);

  const claims = (claimsResult.data ?? []) as { id: string; text: string; no_evidence_confirmed_at: string | null }[];
  const events = (eventsResult.data ?? []) as { id: string; title: string }[];
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
        ? supabase.from("claim_evidence_links").select("claim_id").in("claim_id", claimIds)
        : Promise.resolve({ data: [], error: null }),
      claimIds.length
        ? supabase.from("event_claim_links").select("claim_id").in("claim_id", claimIds)
        : Promise.resolve({ data: [], error: null }),
      claimIds.length
        ? supabase
            .from("claim_assessments")
            .select("claim_id,status,what_it_shows,supports_summary,contradicts_summary,corroboration_note,created_at")
            .in("claim_id", claimIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      eventIds.length
        ? supabase.from("event_document_links").select("event_id").in("event_id", eventIds)
        : Promise.resolve({ data: [], error: null }),
      witnessAccountIds.length
        ? supabase.from("witness_account_document_links").select("witness_account_id").in("witness_account_id", witnessAccountIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (evidenceLinksResult.error) throw new Error(evidenceLinksResult.error.message);
  if (eventClaimLinksResult.error) throw new Error(eventClaimLinksResult.error.message);
  if (assessmentsResult.error) throw new Error(assessmentsResult.error.message);
  if (eventDocLinksResult.error) throw new Error(eventDocLinksResult.error.message);
  if (witnessDocLinksResult.error) throw new Error(witnessDocLinksResult.error.message);

  const evidenceCounts = countBy((evidenceLinksResult.data ?? []) as { claim_id: string }[], (r) => r.claim_id);
  const eventClaimCounts = countBy((eventClaimLinksResult.data ?? []) as { claim_id: string }[], (r) => r.claim_id);
  const eventDocCounts = countBy((eventDocLinksResult.data ?? []) as { event_id: string }[], (r) => r.event_id);
  const witnessDocCounts = countBy(
    (witnessDocLinksResult.data ?? []) as { witness_account_id: string }[],
    (r) => r.witness_account_id
  );

  type AssessmentRow = {
    claim_id: string;
    status: Exclude<DocumentationStatus, "not_assessed">;
    what_it_shows: string;
    supports_summary: string | null;
    contradicts_summary: string | null;
    corroboration_note: string | null;
  };
  const latestAssessmentByClaim = new Map<string, AssessmentRow>();
  for (const row of (assessmentsResult.data ?? []) as AssessmentRow[]) {
    if (!latestAssessmentByClaim.has(row.claim_id)) latestAssessmentByClaim.set(row.claim_id, row);
  }

  const summaryClaims: CaseSummaryClaimInput[] = claims.map((claim) => {
    const latest = latestAssessmentByClaim.get(claim.id) ?? null;
    const status: DocumentationStatus = deriveDisplayStatus(evidenceCounts.get(claim.id) ?? 0, latest?.status ?? null);

    return {
      text: claim.text,
      status,
      whatItShows: latest?.what_it_shows ?? null,
      supportsSummary: latest?.supports_summary ?? null,
      contradictsSummary: latest?.contradicts_summary ?? null,
      corroborationNote: latest?.corroboration_note ?? null,
    };
  });

  const gaps = identifyDocumentationGaps({
    claims: claims.map((claim) => ({
      id: claim.id,
      text: claim.text,
      noEvidenceConfirmedAt: claim.no_evidence_confirmed_at,
      evidenceCount: evidenceCounts.get(claim.id) ?? 0,
      eventCount: eventClaimCounts.get(claim.id) ?? 0,
      latestAssessmentStatus: latestAssessmentByClaim.get(claim.id)?.status ?? null,
    })),
    events: events.map((event) => ({ id: event.id, title: event.title, documentCount: eventDocCounts.get(event.id) ?? 0 })),
    witnessAccounts: witnessAccountEntries.map((account) => ({
      id: account.id,
      witnessName: account.witnessName,
      documentCount: witnessDocCounts.get(account.id) ?? 0,
    })),
  });

  const summaryGaps: CaseSummaryGapInput[] = gaps.map((gap) => ({ type: gap.type, description: gap.description }));

  return { claims: summaryClaims, gaps: summaryGaps, claimCount: claims.length };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId } = await context.params;

  const caseCheck = await assertOwnsCase(auth.supabase, caseId);
  if (!caseCheck.ok) return jsonError(caseCheck.error, 404);

  const { data, error } = await auth.supabase
    .from("case_summaries")
    .select(SUMMARY_COLUMNS)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);

  return jsonOk({ summary: data ? mapCaseSummaryRow(data as CaseSummaryRow) : null });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId } = await context.params;

  const caseCheck = await assertOwnsCase(auth.supabase, caseId);
  if (!caseCheck.ok) return jsonError(caseCheck.error, 404);

  const rateLimit = checkRateLimit(`case-summary:${auth.user.id}`, {
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return jsonError("For mange oppsummeringer på kort tid. Vent litt og prøv igjen.", 429);
  }

  let input: Awaited<ReturnType<typeof loadCaseSummaryInput>>;
  try {
    input = await loadCaseSummaryInput(auth.supabase, caseId);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Kunne ikke hente sakens grunnlag.", 500);
  }

  if (input.claimCount === 0) {
    return jsonError("Legg til minst én påstand i saken før du ber om en samlet oppsummering.", 400);
  }

  const prompt = buildCaseSummaryPrompt({ claims: input.claims, gaps: input.gaps });

  let payload;
  try {
    const raw = await callAiJson({ prompt, instructions: CASE_SUMMARY_INSTRUCTIONS });
    payload = validateCaseSummaryPayload(raw);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "KI-oppsummeringen feilet.", 502);
  }

  if (!payload) {
    return jsonError("KI-svaret hadde ikke forventet format og ble forkastet.", 502);
  }

  const { data: inserted, error: insertError } = await auth.supabase
    .from("case_summaries")
    .insert({
      case_id: caseId,
      user_id: auth.user.id,
      best_documented_summary: payload.bestDocumentedSummary,
      partially_documented_summary: payload.partiallyDocumentedSummary,
      conflicts_summary: payload.conflictsSummary,
      key_gaps_summary: payload.keyGapsSummary,
      strengthen_areas_summary: payload.strengthenAreasSummary,
      model: "gpt-4.1-mini",
    })
    .select(SUMMARY_COLUMNS)
    .single();

  if (insertError || !inserted) {
    return jsonError(insertError?.message ?? "Kunne ikke lagre oppsummeringen.", 500);
  }

  return jsonOk({ summary: mapCaseSummaryRow(inserted as CaseSummaryRow) });
}
