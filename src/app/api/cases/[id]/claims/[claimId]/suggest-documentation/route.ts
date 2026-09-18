import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { checkRateLimit } from "@/lib/rateLimit";
import { callAiJson, DOCUMENTATION_SUGGESTIONS_INSTRUCTIONS } from "@/lib/ai/openai";
import { buildSuggestionsPrompt } from "@/lib/evidence/buildSuggestionsPrompt";
import { validateSuggestionsPayload } from "@/lib/evidence/suggestionsValidation";
import { mapSuggestionRow, type ClaimDocumentationSuggestionRow } from "@/lib/evidence/mappers";

type RouteContext = {
  params: Promise<{ id: string; claimId: string }>;
};

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const SUGGESTION_COLUMNS = "id,claim_id,suggestions,model,created_at";

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId, claimId } = await context.params;

  const rateLimit = checkRateLimit(`evidence-suggest:${auth.user.id}`, {
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (!rateLimit.allowed) {
    return jsonError("For mange forespørsler på kort tid. Vent litt og prøv igjen.", 429);
  }

  const { data: claim, error: claimError } = await auth.supabase
    .from("claims")
    .select("id,case_id,text,no_evidence_confirmed_at")
    .eq("id", claimId)
    .maybeSingle();

  if (claimError) return jsonError(claimError.message, 500);
  if (!claim) return jsonError("Fant ikke opplysningen.", 404);
  if (claim.case_id !== caseId) return jsonError("Opplysningen hører ikke til denne saken.", 400);

  const { data: linkedDocs } = await auth.supabase
    .from("claim_evidence_links")
    .select("case_documents(title)")
    .eq("claim_id", claimId);

  type LinkedDocRow = { case_documents: { title: string } | { title: string }[] | null };
  const titles = ((linkedDocs ?? []) as LinkedDocRow[])
    .map((row) => (Array.isArray(row.case_documents) ? row.case_documents[0] : row.case_documents))
    .filter((doc): doc is { title: string } => Boolean(doc))
    .map((doc) => `- ${doc.title}`);

  const prompt = buildSuggestionsPrompt({
    claimText: claim.text,
    alreadyLinkedSummary: titles.length > 0 ? titles.join("\n") : undefined,
  });

  let suggestions;
  try {
    const raw = await callAiJson({ prompt, instructions: DOCUMENTATION_SUGGESTIONS_INSTRUCTIONS });
    suggestions = validateSuggestionsPayload(raw);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Kunne ikke hente forslag.", 502);
  }

  if (!suggestions) {
    return jsonError("KI-svaret hadde ikke forventet format og ble forkastet.", 502);
  }

  const { data: inserted, error: insertError } = await auth.supabase
    .from("claim_documentation_suggestions")
    .insert({
      claim_id: claimId,
      suggestions,
      model: "gpt-4.1-mini",
    })
    .select(SUGGESTION_COLUMNS)
    .single();

  if (insertError || !inserted) {
    return jsonError(insertError?.message ?? "Kunne ikke lagre forslagene.", 500);
  }

  return jsonOk({ suggestion: mapSuggestionRow(inserted as ClaimDocumentationSuggestionRow) });
}
