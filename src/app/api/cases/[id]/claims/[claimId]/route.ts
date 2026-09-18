import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { mapClaimRow, type ClaimRow } from "@/lib/evidence/mappers";

type RouteContext = {
  params: Promise<{ id: string; claimId: string }>;
};

const CLAIM_SELECT =
  "id,case_id,user_id,text,source_type,no_evidence_confirmed_at,created_at,updated_at,deleted_at";

type PatchBody =
  | { action: "update_text"; text: string }
  | { action: "trash" }
  | { action: "restore" }
  | { action: "confirm_no_evidence" }
  | { action: "unconfirm_no_evidence" };

function isPatchBody(value: unknown): value is PatchBody {
  if (!value || typeof value !== "object") return false;
  const action = (value as Record<string, unknown>).action;

  if (action === "update_text") {
    return typeof (value as Record<string, unknown>).text === "string";
  }

  return (
    action === "trash" ||
    action === "restore" ||
    action === "confirm_no_evidence" ||
    action === "unconfirm_no_evidence"
  );
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { claimId } = await context.params;
  const body = await request.json().catch(() => null);

  if (!isPatchBody(body)) {
    return jsonError(
      'action må være "update_text", "trash", "restore", "confirm_no_evidence" eller "unconfirm_no_evidence".',
      400
    );
  }

  const update: Record<string, string | null> = {};

  if (body.action === "update_text") {
    const text = body.text.trim();
    if (!text) return jsonError("Opplysningen kan ikke være tom.", 400);
    if (text.length > 4000) return jsonError("Opplysningen er for lang (maks 4000 tegn).", 400);
    update.text = text;
  } else if (body.action === "trash") {
    update.deleted_at = new Date().toISOString();
  } else if (body.action === "restore") {
    update.deleted_at = null;
  } else if (body.action === "confirm_no_evidence") {
    update.no_evidence_confirmed_at = new Date().toISOString();
  } else if (body.action === "unconfirm_no_evidence") {
    update.no_evidence_confirmed_at = null;
  }

  const { data: updated, error } = await auth.supabase
    .from("claims")
    .update(update)
    .eq("id", claimId)
    .select(CLAIM_SELECT)
    .single();

  if (error) return jsonError(error.message, 500);
  if (!updated) return jsonError("Fant ikke opplysningen i denne saken.", 404);

  return jsonOk({ claim: mapClaimRow(updated as ClaimRow) });
}
