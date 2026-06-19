import type { PricingPlan } from "@/types/pricing";

export const pricingPlans: PricingPlan[] = [
  {
    name: "Gratis forhåndssjekk",
    price: "0 kr",
    tag: "Start her",
    description:
      "Kort foreløpig vurdering av artikkel, mulig risikonivå og relevante problemområder.",
    features: [
      "Én URL eller artikkeltekst",
      "Kort sammendrag",
      "Foreløpig risikonivå",
      "Mulige presseetiske temaer",
      "Ingen full rapport",
    ],
  },
  {
    name: "PresseSjekk Enkel",
    price: "490 kr",
    tag: "Én artikkel",
    description:
      "Full rapport for én artikkel med vurdering av presseetiske problemstillinger.",
    features: [
      "Full artikkelanalyse",
      "Vurdering av tittel og ingress",
      "Kildebruk og dokumentasjon",
      "Identifisering og privatliv",
      "Anbefalt neste steg",
    ],
  },
  {
    name: "PresseSjekk + PFU",
    price: "790 kr",
    tag: "Mest relevant",
    description:
      "Full rapport, tilsvarsvurdering, rettsstatus og utkast til PFU-klage.",
    features: [
      "Alt i PresseSjekk Enkel",
      "Tilsvar og samtidig imøtegåelse",
      "Straffesak, dom og rettsstatus",
      "Vedleggsliste",
      "PFU-klageutkast",
    ],
  },
  {
    name: "PresseSjekk Sak",
    price: "1 490 kr",
    tag: "Flere artikler",
    description: "For saker med opptil tre artikler som skal vurderes samlet.",
    features: [
      "Opptil 3 artikler",
      "Samlet vurdering",
      "Tidslinje",
      "Felles dokumentasjon",
      "Samlet PFU-klageutkast",
    ],
  },
  {
    name: "Stor sak",
    price: "2 990 kr",
    tag: "Utvidet sak",
    description:
      "For større mediesaker med flere artikler, dokumentasjon og videre oppfølging.",
    features: [
      "Opptil 10 artikler",
      "Saksoversikt",
      "Utvidet tidslinje",
      "Flere vedlegg",
      "Grunnlag for videre dokumenter",
    ],
  },
  {
    name: "Proff",
    price: "Fra 4 990 kr/mnd",
    tag: "Advokat / PR",
    description:
      "For advokater, PR-rådgivere, organisasjoner og bedrifter med flere saker.",
    features: [
      "Flere klientmapper",
      "Flere brukere",
      "Månedsbaserte credits",
      "Adminoversikt",
      "Prioritert videreutvikling",
    ],
  },
];
