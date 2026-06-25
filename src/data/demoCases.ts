import type { CaseSummary, DemoCase } from "@/types/case";

export const demoCaseSummaries: CaseSummary[] = [
  {
    id: "demo-1",
    title: "VG-artikkel om større mediesak",
    media: "VG",
    date: "18.06.2026",
    status: "Rapportpakke kjøpt",
    nextStep: "Generer PFU-klage",
    risk: "Høy",
    href: "/min-side/saker/demo-1",
  },
  {
    id: "demo-2",
    title: "Lokalavis-artikkel med manglende tilsvar",
    media: "Lokalavis",
    date: "14.06.2026",
    status: "Rask sjekk",
    nextStep: "Velg rapportpakke",
    risk: "Middels",
    href: "/min-side/saker/demo-1",
  },
  {
    id: "demo-3",
    title: "Artikkel om rettssak og identifisering",
    media: "Nettavis",
    date: "09.06.2026",
    status: "PFU-klageutkast klart",
    nextStep: "Last ned klage",
    risk: "Middels/høy",
    href: "/min-side/saker/demo-1",
  },
];

export const demoCase: DemoCase = {
  id: "demo-1",
  title: "VG-artikkel om større mediesak",
  media: "VG",
  publishedAt: "18.06.2026",
  articleType: "Nyhetsartikkel",
  checkedCount: 47,
  url: "https://eksempel.no/artikkel/demo",
  status: "Rapportpakke kjøpt",
  risk: "Høy",
  nextStep: "Generer PFU-klage",
  timeline: [
    {
      date: "18.06.2026 kl. 09:12",
      title: "Journalist tok kontakt",
      text: "Bruker oppgir at henvendelsen kom på e-post med kort svarfrist.",
    },
    {
      date: "18.06.2026 kl. 11:30",
      title: "Bruker svarte",
      text: "Bruker oppgir at det ble sendt tilsvar, men at svaret bare delvis ble tatt med.",
    },
    {
      date: "18.06.2026 kl. 14:05",
      title: "Artikkel publisert",
      text: "Artikkelen ble publisert samme dag. Bruker mener saken inneholder sterke faktiske beskyldninger.",
    },
    {
      date: "18.06.2026 kl. 18:22",
      title: "PresseSjekk opprettet",
      text: "Saken er registrert i PresseSjekk med artikkel, tilsvar og foreløpig vurdering.",
    },
  ],
  findings: [
    "Mulig mangelfull samtidig imøtegåelse",
    "Kort svarfrist før publisering",
    "Spørsmål om identifisering",
    "Mulig behov for oppdatering etter rettslig utvikling",
    "Tittel/ingress bør vurderes mot innholdet i artikkelen",
  ],
};
