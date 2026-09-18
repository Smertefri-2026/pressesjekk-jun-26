import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";

type RouteContext = {
  params: Promise<{ id: string; documentId: string }>;
};

const DOCUMENT_SELECT =
  "id,case_id,title,document_type,description,file_name,file_path,file_size,mime_type,created_at,deleted_at,extraction_status,extraction_error,extracted_at,page_count,user_intent_note";

type PatchAction = "trash" | "restore" | "update_intent";

function isPatchAction(value: unknown): value is PatchAction {
  return value === "trash" || value === "restore" || value === "update_intent";
}

/**
 * Myk sletting / gjenoppretting / oppdatering av brukerens intensjonsnotat.
 * Permanent sletting er en egen DELETE.
 *
 * "update_intent" (fase 5): brukerens egen hensikt/hypotese med dette
 * dokumentet ("hva ønsker du at vi særlig skal se etter") - ALDRI et
 * faktum, kun lagret som fritekst atskilt fra KI-ekstraherte document_facts.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId, documentId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { action?: unknown; userIntentNote?: unknown };

  if (!isPatchAction(body.action)) {
    return jsonError('action må være "trash", "restore" eller "update_intent".', 400);
  }

  const update =
    body.action === "update_intent"
      ? { user_intent_note: typeof body.userIntentNote === "string" && body.userIntentNote.trim() ? body.userIntentNote.trim() : null }
      : { deleted_at: body.action === "trash" ? new Date().toISOString() : null };

  // maybeSingle (ikke single): en kryssbruker-oppdatering matcher null rader
  // pga. RLS, og PostgREST sitt single() kaster da PGRST116 ("Cannot coerce
  // the result to a single JSON object") - som endte opp i en uklar 500 i
  // stedet for et rent 404. maybeSingle gir i stedet data: null ved treff-
  // null, slik at 404-grenen under faktisk nås (samme mønster som DELETE
  // under, som allerede gjorde dette riktig).
  const { data: updated, error } = await auth.supabase
    .from("case_documents")
    .update(update)
    .eq("id", documentId)
    .eq("case_id", caseId)
    .select(DOCUMENT_SELECT)
    .maybeSingle();

  if (error) return jsonError(error.message, 500);
  if (!updated) return jsonError("Fant ikke dokumentet i denne saken.", 404);

  return jsonOk({ document: updated });
}

/** Permanent sletting - fjerner filen fra Storage og raden fra databasen. */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId, documentId } = await context.params;

  const { data: document, error: fetchError } = await auth.supabase
    .from("case_documents")
    .select("id,file_path,deleted_at")
    .eq("id", documentId)
    .eq("case_id", caseId)
    .maybeSingle();

  if (fetchError) return jsonError(fetchError.message, 500);
  if (!document) return jsonError("Fant ikke dokumentet i denne saken.", 404);

  if (!document.deleted_at) {
    return jsonError(
      "Dokumentet må flyttes til papirkurv før det kan slettes permanent.",
      400
    );
  }

  const { error: storageError } = await auth.supabase.storage
    .from("case-documents")
    .remove([document.file_path]);

  if (storageError) {
    return jsonError(`Kunne ikke slette filen permanent: ${storageError.message}`, 500);
  }

  const { error: deleteError } = await auth.supabase
    .from("case_documents")
    .delete()
    .eq("id", documentId);

  if (deleteError) {
    return jsonError(
      `Filen ble slettet, men dokumentraden kunne ikke slettes: ${deleteError.message}`,
      500
    );
  }

  return jsonOk({ ok: true });
}
