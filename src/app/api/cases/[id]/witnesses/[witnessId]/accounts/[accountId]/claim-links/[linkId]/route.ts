import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";

type RouteContext = {
  params: Promise<{ id: string; witnessId: string; accountId: string; linkId: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { accountId, linkId } = await context.params;

  const { error, count } = await auth.supabase
    .from("witness_account_claim_links")
    .delete({ count: "exact" })
    .eq("id", linkId)
    .eq("witness_account_id", accountId);

  if (error) return jsonError(error.message, 500);
  if (!count) return jsonError("Fant ikke koblingen.", 404);

  return jsonOk({ ok: true });
}
