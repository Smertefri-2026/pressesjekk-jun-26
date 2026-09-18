import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/authServer";
import { assertOwnsCase } from "@/lib/access/assertOwnsCase";
import { extractDocumentText } from "@/lib/documents/extractDocumentText";
import {
  sanitizeFileName,
  validateUploadedFile,
} from "@/lib/documents/validateUpload";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const DOCUMENT_TYPES = [
  "article",
  "journalist_email",
  "reply_sent",
  "editor_response",
  "pfu_document",
  "legal_document",
  "other",
] as const;

type DocumentType = (typeof DOCUMENT_TYPES)[number];

function isDocumentType(value: string): value is DocumentType {
  return (DOCUMENT_TYPES as readonly string[]).includes(value);
}

const DOCUMENT_SELECT =
  "id,case_id,title,document_type,description,file_name,file_path,file_size,mime_type,created_at,deleted_at,extraction_status,extraction_error,extracted_at,page_count";

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId } = await context.params;
  const includeDeleted = request.nextUrl.searchParams.get("includeDeleted") === "true";

  const caseCheck = await assertOwnsCase(auth.supabase, caseId);
  if (!caseCheck.ok) return jsonError(caseCheck.error, 404);

  let query = auth.supabase
    .from("case_documents")
    .select(DOCUMENT_SELECT)
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  query = includeDeleted
    ? query.not("deleted_at", "is", null)
    : query.is("deleted_at", null);

  const { data, error } = await query;

  if (error) return jsonError(error.message, 500);

  return jsonOk({ documents: data ?? [] });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireUser(request);
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const { id: caseId } = await context.params;

  const caseCheck = await assertOwnsCase(auth.supabase, caseId);
  if (!caseCheck.ok) return jsonError(caseCheck.error, 404);

  const formData = await request.formData().catch(() => null);
  if (!formData) return jsonError("Ugyldig skjemadata.", 400);

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return jsonError("Fil mangler.", 400);
  }

  const validation = validateUploadedFile({
    size: file.size,
    type: file.type,
    name: file.name,
  });

  if (!validation.ok) {
    return jsonError(validation.error, 400);
  }

  const rawDocumentType = String(formData.get("documentType") ?? "other");
  const documentType = isDocumentType(rawDocumentType) ? rawDocumentType : "other";
  const title =
    String(formData.get("title") ?? "").trim() ||
    file.name.replace(/\.[^/.]+$/, "") ||
    "Dokument";
  const description = String(formData.get("description") ?? "").trim() || null;

  const cleanFileName = sanitizeFileName(file.name);
  const filePath = `${auth.user.id}/${caseId}/${Date.now()}-${cleanFileName}`;

  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await auth.supabase.storage
    .from("case-documents")
    .upload(filePath, bytes, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    return jsonError(`Opplasting feilet: ${uploadError.message}`, 500);
  }

  const { data: inserted, error: insertError } = await auth.supabase
    .from("case_documents")
    .insert({
      case_id: caseId,
      user_id: auth.user.id,
      title,
      document_type: documentType,
      description,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type || null,
    })
    .select(DOCUMENT_SELECT)
    .single();

  if (insertError || !inserted) {
    await auth.supabase.storage.from("case-documents").remove([filePath]);
    return jsonError(
      `Dokumentet ble lastet opp, men kunne ikke lagres i saken: ${
        insertError?.message ?? "ukjent feil"
      }`,
      500
    );
  }

  // Tekstuttrekk gjøres synkront her (samme steg som opplastingen) for PDF-er,
  // slik at panelet får ett samlet svar i stedet for et eget kall til
  // /extract etterpå. Feiler uthentingen, beholdes dokumentet - bare med
  // extraction_status="failed"/"unsupported".
  const extraction = await extractDocumentText({
    bytes,
    mimeType: file.type || null,
    fileName: file.name,
  });

  const extractedAt = new Date().toISOString();

  const { data: withExtraction } = await auth.supabase
    .from("case_documents")
    .update({
      extracted_text: extraction.text,
      extraction_status: extraction.status,
      extraction_error: extraction.error,
      extracted_at: extractedAt,
      page_count: extraction.pageCount,
    })
    .eq("id", inserted.id)
    .select(DOCUMENT_SELECT)
    .single();

  return jsonOk({ document: withExtraction ?? inserted });
}
