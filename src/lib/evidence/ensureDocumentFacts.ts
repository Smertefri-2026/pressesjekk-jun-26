import type { SupabaseClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  callAiJson,
  DOCUMENT_FACTS_INSTRUCTIONS,
  AI_DOCUMENT_ISOLATION_INSTRUCTIONS,
} from "@/lib/ai/openai";
import { buildDocumentFactsPrompt } from "./buildDocumentFactsPrompt";
import { validateDocumentFactsPayload } from "./documentFactsValidation";
import { mapDocumentFactsRow, type DocumentFactsRow } from "./mappers";
import type { DocumentFacts } from "./types";

const FACTS_COLUMNS =
  "id,document_id,case_id,extraction_status,extraction_error,document_kind,summary,occurred_at_date,occurred_at_time,date_confidence,date_note,structured_facts,source_characteristics,source_characteristics_note,likely_event_description,model,extracted_at,created_at";

const RATE_LIMIT_MAX = 40;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

/**
 * Sørger for at et dokument har (eller får) en document_facts-rad, FØR det
 * brukes i noe resonnement - kalt lazily fra både claim- og
 * event-koblingsrutene første gang et dokument faktisk kobles til noe.
 *
 * Feiler ALDRI høylytt: en mislykket fakta-ekstraksjon skal ikke hindre
 * selve koblingen fra å lykkes - den lagres bare med
 * extraction_status="failed" og kan prøves på nytt senere. Dette er en
 * hjelpefunksjon, ikke en kritisk sti.
 */
export async function ensureDocumentFacts(
  supabase: SupabaseClient,
  {
    documentId,
    caseId,
    userId,
  }: { documentId: string; caseId: string; userId: string }
): Promise<DocumentFacts | null> {
  const { data: existing } = await supabase
    .from("document_facts")
    .select(FACTS_COLUMNS)
    .eq("document_id", documentId)
    .maybeSingle();

  if (existing && ["completed", "processing", "unsupported"].includes(existing.extraction_status)) {
    return mapDocumentFactsRow(existing as DocumentFactsRow);
  }

  const { data: document, error: documentError } = await supabase
    .from("case_documents")
    .select("id,title,document_type,extracted_text,extraction_status")
    .eq("id", documentId)
    .maybeSingle();

  if (documentError || !document) return null;

  if (document.extraction_status !== "completed" || !document.extracted_text) {
    const { data: unsupported } = await supabase
      .from("document_facts")
      .upsert(
        {
          document_id: documentId,
          case_id: caseId,
          user_id: userId,
          extraction_status: "unsupported",
          extraction_error: "Dokumentteksten er ikke lesbar ennå, så fakta kan ikke hentes ut.",
        },
        { onConflict: "document_id" }
      )
      .select(FACTS_COLUMNS)
      .single();

    return unsupported ? mapDocumentFactsRow(unsupported as DocumentFactsRow) : null;
  }

  const rateLimit = checkRateLimit(`document-facts:${userId}`, {
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    // Ikke feil koblingen - bare la dokumentet stå uten fakta til neste forsøk.
    return existing ? mapDocumentFactsRow(existing as DocumentFactsRow) : null;
  }

  try {
    const prompt = buildDocumentFactsPrompt({
      title: document.title,
      documentType: document.document_type,
      extractedText: document.extracted_text,
    });

    const raw = await callAiJson({
      prompt,
      instructions: `${DOCUMENT_FACTS_INSTRUCTIONS} ${AI_DOCUMENT_ISOLATION_INSTRUCTIONS}`,
    });

    const payload = validateDocumentFactsPayload(raw);

    if (!payload) {
      const { data: failed } = await supabase
        .from("document_facts")
        .upsert(
          {
            document_id: documentId,
            case_id: caseId,
            user_id: userId,
            extraction_status: "failed",
            extraction_error: "KI-svaret hadde ikke forventet format og ble forkastet.",
          },
          { onConflict: "document_id" }
        )
        .select(FACTS_COLUMNS)
        .single();

      return failed ? mapDocumentFactsRow(failed as DocumentFactsRow) : null;
    }

    const { data: saved, error: saveError } = await supabase
      .from("document_facts")
      .upsert(
        {
          document_id: documentId,
          case_id: caseId,
          user_id: userId,
          extraction_status: "completed",
          extraction_error: null,
          document_kind: payload.documentKind,
          summary: payload.summary,
          occurred_at_date: payload.occurredAtDate,
          occurred_at_time: payload.occurredAtTime,
          date_confidence: payload.dateConfidence,
          date_note: payload.dateNote,
          structured_facts: payload.structuredFacts,
          source_characteristics: payload.sourceCharacteristics,
          source_characteristics_note: payload.sourceCharacteristicsNote,
          likely_event_description: payload.likelyEventDescription,
          model: "gpt-4.1-mini",
          extracted_at: new Date().toISOString(),
        },
        { onConflict: "document_id" }
      )
      .select(FACTS_COLUMNS)
      .single();

    if (saveError || !saved) return null;

    return mapDocumentFactsRow(saved as DocumentFactsRow);
  } catch (error) {
    const { data: failed } = await supabase
      .from("document_facts")
      .upsert(
        {
          document_id: documentId,
          case_id: caseId,
          user_id: userId,
          extraction_status: "failed",
          extraction_error: error instanceof Error ? error.message : "Ukjent feil ved fakta-ekstraksjon.",
        },
        { onConflict: "document_id" }
      )
      .select(FACTS_COLUMNS)
      .single();

    return failed ? mapDocumentFactsRow(failed as DocumentFactsRow) : null;
  }
}
