export type NorwegianLawRule = {
  id: string;
  title: string;
  shortTitle: string;
  source:
    | "Grunnloven"
    | "Straffeloven"
    | "Skadeserstatningsloven"
    | "Erstatningsrett"
    | "Prosess / forbehold";
  summary: string;
  relevance: string;
  cautiousLanguage: string[];
};

export const constitutionalRules: NorwegianLawRule[] = [
  {
    id: "grunnloven-96",
    title: "Grunnloven § 96 – Lov, dom og uskyldspresumsjon",
    shortTitle: "Uskyldspresumsjon",
    source: "Grunnloven",
    summary:
      "Ingen kan dømmes uten etter lov eller straffes uten etter dom. Enhver har rett til å bli ansett som uskyldig inntil skyld er bevist etter loven.",
    relevance:
      "Relevant som rettsstatslig bakteppe ved forhåndsdømmende omtale, skyldpregede formuleringer eller medieomtale som kan gi inntrykk av at ansvar er avklart før dom eller endelig avgjørelse.",
    cautiousLanguage: [
      "Dette kan være relevant som rettsstatslig bakteppe.",
      "Det bør ikke fremstilles som at mediet har brutt Grunnloven.",
      "Det kan stilles spørsmål ved om omtalen får en forhåndsdømmende virkning.",
    ],
  },
  {
    id: "grunnloven-100",
    title: "Grunnloven § 100 – Ytringsfrihet",
    shortTitle: "Ytringsfrihet",
    source: "Grunnloven",
    summary:
      "Ytringsfrihet skal finne sted, men ytringer kan samtidig møte ansvar etter nærmere vilkår i lov.",
    relevance:
      "Relevant som bakgrunn for balansen mellom pressefrihet, offentlig interesse, ansvarlig publisering og vern av enkeltpersoner.",
    cautiousLanguage: [
      "Ytringsfrihet og pressefrihet er grunnleggende rettigheter.",
      "Spørsmålet er ikke om pressen kan omtale saken, men om omtalen er ansvarlig, dokumentert og forholdsmessig.",
      "Eventuelle begrensninger eller ansvar må vurderes konkret.",
    ],
  },
  {
    id: "grunnloven-102",
    title: "Grunnloven § 102 – Privatliv",
    shortTitle: "Privatliv",
    source: "Grunnloven",
    summary:
      "Enhver har rett til respekt for privatliv og familieliv, hjem og kommunikasjon.",
    relevance:
      "Relevant ved medieomtale som berører private forhold, helse, familie, barn, bosted, personlige opplysninger eller annen sensitiv informasjon.",
    cautiousLanguage: [
      "Dette kan være relevant som bakgrunn for vurdering av privatliv og belastning.",
      "Det bør vurderes om publiseringen hadde tilstrekkelig offentlig interesse.",
      "Det bør ikke konkluderes juridisk uten nærmere vurdering.",
    ],
  },
];

export const criminalLawRules: NorwegianLawRule[] = [
  {
    id: "straffeloven-266",
    title: "Straffeloven § 266 – Hensynsløs atferd",
    shortTitle: "Hensynsløs atferd",
    source: "Straffeloven",
    summary:
      "Bestemmelsen gjelder alvorlig skremmende eller plagsom opptreden eller annen hensynsløs atferd som krenker en annens fred.",
    relevance:
      "Kan være relevant som mulig rettslig spor der omtale, kontakt, gjentakelse eller samlet opptreden oppleves sterkt belastende. Må vurderes konkret.",
    cautiousLanguage: [
      "Det kan vurderes om forholdet reiser spørsmål om hensynsløs eller sterkt belastende opptreden.",
      "Dette er et mulig rettslig spor, ikke en konklusjon.",
      "Politiet eller advokat må vurdere om vilkårene er oppfylt.",
    ],
  },
  {
    id: "straffeloven-267",
    title: "Straffeloven § 267 – Krenkelse av privatlivets fred",
    shortTitle: "Privatlivets fred",
    source: "Straffeloven",
    summary:
      "Bestemmelsen gjelder offentlig meddelelse om personlige eller huslige forhold når meddelelsen er egnet til å krenke privatlivets fred.",
    relevance:
      "Kan være relevant ved publisering av private, sensitive eller personlige opplysninger uten tydelig offentlig interesse.",
    cautiousLanguage: [
      "Det kan vurderes om publiseringen reiser spørsmål om privatlivets fred.",
      "Dette bør beskrives som et mulig rettslig spor, ikke som en fastslått lovovertredelse.",
      "Det må vurderes konkret om opplysningene er private, om de er offentlige kjent fra før, og hvilken offentlig interesse saken hadde.",
    ],
  },
  {
    id: "straffeloven-185",
    title: "Straffeloven § 185 – Hatefulle ytringer",
    shortTitle: "Hatefulle ytringer",
    source: "Straffeloven",
    summary:
      "Bestemmelsen gjelder diskriminerende eller hatefulle ytringer rettet mot bestemte vernede grupper.",
    relevance:
      "Bare relevant i saker hvor omtalen gjelder vernede grunnlag og faktisk kan reise spørsmål om hatefulle eller diskriminerende ytringer.",
    cautiousLanguage: [
      "Dette bør bare nevnes hvis faktum faktisk gjelder vernede grunnlag.",
      "Det bør ikke brukes som standardpunkt i vanlige mediesaker.",
      "Vurderingen må gjøres konkret.",
    ],
  },
];

export const compensationRules: NorwegianLawRule[] = [
  {
    id: "skadeserstatningsloven-3-6-a",
    title: "Skadeserstatningsloven § 3-6 a – Ærekrenkende ytringer",
    shortTitle: "Ærekrenkende ytringer",
    source: "Skadeserstatningsloven",
    summary:
      "Bestemmelsen kan være relevant ved ytringer som er egnet til å krenke ærefølelse eller omdømme, og som kan gi grunnlag for erstatning eller oppreisning etter nærmere vilkår.",
    relevance:
      "Relevant som mulig sivilt spor ved uriktige, sterkt belastende eller omdømmeskadelige publiseringer.",
    cautiousLanguage: [
      "Dette er et mulig sivilt spor, ikke en konklusjon.",
      "Et eventuelt krav krever konkret vurdering av ytringen, skyld, ansvar, skade, tap og årsakssammenheng.",
      "Dette bør normalt vurderes av advokat eller gjennom en egen utredning.",
    ],
  },
  {
    id: "erstatning-arsakssammenheng",
    title: "Erstatningsrett – Årsakssammenheng",
    shortTitle: "Årsakssammenheng",
    source: "Erstatningsrett",
    summary:
      "Et erstatningskrav krever normalt årsakssammenheng mellom den ansvarsbetingende handlingen og tapet eller skaden.",
    relevance:
      "Relevant ved vurdering av økonomisk tap, omdømmetap, tapte kunder, tapte inntekter, helsemessig belastning eller andre følger av medieomtale.",
    cautiousLanguage: [
      "Det bør vurderes om tapet ville oppstått uten publiseringen.",
      "Det bør vurderes om publiseringen var en nødvendig betingelse for tapet.",
      "Det bør vurderes om tapet var en påregnelig og ikke for fjern følge av publiseringen.",
    ],
  },
  {
    id: "erstatning-dokumentasjon",
    title: "Erstatningsrett – Dokumentasjon av tap",
    shortTitle: "Dokumentasjon av tap",
    source: "Erstatningsrett",
    summary:
      "Et krav om erstatning bør underbygges med dokumentasjon på tap, årsakssammenheng og utvikling før og etter den aktuelle publiseringen.",
    relevance:
      "Relevant ved vurdering av om det bør bestilles en utredningspakke eller innhentes advokatvurdering.",
    cautiousLanguage: [
      "Det bør samles dokumentasjon før og etter publiseringen.",
      "Mulige alternative årsaker til tapet bør vurderes.",
      "En erstatningsvurdering krever normalt mer arbeid enn en enkel PFU- eller politivurdering.",
    ],
  },
];

export const processAndDisclaimerRules: NorwegianLawRule[] = [
  {
    id: "forbehold-ikke-juridisk-radgivning",
    title: "Forbehold – Ikke juridisk rådgivning",
    shortTitle: "Ikke juridisk rådgivning",
    source: "Prosess / forbehold",
    summary:
      "KI-genererte vurderinger er ikke juridisk rådgivning, politianmeldelse, advokatvurdering eller konklusjon om straffbart forhold.",
    relevance:
      "Skal brukes i alle KI-genererte politianmeldelser, vurderingsnotater og erstatningsspor.",
    cautiousLanguage: [
      "Dette er et foreløpig og veiledende utkast.",
      "Teksten bør kvalitetssikres før eventuell innsending.",
      "Politiet, advokat eller domstol må vurdere rettslige spørsmål.",
    ],
  },
  {
    id: "politianmeldelse-formal",
    title: "Politianmeldelse – Hva politiet bes vurdere",
    shortTitle: "Politiets vurdering",
    source: "Prosess / forbehold",
    summary:
      "Et utkast bør be politiet vurdere forholdet, ikke selv konkludere med skyld eller lovbrudd.",
    relevance:
      "Relevant for å sikre at politianmeldelsesutkastet er nøkternt, faktabasert og ikke forhåndsdømmende.",
    cautiousLanguage: [
      "Jeg ber politiet vurdere om forholdet gir grunnlag for videre undersøkelser.",
      "Jeg ber om at vedlagte dokumentasjon vurderes.",
      "Jeg ber om vurdering av om forholdet faller inn under relevante straffebestemmelser.",
    ],
  },
];

export const norwegianLawKnowledgeBase = {
  constitutionalRules,
  criminalLawRules,
  compensationRules,
  processAndDisclaimerRules,
};

export function getPoliceReportContextRules() {
  return [
    ...constitutionalRules,
    ...criminalLawRules,
    ...processAndDisclaimerRules,
  ];
}

export function getCompensationContextRules() {
  return [
    ...constitutionalRules,
    ...compensationRules,
    ...processAndDisclaimerRules,
  ];
}

export function getFullLegalContextRules() {
  return [
    ...constitutionalRules,
    ...criminalLawRules,
    ...compensationRules,
    ...processAndDisclaimerRules,
  ];
}

export function formatNorwegianLawRulesForPrompt(rules: NorwegianLawRule[]) {
  return rules
    .map((rule) => {
      return [
        `${rule.title}`,
        `Kilde: ${rule.source}`,
        `Kort forklaring: ${rule.summary}`,
        `Relevans: ${rule.relevance}`,
        `Forsiktig språk: ${rule.cautiousLanguage.join(" / ")}`,
      ].join("\\n");
    })
    .join("\\n\\n");
}
