import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

const roles = [
  "Jeg er omtalt i saken",
  "Jeg er pårørende",
  "Jeg representerer bedrift/organisasjon",
  "Jeg er journalist",
  "Jeg er advokat/PR-rådgiver",
  "Jeg sjekker som leser",
];

const contactOptions = [
  "Ja, e-post",
  "Ja, SMS",
  "Ja, telefon",
  "Ja, annet",
  "Nei, jeg ble ikke kontaktet",
  "Usikker",
];

export default function PressesjekkPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <PublicHeader />

        <div className="py-14">
          <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
            ← Tilbake til forsiden
          </Link>

          <div className="mt-8 max-w-4xl">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              Start PresseSjekk
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-6xl">
              Sjekk en artikkel mot presseetiske og rettslige problemstillinger
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              PresseSjekk vurderer ikke bare teksten i artikkelen, men også
              om du fikk reell mulighet til tilsvar, om saken gjelder en
              straffesak, og om artikkelen bør vurderes opp mot presseetikk,
              uskyldspresumsjon og rettsstatus.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_380px]">
            <section className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm font-semibold text-cyan-300">Steg 1</p>
                <h2 className="mt-2 text-2xl font-bold">
                  Hvem bruker PresseSjekk?
                </h2>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {roles.map((role) => (
                    <label
                      key={role}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm hover:border-cyan-300/60"
                    >
                      <input type="radio" name="role" />
                      <span>{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm font-semibold text-cyan-300">Steg 2</p>
                <h2 className="mt-2 text-2xl font-bold">Legg inn artikkel</h2>

                <div className="mt-5 space-y-4">
                  <input
                    type="text"
                    placeholder="Lim inn URL til artikkelen..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
                  />

                  <textarea
                    placeholder="Eller lim inn artikkeltekst her..."
                    rows={7}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
                  />

                  <div className="rounded-2xl border border-dashed border-white/20 bg-slate-900 p-5 text-sm text-slate-300">
                    PDF-opplasting kommer senere. Først bygger vi skjema og
                    brukerflyt.
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm font-semibold text-cyan-300">Steg 3</p>
                <h2 className="mt-2 text-2xl font-bold">
                  Tilsvar og kontakt før publisering
                </h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-slate-300">
                      Ble du kontaktet før publisering?
                    </label>
                    <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-cyan-300">
                      {contactOptions.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-slate-300">
                      Fikk du konkrete beskyldninger?
                    </label>
                    <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-cyan-300">
                      <option>Ja</option>
                      <option>Delvis</option>
                      <option>Nei</option>
                      <option>Usikker</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-slate-300">
                      Hvor lang svarfrist fikk du?
                    </label>
                    <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-cyan-300">
                      <option>Ingen tydelig frist</option>
                      <option>Under 1 time</option>
                      <option>1–3 timer</option>
                      <option>Samme dag</option>
                      <option>1 dag</option>
                      <option>Flere dager</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-slate-300">
                      Ble svaret ditt tatt med?
                    </label>
                    <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-cyan-300">
                      <option>Ja, korrekt</option>
                      <option>Ja, men bare delvis</option>
                      <option>Nei</option>
                      <option>Svaret ble gjengitt feil</option>
                      <option>Ikke relevant</option>
                    </select>
                  </div>
                </div>

                <textarea
                  placeholder="Skriv kort hva som skjedde før publisering..."
                  rows={5}
                  className="mt-5 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
                />
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm font-semibold text-cyan-300">Steg 4</p>
                <h2 className="mt-2 text-2xl font-bold">
                  Straffesak, dom og rettsstatus
                </h2>
                <p className="mt-3 text-slate-300">
                  Dette er viktig hvis artikkelen omtaler mistanke, siktelse,
                  tiltale, dom, henleggelse eller frifinnelse. Opplysningene
                  kan brukes i vurderingen av identifisering, uskyldspresumsjon,
                  oppdateringsbehov og mulig skadevirkning.
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-slate-300">
                      Er du / den omtalte knyttet til en straffesak?
                    </label>
                    <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-cyan-300">
                      <option>Nei</option>
                      <option>Ja, som mistenkt</option>
                      <option>Ja, som siktet</option>
                      <option>Ja, som tiltalt</option>
                      <option>Ja, som fornærmet</option>
                      <option>Ja, som vitne</option>
                      <option>Usikker</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-slate-300">
                      Finnes det rettskraftig dom?
                    </label>
                    <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-cyan-300">
                      <option>Ikke relevant</option>
                      <option>Nei, saken er ikke avgjort</option>
                      <option>Ja, dommen er rettskraftig</option>
                      <option>Ja, men dommen er anket</option>
                      <option>Saken ble henlagt</option>
                      <option>Jeg / den omtalte ble frifunnet</option>
                      <option>Usikker</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-slate-300">
                      Blir du / den omtalte navngitt eller identifisert?
                    </label>
                    <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-cyan-300">
                      <option>Ja, fullt navn</option>
                      <option>Ja, bilde</option>
                      <option>Ja, indirekte identifisering</option>
                      <option>Nei</option>
                      <option>Usikker</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm text-slate-300">
                      Er artikkelen oppdatert etter ny utvikling?
                    </label>
                    <select className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none focus:border-cyan-300">
                      <option>Ikke relevant</option>
                      <option>Ja</option>
                      <option>Nei</option>
                      <option>Delvis</option>
                      <option>Usikker</option>
                    </select>
                  </div>
                </div>

                <textarea
                  placeholder="Skriv kort om status i saken, dom, henleggelse, frifinnelse eller annen utvikling..."
                  rows={5}
                  className="mt-5 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300"
                />
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <p className="text-sm font-semibold text-cyan-300">Steg 5</p>
                <h2 className="mt-2 text-2xl font-bold">Dokumentasjon</h2>
                <p className="mt-3 text-slate-300">
                  Her skal brukeren senere kunne laste opp e-post, SMS,
                  skjermbilder, PDF, dom, kjennelse, henleggelse, svar fra
                  redaktør og andre vedlegg.
                </p>

                <div className="mt-5 rounded-2xl border border-dashed border-white/20 bg-slate-900 p-6 text-center text-sm text-slate-400">
                  Opplasting av vedlegg kommer i databasefasen.
                </div>
              </div>
            </section>

            <aside className="h-fit rounded-3xl border border-cyan-300/30 bg-cyan-300/10 p-6 lg:sticky lg:top-8">
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
                Gratis forhåndsresultat
              </p>

              <h2 className="mt-4 text-2xl font-bold">Demoresultat</h2>

              <div className="mt-5 rounded-2xl bg-slate-950 p-5">
                <p className="text-sm text-slate-400">Foreløpig risikonivå</p>
                <p className="mt-2 text-4xl font-bold text-amber-300">
                  Middels/høy
                </p>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-200">
                <p>Mulige problemområder:</p>
                <ul className="list-inside list-disc space-y-2 text-slate-300">
                  <li>Samtidig imøtegåelse</li>
                  <li>Kildebruk og dokumentasjon</li>
                  <li>Tittel og ingress</li>
                  <li>Identifisering</li>
                  <li>Rettstatus / straffesak</li>
                  <li>Mulig oppdateringsbehov</li>
                </ul>
              </div>

              <button className="mt-6 w-full rounded-xl bg-cyan-300 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-200">
                Lås opp full rapport
              </button>

              <p className="mt-4 text-xs leading-6 text-slate-400">
                Dette er kun dummydata. Senere vil rapporten genereres basert
                på artikkel, tilsvar, rettsstatus og dokumentasjon.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
