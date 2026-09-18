import { redirect } from "next/navigation";

/**
 * Fase 6 — PFU-klage og PFU-avgjørelse er slått sammen til én arbeidsflate
 * på /pfu. Denne ruten beholdes som en varig omdirigering slik at gamle
 * lenker og bokmerker fortsatt fungerer.
 */
export default async function PfuDecisionRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/min-side/saker/${id}/pfu`);
}
