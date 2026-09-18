import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";

type RouteContext = {
  params: Promise<{ id: string; claimId: string; linkId: string }>;
};

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { claimId, linkId } = await context.params;

  const { error, count } = await auth.supabase
    .from("claim_evidence_links")
    .delete({ count: "exact" })
    .eq("id", linkId)
    .eq("claim_id", claimId);

  if (error) return jsonError(error.message, 500);
  if (!count) return jsonError("Fant ikke koblingen.", 404);

  return jsonOk({ ok: true });
}
