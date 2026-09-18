import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { mapEventRow, type EventRow } from "@/lib/evidence/mappers";
import type { DatePrecision } from "@/lib/evidence/types";

type RouteContext = {
  params: Promise<{ id: string; eventId: string }>;
};

const EVENT_SELECT =
  "id,case_id,user_id,title,description,event_date,event_time,date_precision,approximate_label,source_type,created_at,updated_at,deleted_at";

const DATE_PRECISIONS = new Set<DatePrecision>(["exact", "date_only", "approximate", "unknown"]);

type PatchBody =
  | {
      action: "update";
      title?: string;
      description?: string | null;
      eventDate?: string | null;
      eventTime?: string | null;
      datePrecision?: DatePrecision;
      approximateLabel?: string | null;
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

  const { eventId } = await context.params;
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
    if (body.title !== undefined) {
      const title = body.title.trim();
      if (!title) return jsonError("Tittelen kan ikke være tom.", 400);
      if (title.length > 300) return jsonError("Tittelen er for lang (maks 300 tegn).", 400);
      update.title = title;
    }

    if (body.description !== undefined) {
      update.description = body.description?.trim() || null;
    }

    if (body.datePrecision !== undefined) {
      if (!DATE_PRECISIONS.has(body.datePrecision)) {
        return jsonError("Ugyldig datopresisjon.", 400);
      }
      update.date_precision = body.datePrecision;
    }

    if (body.eventDate !== undefined) update.event_date = body.eventDate;
    if (body.eventTime !== undefined) update.event_time = body.eventTime;
    if (body.approximateLabel !== undefined) {
      update.approximate_label = body.approximateLabel?.trim() || null;
    }

    if (Object.keys(update).length === 0) {
      return jsonError("Ingen endringer angitt.", 400);
    }
  }

  const { data: updated, error } = await auth.supabase
    .from("events")
    .update(update)
    .eq("id", eventId)
    .select(EVENT_SELECT)
    .single();

  if (error) return jsonError(error.message, 500);
  if (!updated) return jsonError("Fant ikke hendelsen i denne saken.", 404);

  return jsonOk({ event: mapEventRow(updated as EventRow) });
}
