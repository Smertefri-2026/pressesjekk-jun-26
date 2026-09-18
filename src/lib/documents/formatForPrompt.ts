import { wrapUntrustedContent } from "@/lib/ai/openai";

type DocumentForPrompt = {
  title?: string | null;
  document_type?: string | null;
  file_name?: string | null;
  created_at?: string | null;
  extracted_text?: string | null;
};

/**
 * Formaterer opplastede dokumenter for AI-prompt med tydelig skille mellom
 * metadata (trygt, strukturert av oss) og uthentet PDF-tekst (ubetrodd,
 * skrevet av hvem som helst som lastet opp filen). Brukes av
 * generate-police-report-draft og generate-investigation-draft, som er de
 * to rutene som henter extracted_text.
 */
export function formatDocumentsForPrompt(
  documents: DocumentForPrompt[] | null | undefined
) {
  if (!documents || documents.length === 0) {
    return "Ingen dokumenter er registrert.";
  }

  return documents
    .map((document, index) => {
      const meta = `Vedlegg ${index + 1}: ${
        document.title || document.file_name || "Dokument"
      } (type: ${document.document_type || "ukjent"}, lastet opp: ${
        document.created_at || "ukjent dato"
      })`;

      const text = document.extracted_text?.trim();

      if (!text) {
        return `${meta}\nIngen uthentet tekst tilgjengelig for dette vedlegget.`;
      }

      return `${meta}\n${wrapUntrustedContent("Uthentet tekst fra vedlegget", text)}`;
    })
    .join("\n\n");
}
