import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

const audienceCards = [
  {
    title: "Personer omtalt i media",
    text: "For deg som ønsker oversikt over hva som er publisert, om du fikk mulighet til tilsvar, og hvilken dokumentasjon som finnes.",
  },
  {
    title: "Proffbrukere",
    text: "For advokater, PR-rådgivere, redaksjoner og organisasjoner som ønsker en strukturert saksoversikt og et tydeligere grunnlag for videre vurdering.",
  },
  {
    title: "Journalister og redaksjoner",
    text: "For redaksjoner som ønsker et ekstra kontrollpunkt for tilsvar, dokumentasjon, rettsstatus og mulige presseetiske risikopunkter før eller etter publisering.",
  },
  {
    title: "Organisasjoner og virksomheter",
    text: "For virksomheter som trenger en ryddig måte å håndtere omtale, feil, tilsvar, dokumentasjon og videre oppfølging.",
  },
];

const principles = [
  "Tydelig skille mellom fakta, dokumentasjon og vurdering",
  "Strukturert gjennomgang av artikkel, tilsvar og rettsstatus",
  "Veiledende analyser, ikke bastante konklusjoner",
  "Rapporter som kan oppdateres når saken utvikler seg",
  "Bedre grunnlag før dialog med redaksjon, advokat, PFU eller videre oppfølging",
  "Ryddig dokumenthjelp for krevende mediesaker",
  "Mulighet for å bygge saken videre fra rapport til utredningspakke",
];

const steps = [
  {
    title: "Fra uoversiktlig sak",
    text: "Mediesaker kan ofte bestå av artikler, e-poster, SMS-er, tilsvar, dokumenter, henleggelser, dommer og nye opplysninger.",
  },
  {
    title: "Til strukturert oversikt",
    text: "PresseSjekk samler hovedpunktene i en struktur som gjør det enklere å se hva saken faktisk handler om.",
  },
  {
    title: "Til rapport og videre valg",
    text: "Brukeren kan få en veiledende rapport, dokumentasjonsliste og eventuelt utkast til videre oppfølging.",
  },
];

export default function OmPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link href="/" className="text-sm font-semibold text-red-700 hover:text-red-900">
          ← Tilbake til forsiden
        </Link>

        <section className="mt-10 grid gap-10 lg:grid-cols-[1fr_390px] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-700">
              Om PresseSjekk
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              En ryddigere måte å forstå medieomtale på.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              PresseSjekk er laget for å hjelpe mennesker, virksomheter,
              rådgivere og redaksjoner med å strukturere mediesaker, samle
              dokumentasjon og forstå hvilke spørsmål som bør undersøkes videre
              før rapport, PFU-klage, politianmeldelse eller utredning.
            </p>

          </div>

          <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <img
              src="/images/om1.png"
              alt="Illustrasjon av en uoversiktlig mediesak som blir strukturert til dokumentasjon og rapport."
              className="h-full min-h-[230px] w-full object-cover sm:min-h-[320px] lg:min-h-[390px]"
            />
          </figure>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
            Hvorfor PresseSjekk finnes
          </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Mange står alene når medieomtale først er publisert
          </h2>
          <p className="mt-5 max-w-4xl leading-8 text-slate-700">
            Bakgrunnen for PresseSjekk er erfaringen med hvor vanskelig det kan
            være å få hjelp når medieomtale oppleves uriktig, skjev,
            belastende eller mangelfullt dokumentert. Arbeidet med ideen
            startet etter en konkret mediesak i 2014, og har siden handlet om å
            forstå hvilke muligheter som faktisk finnes når noen mener seg
            feilaktig eller urimelig omtalt.
          </p>
          <p className="mt-4 max-w-4xl leading-8 text-slate-700">
            Gjennom samtaler med fagfolk, organisasjoner, rådgivere og personer
            med erfaring fra mediesaker ble det tydelig at mange savner et
            praktisk verktøy før saken eventuelt går videre til redaksjon, PFU,
            advokat, politi eller annen oppfølging.
          </p>
          <p className="mt-4 max-w-4xl leading-8 text-slate-700">
            PresseSjekk er derfor bygget rundt prinsippet dokumentasjon før
            konklusjon: samle fakta, tilsvar, kontakt med redaksjonen,
            rettsstatus, vedlegg og egne opplysninger på ett sted før man tar
            neste steg.
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
            Hovedidé
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">
            Dokumentasjon før konklusjon
          </h2>
          <p className="mt-4 max-w-4xl leading-8 text-slate-700">
            PresseSjekk skal ikke forhåndsdømme medier, personer eller saker.
            Målet er å samle fakta, tilsvar, dokumentasjon og rettsstatus på en
            måte som gir bedre grunnlag for videre vurdering, enten det gjelder
            rapport, PFU-klage, politianmeldelse eller utredning.
          </p>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">
                {index + 1}
              </div>
              <h2 className="mt-6 text-2xl font-black text-slate-950">
                {step.title}
              </h2>
              <p className="mt-4 leading-8 text-slate-700">{step.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
              Prinsipper
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Slik skal PresseSjekk arbeide
            </h2>

            <div className="mt-8 grid gap-3">
              {principles.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800"
                >
                  <span className="mr-2 text-red-700">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
              Viktig forbehold
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Ikke advokat, PFU eller domstol
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              PresseSjekk gir veiledende analyser og dokumenthjelp. Tjenesten
              erstatter ikke advokat, PFU, redaktøransvar eller domstolene.
              Brukeren må selv kontrollere og kvalitetssikre alt innhold før
              det brukes videre.
            </p>
          </aside>
        </section>

        <section className="mt-16 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <figure className="border-b border-slate-200 bg-slate-50">
            <img
              src="/images/om3.png"
              alt="Illustrasjon av ulike brukere som samler dokumentasjon i en felles mediesak."
              className="h-full min-h-[220px] w-full object-cover sm:min-h-[320px]"
              loading="lazy"
            />
          </figure>

          <div className="p-5 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
              For hvem
            </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Hvem PresseSjekk kan hjelpe
          </h2>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {audienceCards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <h3 className="text-xl font-black text-slate-950">
                  {card.title}
                </h3>
                <p className="mt-3 leading-8 text-slate-700">{card.text}</p>
              </article>
            ))}
          </div>
          </div>
        </section>

        <section className="mt-16 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-sm">
          <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_460px] lg:items-stretch">
            <div className="grid content-start gap-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-300">
                  Visjon
                </p>
                <h2 className="mt-3 text-4xl font-black">
                  Mer presise mediesaker. Bedre dokumentasjon. Ryddigere prosesser.
                </h2>
                <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                  Målet er ikke å svekke pressen, men å bidra til bedre
                  dokumentasjon, tydeligere tilsvar og mer etterprøvbare
                  prosesser når medieomtale får store konsekvenser.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-300">
                  Neste steg
                </p>
                <p className="mt-4 text-2xl font-black">
                  Start med en enkel sjekk av artikkelen.
                </p>
                <Link
                  href="/pressesjekk"
                  className="mt-6 inline-flex rounded-xl bg-red-500 px-6 py-4 font-black text-white hover:bg-orange-600"
                >
                  Start sjekk
                </Link>
              </div>
            </div>

            <figure className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <img
                src="/images/om2.png"
                alt="Illustrasjon av dokumentasjon som samles til rapport og videre vurdering."
                className="h-full min-h-[240px] w-full object-cover sm:min-h-[320px] lg:min-h-[420px]"
                loading="lazy"
              />
            </figure>
          </div>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}
