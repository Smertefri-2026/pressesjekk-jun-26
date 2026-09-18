import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { ensureDocumentFacts } from "@/lib/evidence/ensureDocumentFacts";
import { mapEventDocumentLinkRow, type EventDocumentLinkRow } from "@/lib/evidence/mappers";

type RouteContext = {
  params: Promise<{ id: string; eventId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId, eventId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { documentId?: unknown };
  const documentId = typeof body.documentId === "string" ? body.documentId : "";

  if (!documentId) return jsonError("documentId mangler.", 400);

  const [eventResult, documentResult] = await Promise.all([
    auth.supabase.from("events").select("id,case_id").eq("id", eventId).maybeSingle(),
    auth.supabase.from("case_documents").select("id,case_id").eq("id", documentId).maybeSingle(),
  ]);

  if (eventResult.error) return jsonError(eventResult.error.message, 500);
  if (!eventResult.data) return jsonError("Fant ikke hendelsen.", 404);
  if (eventResult.data.case_id !== caseId) return jsonError("Hendelsen hører ikke til denne saken.", 400);

  if (documentResult.error) return jsonError(documentResult.error.message, 500);
  if (!documentResult.data) return jsonError("Fant ikke dokumentet.", 404);
  if (documentResult.data.case_id !== caseId) return jsonError("Dokumentet hører ikke til denne saken.", 400);

  const { data: link, error: insertError } = await auth.supabase
    .from("event_document_links")
    .insert({ event_id: eventId, document_id: documentId, linked_by: auth.user.id })
    .select("id,event_id,document_id,linked_by,created_at")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return jsonError("Dette dokumentet er allerede koblet til hendelsen.", 409);
    }
    return jsonError(insertError.message, 500);
  }

  // Dokumentet brukes nå i resonnement (koblet til en hendelse) - sørg for
  // at fakta er hentet ut, hvis det ikke allerede er gjort. Feiler dette,
  // skal ikke selve koblingen mislykkes - se ensureDocumentFacts.
  await ensureDocumentFacts(auth.supabase, { documentId, caseId, userId: auth.user.id });

  return jsonOk({ link: mapEventDocumentLinkRow(link as EventDocumentLinkRow) });
}
