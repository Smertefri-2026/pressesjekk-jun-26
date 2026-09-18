import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  AI_DOCUMENT_ISOLATION_INSTRUCTIONS,
  EVIDENCE_ASSESSMENT_INSTRUCTIONS,
  callAiJson,
} from "@/lib/ai/openai";
import { buildAssessmentPrompt } from "@/lib/evidence/buildAssessmentPrompt";
import { validateAssessmentPayload } from "@/lib/evidence/assessmentValidation";
import { mapAssessmentRow, mapDocumentFactsRow, type ClaimAssessmentRow, type DocumentFactsRow } from "@/lib/evidence/mappers";
import { compareEventsChronologically, formatEventDate } from "@/lib/evidence/dateFacts";
import type { EvidenceDocumentInput, TimelineContextEvent, WitnessAccountInput } from "@/lib/evidence/types";

type RouteContext = {
  params: Promise<{ id: string; claimId: string }>;
};

// Manuelt utløst per påstand (ikke automatisk), så et generøst tak er nok
// til å hindre skript-messig misbruk uten å hindre reell bruk.
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const ASSESSMENT_COLUMNS =
  "id,claim_id,what_it_shows,supports_summary,contradicts_summary,not_documented_summary,conflicts_between_evidence,timeline_note,witness_breakdown,corroboration_note,status,confidence,confidence_reasoning,evidence_breakdown,evidence_ids_considered,model,created_at";

const DOCUMENT_FACTS_COLUMNS =
  "id,document_id,case_id,extraction_status,extraction_error,document_kind,summary,occurred_at_date,occurred_at_time,date_confidence,date_note,structured_facts,source_characteristics,source_characteristics_note,likely_event_description,model,extracted_at,created_at";

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId, claimId } = await context.params;

  const rateLimit = checkRateLimit(`evidence-assess:${auth.user.id}`, {
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return jsonError("For mange vurderinger på kort tid. Vent litt og prøv igjen.", 429);
  }

  const { data: claim, error: claimError } = await auth.supabase
    .from("claims")
    .select("id,case_id,text")
    .eq("id", claimId)
    .maybeSingle();

  if (claimError) return jsonError(claimError.message, 500);
  if (!claim) return jsonError("Fant ikke opplysningen.", 404);
  if (claim.case_id !== caseId) return jsonError("Opplysningen hører ikke til denne saken.", 400);

  const { data: linkedDocuments, error: documentsError } = await auth.supabase
    .from("claim_evidence_links")
    .select(
      "document_id,case_documents(id,title,document_type,extracted_text,extraction_status,deleted_at,user_intent_note)"
    )
    .eq("claim_id", claimId);

  if (documentsError) return jsonError(documentsError.message, 500);

  type LinkedDocRow = {
    document_id: string;
    case_documents:
      | {
          id: string;
          title: string;
          document_type: string;
          extracted_text: string | null;
          extraction_status: string;
          deleted_at: string | null;
          user_intent_note: string | null;
        }
      | {
          id: string;
          title: string;
          document_type: string;
          extracted_text: string | null;
          extraction_status: string;
          deleted_at: string | null;
          user_intent_note: string | null;
        }[]
      | null;
  };

  const documents: EvidenceDocumentInput[] = ((linkedDocuments ?? []) as LinkedDocRow[])
    .map((row) => (Array.isArray(row.case_documents) ? row.case_documents[0] : row.case_documents))
    .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc) && !doc?.deleted_at)
    .map((doc) => ({
      id: doc.id,
      title: doc.title,
      documentType: doc.document_type,
      extractedText: doc.extracted_text,
      extractionStatus: doc.extraction_status,
      userIntentNote: doc.user_intent_note,
    }));

  // Fase 2B: vitneopplysninger koblet til denne påstanden - egen kildetype,
  // aldri blandet inn i dokumentene. Hentes også før snarveien under, siden
  // en påstand uten dokumenter men med vitner fortsatt skal KI-vurderes.
  const { data: witnessLinks, error: witnessLinksError } = await auth.supabase
    .from("witness_account_claim_links")
    .select(
      "witness_accounts(id,description,observation_type,deleted_at,witnesses(name,identity_status),witness_account_document_links(id))"
    )
    .eq("claim_id", claimId);

  if (witnessLinksError) return jsonError(witnessLinksError.message, 500);

  type LinkedWitnessAccountRow = {
    id: string;
    description: string;
    observation_type: "direct" | "secondhand";
    deleted_at: string | null;
    witnesses: { name: string | null; identity_status: WitnessAccountInput["identityStatus"] } | { name: string | null; identity_status: WitnessAccountInput["identityStatus"] }[] | null;
    witness_account_document_links: { id: string }[] | null;
  };

  type WitnessLinkRow = { witness_accounts: LinkedWitnessAccountRow | LinkedWitnessAccountRow[] | null };

  const witnessAccounts: WitnessAccountInput[] = ((witnessLinks ?? []) as WitnessLinkRow[])
    .map((row) => (Array.isArray(row.witness_accounts) ? row.witness_accounts[0] : row.witness_accounts))
    .filter((account): account is NonNullable<typeof account> => Boolean(account) && !account?.deleted_at)
    .map((account) => {
      const witness = Array.isArray(account.witnesses) ? account.witnesses[0] : account.witnesses;

      return {
        id: account.id,
        witnessName: witness?.name ?? null,
        identityStatus: witness?.identity_status ?? "possible",
        observationType: account.observation_type,
        description: account.description,
        hasWrittenStatement: (account.witness_account_document_links?.length ?? 0) > 0,
      };
    });

  const witnessAccountIds = witnessAccounts.map((account) => account.id);

  // Ingen dokumentasjon eller vitner koblet - vi vet svaret uten å bruke et KI-kall.
  if (documents.length === 0 && witnessAccounts.length === 0) {
    const { data: inserted, error: insertError } = await auth.supabase
      .from("claim_assessments")
      .insert({
        claim_id: claimId,
        what_it_shows: "Ingen dokumentasjon er koblet til denne opplysningen ennå.",
        supports_summary: null,
        contradicts_summary: null,
        not_documented_summary:
          "Hele opplysningen er foreløpig udokumentert - ingen bevis er koblet til den.",
        conflicts_between_evidence: null,
        status: "undocumented",
        confidence: "high",
        confidence_reasoning:
          "Dette er ikke en KI-vurdering, men et faktisk forhold: ingen dokumentasjon er koblet.",
        evidence_breakdown: [],
        evidence_ids_considered: [],
        model: null,
      })
      .select(ASSESSMENT_COLUMNS)
      .single();

    if (insertError || !inserted) {
      return jsonError(insertError?.message ?? "Kunne ikke lagre vurderingen.", 500);
    }

    return jsonOk({ assessment: mapAssessmentRow(inserted as ClaimAssessmentRow) });
  }

  const documentIds = documents.map((doc) => doc.id);

  // Fase 2A: berik dokumentene med tidligere ekstraherte fakta, og hent
  // hendelser koblet til denne påstanden for kronologisk kontekst.
  const [factsResult, eventLinksResult] = await Promise.all([
    auth.supabase.from("document_facts").select(DOCUMENT_FACTS_COLUMNS).in("document_id", documentIds),
    auth.supabase
      .from("event_claim_links")
      .select(
        "events(title,description,event_date,event_time,date_precision,approximate_label,created_at,deleted_at)"
      )
      .eq("claim_id", claimId),
  ]);

  const factsByDocumentId = new Map(
    ((factsResult.data ?? []) as DocumentFactsRow[]).map((row) => [row.document_id, mapDocumentFactsRow(row)])
  );

  const documentsWithFacts: EvidenceDocumentInput[] = documents.map((doc) => ({
    ...doc,
    facts: factsByDocumentId.get(doc.id) ?? null,
  }));

  type LinkedEventRow = {
    events:
      | {
          title: string;
          description: string | null;
          event_date: string | null;
          event_time: string | null;
          date_precision: "exact" | "date_only" | "approximate" | "unknown";
          approximate_label: string | null;
          created_at: string;
          deleted_at: string | null;
        }
      | {
          title: string;
          description: string | null;
          event_date: string | null;
          event_time: string | null;
          date_precision: "exact" | "date_only" | "approximate" | "unknown";
          approximate_label: string | null;
          created_at: string;
          deleted_at: string | null;
        }[]
      | null;
  };

  const linkedEvents = ((eventLinksResult.data ?? []) as LinkedEventRow[])
    .map((row) => (Array.isArray(row.events) ? row.events[0] : row.events))
    .filter((event): event is NonNullable<typeof event> => Boolean(event) && !event?.deleted_at)
    .sort((a, b) =>
      compareEventsChronologically(
        { eventDate: a.event_date, eventTime: a.event_time, datePrecision: a.date_precision, approximateLabel: a.approximate_label, createdAt: a.created_at },
        { eventDate: b.event_date, eventTime: b.event_time, datePrecision: b.date_precision, approximateLabel: b.approximate_label, createdAt: b.created_at }
      )
    );

  const events: TimelineContextEvent[] = linkedEvents.map((event) => ({
    title: event.title,
    description: event.description,
    dateLabel: formatEventDate({
      eventDate: event.event_date,
      eventTime: event.event_time,
      datePrecision: event.date_precision,
      approximateLabel: event.approximate_label,
    }),
  }));

  const prompt = buildAssessmentPrompt({
    claimText: claim.text,
    documents: documentsWithFacts,
    events,
    witnessAccounts,
  });

  let payload;
  try {
    const raw = await callAiJson({
      prompt,
      instructions: `${EVIDENCE_ASSESSMENT_INSTRUCTIONS} ${AI_DOCUMENT_ISOLATION_INSTRUCTIONS}`,
    });

    payload = validateAssessmentPayload(raw, documentIds, witnessAccountIds);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "KI-vurderingen feilet.",
      502
    );
  }

  if (!payload) {
    return jsonError("KI-svaret hadde ikke forventet format og ble forkastet.", 502);
  }

  const { data: inserted, error: insertError } = await auth.supabase
    .from("claim_assessments")
    .insert({
      claim_id: claimId,
      what_it_shows: payload.whatItShows,
      supports_summary: payload.supportsSummary,
      contradicts_summary: payload.contradictsSummary,
      not_documented_summary: payload.notDocumentedSummary,
      conflicts_between_evidence: payload.conflictsBetweenEvidence,
      timeline_note: payload.timelineNote,
      corroboration_note: payload.corroborationNote,
      status: payload.status,
      confidence: payload.confidence,
      confidence_reasoning: payload.confidenceReasoning,
      evidence_breakdown: payload.evidenceBreakdown.map((item) => ({
        document_id: item.documentId,
        verdict: item.verdict,
        note: item.note,
      })),
      witness_breakdown: payload.witnessBreakdown.map((item) => ({
        witness_account_id: item.witnessAccountId,
        verdict: item.verdict,
        note: item.note,
        observation_type: item.observationType,
      })),
      evidence_ids_considered: documentIds,
      model: "gpt-4.1-mini",
    })
    .select(ASSESSMENT_COLUMNS)
    .single();

  if (insertError || !inserted) {
    return jsonError(insertError?.message ?? "Kunne ikke lagre vurderingen.", 500);
  }

  return jsonOk({ assessment: mapAssessmentRow(inserted as ClaimAssessmentRow) });
}
