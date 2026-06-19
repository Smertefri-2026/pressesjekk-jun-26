import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

const quickPoints = [
  "PresseSjekk gir veiledende analyser og dokumenthjelp.",
  "Tjenesten erstatter ikke advokat, PFU, redaktøransvar eller domstolene.",
  "Brukeren har ansvar for å kontrollere rapporter og klageutkast før bruk.",
  "Sensitive dokumenter bør ikke sendes via kontaktskjema.",
];

const sections = [
  {
    title: "1. Om tjenesten",
    text: "PresseSjekk er en digital tjeneste som hjelper brukere med å strukturere og vurdere medieomtale, tilsvar, dokumentasjon, rettsstatus og mulige presseetiske problemstillinger. Tjenesten kan brukes til forhåndssjekk, rapporter, rapportversjoner og utkast til PFU-klage eller annen videre oppfølging.",
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
    title: "8. Gratis forhåndssjekk",
    text: "Gratis forhåndssjekk kan gi en kort og foreløpig vurdering av mulige problemområder. Gratisversjonen er ikke en full rapport og kan ha begrensninger i dybde, dokumentasjon, lagring og videre oppfølging.",
  },
  {
    title: "9. Betalte rapporter og credits",
    text: "Betalte funksjoner kan senere omfatte full rapport, rapportversjoner, PFU-klageutkast, dokumentasjonsliste, profftilgang og credits. Priser, innhold og vilkår kan endres før lansering og vil fremgå tydelig før kjøp.",
  },
  {
    title: "10. Rapportversjoner",
    text: "En mediesak kan endre seg etter publisering. Brukeren bør derfor kunne oppdatere artikkeldata, tilsvar, rettsstatus og dokumentasjon, og eventuelt generere nye rapportversjoner. Tidligere rapporter kan bygge på opplysninger som senere blir endret.",
  },
  {
    title: "11. Profftilgang",
    text: "Profftilgang kan senere tilbys advokater, rådgivere, organisasjoner og virksomheter. Proffbrukere kan få tilgang til flere saker, klientmapper, flere brukere, rapportoversikt, credits og utvidede funksjoner.",
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

const beforeLaunch = [
  "Legg inn juridisk navn på virksomheten",
  "Avklar refusjon/angrerett for digitale rapporter",
  "Avklar endelige priser og credits",
  "Avklar ansvar ved AI-feil og brukerfeil",
  "Avklar proffavtale for advokater/rådgivere",
  "Kvalitetssikre vilkårene juridisk før lansering",
];

export default function VilkarPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link href="/" className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">
          ← Tilbake til forsiden
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Vilkår
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Bruksvilkår for PresseSjekk.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Disse vilkårene beskriver hvordan PresseSjekk kan brukes, hva
              tjenesten leverer, hvilke forbehold som gjelder, og hvilket ansvar
              brukeren selv har ved bruk av rapporter og klageutkast.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pressesjekk"
                className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800"
              >
                Start sjekk
              </Link>
              <Link
                href="/personvern"
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
              >
                Se personvern
              </Link>
            </div>
          </section>

          <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-7">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
              Foreløpig versjon
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Må kvalitetssikres før lansering
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Dette er et gjennomarbeidet utkast. Vilkårene må oppdateres når
              endelig selskap, betalingsløsning, AI-løsning og datalagring er
              bestemt.
            </p>
          </aside>
        </div>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Kort forklart
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              De viktigste forbeholdene
            </h2>

            <div className="mt-8 grid gap-3">
              {quickPoints.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800"
                >
                  <span className="mr-2 text-cyan-700">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Hovedprinsipp
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Struktur og dokumenthjelp
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              PresseSjekk skal hjelpe brukeren med å forstå, strukturere og
              dokumentere en mediesak. Tjenesten skal ikke erstatte faglige,
              juridiske eller redaksjonelle vurderinger.
            </p>
          </aside>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Utkast til vilkår
          </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Bruksvilkår
          </h2>

          <div className="mt-8 space-y-5">
            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <h3 className="text-xl font-black text-slate-950">
                  {section.title}
                </h3>
                <p className="mt-3 leading-8 text-slate-700">
                  {section.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Før lansering
              </p>
              <h2 className="mt-3 text-4xl font-black">
                Dette må avklares senere
              </h2>
              <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                Når tjenesten er nærmere lansering, bør vilkårene oppdateres
                med konkrete betalingsvilkår, refusjon, angrerett, juridisk
                virksomhetsnavn og tydelig ansvarsbegrensning.
              </p>
            </div>

            <div className="grid gap-3">
              {beforeLaunch.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}
