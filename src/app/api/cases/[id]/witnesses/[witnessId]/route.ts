import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { mapWitnessRow, type WitnessRow } from "@/lib/evidence/mappers";
import type { WitnessIdentityStatus } from "@/lib/evidence/types";

type RouteContext = {
  params: Promise<{ id: string; witnessId: string }>;
};

const WITNESS_SELECT =
  "id,case_id,user_id,identity_status,name,contact_info,relationship_to_case,note,created_at,updated_at,deleted_at";

const IDENTITY_STATUSES = new Set<WitnessIdentityStatus>(["possible", "named", "anonymous"]);

type PatchBody =
  | {
      action: "update";
      identityStatus?: WitnessIdentityStatus;
      name?: string | null;
      contactInfo?: string | null;
      relationshipToCase?: string | null;
      note?: string | null;
    }
  | { action: "trash" }
  | { action: "restore" };

function isPatchBody(value: unknown): value is PatchBody {
  if (!value || typeof value !== "object") return false;
  const action = (value as Record<string, unknown>).action;
  return action === "update" || action === "trash" || action === "restore";
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { witnessId } = await context.params;
  const body = await request.json().catch(() => null);

  if (!isPatchBody(body)) {
    return jsonError('action må være "update", "trash" eller "restore".', 400);
  }

  const update: Record<string, string | null> = {};

  if (body.action === "trash") {
    update.deleted_at = new Date().toISOString();
  } else if (body.action === "restore") {
    update.deleted_at = null;
  } else {
    if (body.identityStatus !== undefined) {
      if (!IDENTITY_STATUSES.has(body.identityStatus)) return jsonError("Ugyldig identitetsstatus.", 400);
      update.identity_status = body.identityStatus;
    }
    if (body.name !== undefined) update.name = body.name?.trim() || null;
    if (body.contactInfo !== undefined) update.contact_info = body.contactInfo?.trim() || null;
    if (body.relationshipToCase !== undefined) {
      update.relationship_to_case = body.relationshipToCase?.trim() || null;
    }
    if (body.note !== undefined) update.note = body.note?.trim() || null;

    if (Object.keys(update).length === 0) {
      return jsonError("Ingen endringer angitt.", 400);
    }
  }

  const { data: updated, error } = await auth.supabase
    .from("witnesses")
    .update(update)
    .eq("id", witnessId)
    .select(WITNESS_SELECT)
    .single();

  if (error) return jsonError(error.message, 500);
  if (!updated) return jsonError("Fant ikke vitnet i denne saken.", 404);

  return jsonOk({ witness: mapWitnessRow(updated as WitnessRow) });
}
