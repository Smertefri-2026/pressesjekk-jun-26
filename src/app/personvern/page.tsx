import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

const quickPoints = [
  "Vi samler bare inn opplysninger som er nødvendige for å levere tjenesten.",
  "Du skal ikke sende sensitive dokumenter via kontaktskjemaet.",
  "Når Min Side er aktiv, skal du kunne be om innsyn, retting og sletting.",
  "AI-analyser er veiledende og skal ikke brukes som endelig juridisk vurdering.",
];

const dataTypes = [
  "Navn og e-postadresse",
  "Artikkel-URL, artikkeltekst eller PDF",
  "Opplysninger om kontakt med journalist eller redaksjon",
  "Tilsvar, svarfrist og redaktørsvar",
  "Dokumentasjon, skjermbilder og vedlegg",
  "Rettstatus, henleggelse, dom, frifinnelse eller ny utvikling",
  "Rapporter, rapportversjoner og PFU-klageutkast",
  "Tekniske opplysninger som IP-adresse, sikkerhetslogger og spamkontroll",
];

const sections = [
  {
    title: "1. Behandlingsansvarlig",
    text: "PresseSjekk er behandlingsansvarlig for personopplysninger som behandles gjennom tjenesten, med mindre annet er avtalt skriftlig. Når endelig selskapsstruktur er klar, skal navn på behandlingsansvarlig virksomhet, organisasjonsnummer og kontaktpunkt for personvern legges inn her.",
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
    text: "Opplysningene brukes for å levere tjenesten: opprette sak, gjennomføre forhåndssjekk, lagre dokumentasjon, lage rapport, generere rapportversjoner, lage utkast til PFU-klage, gi brukerstøtte, behandle betaling og sikre tjenesten mot misbruk og spam.",
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
    title: "9. Min Side og lagrede saker",
    text: "Når Min Side og innlogging kobles på, vil brukeren kunne opprette og lagre saker. En sak kan bestå av artikkeldata, dokumentasjon, tilsvar, rettsstatus, rapporter og klageutkast. Brukeren bør kunne oppdatere saken, legge til nye dokumenter og generere nye rapportversjoner.",
  },
  {
    title: "10. Bruk av kunstig intelligens",
    text: "PresseSjekk vil kunne bruke kunstig intelligens for å analysere artikkeltekst, tilsvar, dokumentasjon og rettsstatus. AI-resultater er veiledende. De skal ikke forstås som juridisk rådgivning, PFU-avgjørelse eller garanti for utfallet av en klage. Brukeren må alltid kontrollere rapporter og klageutkast før bruk.",
  },
  {
    title: "11. Leverandører og databehandlere",
    text: "PresseSjekk kan bruke eksterne leverandører for hosting, database, sikkerhet, e-post, betaling, dokumentlagring og AI-analyse. Disse leverandørene kan behandle personopplysninger på vegne av PresseSjekk. Før lansering må konkrete leverandører og nødvendige databehandleravtaler dokumenteres.",
  },
  {
    title: "12. Betaling og credits",
    text: "Når betaling kobles på, kan opplysninger om kjøp, credits, kvitteringer og abonnement behandles. Betalingsopplysninger vil normalt håndteres av en betalingsleverandør. PresseSjekk bør ikke lagre kortinformasjon direkte.",
  },
  {
    title: "13. Lagringstid",
    text: "Opplysninger lagres så lenge det er nødvendig for formålet de ble samlet inn for. Saker bør kunne slettes av brukeren eller etter forespørsel. Endelige lagringstider må fastsettes før lansering, blant annet for kontaktskjema, lagrede saker, rapporter, vedlegg, betalingsdata og sikkerhetslogger.",
  },
  {
    title: "14. Sikkerhet",
    text: "PresseSjekk skal bruke tekniske og organisatoriske tiltak for å beskytte opplysninger mot uautorisert tilgang, tap, endring eller misbruk. Dette kan omfatte tilgangsstyring, innlogging, kryptert overføring, sikker dokumentlagring, logging, backup og begrenset tilgang for administratorer.",
  },
  {
    title: "15. Dine rettigheter",
    text: "Du kan ha rett til innsyn, retting, sletting, begrensning av behandling, dataportabilitet og å protestere mot behandling. Du kan også ha rett til å klage til Datatilsynet. Før du klager til Datatilsynet, bør du først kontakte virksomheten som behandler opplysningene.",
  },
  {
    title: "16. Sletting av konto og saker",
    text: "Når innlogging og Min Side er på plass, bør brukeren kunne be om sletting av konto, enkeltsaker, rapporter og vedlegg. Noen opplysninger kan likevel måtte lagres i en periode dersom det er nødvendig for regnskap, sikkerhet, dokumentasjon eller rettslige forpliktelser.",
  },
  {
    title: "17. Endringer i personvernerklæringen",
    text: "Denne personvernerklæringen kan oppdateres når tjenesten utvikles. Endringer kan bli nødvendige når vi innfører innlogging, betaling, dokumentopplasting, AI-analyse, rapportgenerering, e-postutsending eller nye leverandører.",
  },
];

const laterTasks = [
  "Legg inn behandlingsansvarlig virksomhet og organisasjonsnummer",
  "Bestem personvernkontakt",
  "Beskriv endelige leverandører og databehandlere",
  "Fastsett lagringstid for saker, vedlegg og rapporter",
  "Avklar AI-behandling og databehandleravtaler",
  "Lag rutine for innsyn, retting og sletting",
];

export default function PersonvernPage() {
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
              Personvern
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Personvernerklæring for PresseSjekk.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Denne erklæringen forklarer hvordan PresseSjekk behandler
              personopplysninger når du bruker nettsiden, kontaktskjemaet,
              artikkelsjekk, Min Side og senere rapport- og betalingsfunksjoner.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/kontakt"
                className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800"
              >
                Kontakt oss
              </Link>
              <Link
                href="/vilkar"
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
              >
                Se vilkår
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
              Denne teksten er et gjennomarbeidet utkast. Den må oppdateres når
              endelig teknisk løsning, leverandører, lagringstid og
              behandlingsansvarlig virksomhet er bestemt.
            </p>
          </aside>
        </div>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Kort forklart
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Hovedprinsippene
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
              Viktig for brukere
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Ikke send mer enn nødvendig
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Mediesaker kan inneholde private eller belastende opplysninger.
              Legg bare inn informasjon som er relevant for saken, og ikke send
              sensitive dokumenter via kontaktskjemaet.
            </p>
          </aside>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Opplysninger
          </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Eksempler på opplysninger som kan behandles
          </h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-700">
            Hvilke opplysninger som behandles avhenger av hvordan du bruker
            tjenesten. En enkel kontaktmelding krever lite informasjon. En full
            PresseSjekk-sak kan inneholde mer dokumentasjon.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {dataTypes.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800"
              >
                <span className="mr-2 text-cyan-700">✓</span>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Erklæring
          </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Slik behandler vi personopplysninger
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
                Dette må fylles inn senere
              </h2>
              <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                Når teknisk løsning er endelig, bør denne siden oppdateres med
                konkret informasjon om selskap, leverandører, databehandleravtaler,
                lagringstid, sletting og kontaktpunkt.
              </p>
            </div>

            <div className="grid gap-3">
              {laterTasks.map((item) => (
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
