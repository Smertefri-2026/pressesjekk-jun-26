import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { mapWitnessAccountDocumentLinkRow, type WitnessAccountDocumentLinkRow } from "@/lib/evidence/mappers";
import { ensureDocumentFacts } from "@/lib/evidence/ensureDocumentFacts";

type RouteContext = {
  params: Promise<{ id: string; witnessId: string; accountId: string }>;
};

/**
 * Kobler et dokument som en FAKTISK SKRIFTLIG ERKLÆRING til en
 * vitneopplysning. Tilstedeværelse av denne koblingen er selve
 * definisjonen på at vitnet har avgitt en faktisk erklæring, ikke bare
 * "brukeren sier vitnet kan bekrefte noe" - se rapport.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId, accountId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { documentId?: unknown };
  const documentId = typeof body.documentId === "string" ? body.documentId : "";

  if (!documentId) return jsonError("documentId mangler.", 400);

  const [accountResult, documentResult] = await Promise.all([
    auth.supabase.from("witness_accounts").select("id,case_id").eq("id", accountId).maybeSingle(),
    auth.supabase.from("case_documents").select("id,case_id").eq("id", documentId).maybeSingle(),
  ]);

  if (accountResult.error) return jsonError(accountResult.error.message, 500);
  if (!accountResult.data) return jsonError("Fant ikke vitneopplysningen.", 404);
  if (accountResult.data.case_id !== caseId) return jsonError("Vitneopplysningen hører ikke til denne saken.", 400);

  if (documentResult.error) return jsonError(documentResult.error.message, 500);
  if (!documentResult.data) return jsonError("Fant ikke dokumentet.", 404);
  if (documentResult.data.case_id !== caseId) return jsonError("Dokumentet hører ikke til denne saken.", 400);

  const { data: link, error: insertError } = await auth.supabase
    .from("witness_account_document_links")
    .insert({ witness_account_id: accountId, document_id: documentId, linked_by: auth.user.id })
    .select("id,witness_account_id,document_id,linked_by,created_at")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return jsonError("Dette dokumentet er allerede koblet til denne vitneopplysningen.", 409);
    }
    return jsonError(insertError.message, 500);
  }

  await ensureDocumentFacts(auth.supabase, { documentId, caseId, userId: auth.user.id });

  return jsonOk({ link: mapWitnessAccountDocumentLinkRow(link as WitnessAccountDocumentLinkRow) });
}
