export type PackagePlanType = "single" | "monthly";

export type PackagePlanId =
  | "report_pack"
  | "pfu_pack"
  | "full_pack"
  | "investigation_pack"
  | "monthly_start"
  | "monthly_pro"
  | "monthly_agency"
  | "monthly_enterprise";

export type PackagePlan = {
  id: PackagePlanId;
  type: PackagePlanType;
  tag: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  href: string;
  button: string;
};

export const singlePackages: PackagePlan[] = [
  {
    id: "report_pack",
    type: "single",
    tag: "Steg 1–3",
    name: "Rapportpakke",
    price: "Fra 490 kr",
    description:
      "For deg som vil samle saken, legge inn dokumentasjon og få en strukturert PresseSjekk-rapport.",
    features: [
      "1 sak",
      "Sak registrert",
      "Saksopplysninger / publiseringsgrunnlag",
      "Rapport med KI-basert vurdering",
      "Nedlasting som PDF og tekst",
      "Passer for privatpersoner, virksomheter og journalister",
    ],
    href: "/pressesjekk",
    button: "Start med rapportpakke",
  },
  {
    id: "pfu_pack",
    type: "single",
    tag: "Steg 1–4",
    name: "PFU-pakke",
    price: "Fra 1 490 kr",
    description:
      "For deg som vil gå videre fra rapport til et strukturert PFU-klage.",
    features: [
      "Alt i Rapportpakke",
      "PFU-klage med KI",
      "Presseetisk vurdering opp mot VVP",
      "Nedlasting av PFU-klage som PDF og tekst",
      "Kan oppgraderes videre til full dokumentpakke",
    ],
    href: "/pressesjekk",
    button: "Velg PFU-pakke",
  },
  {
    id: "full_pack",
    type: "single",
    tag: "Steg 1–6",
    name: "Full dokumentpakke",
    price: "Fra 2 990 kr",
    description:
      "For deg som ønsker komplett digital saksgang med rapport, PFU-klage og PFU-avgjørelse og politianmeldelse.",
    features: [
      "Alt i PFU-pakke",
      "PFU-avgjørelse / status",
      "Politianmeldelse med førsteside",
      "Dokumentgrunnlag og forbehold",
      "Nedlasting som komplett PDF",
      "Best grunnlag før eventuell utredningspakke",
    ],
    href: "/pressesjekk",
    button: "Velg full dokumentpakke",
  },
  {
    id: "investigation_pack",
    type: "single",
    tag: "Manuell hjelp",
    name: "Utredningspakke",
    price: "Fra 100 000 kr",
    description:
      "For større eller mer alvorlige saker der du ønsker manuell gjennomgang, strukturering og videre strategi.",
    features: [
      "Manuell vurdering av saken",
      "Gjennomgang av dokumentasjon",
      "Kvalitetssikring av rapport og dokumentpakke",
      "Forslag til videre strategi",
      "Kronologisk saksgjennomgang",
      "Vedleggsliste og strukturert grunnlag",
    ],
    href: "/kontakt",
    button: "Be om utredningspakke",
  },
];

export const monthlyPackages: PackagePlan[] = [
  {
    id: "monthly_start",
    type: "monthly",
    tag: "Proff start",
    name: "3 saker",
    price: "1 990 kr/mnd",
    description:
      "For enkeltpersoner, mindre virksomheter eller rådgivere som jevnlig vurderer mediesaker.",
    features: [
      "Inntil 3 aktive saker per måned",
      "Rapportpakker inkludert",
      "Mulighet for oppgradering til PFU-pakke",
      "Dokumentasjon og rapportversjoner",
      "Passer for små organisasjoner og rådgivere",
    ],
    href: "/kontakt",
    button: "Kontakt oss",
  },
  {
    id: "monthly_pro",
    type: "monthly",
    tag: "Anbefalt",
    name: "15 saker",
    price: "4 990 kr/mnd",
    description:
      "For advokater, PR-rådgivere, organisasjoner og redaksjoner med løpende behov.",
    features: [
      "Inntil 15 aktive saker per måned",
      "Rapportpakker inkludert",
      "Rabattert oppgradering til PFU-pakke",
      "Egnet for klientarbeid og intern kvalitetssikring",
      "Prioritert videreutvikling og support etter avtale",
    ],
    href: "/kontakt",
    button: "Be om profftilgang",
  },
  {
    id: "monthly_agency",
    type: "monthly",
    tag: "Byrå / redaksjon",
    name: "50 saker inkludert",
    price: "14 990 kr/mnd",
    description:
      "For større miljøer som trenger løpende kontroll, dokumentasjon og oversikt over mange saker.",
    features: [
      "50 saker inkludert per måned",
      "Ekstra saker etter avtale",
      "Flere brukere / team etter avtale",
      "Rapportpakker inkludert",
      "Egnet for redaksjoner, byråer og organisasjoner",
      "Mulighet for tilpasset fakturering",
    ],
    href: "/kontakt",
    button: "Kontakt oss",
  },
  {
    id: "monthly_enterprise",
    type: "monthly",
    tag: "Enterprise",
    name: "Tilpasset",
    price: "Etter avtale",
    description:
      "For større aktører med behov for flere brukere, mange saker, support eller spesialtilpasning.",
    features: [
      "Tilpasset antall saker",
      "Tilpasset antall brukere",
      "Mulighet for opplæring",
      "Mulighet for egne arbeidsflyter",
      "Pris etter behov og omfang",
    ],
    href: "/kontakt",
    button: "Be om tilbud",
  },
];

export const allPackagePlans = [...singlePackages, ...monthlyPackages];

// --- v1 checkout-scope (B4) ---------------------------------------------
// Kun disse tre pakkene er kjøpbare i v1 sin offentlige checkout.
export const v1PurchasablePackageIds: PackagePlanId[] = [
  "report_pack",
  "pfu_pack",
  "full_pack",
];

// De tre v1-pakkene som skal vises som kjøpbare (brukes i /priser i C3).
export const v1PurchasablePackages: PackagePlan[] = singlePackages.filter(
  (plan) => (v1PurchasablePackageIds as string[]).includes(plan.id)
);

// Utsatt til etter v1 – skal IKKE være del av offentlig checkout.
// Vises eventuelt som "Kontakt oss" i stedet for kjøpsknapp.
export const deferredPackageIds: PackagePlanId[] = [
  "investigation_pack",
  "monthly_start",
  "monthly_pro",
  "monthly_agency",
  "monthly_enterprise",
];

// True hvis pakken kan kjøpes i v1 sin offentlige checkout.
export function isV1Purchasable(packageId: string): boolean {
  return (v1PurchasablePackageIds as string[]).includes(packageId);
}
// ------------------------------------------------------------------------

export const packageAccessSteps: Record<PackagePlanId, number[]> = {
  report_pack: [1, 2, 3],
  pfu_pack: [1, 2, 3, 4],
  full_pack: [1, 2, 3, 4, 5, 6],
  investigation_pack: [1, 2, 3, 4, 5, 6, 7],
  monthly_start: [1, 2, 3],
  monthly_pro: [1, 2, 3],
  monthly_agency: [1, 2, 3],
  monthly_enterprise: [1, 2, 3],
};

export const upgradePaths = {
  report_pack: "pfu_pack",
  pfu_pack: "full_pack",
  full_pack: "investigation_pack",
} as const;
