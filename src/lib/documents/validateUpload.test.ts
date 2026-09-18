import { describe, expect, it } from "vitest";
import {
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  validateUploadedFile,
} from "./validateUpload";

describe("validateUploadedFile", () => {
  it("godtar en gyldig PDF innenfor grensen", () => {
    const result = validateUploadedFile({
      size: 1024,
      type: "application/pdf",
      name: "dokument.pdf",
    });

    expect(result.ok).toBe(true);
  });

  it("avviser tomme filer", () => {
    const result = validateUploadedFile({
      size: 0,
      type: "application/pdf",
      name: "tom.pdf",
    });

    expect(result.ok).toBe(false);
  });

  it("avviser filer over størrelsesgrensen", () => {
    const result = validateUploadedFile({
      size: MAX_DOCUMENT_FILE_SIZE_BYTES + 1,
      type: "application/pdf",
      name: "stor.pdf",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/for stor/i);
  });

  it("avviser filtyper som ikke er på allow-listen (kan ikke omgås ved å endre filnavn)", () => {
    const result = validateUploadedFile({
      size: 1024,
      type: "application/x-msdownload",
      name: "harmlos.pdf",
    });

    expect(result.ok).toBe(false);
  });

  it("avviser fil uten filnavn", () => {
    const result = validateUploadedFile({
      size: 1024,
      type: "application/pdf",
      name: "",
    });

    expect(result.ok).toBe(false);
  });
});
