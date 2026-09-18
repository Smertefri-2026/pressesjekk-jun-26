import { redirect } from "next/navigation";

/**
 * Fase 6.3 — Saksopplysninger og Rapport er slått sammen til én arbeidsflate
 * på /full-rapport. Denne ruten beholdes som en varig omdirigering slik at
 * gamle lenker og bokmerker fortsatt fungerer.
 */
export default async function OpplysningerRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/min-side/saker/${id}/full-rapport`);
}
