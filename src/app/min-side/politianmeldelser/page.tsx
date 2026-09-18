import { redirect } from "next/navigation";

/**
 * Fase 6.3 — de fire arkiv-sidene (rapporter/pfu-klager/politianmeldelser/
 * utredninger) er slått sammen til én side med faner på /min-side/rapporter.
 * Denne ruten beholdes som en varig omdirigering slik at gamle lenker og
 * bokmerker fortsatt fungerer.
 */
export default function PolitianmeldelserRedirectPage() {
  redirect("/min-side/rapporter?tab=politi");
}
