import { extractText } from "unpdf";

const MAX_EXTRACTED_CHARACTERS = 120_000;

export type DocumentExtractionResult =
  | {
      status: "completed";
      text: string;
      pageCount: number | null;
      error: null;
    }
  | {
      status: "failed" | "unsupported";
      text: null;
      pageCount: number | null;
      error: string;
    };

function normalizeExtractedText(value: string) {
  return value
    .normalize("NFC")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractDocumentText(params: {
  bytes: ArrayBuffer;
  mimeType: string | null;
  fileName: string;
}): Promise<DocumentExtractionResult> {
  const mimeType = params.mimeType?.toLowerCase() ?? "";
  const fileName = params.fileName.toLowerCase();

  const isPdf =
    mimeType === "application/pdf" ||
    fileName.endsWith(".pdf");

  if (!isPdf) {
    return {
      status: "unsupported",
      text: null,
      pageCount: null,
      error: "Dokumenttypen støttes ikke for tekstuthenting ennå.",
    };
  }

  try {
    const result = await extractText(new Uint8Array(params.bytes), {
      mergePages: false,
    });

    const pages = Array.isArray(result.text)
      ? result.text
      : [String(result.text ?? "")];

    const normalizedText = normalizeExtractedText(
      pages
        .map((page, index) => `--- Side ${index + 1} ---\n${page}`)
        .join("\n\n")
    );

    const meaningfulCharacters = normalizedText
      .replace(/--- Side \d+ ---/g, "")
      .replace(/\s/g, "")
      .length;

    const minimumExpectedCharacters = Math.max(100, pages.length * 75);

    if (
      !normalizedText ||
      meaningfulCharacters < minimumExpectedCharacters
    ) {
      return {
        status: "failed",
        text: null,
        pageCount: pages.length || null,
        error:
          "PDF-en inneholder for lite maskinlesbar tekst og ser ut til å være skannet som bilder. Last opp en tekstbasert PDF eller legg inn innholdet manuelt.",
      };
    }

    const limitedText =
      normalizedText.length > MAX_EXTRACTED_CHARACTERS
        ? `${normalizedText.slice(0, MAX_EXTRACTED_CHARACTERS)}\n\n[TEKST AVKORTET]`
        : normalizedText;

    return {
      status: "completed",
      text: limitedText,
      pageCount: pages.length || null,
      error: null,
    };
  } catch (error) {
    return {
      status: "failed",
      text: null,
      pageCount: null,
      error:
        error instanceof Error
          ? error.message
          : "Ukjent feil ved uthenting av PDF-tekst.",
    };
  }
}
