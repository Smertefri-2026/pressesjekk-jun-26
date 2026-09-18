import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { mapWitnessAccountClaimLinkRow, type WitnessAccountClaimLinkRow } from "@/lib/evidence/mappers";

type RouteContext = {
  params: Promise<{ id: string; witnessId: string; accountId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId, accountId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { claimId?: unknown };
  const claimId = typeof body.claimId === "string" ? body.claimId : "";

  if (!claimId) return jsonError("claimId mangler.", 400);

  const [accountResult, claimResult] = await Promise.all([
    auth.supabase.from("witness_accounts").select("id,case_id").eq("id", accountId).maybeSingle(),
    auth.supabase.from("claims").select("id,case_id").eq("id", claimId).maybeSingle(),
  ]);

  if (accountResult.error) return jsonError(accountResult.error.message, 500);
  if (!accountResult.data) return jsonError("Fant ikke vitneopplysningen.", 404);
  if (accountResult.data.case_id !== caseId) return jsonError("Vitneopplysningen hører ikke til denne saken.", 400);

  if (claimResult.error) return jsonError(claimResult.error.message, 500);
  if (!claimResult.data) return jsonError("Fant ikke opplysningen.", 404);
  if (claimResult.data.case_id !== caseId) return jsonError("Opplysningen hører ikke til denne saken.", 400);

  const { data: link, error: insertError } = await auth.supabase
    .from("witness_account_claim_links")
    .insert({ witness_account_id: accountId, claim_id: claimId, linked_by: auth.user.id })
    .select("id,witness_account_id,claim_id,linked_by,created_at")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return jsonError("Denne vitneopplysningen er allerede koblet til denne påstanden.", 409);
    }
    return jsonError(insertError.message, 500);
  }

  return jsonOk({ link: mapWitnessAccountClaimLinkRow(link as WitnessAccountClaimLinkRow) });
}
