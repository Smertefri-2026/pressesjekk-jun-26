import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { assertOwnsCase } from "@/lib/access/assertOwnsCase";
import { ensureDocumentFacts } from "@/lib/evidence/ensureDocumentFacts";
import { mapDocumentFactsRow, type DocumentFactsRow } from "@/lib/evidence/mappers";

type RouteContext = {
  params: Promise<{ id: string; documentId: string }>;
};

const FACTS_COLUMNS =
  "id,document_id,case_id,extraction_status,extraction_error,document_kind,summary,occurred_at_date,occurred_at_time,date_confidence,date_note,structured_facts,source_characteristics,source_characteristics_note,likely_event_description,model,extracted_at,created_at,user_confirmed,user_corrections";

/**
 * Leser ut allerede ekstraherte dokumentfakta (om de finnes). Trigger ALDRI
 * et nytt KI-kall selv - kun POST under gjør det eksplisitt.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId, documentId } = await context.params;

  const caseCheck = await assertOwnsCase(auth.supabase, caseId);
  if (!caseCheck.ok) return jsonError(caseCheck.error, 404);

  const { data, error } = await auth.supabase
    .from("document_facts")
    .select(FACTS_COLUMNS)
    .eq("document_id", documentId)
    .eq("case_id", caseId)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);

  return jsonOk({ facts: data ? mapDocumentFactsRow(data as DocumentFactsRow) : null });
}

/**
 * Fase 5: trigger fakta-ekstraksjon EKSPLISITT rett etter opplasting i
 * Evidence Workspace - i motsetning til den opprinnelige, lazily-utløste
 * stien (kun ved første kobling til en påstand/hendelse). Gjenbruker samme
 * ensureDocumentFacts-funksjon uendret - ingen ny ekstraksjonslogikk.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId, documentId } = await context.params;

  const caseCheck = await assertOwnsCase(auth.supabase, caseId);
  if (!caseCheck.ok) return jsonError(caseCheck.error, 404);

  const { data: document, error: documentError } = await auth.supabase
    .from("case_documents")
    .select("id,case_id")
    .eq("id", documentId)
    .eq("case_id", caseId)
    .maybeSingle();

  if (documentError) return jsonError(documentError.message, 500);
  if (!document) return jsonError("Fant ikke dokumentet i denne saken.", 404);

  const facts = await ensureDocumentFacts(auth.supabase, { documentId, caseId, userId: auth.user.id });

  if (!facts) {
    return jsonError("Kunne ikke hente ut dokumentfakta akkurat nå. Prøv igjen om litt.", 502);
  }

  return jsonOk({ facts });
}

type PatchBody =
  | { action: "confirm" }
  | { action: "correct"; corrections: Record<string, unknown> };

function isPatchBody(value: unknown): value is PatchBody {
  if (!value || typeof value !== "object") return false;
  const action = (value as Record<string, unknown>).action;
  return action === "confirm" || action === "correct";
}

/**
 * Fase 5: brukeren bekrefter eller korrigerer KI-ekstraherte fakta. En
 * korreksjon overskriver ALDRI de opprinnelige KI-feltene - den lagres i
 * `user_corrections` som et eget lag over originalen, slik at både KI sin
 * opprinnelige ekstraksjon og brukerens rettelse alltid er synlige
 * (kilde/historikk bevart, jf. kravet i fase 5-spesifikasjonen).
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId, documentId } = await context.params;

  const caseCheck = await assertOwnsCase(auth.supabase, caseId);
  if (!caseCheck.ok) return jsonError(caseCheck.error, 404);

  const body = await request.json().catch(() => null);
  if (!isPatchBody(body)) {
    return jsonError('action må være "confirm" eller "correct".', 400);
  }

  const { data: existing, error: existingError } = await auth.supabase
    .from("document_facts")
    .select("id,user_corrections")
    .eq("document_id", documentId)
    .eq("case_id", caseId)
    .maybeSingle();

  if (existingError) return jsonError(existingError.message, 500);
  if (!existing) return jsonError("Fant ingen dokumentfakta å bekrefte/korrigere for dette dokumentet ennå.", 404);

  const update: Record<string, unknown> = {};

  if (body.action === "confirm") {
    update.user_confirmed = true;
  } else {
    const ALLOWED_FIELDS = new Set([
      "document_kind",
      "occurred_at_date",
      "occurred_at_time",
      "likely_event_description",
      "summary",
    ]);

    const currentCorrections =
      existing.user_corrections && typeof existing.user_corrections === "object" && !Array.isArray(existing.user_corrections)
        ? (existing.user_corrections as Record<string, unknown>)
        : {};

    const nextCorrections: Record<string, string> = {};
    for (const [key, value] of Object.entries(currentCorrections)) {
      if (typeof value === "string") nextCorrections[key] = value;
    }

    for (const [field, value] of Object.entries(body.corrections ?? {})) {
      // Aksepterer også vilkårlige structured_facts-feltnavn (f.eks.
      // "sender", "recipient") i tillegg til den faste listen, siden disse
      // feltnavnene er dynamiske per dokumenttype (jf. buildDocumentFactsPrompt).
      if (!ALLOWED_FIELDS.has(field) && typeof value !== "string") continue;
      if (typeof value !== "string") continue;
      const trimmed = value.trim();
      if (trimmed) {
        nextCorrections[field] = trimmed;
      } else {
        delete nextCorrections[field];
      }
    }

    update.user_corrections = nextCorrections;
    update.user_confirmed = true;
  }

  const { data: updated, error: updateError } = await auth.supabase
    .from("document_facts")
    .update(update)
    .eq("id", existing.id)
    .select(FACTS_COLUMNS)
    .single();

  if (updateError || !updated) {
    return jsonError(updateError?.message ?? "Kunne ikke lagre bekreftelsen/korreksjonen.", 500);
  }

  return jsonOk({ facts: mapDocumentFactsRow(updated as DocumentFactsRow) });
}
