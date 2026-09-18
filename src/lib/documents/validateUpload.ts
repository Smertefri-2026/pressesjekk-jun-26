// Speiler bucket-konfigurasjonen for `case-documents` i
// supabase/pfu-decisions-and-storage.sql. Holdes i sync manuelt - hvis
// bucket-grensene endres i Supabase, oppdater denne også.
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
] as const;

export const MAX_DOCUMENT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export type UploadValidationResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * App-lags validering av opplastede filer. Storage-bucketen håndhever også
 * størrelse/mimetype (defense in depth), men denne kjører FØR vi i det hele
 * tatt kontakter Storage, slik at brukeren får en tydelig norsk feilmelding
 * med en gang - og slik at vi ikke stoler utelukkende på klientens egen
 * (trivielt omgåtte) input-validering.
 */
export function validateUploadedFile(file: {
  size: number;
  type: string;
  name: string;
}): UploadValidationResult {
  if (!file.name || file.name.trim().length === 0) {
    return { ok: false, error: "Filen mangler filnavn." };
  }

  if (file.size <= 0) {
    return { ok: false, error: "Filen er tom." };
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `Filen er for stor. Maks filstørrelse er ${
        MAX_DOCUMENT_FILE_SIZE_BYTES / (1024 * 1024)
      } MB.`,
    };
  }

  if (
    !ALLOWED_DOCUMENT_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number]
    )
  ) {
    return {
      ok: false,
      error: `Filtypen "${
        file.type || "ukjent"
      }" støttes ikke. Tillatte typer: PDF, JPG, PNG, WEBP, TXT.`,
    };
  }

  return { ok: true };
}

export function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}
