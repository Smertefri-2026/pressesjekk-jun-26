import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

const sections = [
  {
    title: "1. Behandlingsansvarlig",
    text: "Behandlingsansvarlig for PresseSjekk er eier og driver av tjenesten. Kontakt for personvernspørsmål: post [a] pressesjekk.no.",
  },
  {
    title: "2. Hva er PresseSjekk?",
    text: "PresseSjekk er en tjeneste for strukturert vurdering av medieomtale, tilsvar, dokumentasjon, rettsstatus og mulige presseetiske problemstillinger. Tjenesten kan brukes av personer som er omtalt i media, journalister, advokater, rådgivere, virksomheter og organisasjoner.",
  },
  {
    title: "3. Hvilke opplysninger behandler vi?",
    text: "Vi kan behandle opplysninger du selv legger inn i kontaktskjema, artikkelsjekk, Min Side eller senere betalings- og rapportfunksjoner. Dette kan være navn, e-postadresse, artikkel-URL, artikkeltekst, beskrivelser av saken, dokumentasjon, tilsvar, rettsstatus og rapporter. Dersom du laster opp dokumenter, kan disse inneholde personopplysninger om deg eller andre.",
  },
  {
    title: "4. Sensitive eller belastende opplysninger",
    text: "Mediesaker kan inneholde sensitive, private eller belastende opplysninger. Du bør derfor bare legge inn opplysninger som er nødvendige for saken. Kontaktskjemaet skal ikke brukes til å sende sensitive dokumenter. Når sikker opplasting er på plass, bør dokumentasjon legges inn direkte på en lagret sak.",
  },
  {
    title: "5. Formål med behandlingen",
    text: "Opplysningene brukes for å levere tjenesten: gjennomføre rask sjekk, vise raskrapport, telle hvor mange ganger en URL er sjekket, opprette sak, lagre dokumentasjon, lage rapport, generere rapportversjoner, lage utkast til PFU-klage, politianmeldelse eller utredning, gi brukerstøtte, behandle betaling og sikre tjenesten mot misbruk og spam.",
  },
  {
    title: "6. Behandlingsgrunnlag",
    text: "Behandlingen vil normalt bygge på at du ber oss levere en tjeneste til deg, at vi må oppfylle en avtale eller forberede en avtale, at vi har en berettiget interesse i å sikre og forbedre tjenesten, eller at vi må oppfylle rettslige forpliktelser. For enkelte opplysninger kan samtykke eller særskilt behandlingsgrunnlag bli aktuelt. Dette må vurderes nærmere før endelig lansering.",
  },
  {
    title: "7. Kontaktskjema",
    text: "Når du bruker kontaktskjemaet, behandler vi navn, e-postadresse, valgt tema og meldingen du sender. Henvendelsen sendes til en skjult mottakeradresse som ikke vises offentlig på nettsiden. Kontaktskjemaet skal brukes til generelle henvendelser, ikke innsending av sensitive dokumenter.",
  },
  {
    title: "8. Cloudflare Turnstile",
    text: "Kontaktskjemaet bruker Cloudflare Turnstile for å beskytte mot spam og automatiserte innsendinger. Turnstile hjelper med å vurdere om henvendelsen kommer fra et menneske. Cloudflare kan behandle tekniske opplysninger i forbindelse med sikkerhetskontrollen.",
  },
  {
    title: "9. Rask sjekk og raskrapport",
    text: "Rask sjekk kan brukes uten innlogging. Når du limer inn en artikkel-URL, kan PresseSjekk lagre URL-en, normalisert URL, rollevalg, tidspunkt, søketeller og en foreløpig KI-basert raskrapport. Raskrapporten er en offentlig forhåndsvurdering og skal ikke inneholde sensitive dokumenter.",
  },
  {
    title: "10. Min Side og lagrede saker",
    text: "Når du bruker Min Side og innlogging, kan du opprette og lagre saker. En sak kan bestå av artikkeldata, dokumentasjon, tilsvar, rettsstatus, rapporter, PFU-klage, politianmeldelse, utredning og vedlegg. Brukeren bør kunne oppdatere saken, legge til nye dokumenter og generere nye rapportversjoner.",
  },
  {
    title: "11. Bruk av kunstig intelligens",
    text: "PresseSjekk kan bruke kunstig intelligens for å lage raskrapporter, analysere artikkeltekst, tilsvar, dokumentasjon og rettsstatus, og generere rapporter, PFU-klage, politianmeldelse og utredning. AI-resultater er veiledende. De skal ikke forstås som juridisk rådgivning, PFU-avgjørelse, politiets vurdering eller garanti for utfallet av en klage. Brukeren må alltid kontrollere innhold før bruk.",
  },
  {
    title: "12. Leverandører og databehandlere",
    text: "PresseSjekk kan bruke eksterne leverandører for hosting, database, sikkerhet, e-post, betaling, dokumentlagring og AI-analyse. Disse leverandørene kan behandle personopplysninger på vegne av PresseSjekk. Før lansering må konkrete leverandører og nødvendige databehandleravtaler dokumenteres.",
  },
  {
    title: "13. Betaling og dokumentpakker",
    text: "Når betaling kobles på, kan opplysninger om kjøp av rapportpakker, PFU-pakker, full dokumentpakke, utredningspakke, kvitteringer og abonnement behandles. Betalingsopplysninger vil normalt håndteres av en betalingsleverandør som Stripe. PresseSjekk skal ikke lagre kortinformasjon direkte.",
  },
  {
    title: "14. Lagringstid",
    text: "Opplysninger lagres så lenge det er nødvendig for formålet de ble samlet inn for. Saker bør kunne slettes av brukeren eller etter forespørsel. Endelige lagringstider må fastsettes før lansering, blant annet for kontaktskjema, lagrede saker, rapporter, vedlegg, betalingsdata og sikkerhetslogger.",
  },
  {
    title: "15. Sikkerhet",
    text: "PresseSjekk skal bruke tekniske og organisatoriske tiltak for å beskytte opplysninger mot uautorisert tilgang, tap, endring eller misbruk. Dette kan omfatte tilgangsstyring, innlogging, kryptert overføring, sikker dokumentlagring, logging, backup og begrenset tilgang for administratorer.",
  },
  {
    title: "16. Dine rettigheter",
    text: "Du kan ha rett til innsyn, retting, sletting, begrensning av behandling, dataportabilitet og å protestere mot behandling. Du kan også ha rett til å klage til Datatilsynet. Før du klager til Datatilsynet, bør du først kontakte virksomheten som behandler opplysningene.",
  },
  {
    title: "17. Sletting av konto og saker",
    text: "Når innlogging og Min Side er på plass, bør brukeren kunne be om sletting av konto, enkeltsaker, rapporter og vedlegg. Noen opplysninger kan likevel måtte lagres i en periode dersom det er nødvendig for regnskap, sikkerhet, dokumentasjon eller rettslige forpliktelser.",
  },
  {
    title: "18. Endringer i personvernerklæringen",
    text: "Denne personvernerklæringen kan oppdateres når tjenesten utvikles. Endringer kan bli nødvendige når vi innfører innlogging, betaling, dokumentopplasting, AI-analyse, rapportgenerering, e-postutsending eller nye leverandører.",
  },
];

export default function PersonvernPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link href="/" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
          ← Tilbake til forsiden
        </Link>

        <div className="mt-10">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-700">
              Personvern
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl md:text-7xl">
              Personvernerklæring for PresseSjekk.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Denne erklæringen forklarer hvordan PresseSjekk behandler
              personopplysninger når du bruker nettsiden, kontaktskjemaet,
              rask sjekk, raskrapport, Min Side, rapportpakker,
              dokumentpakker og senere betalingsfunksjoner.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/kontakt"
                className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800"
              >
                Kontakt oss
              </Link>
            </div>
          </section>
        </div>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-700">
            Erklæring
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Slik behandler vi personopplysninger
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
