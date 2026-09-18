import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { mapWitnessAccountRow, type WitnessAccountRow } from "@/lib/evidence/mappers";
import type { ObservationType } from "@/lib/evidence/types";

type RouteContext = {
  params: Promise<{ id: string; witnessId: string; accountId: string }>;
};

const ACCOUNT_SELECT =
  "id,witness_id,case_id,user_id,description,observation_type,event_id,created_at,updated_at,deleted_at";

const OBSERVATION_TYPES = new Set<ObservationType>(["direct", "secondhand"]);

type PatchBody =
  | { action: "update"; description?: string; observationType?: ObservationType; eventId?: string | null }
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

  const { id: caseId, accountId } = await context.params;
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
    if (body.description !== undefined) {
      const description = body.description.trim();
      if (!description) return jsonError("Beskrivelsen kan ikke være tom.", 400);
      update.description = description;
    }
    if (body.observationType !== undefined) {
      if (!OBSERVATION_TYPES.has(body.observationType)) return jsonError("Ugyldig observasjonstype.", 400);
      update.observation_type = body.observationType;
    }
    if (body.eventId !== undefined) {
      if (body.eventId) {
        const { data: event, error: eventError } = await auth.supabase
          .from("events")
          .select("id,case_id")
          .eq("id", body.eventId)
          .maybeSingle();

        if (eventError) return jsonError(eventError.message, 500);
        if (!event) return jsonError("Fant ikke hendelsen.", 404);
        if (event.case_id !== caseId) return jsonError("Hendelsen hører ikke til denne saken.", 400);
      }
      update.event_id = body.eventId;
    }

    if (Object.keys(update).length === 0) {
      return jsonError("Ingen endringer angitt.", 400);
    }
  }

  const { data: updated, error } = await auth.supabase
    .from("witness_accounts")
    .update(update)
    .eq("id", accountId)
    .select(ACCOUNT_SELECT)
    .single();

  if (error) return jsonError(error.message, 500);
  if (!updated) return jsonError("Fant ikke vitneopplysningen.", 404);

  return jsonOk({ account: mapWitnessAccountRow(updated as WitnessAccountRow) });
}
