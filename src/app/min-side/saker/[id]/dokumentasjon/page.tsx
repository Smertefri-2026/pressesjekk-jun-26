import { permanentRedirect } from "next/navigation";

/**
 * Fase 6.5 — Dokumentasjonssenteret er avviklet som egen side. Oversikt,
 * dokumentasjonshull og bevisoversikt er flyttet inn i Full rapport; resten
 * (påstander/dokumenter/tidslinje/vitner) fantes allerede der. Ruten
 * beholdes som en varig omdirigering slik at gamle lenker og bokmerker
 * fortsatt fungerer.
 */
export default async function DokumentasjonRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  permanentRedirect(`/min-side/saker/${id}/full-rapport`);
}
