import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { mapEvidenceLinkRow, type ClaimEvidenceLinkRow } from "@/lib/evidence/mappers";
import { ensureDocumentFacts } from "@/lib/evidence/ensureDocumentFacts";

type RouteContext = {
  params: Promise<{ id: string; claimId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId, claimId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { documentId?: unknown };
  const documentId = typeof body.documentId === "string" ? body.documentId : "";

  if (!documentId) return jsonError("documentId mangler.", 400);

  // Bekreft at både påstanden og dokumentet faktisk tilhører DENNE saken.
  // RLS bekrefter eierskap, men ikke at de to hører til samme sak - uten
  // denne sjekken kunne en bruker i teorien koble et dokument fra én av
  // sine saker til en påstand i en annen.
  const [claimResult, documentResult] = await Promise.all([
    auth.supabase.from("claims").select("id,case_id").eq("id", claimId).maybeSingle(),
    auth.supabase.from("case_documents").select("id,case_id").eq("id", documentId).maybeSingle(),
  ]);

  if (claimResult.error) return jsonError(claimResult.error.message, 500);
  if (!claimResult.data) return jsonError("Fant ikke opplysningen.", 404);
  if (claimResult.data.case_id !== caseId) {
    return jsonError("Opplysningen hører ikke til denne saken.", 400);
  }

  if (documentResult.error) return jsonError(documentResult.error.message, 500);
  if (!documentResult.data) return jsonError("Fant ikke dokumentet.", 404);
  if (documentResult.data.case_id !== caseId) {
    return jsonError("Dokumentet hører ikke til denne saken.", 400);
  }

  const { data: link, error: insertError } = await auth.supabase
    .from("claim_evidence_links")
    .insert({ claim_id: claimId, document_id: documentId, linked_by: auth.user.id })
    .select("id,claim_id,document_id,linked_by,created_at")
    .single();

  if (insertError) {
    // unique(claim_id, document_id) - vennlig feilmelding ved dobbelkobling.
    if (insertError.code === "23505") {
      return jsonError("Dette dokumentet er allerede koblet til denne opplysningen.", 409);
    }
    return jsonError(insertError.message, 500);
  }

  // Fase 2A, rent additivt: dokumentet er nå i bruk i resonnement (koblet
  // til en påstand) - sørg for at fakta er hentet ut. Feiler dette, skal
  // ikke selve koblingen mislykkes - se ensureDocumentFacts.
  await ensureDocumentFacts(auth.supabase, { documentId, caseId, userId: auth.user.id });

  return jsonOk({ link: mapEvidenceLinkRow(link as ClaimEvidenceLinkRow) });
}
