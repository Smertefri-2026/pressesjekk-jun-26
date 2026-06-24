import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

const packages = [
  {
    tag: "Steg 1–3",
    name: "Rapportpakke",
    price: "Fra 490 kr",
    description:
      "For deg som vil samle saken, legge inn dokumentasjon og få en strukturert PresseSjekk-rapport.",
    features: [
      "1 sak",
      "Sak registrert",
      "Saksopplysninger / publiseringsgrunnlag",
      "Rapport med KI-basert vurdering",
      "Nedlasting som PDF og tekst",
      "Passer for både privatpersoner, virksomheter og journalister",
    ],
    href: "/pressesjekk",
    button: "Start med rapportpakke",
  },
  {
    tag: "Steg 1–4",
    name: "PFU-pakke",
    price: "Fra 1 490 kr",
    description:
      "For deg som vil gå videre fra rapport til et strukturert PFU-klageutkast.",
    features: [
      "Alt i Rapportpakke",
      "PFU-klageutkast med KI",
      "Presseetisk vurdering opp mot VVP",
      "Nedlasting av PFU-klage som PDF og tekst",
      "Kan oppgraderes videre til full dokumentpakke",
    ],
    href: "/pressesjekk",
    button: "Velg PFU-pakke",
  },
  {
    tag: "Steg 1–6",
    name: "Full dokumentpakke",
    price: "Fra 2 990 kr",
    description:
      "For deg som ønsker komplett digital saksgang med rapport, PFU-spor og politianmeldelse.",
    features: [
      "Alt i PFU-pakke",
      "PFU-avgjørelse / status",
      "Politianmeldelse med førsteside",
      "Dokumentgrunnlag og forbehold",
      "Nedlasting som komplett PDF",
      "Best grunnlag før eventuell utredningspakke",
    ],
    href: "/pressesjekk",
    button: "Velg full dokumentpakke",
  },
  {
    tag: "Manuell hjelp",
    name: "Utredningspakke",
    price: "Fra 9 900 kr",
    description:
      "For større eller mer alvorlige saker der du ønsker manuell gjennomgang, strukturering og videre strategi.",
    features: [
      "Manuell vurdering av saken",
      "Gjennomgang av dokumentasjon",
      "Kvalitetssikring av rapport og dokumentpakke",
      "Forslag til videre strategi",
      "Kan brukes før advokat, PFU eller annen videre oppfølging",
      "Pris avhenger av sakens omfang",
    ],
    href: "/kontakt",
    button: "Be om utredningspakke",
  },
];

const upgrades = [
  {
    title: "Fra rapport til PFU",
    text: "Har du startet med Rapportpakke, kan du oppgradere til PFU-pakke dersom saken bør klages videre.",
  },
  {
    title: "Fra PFU til full dokumentpakke",
    text: "Har du PFU-pakke, kan du oppgradere til full dokumentpakke med politianmeldelse og mer komplett dokumentgrunnlag.",
  },
  {
    title: "Flere saker",
    text: "Brukere som jobber med flere saker bør kunne kjøpe ekstra saksplasser eller en større pakke.",
  },
];

export default function PriserPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link href="/" className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">
          ← Tilbake til forsiden
        </Link>

        <div className="mt-10">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
            Priser
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl md:text-7xl">
            Velg pakken som passer saken.
          </h1>

          <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
            PresseSjekk kan brukes til enkel rapport, PFU-klage, full dokumentpakke
            eller manuell utredning. Du kan starte enkelt og oppgradere dersom saken
            trenger mer oppfølging.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/pressesjekk"
              className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800"
            >
              Start sjekk
            </Link>
            <Link
              href="/eksempelrapport"
              className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
            >
              Se eksempelrapport
            </Link>
          </div>
        </div>

        <section className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {packages.map((plan) => (
            <article
              key={plan.name}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="inline-flex w-fit rounded-full bg-cyan-100 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-cyan-800">
                {plan.tag}
              </p>

              <h2 className="mt-5 text-2xl font-black text-slate-950">
                {plan.name}
              </h2>

              <p className="mt-3 text-4xl font-black text-slate-950">
                {plan.price}
              </p>

              <p className="mt-4 leading-8 text-slate-700">
                {plan.description}
              </p>

              <ul className="mt-6 space-y-3 text-sm font-medium text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-cyan-700">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className="mt-8 block rounded-xl bg-cyan-500 px-5 py-4 text-center font-black text-slate-950 hover:bg-cyan-400"
              >
                {plan.button}
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Oppgradering
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Start enkelt. Oppgrader når saken krever mer.
          </h2>

          <p className="mt-4 max-w-3xl leading-8 text-slate-700">
            Mange saker starter med behov for oversikt. Dersom rapporten viser at
            saken bør tas videre, kan brukeren oppgradere til PFU-pakke, full
            dokumentpakke eller utredningspakke.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {upgrades.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <h3 className="text-xl font-black text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-slate-950 p-5 text-white shadow-sm sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Proffbrukere
              </p>

              <h2 className="mt-3 text-3xl font-black sm:text-4xl">
                For advokater, rådgivere, organisasjoner og redaksjoner.
              </h2>

              <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                Profesjonelle brukere kan ha behov for flere saker, flere
                dokumentpakker, klientoversikt, redaksjonell kvalitetssikring og
                løpende tilgang. Proffløsning bør prises etter antall brukere,
                saker og rapportvolum.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <p className="font-black text-white">Profftilgang</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Første forslag: fra 4 990 kr per måned for virksomheter med
                løpende behov. Endelig pris avhenger av antall brukere og saker.
              </p>
              <Link
                href="/kontakt"
                className="mt-5 inline-block rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 hover:bg-cyan-300"
              >
                Kontakt oss
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-8">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Klar til å starte?
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Start med én sak.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-700">
            Du kan begynne med rapportpakken og oppgradere dersom saken bør tas
            videre til PFU, full dokumentpakke eller utredningspakke.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/pressesjekk"
              className="rounded-xl bg-cyan-500 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-400"
            >
              Start sjekk
            </Link>
            <Link
              href="/kontakt"
              className="rounded-xl border border-slate-300 px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
            >
              Kontakt oss
            </Link>
          </div>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}
