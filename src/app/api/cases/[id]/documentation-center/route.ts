import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { assertOwnsCase } from "@/lib/access/assertOwnsCase";
import { mapDocumentFactsRow, type DocumentFactsRow } from "@/lib/evidence/mappers";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const DOCUMENT_SELECT =
  "id,case_id,title,document_type,description,file_name,file_size,mime_type,created_at,extraction_status,extraction_error,extracted_at,page_count,user_intent_note";

const DOCUMENT_FACTS_COLUMNS =
  "id,document_id,case_id,extraction_status,extraction_error,document_kind,summary,occurred_at_date,occurred_at_time,date_confidence,date_note,structured_facts,source_characteristics,source_characteristics_note,likely_event_description,model,extracted_at,created_at,user_confirmed,user_corrections";

type DocumentRow = {
  id: string;
  case_id: string;
  title: string;
  document_type: string;
  description: string | null;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  extraction_status: string;
  extraction_error: string | null;
  extracted_at: string | null;
  page_count: number | null;
  user_intent_note: string | null;
};

function first<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * Saksbred, enriket dokumentliste til Dokumentasjonssenteret - kobler inn
 * dokumentfakta, koblede påstander og koblede hendelser i ett kall, uten å
 * røre den delte /documents-ruten som andre paneler (opplastingsplukkere)
 * allerede er avhengige av med sin enklere respons-form.
 *
 * Resten av senteret (oversikt-tall, påstander, tidslinje, vitner, hull)
 * gjenbruker eksisterende ruter (/claims, /events, /witnesses,
 * /documentation-gaps) client-side, samme mønster som DocumentationSummary
 * allerede bruker - ingen duplisert kjernelogikk.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId } = await context.params;

  const caseCheck = await assertOwnsCase(auth.supabase, caseId);
  if (!caseCheck.ok) return jsonError(caseCheck.error, 404);

  const { data: documentRows, error: documentsError } = await auth.supabase
    .from("case_documents")
    .select(DOCUMENT_SELECT)
    .eq("case_id", caseId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (documentsError) return jsonError(documentsError.message, 500);

  const documents = (documentRows ?? []) as DocumentRow[];
  const documentIds = documents.map((doc) => doc.id);

  if (documentIds.length === 0) {
    return jsonOk({ documents: [] });
  }

  const [factsResult, claimLinksResult, eventLinksResult] = await Promise.all([
    auth.supabase.from("document_facts").select(DOCUMENT_FACTS_COLUMNS).in("document_id", documentIds),
    auth.supabase
      .from("claim_evidence_links")
      .select("id,document_id,claim_id,claims(id,text)")
      .in("document_id", documentIds),
    auth.supabase
      .from("event_document_links")
      .select("id,document_id,event_id,events(id,title,event_date,event_time,date_precision,approximate_label)")
      .in("document_id", documentIds),
  ]);

  if (factsResult.error) return jsonError(factsResult.error.message, 500);
  if (claimLinksResult.error) return jsonError(claimLinksResult.error.message, 500);
  if (eventLinksResult.error) return jsonError(eventLinksResult.error.message, 500);

  const factsByDocumentId = new Map(
    ((factsResult.data ?? []) as DocumentFactsRow[]).map((row) => [row.document_id, mapDocumentFactsRow(row)])
  );

  type ClaimLinkRow = { id: string; document_id: string; claim_id: string; claims: { id: string; text: string } | { id: string; text: string }[] | null };
  const claimLinksByDocumentId = new Map<string, { id: string; text: string }[]>();
  for (const row of (claimLinksResult.data ?? []) as ClaimLinkRow[]) {
    const claim = first(row.claims);
    if (!claim) continue;
    const list = claimLinksByDocumentId.get(row.document_id) ?? [];
    list.push(claim);
    claimLinksByDocumentId.set(row.document_id, list);
  }

  type EventLinkRow = {
    id: string;
    document_id: string;
    event_id: string;
    events:
      | { id: string; title: string; event_date: string | null; event_time: string | null; date_precision: string; approximate_label: string | null }
      | { id: string; title: string; event_date: string | null; event_time: string | null; date_precision: string; approximate_label: string | null }[]
      | null;
  };
  const eventLinksByDocumentId = new Map<
    string,
    { id: string; title: string; eventDate: string | null; eventTime: string | null; datePrecision: string; approximateLabel: string | null }[]
  >();
  for (const row of (eventLinksResult.data ?? []) as EventLinkRow[]) {
    const event = first(row.events);
    if (!event) continue;
    const list = eventLinksByDocumentId.get(row.document_id) ?? [];
    list.push({
      id: event.id,
      title: event.title,
      eventDate: event.event_date,
      eventTime: event.event_time,
      datePrecision: event.date_precision,
      approximateLabel: event.approximate_label,
    });
    eventLinksByDocumentId.set(row.document_id, list);
  }

  const result = documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    documentType: doc.document_type,
    description: doc.description,
    fileName: doc.file_name,
    fileSize: doc.file_size,
    mimeType: doc.mime_type,
    createdAt: doc.created_at,
    extractionStatus: doc.extraction_status,
    extractionError: doc.extraction_error,
    extractedAt: doc.extracted_at,
    pageCount: doc.page_count,
    userIntentNote: doc.user_intent_note,
    facts: factsByDocumentId.get(doc.id) ?? null,
    claims: claimLinksByDocumentId.get(doc.id) ?? [],
    events: eventLinksByDocumentId.get(doc.id) ?? [],
  }));

  return jsonOk({ documents: result });
}
