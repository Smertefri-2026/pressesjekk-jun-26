import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

const sections = [
  {
    title: "1. Om tjenesten",
    text: "PresseSjekk er en digital tjeneste som hjelper brukere med å strukturere og vurdere medieomtale, tilsvar, dokumentasjon, rettsstatus og mulige presseetiske problemstillinger. Tjenesten kan brukes til rask sjekk, raskrapport, lagrede saker, rapporter, rapportversjoner, utkast til PFU-klage, politianmeldelse, utredning og annen videre oppfølging.",
  },
  {
    title: "2. Hvem kan bruke PresseSjekk?",
    text: "Tjenesten kan brukes av privatpersoner, bedrifter, organisasjoner, journalister, advokater, PR-rådgivere og andre som ønsker en strukturert vurdering av medieomtale eller publisering. Enkelte funksjoner kan senere kreve innlogging, betaling eller profftilgang.",
  },
  {
    title: "3. Ikke juridisk rådgivning",
    text: "PresseSjekk gir ikke juridisk rådgivning og erstatter ikke advokat. Rapportene og klageutkastene er veiledende arbeidsdokumenter. Brukeren må selv vurdere om saken bør tas videre til advokat, redaktør, PFU, domstol eller annen instans.",
  },
  {
    title: "4. Ikke PFU-avgjørelse",
    text: "PresseSjekk avgjør ikke om pressen har brutt god presseskikk. Tjenesten kan peke på mulige presseetiske problemstillinger, men gir ingen garanti for at en klage fører frem i PFU eller andre organer.",
  },
  {
    title: "5. Brukerens ansvar",
    text: "Brukeren er ansvarlig for at opplysninger som legges inn er korrekte, relevante og lovlig å bruke. Brukeren må kontrollere alle rapporter, analyser, dokumentlister og klageutkast før de brukes eller sendes videre.",
  },
  {
    title: "6. Dokumentasjon og vedlegg",
    text: "Brukeren bør bare legge inn dokumentasjon som er relevant for saken. Sensitive dokumenter bør ikke sendes via kontaktskjema. Når sikker opplasting er på plass, bør dokumentasjon legges inn direkte på en lagret sak.",
  },
  {
    title: "7. Kunstig intelligens",
    text: "PresseSjekk kan bruke kunstig intelligens til å analysere artikkeltekst, tilsvar, dokumentasjon og rettsstatus. AI-resultater kan inneholde feil, mangler eller vurderinger som må kontrolleres. AI-analyser skal alltid forstås som veiledende.",
  },
  {
    title: "8. Rask sjekk og raskrapport",
    text: "Rask sjekk kan gi en kort og foreløpig vurdering av mulige problemområder uten innlogging. Raskrapporten er ikke en rapportpakke, og den bygger normalt på begrenset informasjon. Den kan vise søketeller, foreløpige temaer, mulige VVP-punkter, juridiske rammer og anbefalt neste steg.",
  },
  {
    title: "9. Betalte rapportpakker og dokumentpakker",
    text: "Betalte funksjoner kan omfatte rapportpakke, PFU-pakke, full dokumentpakke, politianmeldelse, dokumentasjonsliste, utredningspakke og eventuell profftilgang. Priser, innhold og vilkår skal fremgå tydelig før kjøp. Betaling kan senere håndteres gjennom Stripe eller annen betalingsleverandør.",
  },
  {
    title: "10. Rapportversjoner",
    text: "En mediesak kan endre seg etter publisering. Brukeren bør derfor kunne oppdatere artikkeldata, tilsvar, rettsstatus og dokumentasjon, og eventuelt generere nye rapportversjoner. Tidligere rapporter kan bygge på opplysninger som senere blir endret.",
  },
  {
    title: "11. Profftilgang",
    text: "Profftilgang kan tilbys advokater, PR-rådgivere, redaksjoner, organisasjoner og virksomheter. Proffbrukere kan få tilgang til flere saker per måned, flere brukere, rapportoversikt, dokumentpakker og utvidede funksjoner.",
  },
  {
    title: "12. Tilgjengelighet og tekniske feil",
    text: "PresseSjekk kan være utilgjengelig ved vedlikehold, tekniske feil, leverandørproblemer eller videreutvikling. Det gis ingen garanti for at tjenesten alltid vil være tilgjengelig uten avbrudd.",
  },
  {
    title: "13. Ansvarsbegrensning",
    text: "PresseSjekk er ikke ansvarlig for tap som følge av brukerens bruk av rapporter, analyser, klageutkast eller annen informasjon fra tjenesten. Brukeren må selv vurdere, kontrollere og kvalitetssikre alt innhold før videre bruk.",
  },
  {
    title: "14. Immaterielle rettigheter",
    text: "Design, tekst, struktur, funksjonalitet og innhold i PresseSjekk tilhører PresseSjekk eller relevante rettighetshavere. Brukeren kan bruke rapporter og dokumenter som genereres for egen sak, men kan ikke kopiere eller videreselge tjenesten som egen løsning.",
  },
  {
    title: "15. Personvern",
    text: "Bruk av tjenesten innebærer behandling av personopplysninger. Dette er nærmere beskrevet i personvernerklæringen. Brukeren bør lese personvernerklæringen før sensitive eller belastende opplysninger legges inn.",
  },
  {
    title: "16. Endringer i vilkårene",
    text: "Vilkårene kan oppdateres når tjenesten utvikles videre, særlig ved innføring av innlogging, betaling, dokumentopplasting, AI-analyse, rapportgenerering, profftilgang eller nye leverandører.",
  },
];

export default function VilkarPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link href="/" className="text-sm font-semibold text-red-700 hover:text-red-900">
          ← Tilbake til forsiden
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-700">
              Vilkår
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl md:text-7xl">
              Bruksvilkår for PresseSjekk.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Disse vilkårene beskriver hvordan PresseSjekk kan brukes, hva
              tjenesten leverer, hvilke forbehold som gjelder, og hvilket ansvar
              brukeren selv har ved bruk av raskrapporter, rapporter,
              klageutkast, politianmeldelser, utredninger og andre dokumenter.
            </p>
          </section>

          <aside className="hidden overflow-hidden rounded-3xl border border-red-200 bg-white shadow-sm lg:block">
            <div className="relative min-h-[280px] bg-slate-950 p-7 text-white">
              <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-red-500/20 blur-2xl" />
              <div className="absolute bottom-6 left-6 h-28 w-28 rounded-full bg-orange-400/20 blur-2xl" />

              <div className="relative">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-300">
                  Vilkår og ansvar
                </p>

                <div className="mt-8 rounded-2xl border border-white/10 bg-white/10 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-400 text-sm font-black text-slate-950">
                      ✓
                    </span>
                    <div className="h-3 flex-1 rounded-full bg-white/60" />
                  </div>
                  <div className="mt-5 grid gap-2">
                    <div className="h-2 rounded-full bg-white/25" />
                    <div className="h-2 w-2/3 rounded-full bg-white/20" />
                  </div>
                </div>

                <p className="mt-7 text-sm leading-7 text-slate-300">
                  Vilkårene forklarer hva tjenesten kan hjelpe med, hvilke
                  forbehold som gjelder, og hva brukeren selv må kontrollere.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
            Vilkår
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Bruksvilkår
          </h2>

          <div className="mt-8 space-y-5">
            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <h3 className="text-lg font-black text-slate-950 sm:text-xl">
                  {section.title}
                </h3>
                <p className="mt-3 leading-8 text-slate-700">
                  {section.text}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}
