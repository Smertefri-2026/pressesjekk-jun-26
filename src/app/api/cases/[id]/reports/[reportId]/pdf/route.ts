import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type RouteContext = {
  params: Promise<{
    id: string;
    reportId: string;
  }>;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function safeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Ukjent dato";

  try {
    return new Intl.DateTimeFormat("nb-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "Ukjent dato";
  }
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Ukjent dato";

  try {
    return new Intl.DateTimeFormat("nb-NO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "Ukjent dato";
  }
}

function formatFileDate(value: string | null | undefined) {
  if (!value) return "ukjent-dato";

  try {
    const date = new Date(value);
    const pad = (number: number) => String(number).padStart(2, "0");

    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      `${pad(date.getHours())}${pad(date.getMinutes())}`,
    ].join("-");
  } catch {
    return "ukjent-dato";
  }
}

function reportTypeLabel(
  type: string | null | undefined,
  version: number | null | undefined,
  createdAt?: string | null | undefined
) {
  if (type === "full_report") return `KI-rapport v${version ?? "1"}`;
  if (type === "pfu_draft") return `PFU-klage v${version ?? "1"}`;
  if (type === "police_draft") return `Politianmeldelse - ${formatDateTime(createdAt)}`;
  if (type === "investigation_draft") return `Utredning v${version ?? "1"}`;
  return `Regelbasert rapport v${version ?? "1"}`;
}

function wrapLine(text: string, maxCharacters: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (candidate.length > maxCharacters && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) lines.push(current);

  return lines.length > 0 ? lines : [""];
}

function buildInvestigationDraftText({
  caseItem,
  report,
  documents,
}: {
  caseItem: any;
  report: any;
  documents: any[];
}) {
  const documentLines =
    documents.length > 0
      ? documents
          .map((item, index) => {
            const number = String(index + 1).padStart(2, "0");
            const name = safeText(item.file_name || item.title || "Dokument");
            const category = safeText(item.category || "dokument");
            const date = formatDate(item.created_at);
            return `Vedlegg ${number}: ${name} (${category}) - ${date}`;
          })
          .join("\n")
      : "Ingen dokumenter registrert.";

  return [
    "PresseSjekk utredning",
    "",
    "Sak",
    safeText(caseItem.title || "Ukjent sak"),
    "",
    "Kilde / artikkel",
    safeText(
      caseItem.article_url ??
        caseItem.url ??
        caseItem.source_url ??
        caseItem.link ??
        caseItem.media_name ??
        caseItem.publisher ??
        "Ikke registrert"
    ),
    "",
    "Rapport",
    reportTypeLabel(report.report_type, report.version, report.created_at),
    "",
    "Rapportdato",
    formatDate(report.created_at),
    "",
    "UTREDNING",
    safeText(report.investigation_draft || "Ingen utredningstekst registrert."),
    "",
    "Vedleggsliste",
    documentLines,
    "",
    "Forbehold",
    "Dette er et foreløpig og veiledende utredningsutkast generert av PresseSjekk basert på innsendte opplysninger og dokumentasjon. Det er ikke juridisk rådgivning, advokatvurdering, PFU-avgjørelse, politiets vurdering eller endelig konklusjon. Teksten bør kontrolleres og kvalitetssikres før bruk i alvorlige prosesser.",
  ].join("\n");
}

function buildPoliceDraftText({
  caseItem,
  report,
  documents,
}: {
  caseItem: any;
  report: any;
  documents: any[];
}) {
  const documentLines =
    documents.length > 0
      ? documents
          .map((item) => {
            const name = safeText(item.file_name || item.title || "Dokument");
            const category = safeText(item.category || "dokument");
            return `- ${name} (${category})`;
          })
          .join("\n")
      : "- Ingen dokumenter registrert.";

  return [
    "PresseSjekk politianmeldelse",
    "",
    "Sak",
    safeText(caseItem.title || "Ukjent sak"),
    "",
    "Kilde / artikkel",
    safeText(
      caseItem.article_url ??
        caseItem.url ??
        caseItem.source_url ??
        caseItem.link ??
        caseItem.media_name ??
        caseItem.publisher ??
        "Ikke registrert"
    ),
    "",
    "Rapport",
    reportTypeLabel(report.report_type, report.version, report.created_at),
    "",
    "Rapportdato",
    formatDate(report.created_at),
    "",
    "POLITIANMELDELSE",
    safeText(report.police_draft || "Ingen vurderingstekst registrert."),
    "",
    "Dokumentgrunnlag",
    documentLines,
    "",
    "Forbehold",
    "Dette er et foreløpig og veiledende utkast til politianmeldelse basert på kundens innsendte opplysninger. Det er ikke juridisk rådgivning, advokatvurdering, politiets vurdering eller konklusjon om straffbart forhold. Teksten bør kontrolleres og kvalitetssikres før eventuell bruk eller innsending.",
  ].join("\n");
}

function buildPfuDraftText({
  caseItem,
  report,
  documents,
}: {
  caseItem: any;
  report: any;
  documents: any[];
}) {
  const documentLines =
    documents.length > 0
      ? documents
          .map((item) => {
            const name = safeText(item.file_name || item.title || "Dokument");
            const category = safeText(item.category || "dokument");
            return `- ${name} (${category})`;
          })
          .join("\n")
      : "- Ingen dokumenter registrert.";

  return [
    "PresseSjekk PFU-klage",
    "",
    "Sak",
    safeText(caseItem.title || "Ukjent sak"),
    "",
    "Kilde / artikkel",
    safeText(
      caseItem.article_url ??
        caseItem.url ??
        caseItem.source_url ??
        caseItem.link ??
        caseItem.media_name ??
        caseItem.publisher ??
        "Ikke registrert"
    ),
    "",
    "Rapport",
    reportTypeLabel(report.report_type, report.version, report.created_at),
    "",
    "Rapportdato",
    formatDate(report.created_at),
    "",
    "PFU-klage",
    safeText(report.pfu_draft || "Ingen PFU-tekst registrert."),
    "",
    "Dokumentgrunnlag",
    documentLines,
    "",
    "Forbehold",
    "Dette er et foreløpig og veiledende PFU-klage. Det er ikke juridisk rådgivning, PFU-avgjørelse eller endelig presseetisk vurdering. Teksten bør kontrolleres og tilpasses før eventuell innsending.",
  ].join("\n");
}

function buildReportText({
  caseItem,
  report,
  inputs,
  documents,
}: {
  caseItem: any;
  report: any;
  inputs: any[];
  documents: any[];
}) {
  const findings = Array.isArray(report.findings) ? report.findings : [];
  const recommendations = Array.isArray(report.recommendations)
    ? report.recommendations
    : [];

  const inputLines =
    inputs.length > 0
      ? inputs
          .map((item) => {
            const label = safeText(item.label || item.input_type || "Opplysning");
            const value = safeText(item.value || "");
            return value ? `- ${label}: ${value}` : `- ${label}`;
          })
          .join("\n")
      : "- Ingen egne saksopplysninger registrert.";

  const documentLines =
    documents.length > 0
      ? documents
          .map((item) => {
            const name = safeText(item.file_name || item.title || "Dokument");
            const category = safeText(item.category || "dokument");
            return `- ${name} (${category})`;
          })
          .join("\n")
      : "- Ingen dokumenter registrert.";

  const findingsText =
    findings.length > 0
      ? findings.map((item: string, index: number) => `${index + 1}. ${safeText(item)}`).join("\n")
      : "Ingen funn registrert.";

  const recommendationsText =
    recommendations.length > 0
      ? recommendations
          .map((item: string, index: number) => `${index + 1}. ${safeText(item)}`)
          .join("\n")
      : "Ingen anbefalinger registrert.";

  return [
    "PresseSjekk rapport",
    "",
    "Sak",
    safeText(caseItem.title || "Ukjent sak"),
    "",
    "Kilde / artikkel",
    safeText(
      caseItem.article_url ??
        caseItem.url ??
        caseItem.source_url ??
        caseItem.link ??
        caseItem.media_name ??
        caseItem.publisher ??
        "Ikke registrert"
    ),
    "",
    "Publiseringsdato",
    formatDate(caseItem.publication_date ?? caseItem.article_date ?? caseItem.published_at ?? caseItem.created_at),
    "",
    "Rapport",
    reportTypeLabel(report.report_type, report.version, report.created_at),
    "",
    "Rapportdato",
    formatDate(report.created_at),
    "",
    "Sammendrag",
    safeText(report.summary || "Ingen sammendrag registrert."),
    "",
    "Foreløpige funn",
    findingsText,
    "",
    "Anbefalte neste steg",
    recommendationsText,
    "",
    "Saksopplysninger",
    inputLines,
    "",
    "Dokumentgrunnlag",
    documentLines,
    "",
    "Forbehold",
    "Dette er et foreløpig og veiledende rapportutkast. Det er ikke juridisk rådgivning, PFU-avgjørelse eller endelig vurdering. Innholdet bør kontrolleres før det brukes videre.",
  ].join("\n");
}

async function createReportPdf(reportText: string) {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 54;
  const contentWidth = pageWidth - margin * 2;
  const fontSize = 10.5;
  const lineHeight = 16;
  const maxCharacters = 86;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = 700;

  const dark = rgb(0.02, 0.05, 0.09);
  const slate = rgb(0.39, 0.45, 0.55);
  const lightSlate = rgb(0.93, 0.96, 0.98);
  const border = rgb(0.82, 0.87, 0.92);
  const cyan = rgb(0.04, 0.45, 0.55);
  const lightCyan = rgb(0.90, 0.98, 1);

  const sectionHeadings = new Set([
    "Sak",
    "Kilde / artikkel",
    "Publiseringsdato",
    "Rapport",
    "Rapportdato",
    "Sammendrag",
    "Foreløpige funn",
    "Anbefalte neste steg",
    "Saksopplysninger",
    "Dokumentgrunnlag",
    "Forbehold",
    "POLITIANMELDELSE",
    "UTREDNING",
    "Vedleggsliste",
  ]);

  const isPoliceReport = reportText.includes("POLITIANMELDELSE");
  const isInvestigationReport = reportText.includes("UTREDNING");

  function valueAfterHeading(heading: string) {
    const lines = reportText.split("\n").map((line) => line.trim());
    const index = lines.findIndex((line) => line === heading);

    if (index === -1) return "";

    for (let i = index + 1; i < lines.length; i += 1) {
      if (lines[i]) return lines[i];
    }

    return "";
  }

  function valueAfterPrefix(prefix: string) {
    const lines = reportText.split("\n").map((line) => line.trim());
    const match = lines.find((line) => line.startsWith(prefix));

    return match ? match.replace(prefix, "").trim() : "";
  }

  function drawHeader(currentPage: any) {
    currentPage.drawRectangle({
      x: 0,
      y: pageHeight - 82,
      width: pageWidth,
      height: 82,
      color: lightCyan,
    });

    currentPage.drawText("PresseSjekk", {
      x: margin,
      y: pageHeight - 42,
      size: 23,
      font: boldFont,
      color: dark,
    });

    currentPage.drawText("Din kontroll av media", {
      x: margin,
      y: pageHeight - 60,
      size: 9,
      font: boldFont,
      color: cyan,
    });

    currentPage.drawText("KONFIDENSIELL / VEILEDENDE RAPPORT", {
      x: pageWidth - margin - 190,
      y: pageHeight - 48,
      size: 8,
      font: boldFont,
      color: cyan,
    });

    currentPage.drawLine({
      start: { x: margin, y: pageHeight - 82 },
      end: { x: pageWidth - margin, y: pageHeight - 82 },
      thickness: 1,
      color: border,
    });
  }

  function addPageIfNeeded(extraSpace = 40) {
    if (y < 70 + extraSpace) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      drawHeader(page);
      y = 700;
    }
  }

  function drawLineText(
    line: string,
    options?: {
      bold?: boolean;
      size?: number;
      color?: any;
      x?: number;
      lineHeight?: number;
    }
  ) {
    addPageIfNeeded();

    page.drawText(line, {
      x: options?.x ?? margin,
      y,
      size: options?.size ?? fontSize,
      font: options?.bold ? boldFont : regularFont,
      color: options?.color ?? dark,
    });

    y -= options?.lineHeight ?? lineHeight;
  }

  function drawWrappedText(textValue: string, options?: { indent?: number; color?: any }) {
    const indent = options?.indent ?? 0;
    const adjustedMaxCharacters = maxCharacters - Math.round(indent / 6);
    const lines = wrapLine(textValue, adjustedMaxCharacters);

    for (const line of lines) {
      drawLineText(line, {
        x: margin + indent,
        color: options?.color ?? dark,
      });
    }
  }

  function drawSectionHeading(heading: string) {
    addPageIfNeeded(70);

    y -= 8;

    page.drawRectangle({
      x: margin,
      y: y - 6,
      width: contentWidth,
      height: 26,
      color: lightSlate,
      borderColor: border,
      borderWidth: 0.7,
    });

    page.drawText(heading, {
      x: margin + 12,
      y: y + 2,
      size: 11,
      font: boldFont,
      color: dark,
    });

    y -= 24;
  }

  function drawPoliceCoverPage() {
    drawHeader(page);

    const caseTitle = valueAfterHeading("Sak") || "Ikke registrert";
    const source = valueAfterHeading("Kilde / artikkel") || "Ikke registrert";
    const reportLabel = valueAfterHeading("Rapport") || "Politianmeldelse";
    const sender = valueAfterPrefix("Navn:") || "Anmelder / klager";

    y = 635;

    page.drawText("POLITIANMELDELSE", {
      x: margin,
      y,
      size: 28,
      font: boldFont,
      color: dark,
    });

    y -= 28;

    page.drawText("Foreløpig utkast basert på innsendte opplysninger", {
      x: margin,
      y,
      size: 12,
      font: boldFont,
      color: cyan,
    });

    y -= 34;

    page.drawRectangle({
      x: margin,
      y: y - 10,
      width: contentWidth,
      height: 1,
      color: border,
    });

    y -= 38;

    const coverRows = [
      ["Til", "Politiet / relevant mottaker"],
      ["Fra", sender],
      ["Dato", reportLabel.replace("Politianmeldelse -", "").trim()],
      ["Sak", caseTitle],
      ["Medieomtale", source],
      ["Dokumenttype", "Politianmeldelse med vedlagt vurderingsgrunnlag"],
    ];

    for (const [label, value] of coverRows) {
      page.drawText(`${label}:`, {
        x: margin,
        y,
        size: 10.5,
        font: boldFont,
        color: dark,
      });

      const lines = wrapLine(value, 68);

      for (let i = 0; i < lines.length; i += 1) {
        page.drawText(lines[i], {
          x: margin + 105,
          y,
          size: 10.5,
          font: regularFont,
          color: dark,
        });

        if (i < lines.length - 1) y -= lineHeight;
      }

      y -= 24;
    }

    y -= 14;

    page.drawText("Kort forklaring", {
      x: margin,
      y,
      size: 13,
      font: boldFont,
      color: dark,
    });

    y -= 22;

    const explanation =
      "Dette dokumentet er generert av PresseSjekk basert på kundens innsendte opplysninger. Dokumentet er ment som et strukturert utkast til politianmeldelse og må kvalitetssikres før eventuell innsending.";

    for (const line of wrapLine(explanation, 78)) {
      page.drawText(line, {
        x: margin,
        y,
        size: 10.5,
        font: regularFont,
        color: dark,
      });

      y -= lineHeight;
    }

    y -= 18;

    page.drawText("Vedlegg / grunnlag", {
      x: margin,
      y,
      size: 13,
      font: boldFont,
      color: dark,
    });

    y -= 22;

    const bullets = [
      "Saksopplysninger",
      "Medieomtale / artikkel",
      "Eventuell PFU-klage og PFU-avgjørelse",
      "Opplastet dokumentasjon",
      "Vedlagt vurderingsgrunnlag",
    ];

    for (const bullet of bullets) {
      page.drawText(`- ${bullet}`, {
        x: margin,
        y,
        size: 10.5,
        font: regularFont,
        color: dark,
      });

      y -= lineHeight;
    }

    page = pdfDoc.addPage([pageWidth, pageHeight]);
    drawHeader(page);
    y = 700;
  }

  function drawInvestigationCoverPage() {
    drawHeader(page);

    const caseTitle = valueAfterHeading("Sak") || "Ikke registrert";
    const source = valueAfterHeading("Kilde / artikkel") || "Ikke registrert";
    const reportLabel = valueAfterHeading("Rapport") || "Utredning";

    y = 635;

    page.drawText("UTREDNING", {
      x: margin,
      y,
      size: 34,
      font: boldFont,
      color: dark,
    });

    y -= 30;

    page.drawText("Komplett utredningsgrunnlag for mediesak", {
      x: margin,
      y,
      size: 12,
      font: boldFont,
      color: cyan,
    });

    y -= 34;

    page.drawRectangle({
      x: margin,
      y: y - 10,
      width: contentWidth,
      height: 1,
      color: border,
    });

    y -= 38;

    const coverRows = [
      ["Dokumenttype", "PresseSjekk utredning"],
      ["Sak", caseTitle],
      ["Medieomtale", source],
      ["Dato", formatDate(new Date().toISOString())],
      ["Rapport", reportLabel],
      ["Innhold", "Utredning, kronologisk gjennomgang og vedleggsliste"],
    ];

    for (const [label, value] of coverRows) {
      page.drawText(`${label}:`, {
        x: margin,
        y,
        size: 10.5,
        font: boldFont,
        color: dark,
      });

      const lines = wrapLine(value, 68);

      for (let i = 0; i < lines.length; i += 1) {
        page.drawText(lines[i], {
          x: margin + 105,
          y,
          size: 10.5,
          font: regularFont,
          color: dark,
        });

        if (i < lines.length - 1) y -= lineHeight;
      }

      y -= 24;
    }

    y -= 14;

    page.drawRectangle({
      x: margin,
      y: 170,
      width: contentWidth,
      height: 110,
      color: lightCyan,
      borderColor: rgb(0.35, 0.90, 1),
      borderWidth: 1,
    });

    page.drawText("Formål", {
      x: margin + 18,
      y: 250,
      size: 13,
      font: boldFont,
      color: dark,
    });

    const explanation =
      "Dette dokumentet samler brukerens versjon av saken, dokumentasjon, tidslinje, vurderingstemaer og vedleggsliste i ett strukturert utredningsgrunnlag.";

    let explanationY = 226;

    for (const line of wrapLine(explanation, 72)) {
      page.drawText(line, {
        x: margin + 18,
        y: explanationY,
        size: 10.5,
        font: regularFont,
        color: dark,
      });

      explanationY -= lineHeight;
    }

    page = pdfDoc.addPage([pageWidth, pageHeight]);
    drawHeader(page);
    y = 700;
  }

  if (isPoliceReport) {
    drawPoliceCoverPage();
  } else if (isInvestigationReport) {
    drawInvestigationCoverPage();
  } else {
    drawHeader(page);
  }

  page.drawText(
    isPoliceReport
      ? "PresseSjekk politianmeldelse"
      : isInvestigationReport
        ? "PresseSjekk utredning"
        : "PresseSjekk-rapport",
    {
      x: margin,
      y,
      size: 24,
      font: boldFont,
      color: dark,
    }
  );

  y -= 26;

  page.drawText(
    isPoliceReport
      ? "Strukturert utkast til politianmeldelse basert på innsendte opplysninger."
      : isInvestigationReport
        ? "Samlet utredningsgrunnlag basert på saken og innsendt dokumentasjon."
        : "Strukturert kontroll av medieomtale basert på innsendte opplysninger.",
    {
      x: margin,
      y,
      size: 10.5,
      font: regularFont,
      color: slate,
    }
  );

  y -= 34;

  page.drawRectangle({
    x: margin,
    y: y - 10,
    width: contentWidth,
    height: 1,
    color: border,
  });

  y -= 30;

  for (const paragraph of reportText.split("\n")) {
    const trimmed = paragraph.trim();

    if (
      !trimmed ||
      trimmed === "PresseSjekk rapport" ||
      trimmed === "PresseSjekk utredning"
    ) {
      if (!trimmed) y -= 4;
      continue;
    }

    if (sectionHeadings.has(trimmed)) {
      drawSectionHeading(trimmed);
      continue;
    }

    const isNumbered = /^\d+\.\s+/.test(trimmed);
    const isBullet = trimmed.startsWith("- ");

    if (isNumbered || isBullet) {
      drawWrappedText(trimmed, { indent: 14 });
      y -= 3;
      continue;
    }

    drawWrappedText(trimmed);
    y -= 5;
  }

  const pages = pdfDoc.getPages();

  pages.forEach((pdfPage, index) => {
    pdfPage.drawLine({
      start: { x: margin, y: 52 },
      end: { x: pageWidth - margin, y: 52 },
      thickness: 0.7,
      color: border,
    });

    pdfPage.drawText(`Side ${index + 1} av ${pages.length}`, {
      x: margin,
      y: 35,
      size: 8,
      font: regularFont,
      color: slate,
    });

    pdfPage.drawText("PresseSjekk.no", {
      x: pageWidth - margin - 74,
      y: 35,
      size: 8,
      font: boldFont,
      color: cyan,
    });

    pdfPage.drawText("Veiledende rapport. Erstatter ikke advokat, PFU, redaktøransvar eller domstolene.", {
      x: margin,
      y: 22,
      size: 7.5,
      font: regularFont,
      color: slate,
    });
  });

  return await pdfDoc.save();
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id, reportId } = await context.params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonError("Supabase miljøvariabler mangler.", 500);
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return jsonError("Du må være innlogget for å laste ned PDF.", 401);
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

  const { data: caseItem, error: caseError } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .single();

  if (caseError || !caseItem) {
    return jsonError(caseError?.message ?? "Fant ikke saken.", 404);
  }

  const { data: report, error: reportError } = await supabase
    .from("case_reports")
    .select("*")
    .eq("id", reportId)
    .eq("case_id", id)
    .single();

  if (reportError || !report) {
    return jsonError(reportError?.message ?? "Fant ikke rapporten.", 404);
  }

  const { data: inputs } = await supabase
    .from("case_inputs")
    .select("*")
    .eq("case_id", id)
    .order("created_at", { ascending: true });

  const { data: documents } = await supabase
    .from("case_documents")
    .select("id,file_name,title,category,created_at")
    .eq("case_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  const reportText =
    report.report_type === "investigation_draft"
      ? buildInvestigationDraftText({
          caseItem,
          report,
          documents: documents ?? [],
        })
      : report.report_type === "police_draft"
        ? buildPoliceDraftText({
            caseItem,
            report,
            documents: documents ?? [],
          })
        : report.report_type === "pfu_draft"
          ? buildPfuDraftText({
              caseItem,
              report,
              documents: documents ?? [],
            })
          : buildReportText({
              caseItem,
              report,
              inputs: inputs ?? [],
              documents: documents ?? [],
            });

  const pdfBytes = await createReportPdf(reportText);

  const fileName =
    report.report_type === "investigation_draft"
      ? `pressesjekk-utredning-v${report.version ?? "1"}.pdf`
      : report.report_type === "police_draft"
        ? `pressesjekk-politianmeldelse-${formatFileDate(report.created_at)}.pdf`
        : report.report_type === "pfu_draft"
          ? `pressesjekk-pfu-klageutkast-v${report.version ?? "1"}.pdf`
          : `pressesjekk-rapport-v${report.version ?? "1"}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PDF generation failed:", error);

    return jsonError(
      error instanceof Error
        ? `PDF-feil: ${error.message}`
        : "Ukjent feil ved generering av PDF.",
      500
    );
  }
}
