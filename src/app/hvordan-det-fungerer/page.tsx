import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

const steps = [
  {
    title: "Legg inn artikkel",
    text: "Start med URL, PDF eller artikkeltekst. PresseSjekk bruker dette som grunnlag for å forstå hva saken handler om, hvem som omtales og hvilke påstander som fremsettes.",
  },
  {
    title: "Svar på spørsmål om tilsvar",
    text: "Du registrerer om du ble kontaktet før publisering, om beskyldningene ble forelagt tydelig, hvor lang svarfrist du fikk og om svaret ditt ble tatt med.",
  },
  {
    title: "Legg til rettsstatus",
    text: "Hvis saken gjelder mistanke, siktelse, tiltale, dom, henleggelse eller frifinnelse, kan dette legges inn som en del av vurderingen.",
  },
  {
    title: "Last opp dokumentasjon",
    text: "Samle e-post, SMS, skjermbilder, dommer, henleggelser, tilsvar og annen dokumentasjon som kan være relevant for saken.",
  },
  {
    title: "Få foreløpig vurdering",
    text: "Gratis forhåndssjekk gir en kort oversikt over mulige problemområder og om saken kan være verdt å gå videre med.",
  },
  {
    title: "Lås opp rapport og klageutkast",
    text: "Full rapport kan gi strukturert vurdering, mulige presseetiske problemstillinger, vedleggsliste og utkast til PFU-klage.",
  },
];

const checks = [
  "Samtidig imøtegåelse",
  "Tilsvar",
  "Kildebruk og dokumentasjon",
  "Tittel og ingress",
  "Identifisering",
  "Privatliv",
  "Bildebruk",
  "Rettssak, dom og henleggelse",
  "Oppdateringsbehov",
  "Helhetsinntrykk og balanse",
];

const notDoing = [
  "PresseSjekk avgjør ikke om pressen har brutt god presseskikk.",
  "PresseSjekk erstatter ikke advokat, PFU eller domstolene.",
  "PresseSjekk garanterer ikke at en klage fører frem.",
  "Brukeren må selv kontrollere og godkjenne alt før innsending.",
];

const outputs = [
  {
    title: "Gratis forhåndssjekk",
    text: "Kort vurdering av mulig risiko, hovedtema i artikkelen og hvilke punkter som kan være relevante å se nærmere på.",
  },
  {
    title: "Full rapport",
    text: "Mer detaljert gjennomgang av artikkel, tilsvar, rettsstatus, dokumentasjon og mulige presseetiske problemområder.",
  },
  {
    title: "PFU-klageutkast",
    text: "Strukturert klageutkast med innledning, sakens bakgrunn, mulige klagepunkter og forslag til vedleggsliste.",
  },
];

export default function HvordanDetFungererPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <Link href="/" className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">
          ← Tilbake til forsiden
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Slik fungerer det
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Fra medieartikkel til strukturert vurdering.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              PresseSjekk er bygget som en saksflyt. Du legger inn artikkel,
              tilsvar, rettsstatus og dokumentasjon, og får hjelp til å se om
              saken kan reise presseetiske problemstillinger.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pressesjekk"
                className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800"
              >
                Start gratis sjekk
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
              Kort forklart
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Ikke bare en URL-sjekk
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              En mediesak handler ofte om mer enn teksten i artikkelen. Derfor
              ser PresseSjekk også på prosessen før publisering, muligheten for
              tilsvar, dokumentasjonen og eventuell rettslig utvikling.
            </p>

            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Hovedidé
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                Artikkel + dokumentasjon + tilsvar
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Jo bedre grunnlag du legger inn, desto bedre kan rapporten og
                klageutkastet struktureres.
              </p>
            </div>
          </aside>
        </div>

        <section className="mt-16">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Prosessen
          </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Seks steg fra artikkel til rapport
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

        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Hva vurderes?
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Mulige presseetiske problemområder
            </h2>
            <p className="mt-4 max-w-3xl leading-8 text-slate-700">
              PresseSjekk kan hjelpe med å strukturere spørsmål som ofte går
              igjen i mediesaker: fikk den omtalte reell mulighet til å svare,
              var saken godt nok dokumentert, og er identifiseringen
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
              ikke en domstol, ikke PFU og ikke en erstatning for juridisk
              rådgivning.
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
                Fra gratis vurdering til full rapport
              </h2>
              <p className="mt-5 max-w-3xl leading-8 text-slate-300">
                Brukeren kan starte enkelt og gratis. Dersom saken virker
                alvorlig eller bør dokumenteres videre, kan man gå videre til
                betalt rapport og klageutkast.
              </p>
            </div>

            <div className="grid gap-3">
              {outputs.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <h3 className="font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
            Klar til å prøve?
          </p>
          <h2 className="mt-3 text-4xl font-black text-slate-950">
            Start med én artikkel
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-slate-700">
            Du kan starte med URL eller artikkeltekst. Senere kan du legge til
            mer dokumentasjon og bygge en mer komplett sak.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/pressesjekk"
              className="rounded-xl bg-cyan-500 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-400"
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
