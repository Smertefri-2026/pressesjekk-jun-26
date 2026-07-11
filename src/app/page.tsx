import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";
import { QuickCheckBox } from "@/components/public/QuickCheckBox";

const mainBenefits = [
  {
    title: "Sjekk artikkelen",
    text: "Lim inn URL, artikkeltekst eller last opp dokumentasjon. PresseSjekk hjelper deg å strukturere hva saken faktisk handler om.",
  },
  {
    title: "Vurder tilsvar",
    text: "Se om du ble kontaktet før publisering, om beskyldningene var konkrete, og om svaret ditt ble tatt med på en ryddig måte.",
  },
  {
    title: "Bygg dokumentasjon",
    text: "Samle e-post, SMS, skjermbilder, rettsstatus, vedlegg og tidslinje på ett sted før du går videre.",
  },
  {
    title: "Få rapport og klageutkast",
    text: "Rapportpakke kan gi mulige problemområder, anbefalt neste steg og strukturert utkast til PFU-klage.",
  },
];

const audiences = [
  {
    title: "For deg som er omtalt",
    text: "Få oversikt over hva som er skrevet, hva du svarte, og hvilke punkter som bør vurderes videre.",
    href: "/pressesjekk",
    label: "Start sjekk",
  },
  {
    title: "For bedrifter og organisasjoner",
    text: "Dokumenter omtale, tilsvar, redaktørsvar, rapporter og videre oppfølging i én strukturert sak.",
    href: "/pressesjekk",
    label: "Start sak",
  },
  {
    title: "For journalister og redaksjoner",
    text: "Kvalitetssikre publiseringsgrunnlag, kilder, tilsvar og VVP-risiko før publisering eller videre arbeid.",
    href: "/min-side/saker/ny?role=journalist",
    label: "Start redaksjonell sak",
  },
  {
    title: "For proffbrukere",
    text: "For advokater, PR-rådgivere, organisasjoner og andre som jobber med flere mediesaker over tid.",
    href: "/proff",
    label: "Se proffløsning",
  },
];

const checks = [
  "Samtidig imøtegåelse",
  "Tilsvar",
  "Kildebruk",
  "Tittel og ingress",
  "Identifisering",
  "Privatliv",
  "Rettsstatus",
  "Oppdateringsbehov",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_420px] lg:items-center">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-700">
              Presseetikk, tilsvar og dokumentasjon
            </p>

            <h1 className="mt-5 max-w-5xl [text-wrap:balance] text-4xl font-black sm:text-5xl tracking-tight text-slate-950 md:text-7xl">
              Når media skriver om deg, bør du kunne sjekke dem tilbake.
            </h1>

            <p className="mt-7 max-w-3xl text-xl leading-9 text-slate-700">
              PresseSjekk hjelper deg å vurdere medieomtale, tilsvar,
              dokumentasjon og mulige presseetiske problemstillinger på ett
              sted. Start med én sak, og gå videre til rapportpakke,
              PFU-pakke, full dokumentpakke eller utredningspakke dersom saken
              bør følges opp.
            </p>

            <div className="mt-8 grid max-w-md grid-cols-2 gap-3 text-sm font-semibold text-slate-600">
              <span className="block w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-left">
                For privatpersoner
              </span>
              <span className="block w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-left">
                For bedrifter
              </span>
              <span className="block w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-left">
                For advokater
              </span>
              <span className="block w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-left">
                For redaksjoner
              </span>
            </div>
          </section>

          <figure className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
            <img
              src="/images/bilde1.png"
              alt="Skjerm med artikkel, sjekkliste og dokumentasjon samlet i PresseSjekk."
              className="h-full min-h-[360px] w-full object-cover"
            />
          </figure>
        </div>

        <section className="mt-12 rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-800">
            Rask sjekk eller egen sak
          </p>

          <h2 className="mt-4 text-4xl font-black text-slate-950">
            Start med URL og rolle
          </h2>

          <p className="mt-4 max-w-3xl leading-8 text-slate-700">
            Velg om du bare vil gjøre en rask lesersjekk, eller om du er omtalt
            i saken og bør opprette en lagret sak. Hurtigsjekken kan brukes uten
            innlogging, mens full saksgang krever Min Side.
          </p>

          <QuickCheckBox />

          <p className="mt-5 text-xs leading-6 text-slate-600">
            PresseSjekk gir veiledende dokumenthjelp. Tjenesten erstatter ikke
            advokat, PFU, redaktøransvar eller domstolene.
          </p>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {mainBenefits.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-lg font-black text-red-800">
                ✓
              </div>
              <h2 className="text-xl font-black text-slate-950">
                {item.title}
              </h2>
              <p className="mt-4 leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
              Hva sjekkes?
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              PresseSjekk ser på mer enn bare artikkelteksten
            </h2>
            <p className="mt-4 max-w-3xl leading-8 text-slate-700">
              Mange mediesaker handler ikke bare om ordene som står i
              artikkelen. Det handler også om prosessen før publisering, om
              beskyldningene ble forelagt tydelig, om svaret ble tatt med, og om
              rettsstatus er presist forklart.
            </p>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
              <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:order-2">
                <img
                  src="/images/bilde2.png"
                  alt="Oversikt over punkter PresseSjekk vurderer rundt en mediesak."
                  className="w-full object-cover"
                  loading="lazy"
                />
              </figure>

              <div className="grid gap-3 md:grid-cols-2 lg:order-1 lg:grid-cols-2">
                {checks.map((item) => (
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
          </div>

          <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
              Viktig forbehold
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Ikke en dom – men et bedre grunnlag
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              PresseSjekk avgjør ikke om pressen har brutt god presseskikk, og
              tjenesten lover ikke et bestemt resultat. Den hjelper deg å
              strukturere saken, dokumentasjonen og mulige punkter som bør
              vurderes videre.
            </p>

            <ul className="mt-6 space-y-3 text-sm font-medium text-slate-700">
              <li>• Veiledende analyse</li>
              <li>• Strukturert dokumentasjon</li>
              <li>• Mulige presseetiske problemområder</li>
              <li>• Utkast som må kontrolleres før bruk</li>
            </ul>
          </aside>
        </section>

        <section className="mt-16 rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-300">
                Bygget som saksflyt
              </p>
              <h2 className="mt-3 text-4xl font-black">
                Fra artikkel til komplett dokumentpakke
              </h2>
              <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                PresseSjekk er ikke bare en enkel URL-sjekk. Tjenesten er en
                trygg saksflyt der artikkel, tilsvar, rettsstatus,
                dokumentasjon, rapport, PFU-klage, PFU-avgjørelse, politianmeldelse og
                utredningspakke kan bygges i samme sak.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-slate-200">
                  1. Legg inn artikkel
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-slate-200">
                  2. Svar på tilsvar-spørsmål
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-slate-200">
                  3. Legg til dokumentasjon
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-semibold text-slate-200">
                  4. Generer rapport, PFU, politianmeldelse eller utredning
                </div>
              </div>
            </div>

            <figure className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] lg:self-stretch">
              <img
                src="/images/bilde3.png"
                alt="Dokumentpakke med rapport, tilsvar og dokumentasjon for en mediesak."
                className="h-full min-h-[260px] w-full object-cover"
                loading="lazy"
              />
            </figure>
          </div>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {audiences.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <h2 className="text-2xl font-black text-slate-950">
                {item.title}
              </h2>
              <p className="mt-4 leading-8 text-slate-700">{item.text}</p>
              <Link
                href={item.href}
                className="mt-6 inline-block rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-950 hover:bg-slate-100"
              >
                {item.label}
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
            Klar til å prøve?
          </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Start med rask sjekk
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-700">
            Du kan starte enkelt med URL eller artikkeltekst. Senere kan du
            legge til dokumentasjon, låse opp rapport og bygge klageutkast.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/pressesjekk"
              className="rounded-xl bg-red-500 px-6 py-4 font-bold text-slate-950 hover:bg-red-500"
            >
              Start gratis sjekk
            </Link>
            <Link
              href="/priser"
              className="rounded-xl border border-slate-300 px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
            >
              Se priser
            </Link>
          </div>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}
