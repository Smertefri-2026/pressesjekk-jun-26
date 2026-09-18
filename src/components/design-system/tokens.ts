/**
 * PresseSjekk Design System 1.0
 *
 * Kilden til sannhet for farger, typografi, radius, skygge og spacing på
 * tvers av PresseSjekk. Dette er IKKE et nytt fargesystem - det er en
 * dokumentasjon og håndheving av mønstrene som allerede fantes i Card,
 * Button, Badge og StatCard, ryddet til én tydelig regel per rolle
 * (Fase 7.2, etter designanalysen i Fase 7).
 *
 * Bruk disse konstantene i nye komponenter i stedet for å finne opp nye
 * Tailwind-klasser. Avvik er greit når konteksten faktisk krever det
 * (f.eks. et bevisst mørkt "Neste steg"-panel) - men avviket bør da være
 * en bevisst beslutning, ikke en tilfeldighet.
 */

// --- Farger ------------------------------------------------------------
// Én rolle, én farge. "brand"/"primary" er ALDRI oransje noe sted i appen
// lenger (Fase 7.2 Blokk 1) - rødt er eneste hovedsignal for handling.

export const COLOR_ROLES = {
  /** Hovedhandling: knapper, aktive lenker, eyebrows, "du er her". */
  brand: { bg: "bg-red-500", bgHover: "hover:bg-red-600", text: "text-white", accentText: "text-red-700" },
  /** Sterk, men underordnet handling - "gå videre i saksgangen"-knapper. */
  secondary: { bg: "bg-slate-950", bgHover: "hover:bg-slate-800", text: "text-white" },
  /** Nøytral bakgrunn/kort/kant - grunnspråket i hele appen. */
  neutral: { bg: "bg-white", border: "border-slate-200", text: "text-slate-950", muted: "text-slate-500" },
  /** Ferdig / godkjent / vellykket. */
  success: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800" },
  /** Under behandling / krever oppmerksomhet, ikke en feil. */
  warning: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800" },
  /** Feil / mangler / kan ikke fullføres. */
  danger: { bg: "bg-red-50", border: "border-red-200", text: "text-red-800" },
  /** Nøytral opplysning, ikke status. */
  info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900" },
} as const;

// --- Typografi -----------------------------------------------------------
// Sterk vekt (font-black) reserveres for tall og hovedoverskrifter - IKKE
// for løpende tekst, beskrivelser eller hjelpetekst (Fase 7.2 Blokk 4).

export const TEXT_ROLES = {
  h1: "text-4xl font-black tracking-tight text-slate-950 sm:text-5xl md:text-7xl [text-wrap:balance]",
  h2: "text-3xl font-black text-slate-950 sm:text-4xl",
  h3: "text-xl font-bold text-slate-950",
  /** Løpende tekst - middels vekt, ikke bold. Dette er den viktigste enkeltendringen i Fase 7.2. */
  body: "text-base font-normal leading-7 text-slate-700",
  /** Hjelpetekst, beskrivelser, sekundær informasjon under en overskrift. */
  bodySecondary: "text-sm font-medium leading-6 text-slate-500",
  /** Skjemalabel. */
  label: "text-sm font-bold text-slate-800",
  /** Liten, uppercase seksjonsmarkør - "DOKUMENTASJON", "SAKSARKIV" osv. */
  eyebrow: "text-sm font-bold uppercase tracking-[0.25em] text-red-700",
  /** Tekst inni knapper. */
  button: "font-black",
  /** Store, tellende tall (StatCard, StatusSummary). Beholder full vekt bevisst. */
  numeric: "font-black text-slate-950 tabular-nums",
} as const;

// --- Radius --------------------------------------------------------------
// Fire bevisste nivåer + pill - ikke tilfeldig variasjon, men én regel per
// rolle. "compact" er den eneste bevisste, navngitte unntaksrollen; den
// brukes KUN for tette rad-handlinger i tabeller/lister (Saksarkiv,
// Evidence-paneler), aldri som en tilfeldig fjerde knappevariant.

export const RADIUS = {
  /** Store kort, paneler, seksjoner - matcher Card-komponenten. */
  container: "rounded-3xl",
  /** Knapper - matcher Button-komponenten. */
  control: "rounded-xl",
  /** Skjemafelt (input/textarea/select) og mindre nøstede bokser inni et kort. */
  field: "rounded-2xl",
  /** Tette rad-handlinger i tabeller/lister der en full control-radius blir uforholdsmessig stor. */
  compact: "rounded-lg",
  /** Badges, statuspiller, avatarer. */
  pill: "rounded-full",
} as const;

// --- Skygge ----------------------------------------------------------------
// Disiplinen som allerede fantes (168×shadow-sm, nesten aldri annet) -
// dokumentert her som regel, ikke endret.

export const SHADOW = {
  /** Standard for alle kort. */
  base: "shadow-sm",
  /** Kun ved hover på klikkbare kort (StatCard). Aldri som hviletilstand. */
  hover: "hover:shadow-md",
} as const;

// --- Spacing -------------------------------------------------------------
// Konsekvent skala for luft mellom seksjoner / inni kort. Bruk disse
// fremfor å finne opp nye mt-/gap-verdier.

export const SPACING = {
  /** Mellom store seksjoner på en side. */
  section: "mt-10",
  /** Mellom kort i en liste/grid. */
  stack: "gap-4",
  /** Innvendig padding, standard kort. */
  cardPadding: "p-5 sm:p-7",
  /** Innvendig padding, kompakt kort/nøstet boks. */
  tightPadding: "p-4",
} as const;
