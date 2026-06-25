import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

const steps = [
  {
    title: "Sak registrert",
    text: "Start med å opprette en sak. Du legger inn tittel, medieomtale, lenke eller artikkeltekst og en kort forklaring av hva saken gjelder.",
  },
  {
    title: "Saksopplysninger",
    text: "Her samler du fakta, tilsvar, kontakt med redaksjonen, rettsstatus, dokumentasjon og vedlegg. Dette blir grunnlaget for resten av saksgangen.",
  },
  {
    title: "Rapport",
    text: "PresseSjekk kan lage en strukturert rapport som peker på mulige presseetiske problemområder, dokumentasjon og anbefalte neste steg.",
  },
  {
    title: "PFU-klage",
    text: "Dersom saken bør vurderes videre, kan systemet lage et utkast til PFU-klage basert på saken, rapporten og dokumentasjonen.",
  },
  {
    title: "PFU-avgjørelse",
    text: "Når PFU har behandlet saken, kan du registrere avgjørelsen og bruke den videre i dokumentasjonen.",
  },
  {
    title: "Politianmeldelse",
    text: "I alvorlige saker kan du lage et nøkternt utkast til politianmeldelse eller vurderingsgrunnlag. Dette må alltid kvalitetssikres før bruk.",
  },
  {
    title: "Utredningspakke",
    text: "For større saker kan du samle rapport, PFU-spor, politianmeldelse, dokumentasjon, tidslinje og vedlegg i en mer komplett utredning.",
  },
];

const packages = [
  {
    title: "Rapportpakke",
    text: "Gir tilgang til sak, saksopplysninger og rapport.",
    steps: "Steg 1–3",
  },
  {
    title: "PFU-pakke",
    text: "Gir tilgang til rapport og utkast til PFU-klage.",
    steps: "Steg 1–4",
  },
  {
    title: "Full dokumentpakke",
    text: "Gir tilgang til rapport, PFU-spor, PFU-avgjørelse og politianmeldelse.",
    steps: "Steg 1–6",
  },
  {
    title: "Utredningspakke",
    text: "Gir tilgang til hele saksgangen og samlet utredning for større saker.",
    steps: "Steg 1–7",
  },
];

const checks = [
  "Samtidig imøtegåelse",
  "Tilsvar og svarfrist",
  "Kildebruk og dokumentasjon",
  "Tittel, ingress og helhetsinntrykk",
  "Identifisering og skadevirkning",
  "Privatliv og bildebruk",
  "Rettstatus, dom og henleggelse",
  "Oppdateringsbehov",
  "PFU-spor",
  "Videre oppfølging",
];

const notDoing = [
  "PresseSjekk avgjør ikke om pressen har brutt god presseskikk.",
  "PresseSjekk erstatter ikke advokat, PFU, politiet eller domstolene.",
  "PresseSjekk garanterer ikke at en klage eller anmeldelse fører frem.",
  "Brukeren må selv kontrollere og godkjenne alt før innsending.",
];

export default function HvordanDetFungererPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/"
          className="text-sm font-semibold text-cyan-700 hover:text-cyan-900"
        >
          ← Tilbake til forsiden
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Slik fungerer det
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Fra medieartikkel til komplett dokumentpakke.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              PresseSjekk er bygget som en saksgang. Du starter med én
              mediesak, samler opplysninger og dokumentasjon, og kan deretter
              bygge rapport, PFU-klage, politianmeldelse og utredning etter
              behov.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pressesjekk"
                className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800"
              >
                Start sjekk
              </Link>
              <Link
                href="/priser"
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
              >
                Se pakker og priser
              </Link>
            </div>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-7 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Kort forklart
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Ikke bare en URL-sjekk
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              En mediesak handler ofte om mer enn teksten i artikkelen. Derfor
              ser PresseSjekk også på tilsvar, kontakt før publisering,
              dokumentasjon, rettsstatus, vedlegg og videre oppfølging.
            </p>

            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Hovedidé
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                Artikkel + dokumentasjon + saksgang
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Jo bedre grunnlag du legger inn, desto bedre kan rapportene og
                dokumentpakkene struktureres.
              </p>
            </div>
          </aside>
        </div>

        <section className="mt-16">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Prosessen
          </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Syv steg fra sak til utredning
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-lg font-black text-cyan-800">
                  {index + 1}
                </div>
                <h3 className="text-xl font-black text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-4 leading-7 text-slate-600">{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 lg:grid-cols-4">
          {packages.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-700">
                {item.steps}
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                {item.title}
              </h2>
              <p className="mt-4 leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Hva vurderes?
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Mulige problemområder i mediesaken
            </h2>
            <p className="mt-4 max-w-3xl leading-8 text-slate-700">
              PresseSjekk hjelper deg å strukturere spørsmål som ofte går igjen
              i mediesaker: fikk den omtalte reell mulighet til å svare, var
              saken godt nok dokumentert, og er identifiseringen
              forholdsmessig?
            </p>

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {checks.map((item) => (
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

          <aside className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
              Viktig forbehold
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Veiledning, ikke fasit
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              PresseSjekk skal gi struktur, oversikt og dokumenthjelp. Det er
              ikke en domstol, ikke PFU, ikke politiet og ikke en erstatning for
              juridisk rådgivning.
            </p>

            <ul className="mt-6 space-y-3 text-sm font-medium text-slate-700">
              {notDoing.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="mt-16 rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Hva får du?
              </p>
              <h2 className="mt-3 text-4xl font-black">
                En trinnvis vei videre
              </h2>
              <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                Du trenger ikke bestille alt med én gang. Start med saken, og
                oppgrader til riktig dokumentpakke dersom saken krever mer
                dokumentasjon, klageutkast eller utredning.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <h3 className="font-black text-white">Rapport</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Strukturert vurdering av saken og mulige problemområder.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <h3 className="font-black text-white">PFU-klage</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Utkast til klage basert på sak, rapport og dokumentasjon.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <h3 className="font-black text-white">Politianmeldelse</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Nøkternt utkast i alvorlige saker der dette må vurderes.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <h3 className="font-black text-white">Utredning</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Samlet dokumentpakke med utredningsgrunnlag og vedleggsliste.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Klar til å prøve?
          </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Start med én sak
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-700">
            Du kan starte med URL eller artikkeltekst. Senere kan du legge til
            mer dokumentasjon og bygge en mer komplett dokumentpakke.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/pressesjekk"
              className="rounded-xl bg-cyan-500 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-400"
            >
              Start sjekk
            </Link>
            <Link
              href="/priser"
              className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
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
