import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

const roles = [
  "Jeg er omtalt i saken",
  "Jeg er pårørende",
  "Jeg representerer bedrift/organisasjon",
  "Jeg er journalist",
  "Jeg er advokat/PR-rådgiver",
  "Jeg sjekker som leser",
];

const previewFindings = [
  "Mulig behov for vurdering av samtidig imøtegåelse",
  "Spørsmål om tittel, ingress og helhetsinntrykk",
  "Mulig vurdering av identifisering eller skadevirkning",
  "Dokumentasjon bør legges til før full rapport",
];

const documentationItems = [
  "E-post fra journalist",
  "SMS eller annen kontakt før publisering",
  "Ditt svar til redaksjonen",
  "Skjermbilder av artikkel, tittel, bildebruk eller endringer",
  "Dom, henleggelse, frifinnelse eller annen rettsstatus",
  "Svar fra redaktør eller publiserte rettelser",
];

export default function PresseSjekkPage() {
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
              Start sjekk
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Sjekk en artikkel mot presseetiske problemstillinger.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Legg inn artikkel, tilsvar, rettsstatus og dokumentasjon. Først
              får du en gratis forhåndsvurdering. Hvis saken bør følges opp,
              kan du gå videre til full rapport og PFU-klageutkast.
            </p>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-7 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Gratis forhåndssjekk
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Første vurdering
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Gratisversjonen bør gi en kort indikasjon på mulige
              problemområder. Full rapport krever mer dokumentasjon og
              eventuelt betaling.
            </p>

            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">
                Foreløpig status
              </p>
              <p className="mt-2 text-3xl font-black text-amber-600">
                Ikke analysert
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Fyll ut skjemaet for å starte forhåndssjekken.
              </p>
            </div>
          </aside>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-[1fr_390px]">
          <section className="space-y-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Steg 1
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Hvem sjekker saken?
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Rollen din kan påvirke hvilke spørsmål som bør stilles videre.
                En omtalt person har ofte andre behov enn en journalist,
                advokat, bedrift eller leser.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {roles.map((role) => (
                  <label
                    key={role}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800 hover:border-cyan-300 hover:bg-cyan-50"
                  >
                    <input type="radio" name="role" className="h-4 w-4" />
                    <span>{role}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Steg 2
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Legg inn artikkel
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Du kan starte med URL. Hvis artikkelen ikke kan hentes
                automatisk, kan du lime inn teksten manuelt. PDF-opplasting kan
                legges til i databasefasen.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Artikkel-URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://avis.no/artikkel/..."
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Lim inn artikkeltekst
                  </label>
                  <textarea
                    rows={8}
                    placeholder="Lim inn hele artikkelen her dersom URL ikke kan leses..."
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                  <p className="font-bold text-slate-950">
                    PDF-opplasting kommer senere
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    I første prototype viser vi bare feltet. Senere kan PDF,
                    skjermbilder og vedlegg lagres på Min Side.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Steg 3
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Tilsvar og kontakt før publisering
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Mange presseetiske vurderinger handler om prosessen før
                publisering. Ble du kontaktet? Fikk du konkrete beskyldninger?
                Fikk du rimelig tid til å svare? Ble svaret ditt tatt med?
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Ble du kontaktet før publisering?
                  </label>
                  <select className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500">
                    <option>Velg</option>
                    <option>Ja, på e-post</option>
                    <option>Ja, på telefon</option>
                    <option>Ja, på SMS</option>
                    <option>Nei</option>
                    <option>Usikker</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Fikk du konkrete beskyldninger?
                  </label>
                  <select className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500">
                    <option>Velg</option>
                    <option>Ja</option>
                    <option>Delvis</option>
                    <option>Nei</option>
                    <option>Usikker</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Hvor lang svarfrist fikk du?
                  </label>
                  <select className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500">
                    <option>Velg</option>
                    <option>Under 1 time</option>
                    <option>1–3 timer</option>
                    <option>Samme dag</option>
                    <option>Mer enn ett døgn</option>
                    <option>Ingen tydelig frist</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Ble svaret ditt tatt med?
                  </label>
                  <select className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500">
                    <option>Velg</option>
                    <option>Ja</option>
                    <option>Delvis</option>
                    <option>Nei</option>
                    <option>Usikker</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="text-sm font-bold text-slate-700">
                  Kort forklaring
                </label>
                <textarea
                  rows={5}
                  placeholder="Forklar kort hva som skjedde før publisering..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500"
                />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Steg 4
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Rettsstatus og senere utvikling
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Dersom artikkelen handler om mistanke, siktelse, tiltale, dom,
                henleggelse eller frifinnelse, bør dette registreres. Det kan
                også være relevant om artikkelen senere burde vært oppdatert.
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Gjelder saken straffesak eller rettsstatus?
                  </label>
                  <select className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500">
                    <option>Velg</option>
                    <option>Nei</option>
                    <option>Ja, mistanke/siktelse/tiltale</option>
                    <option>Ja, dom</option>
                    <option>Ja, henleggelse</option>
                    <option>Ja, frifinnelse</option>
                    <option>Usikker</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Ble artikkelen oppdatert senere?
                  </label>
                  <select className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500">
                    <option>Velg</option>
                    <option>Ja</option>
                    <option>Nei</option>
                    <option>Delvis</option>
                    <option>Ikke relevant</option>
                    <option>Usikker</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <label className="text-sm font-bold text-slate-700">
                  Forklar rettsstatus eller senere utvikling
                </label>
                <textarea
                  rows={5}
                  placeholder="Forklar eventuell dom, henleggelse, frifinnelse, anke eller ny utvikling..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500"
                />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Steg 5
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Dokumentasjon
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Jo bedre dokumentasjon som legges inn, desto bedre kan saken
                struktureres. I første prototype viser vi hva som bør samles.
                Senere kan dette lastes opp og lagres på Min Side.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {documentationItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-800"
                  >
                    <span className="mr-2 text-cyan-700">✓</span>
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                <p className="font-bold text-slate-950">
                  Opplasting kommer i databasefasen
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  PDF, bilder, e-post og dokumenter bør senere lagres sikkert
                  under saken på Min Side.
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-cyan-200 bg-cyan-50 p-8 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
                Klar til forhåndssjekk
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                Start gratis vurdering
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                I neste fase skal denne knappen opprette en sak, lagre
                opplysningene og starte en enkel forhåndsanalyse.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <button className="rounded-xl bg-cyan-500 px-6 py-4 font-black text-slate-950 hover:bg-cyan-400">
                  Start gratis forhåndssjekk
                </button>
                <Link
                  href="/eksempelrapport"
                  className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
                >
                  Se eksempelrapport
                </Link>
              </div>
            </section>
          </section>

          <aside className="h-fit space-y-6 lg:sticky lg:top-8">
            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Forhåndsresultat
              </p>
              <h2 className="mt-4 text-3xl font-black text-slate-950">
                Demoresultat
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Når skjemaet kobles til AI senere, kan brukeren få en kort
                forhåndsvurdering her.
              </p>

              <div className="mt-6 rounded-2xl bg-amber-50 p-5">
                <p className="text-sm font-semibold text-amber-700">
                  Foreløpig risiko
                </p>
                <p className="mt-2 text-3xl font-black text-amber-700">
                  Middels/høy
                </p>
              </div>

              <ul className="mt-6 space-y-3 text-sm font-medium text-slate-700">
                {previewFindings.map((item) => (
                  <li key={item}>
                    <span className="mr-2 text-cyan-700">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-7 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
                Viktig
              </p>
              <h2 className="mt-4 text-2xl font-black text-slate-950">
                Du kan endre saken senere
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Hvis du velger feil, finner nye e-poster, får svar fra
                redaksjonen eller får ny rettsstatus, bør saken kunne
                oppdateres og rapporten genereres på nytt.
              </p>
            </section>

            <section className="rounded-3xl bg-slate-950 p-7 text-white shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Neste fase
              </p>
              <h2 className="mt-4 text-2xl font-black">
                Fra skjema til Min Side
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                Når database kobles på, skal denne flyten opprette en lagret sak
                som kan redigeres, dokumenteres og brukes til rapportversjoner.
              </p>
            </section>
          </aside>
        </div>
      </section>

      <LightPublicFooter />
    </main>
  );
}
