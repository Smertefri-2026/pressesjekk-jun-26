export type MediaEthicsRule = {
  id: string;
  title: string;
  shortTitle: string;
  source: "VVP" | "Redaktørplakaten" | "PFU" | "Lov / rettslig spor";
  summary: string;
  relevance: string;
  cautiousLanguage: string[];
};

export const vvpRules: MediaEthicsRule[] = [
  {
    id: "vvp-4-1",
    title: "VVP 4.1 – Saklighet og omtanke",
    shortTitle: "Saklighet og omtanke",
    source: "VVP",
    summary:
      "Pressen skal legge vekt på saklighet og omtanke i innhold og presentasjon.",
    relevance:
      "Relevant når omtalen kan oppleves belastende, skjev, urimelig hard, unyansert eller unødvendig krenkende.",
    cautiousLanguage: [
      "Det kan vurderes om omtalen er tilstrekkelig saklig og hensynsfull.",
      "Saken kan reise spørsmål om presentasjonen går lenger enn nødvendig.",
      "Det bør vurderes om belastningen står i rimelig forhold til sakens offentlige interesse.",
    ],
  },
  {
    id: "vvp-4-2",
    title: "VVP 4.2 – Skille mellom fakta og kommentarer",
    shortTitle: "Fakta og kommentarer",
    source: "VVP",
    summary:
      "Pressen skal gjøre klart hva som er faktiske opplysninger og hva som er kommentarer.",
    relevance:
      "Relevant når artikkelen blander dokumenterte fakta, påstander, vurderinger, sterke karakteristikker eller spekulasjoner.",
    cautiousLanguage: [
      "Det kan vurderes om artikkelen skiller tydelig nok mellom fakta, påstander og vurderinger.",
      "Det bør undersøkes om leseren får et klart bilde av hva som er dokumentert og hva som er redaksjonell vurdering.",
    ],
  },
  {
    id: "vvp-4-4",
    title: "VVP 4.4 – Dekning for overskrifter, henvisninger og ingresser",
    shortTitle: "Dekning for overskrift",
    source: "VVP",
    summary:
      "Overskrifter, henvisninger, ingresser og inn-/utannonseringer skal ikke gå lenger enn det er dekning for i stoffet.",
    relevance:
      "Relevant når overskrift, bildebruk, ingress eller vinkling kan gi et sterkere inntrykk enn faktagrunnlaget gir dekning for.",
    cautiousLanguage: [
      "Det kan vurderes om overskriften har tilstrekkelig dekning i artikkelens faktiske innhold.",
      "Det bør vurderes om ingress eller vinkling forsterker inntrykket utover det dokumentasjonen tilsier.",
    ],
  },
  {
    id: "vvp-4-5",
    title: "VVP 4.5 – Forhåndsdømming i kriminal- og rettsreportasje",
    shortTitle: "Forhåndsdømming",
    source: "VVP",
    summary:
      "Pressen skal unngå forhåndsdømming og gjøre klart at skyld først er avgjort ved rettskraftig dom.",
    relevance:
      "Relevant i saker hvor personer omtales som skyldige, ansvarlige eller klanderverdige før endelig avklaring.",
    cautiousLanguage: [
      "Saken kan reise spørsmål om omtalen får en forhåndsdømmende virkning.",
      "Det bør vurderes om omtalen tydelig nok presiserer at skyld eller ansvar ikke er endelig avgjort.",
      "Dette kan også ses i lys av det grunnleggende prinsippet om uskyldspresumsjon, men PFU vurderer saken presseetisk.",
    ],
  },
  {
    id: "vvp-4-7",
    title: "VVP 4.7 – Navn, bilde og identifisering",
    shortTitle: "Identifisering",
    source: "VVP",
    summary:
      "Pressen skal være varsom med navn, bilde og andre klare identifikasjonstegn i forbindelse med klanderverdige eller straffbare forhold.",
    relevance:
      "Relevant når en person kan identifiseres direkte eller indirekte gjennom navn, bilde, yrke, kjønn, rolle, bosted, familie, arbeidsplass eller andre kjennetegn.",
    cautiousLanguage: [
      "Det kan vurderes om identifiseringen var nødvendig og forholdsmessig.",
      "Det bør vurderes om omtale med kjønn, yrke, rolle, bilde eller andre kjennetegn likevel gjorde personen identifiserbar.",
      "Det kan vurderes om identifiseringen medførte en urimelig belastning.",
    ],
  },
  {
    id: "vvp-4-13",
    title: "VVP 4.13 – Retting og beklagelse",
    shortTitle: "Retting",
    source: "VVP",
    summary:
      "Feilaktige opplysninger skal rettes og eventuelt beklages snarest mulig.",
    relevance:
      "Relevant når det påstås at artikkelen inneholder faktiske feil, manglende retting eller utilstrekkelig presisering.",
    cautiousLanguage: [
      "Det bør vurderes om påpekte feil ble rettet tydelig og raskt nok.",
      "Det kan vurderes om en eventuell retting eller presisering var tilstrekkelig synlig for publikum.",
    ],
  },
  {
    id: "vvp-4-14",
    title: "VVP 4.14 – Samtidig imøtegåelse",
    shortTitle: "Samtidig imøtegåelse",
    source: "VVP",
    summary:
      "Den som utsettes for sterke beskyldninger skal så vidt mulig få adgang til samtidig imøtegåelse av faktiske opplysninger.",
    relevance:
      "Relevant når artikkelen inneholder sterke beskyldninger eller faktiske påstander rettet mot en person, virksomhet eller organisasjon.",
    cautiousLanguage: [
      "Det kan vurderes om den omtalte parten fikk reell mulighet til samtidig imøtegåelse.",
      "Det bør vurderes om beskyldningene var så sterke at redaksjonen burde innhentet imøtegåelse før publisering.",
    ],
  },
  {
    id: "vvp-4-15",
    title: "VVP 4.15 – Tilsvar",
    shortTitle: "Tilsvar",
    source: "VVP",
    summary:
      "Den som er blitt utsatt for angrep skal snarest mulig få adgang til tilsvar, innenfor rimelige rammer.",
    relevance:
      "Relevant når en person eller part mener at de ikke fikk svare etter publisering, eller at tilsvar ble avvist eller redigert urimelig.",
    cautiousLanguage: [
      "Det kan vurderes om klager fikk tilstrekkelig adgang til tilsvar.",
      "Det bør vurderes om eventuelt tilsvar ble behandlet på en rimelig og presseetisk forsvarlig måte.",
    ],
  },
];

export const editorResponsibilityRules: MediaEthicsRule[] = [
  {
    id: "redaktor-ansvar",
    title: "Redaktørplakaten – Redaktørens personlige og fulle ansvar",
    shortTitle: "Redaktøransvar",
    source: "Redaktørplakaten",
    summary:
      "Redaktøren har det personlige og fulle ansvaret for innholdet i mediet.",
    relevance:
      "Relevant som bakgrunn for hvem som har ansvar for publisering, presentasjon, retting, skille mellom fakta og mening, og redaksjonelle valg.",
    cautiousLanguage: [
      "Redaktøransvaret kan nevnes som bakgrunn for hvorfor henvendelser og klager normalt bør rettes til ansvarlig redaktør.",
      "I PFU-sporet bør konkrete klagepunkter likevel primært kobles til Vær Varsom-plakaten.",
    ],
  },
  {
    id: "redaktor-fakta-mening",
    title: "Redaktørplakaten – Skille mellom fakta og meningsinnhold",
    shortTitle: "Fakta og mening",
    source: "Redaktørplakaten",
    summary:
      "Redaktøren skal bidra til et tydelig skille mellom fakta og meningsinnhold, og mellom redaksjonelt og kommersielt materiale.",
    relevance:
      "Relevant i saker hvor fremstillingen blander fakta, tolkninger, redaksjonelle vurderinger, kommentarstoff eller kommersielle interesser.",
    cautiousLanguage: [
      "Dette kan brukes som bakgrunn i rapporten, men PFU-klagen bør normalt forankres i relevante VVP-punkter.",
    ],
  },
];

export const pfuContextRules: MediaEthicsRule[] = [
  {
    id: "pfu-mandat",
    title: "PFU – Presseetisk vurdering",
    shortTitle: "PFUs mandat",
    source: "PFU",
    summary:
      "PFU vurderer presseetiske spørsmål etter Vær Varsom-plakaten, ikke straff, erstatning eller endelig juridisk ansvar.",
    relevance:
      "Viktig for å skille mellom PFU-klage, juridisk vurdering, politianmeldelse og offentlig debatt.",
    cautiousLanguage: [
      "PFU-klagen bør avgrenses til presseetiske spørsmål.",
      "Mulige rettslige spørsmål kan nevnes som egne spor, men bør ikke presenteres som PFUs avgjørelsesgrunnlag.",
    ],
  },
  {
    id: "pfu-sammensetning",
    title: "PFU – Sammensetning og selvjustis",
    shortTitle: "PFU-sammensetning",
    source: "PFU",
    summary:
      "PFU er pressens faglige utvalg og består av representanter fra mediene og allmennheten.",
    relevance:
      "Relevant på åpne informasjonssider om pressens selvjustis, debatt om uavhengighet og hvem som kontrollerer pressen.",
    cautiousLanguage: [
      "Dette bør omtales saklig som en del av systemforståelsen.",
      "I konkrete PFU-klager bør man unngå at klagen fremstår som et angrep på utvalget før saken er behandlet.",
    ],
  },
];

export const legalContextRules: MediaEthicsRule[] = [
  {
    id: "grunnloven-96",
    title: "Grunnloven § 96 – Dom, straff og uskyldspresumsjon",
    shortTitle: "Uskyldspresumsjon",
    source: "Lov / rettslig spor",
    summary:
      "Ingen kan dømmes uten etter lov eller straffes uten etter dom. Enhver har rett til å bli ansett som uskyldig inntil skyld er bevist etter loven.",
    relevance:
      "Relevant som demokratisk og rettsstatsmessig bakgrunn i debatt om forhåndsdømming, særlig når medier omtaler skyld, ansvar eller klanderverdige forhold før endelig avklaring.",
    cautiousLanguage: [
      "Dette kan være relevant som bakteppe for spørsmålet om forhåndsdømmende medieomtale.",
      "I PFU-klagen bør dette normalt kobles til VVP 4.5, ikke presenteres som en selvstendig PFU-regel.",
      "Det kan stilles spørsmål ved om omtalen får en forhåndsdømmende virkning.",
    ],
  },
  {
    id: "privatlivets-fred",
    title: "Mulig rettslig spor – Privatlivets fred",
    shortTitle: "Privatlivets fred",
    source: "Lov / rettslig spor",
    summary:
      "Medieomtale kan i enkelte tilfeller reise spørsmål om privatlivets fred, særlig ved sensitive eller private opplysninger uten klar offentlig interesse.",
    relevance:
      "Relevant som eget rettslig spor, særlig ved omtale av private forhold, helse, familie, barn, bosted, bilder eller andre sensitive opplysninger.",
    cautiousLanguage: [
      "Dette ligger utenfor PFUs mandat som juridisk avgjørelse, men kan nevnes som et mulig separat rettslig spor.",
      "Det bør vurderes av advokat eller relevant myndighet før det trekkes juridiske konklusjoner.",
    ],
  },
  {
    id: "aerekrenkende-omtale",
    title: "Mulig rettslig spor – Ærekrenkende eller omdømmeskadelig omtale",
    shortTitle: "Ærekrenkende omtale",
    source: "Lov / rettslig spor",
    summary:
      "Medieomtale kan i enkelte tilfeller reise spørsmål om ærekrenkende, uriktig eller sterkt omdømmeskadelig fremstilling.",
    relevance:
      "Relevant som mulig rettslig spor ved uriktige faktapåstander, sterke beskyldninger, identifisering eller omtale som kan skade omdømme.",
    cautiousLanguage: [
      "Det kan stilles spørsmål ved om omtalen er uriktig, sterkt belastende eller omdømmeskadelig.",
      "Dette bør beskrives som mulig rettslig spor, ikke som en konklusjon.",
      "Vurdering av erstatning, oppreisning eller straffeansvar bør gjøres av advokat eller relevant myndighet.",
    ],
  },
];

export const mediaEthicsKnowledgeBase = {
  vvpRules,
  editorResponsibilityRules,
  pfuContextRules,
  legalContextRules,
};

export function getPfuRelevantRules() {
  return vvpRules;
}

export function getReportContextRules() {
  return [
    ...vvpRules,
    ...editorResponsibilityRules,
    ...pfuContextRules,
    ...legalContextRules,
  ];
}

export function getPublicDebateRules() {
  return [
    ...pfuContextRules,
    ...legalContextRules,
    ...editorResponsibilityRules,
  ];
}

export function formatRulesForPrompt(rules: MediaEthicsRule[]) {
  return rules
    .map((rule) => {
      return [
        `${rule.title}`,
        `Kilde: ${rule.source}`,
        `Kort forklaring: ${rule.summary}`,
        `Relevans: ${rule.relevance}`,
        `Forsiktig språk: ${rule.cautiousLanguage.join(" / ")}`,
      ].join("\n");
    })
    .join("\n\n");
}
