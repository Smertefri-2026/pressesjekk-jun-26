import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { assertOwnsCase } from "@/lib/access/assertOwnsCase";
import {
  mapEventClaimLinkRow,
  mapEventDocumentLinkRow,
  mapEventRow,
  type EventClaimLinkRow,
  type EventDocumentLinkRow,
  type EventRow,
} from "@/lib/evidence/mappers";
import type { DatePrecision } from "@/lib/evidence/types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const EVENT_SELECT =
  "id,case_id,user_id,title,description,event_date,event_time,date_precision,approximate_label,source_type,created_at,updated_at,deleted_at";

const DATE_PRECISIONS = new Set<DatePrecision>(["exact", "date_only", "approximate", "unknown"]);

type EventClaimLinkWithClaim = EventClaimLinkRow & {
  claims: { id: string; text: string } | { id: string; text: string }[] | null;
};

type EventDocumentLinkWithDocument = EventDocumentLinkRow & {
  case_documents: { id: string; title: string } | { id: string; title: string }[] | null;
};

function first<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId } = await context.params;

  const caseCheck = await assertOwnsCase(auth.supabase, caseId);
  if (!caseCheck.ok) return jsonError(caseCheck.error, 404);

  const { data: eventRows, error: eventsError } = await auth.supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("case_id", caseId)
    .is("deleted_at", null)
    .order("event_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  if (eventsError) return jsonError(eventsError.message, 500);

  const events = (eventRows ?? []) as EventRow[];
  const eventIds = events.map((event) => event.id);

  if (eventIds.length === 0) {
    return jsonOk({ events: [] });
  }

  const [claimLinksResult, documentLinksResult] = await Promise.all([
    auth.supabase
      .from("event_claim_links")
      .select("id,event_id,claim_id,linked_by,created_at,claims(id,text)")
      .in("event_id", eventIds),
    auth.supabase
      .from("event_document_links")
      .select("id,event_id,document_id,linked_by,created_at,case_documents(id,title)")
      .in("event_id", eventIds),
  ]);

  if (claimLinksResult.error) return jsonError(claimLinksResult.error.message, 500);
  if (documentLinksResult.error) return jsonError(documentLinksResult.error.message, 500);

  const claimLinksByEventId = new Map<string, EventClaimLinkWithClaim[]>();
  for (const row of (claimLinksResult.data ?? []) as EventClaimLinkWithClaim[]) {
    const list = claimLinksByEventId.get(row.event_id) ?? [];
    list.push(row);
    claimLinksByEventId.set(row.event_id, list);
  }

  const documentLinksByEventId = new Map<string, EventDocumentLinkWithDocument[]>();
  for (const row of (documentLinksResult.data ?? []) as EventDocumentLinkWithDocument[]) {
    const list = documentLinksByEventId.get(row.event_id) ?? [];
    list.push(row);
    documentLinksByEventId.set(row.event_id, list);
  }

  const result = events.map((eventRow) => {
    const claimLinks = claimLinksByEventId.get(eventRow.id) ?? [];
    const documentLinks = documentLinksByEventId.get(eventRow.id) ?? [];

    return {
      ...mapEventRow(eventRow),
      claims: claimLinks.map((link) => {
        const claim = first(link.claims);
        return { ...mapEventClaimLinkRow(link), claim };
      }),
      documents: documentLinks.map((link) => {
        const document = first(link.case_documents);
        return { ...mapEventDocumentLinkRow(link), document };
      }),
    };
  });

  return jsonOk({ events: result });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId } = await context.params;

  const caseCheck = await assertOwnsCase(auth.supabase, caseId);
  if (!caseCheck.ok) return jsonError(caseCheck.error, 404);

  const body = (await request.json().catch(() => ({}))) as {
    title?: unknown;
    description?: unknown;
    eventDate?: unknown;
    eventTime?: unknown;
    datePrecision?: unknown;
    approximateLabel?: unknown;
  };

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return jsonError("Hendelsen må ha en kort tittel.", 400);
  if (title.length > 300) return jsonError("Tittelen er for lang (maks 300 tegn).", 400);

  const description =
    typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;

  const datePrecision: DatePrecision =
    typeof body.datePrecision === "string" && DATE_PRECISIONS.has(body.datePrecision as DatePrecision)
      ? (body.datePrecision as DatePrecision)
      : "date_only";

  const eventDate = typeof body.eventDate === "string" && body.eventDate.trim() ? body.eventDate : null;
  const eventTime = typeof body.eventTime === "string" && body.eventTime.trim() ? body.eventTime : null;
  const approximateLabel =
    typeof body.approximateLabel === "string" && body.approximateLabel.trim()
      ? body.approximateLabel.trim()
      : null;

  if ((datePrecision === "exact" || datePrecision === "date_only") && !eventDate) {
    return jsonError('Velg en dato, eller sett presisjon til "approximate"/"unknown".', 400);
  }

  const { data: inserted, error: insertError } = await auth.supabase
    .from("events")
    .insert({
      case_id: caseId,
      user_id: auth.user.id,
      title,
      description,
      event_date: eventDate,
      event_time: datePrecision === "exact" ? eventTime : null,
      date_precision: datePrecision,
      approximate_label: approximateLabel,
      source_type: "user",
    })
    .select(EVENT_SELECT)
    .single();

  if (insertError || !inserted) {
    return jsonError(insertError?.message ?? "Kunne ikke lagre hendelsen.", 500);
  }

  return jsonOk({ event: { ...mapEventRow(inserted as EventRow), claims: [], documents: [] } });
}
