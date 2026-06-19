export const adminStats = [
  { label: "Brukere", value: "128", note: "+24 siste 7 dager" },
  { label: "Saker", value: "312", note: "47 aktive saker" },
  { label: "Analyser", value: "1 284", note: "183 siste døgn" },
  { label: "Betalinger", value: "42 180 kr", note: "Dummy tall" },
  { label: "OpenAI-kostnad", value: "1 940 kr", note: "Må overvåkes" },
  { label: "Feilede jobber", value: "7", note: "Krever sjekk" },
];

export const popularArticles = [
  {
    title: "VG-artikkel om større mediesak",
    media: "VG",
    checks: 47,
    risk: "Høy",
  },
  {
    title: "Lokalavis-artikkel med manglende tilsvar",
    media: "Lokalavis",
    checks: 31,
    risk: "Middels",
  },
  {
    title: "Artikkel om rettssak og identifisering",
    media: "Nettavis",
    checks: 22,
    risk: "Middels/høy",
  },
];

export const latestCases = [
  {
    user: "Privatperson",
    case: "Ny artikkel lagt inn",
    status: "Venter på analyse",
    time: "07:12",
  },
  {
    user: "Advokatkonto",
    case: "PFU-klage generert",
    status: "Ferdig",
    time: "06:48",
  },
  {
    user: "Bedrift",
    case: "Full rapport kjøpt",
    status: "Betalt",
    time: "06:21",
  },
  {
    user: "Journalist",
    case: "Før publisering-sjekk",
    status: "Gratis preview",
    time: "05:55",
  },
];
