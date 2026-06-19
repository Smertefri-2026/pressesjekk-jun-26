import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

const benefits = [
  {
    title: "Sjekk sterke påstander før publisering",
    text: "Få en strukturert gjennomgang av om saken inneholder sterke faktiske beskyldninger som bør forelegges den omtalte tydeligere.",
  },
  {
    title: "Test samtidig imøtegåelse",
    text: "Se om henvendelsen til den omtalte er konkret nok, om svarfristen virker rimelig, og om svaret er håndtert på en ryddig måte.",
  },
  {
    title: "Vurder identifisering og skadevirkning",
    text: "Få hjelp til å vurdere om navn, bilde, sted, rolle eller indirekte opplysninger kan gjøre en person identifiserbar.",
  },
  {
    title: "Reduser risiko for klager",
    text: "PresseSjekk kan brukes som en ekstra kontroll før publisering, særlig i krevende saker med konflikt, straffesak eller stor belastning.",
  },
];

const checklist = [
  "Er de sentrale påstandene tydelige og dokumenterte?",
  "Har den omtalte fått vite hva beskyldningene konkret gjelder?",
  "Er svarfristen rimelig i forhold til sakens alvor?",
  "Er svaret fra den omtalte gjengitt korrekt og relevant?",
  "Er tittel og ingress dekkende for innholdet?",
  "Er identifisering nødvendig og forholdsmessig?",
  "Er rettsstatus presist forklart?",
  "Bør saken oppdateres ved ny utvikling?",
];

const useCases = [
  "Nyhetssaker med sterke beskyldninger",
  "Krim- og rettssaker",
  "Lokale konfliktsaker",
  "Kritiske saker om bedrifter eller organisasjoner",
  "Saker der kilder står mot hverandre",
  "Saker med bilder, navn eller indirekte identifisering",
];

export default function ForJournalisterPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <Link href="/" className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">
          ← Tilbake til forsiden
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              For journalister og redaksjoner
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Sjekk saken før den blir en klagesak.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              PresseSjekk kan brukes før publisering som et ekstra kontrollpunkt
              for presseetikk, samtidig imøtegåelse, kildebruk, identifisering
              og rettsstatus. Målet er ikke å svekke journalistikken – men å
              styrke den.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pressesjekk"
                className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800"
              >
                Test en sak
              </Link>
              <Link
                href="/eksempelrapport"
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
              >
                Se eksempelrapport
              </Link>
            </div>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-7 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Redaksjonell trygghet
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              PresseSjekk er for bedre journalistikk
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              En god sak tåler kontroll. PresseSjekk kan hjelpe redaksjoner med
              å se svake punkter før publisering – særlig i saker som kan få
              store konsekvenser for enkeltpersoner.
            </p>

            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Typisk bruk
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                Før publisering
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sjekk om saken bør styrkes før publisering, ikke først etter at
                klagen kommer.
              </p>
            </div>
          </aside>
        </div>

        <section className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 text-lg font-black text-cyan-800">
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
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Redaksjonell sjekkliste
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Spørsmål saken bør tåle
            </h2>
            <p className="mt-4 max-w-3xl leading-8 text-slate-700">
              Dette er eksempler på kontrollspørsmål PresseSjekk kan hjelpe
              journalister og redaktører med å gå gjennom før publisering.
            </p>

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {checklist.map((item) => (
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
              Viktig presisering
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">
              Ikke en fasit – et kontrollverktøy
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              PresseSjekk skal ikke overta redaktøransvaret. Tjenesten skal
              heller gi en strukturert gjennomgang av mulige risikopunkter, slik
              at redaksjonen kan gjøre bedre vurderinger før publisering.
            </p>

            <ul className="mt-6 space-y-3 text-sm font-medium text-slate-700">
              <li>• Redaksjonen tar selv beslutningen.</li>
              <li>• AI-vurderingen er veiledende.</li>
              <li>• Saken må vurderes journalistisk og konkret.</li>
              <li>• PresseSjekk erstatter ikke redaktørens ansvar.</li>
            </ul>
          </aside>
        </section>

        <section className="mt-16 rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Når bør redaksjonen bruke PresseSjekk?
              </p>
              <h2 className="mt-3 text-4xl font-black">
                Særlig nyttig i krevende saker
              </h2>
              <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                Mange klager handler ikke bare om én formulering, men om hele
                prosessen: kildegrunnlag, kontakt før publisering, tittel,
                identifisering og hvordan den omtaltes svar blir håndtert.
              </p>
            </div>

            <div className="grid gap-3">
              {useCases.map((item) => (
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

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Klar for å teste?
          </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Sjekk saken før publisering
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-700">
            Bruk PresseSjekk som et ekstra kontrollpunkt når saken er krevende,
            belastende eller kan utløse klage.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/pressesjekk"
              className="rounded-xl bg-cyan-500 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-400"
            >
              Start sjekk
            </Link>
            <Link
              href="/for-advokater"
              className="rounded-xl border border-slate-300 px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
            >
              Se proffløsning
            </Link>
          </div>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}
