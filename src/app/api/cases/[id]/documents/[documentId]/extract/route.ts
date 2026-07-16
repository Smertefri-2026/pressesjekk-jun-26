import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractDocumentText } from "@/lib/documents/extractDocumentText";

type RouteContext = {
  params: Promise<{
    id: string;
    documentId: string;
  }>;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: caseId, documentId } = await context.params;

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return jsonError("Du må være innlogget.", 401);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonError("Supabase-miljøvariabler mangler.", 500);
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
    auth: {
      persistSession: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonError("Kunne ikke bekrefte bruker.", 401);
  }

  const { data: document, error: documentError } = await supabase
    .from("case_documents")
    .select(
      "id,case_id,user_id,file_name,file_path,mime_type,deleted_at,extraction_status"
    )
    .eq("id", documentId)
    .eq("case_id", caseId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (documentError) {
    return jsonError(
      `Kunne ikke hente dokumentet: ${documentError.message}`,
      500
    );
  }

  if (!document) {
    return jsonError("Fant ikke dokumentet i denne saken.", 404);
  }

  const { error: processingError } = await supabase
    .from("case_documents")
    .update({
      extraction_status: "processing",
      extraction_error: null,
    })
    .eq("id", document.id)
    .eq("user_id", user.id);

  if (processingError) {
    return jsonError(
      `Kunne ikke starte tekstuthenting: ${processingError.message}`,
      500
    );
  }

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("case-documents")
    .download(document.file_path);

  if (downloadError || !fileData) {
    const errorMessage =
      downloadError?.message ?? "Filen kunne ikke lastes ned.";

    await supabase
      .from("case_documents")
      .update({
        extraction_status: "failed",
        extraction_error: errorMessage,
        extracted_text: null,
        extracted_at: new Date().toISOString(),
        page_count: null,
      })
      .eq("id", document.id)
      .eq("user_id", user.id);

    return jsonError(`Kunne ikke laste ned dokumentet: ${errorMessage}`, 500);
  }

  const bytes = await fileData.arrayBuffer();

  const extraction = await extractDocumentText({
    bytes,
    mimeType: document.mime_type,
    fileName: document.file_name,
  });

  const extractedAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("case_documents")
    .update({
      extracted_text: extraction.text,
      extraction_status: extraction.status,
      extraction_error: extraction.error,
      extracted_at: extractedAt,
      page_count: extraction.pageCount,
    })
    .eq("id", document.id)
    .eq("user_id", user.id);

  if (updateError) {
    return jsonError(
      `Teksten ble behandlet, men resultatet kunne ikke lagres: ${updateError.message}`,
      500
    );
  }

  return NextResponse.json({
    document: {
      id: document.id,
      extractionStatus: extraction.status,
      extractionError: extraction.error,
      pageCount: extraction.pageCount,
      extractedCharacters: extraction.text?.length ?? 0,
      extractedAt,
    },
  });
}
