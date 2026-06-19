import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

const contactOptions = [
  {
    title: "Jeg er omtalt i media",
    text: "Bruk PresseSjekk hvis du ønsker å vurdere en artikkel, dokumentere tilsvar eller forberede videre oppfølging.",
    href: "/pressesjekk",
    label: "Start sjekk",
  },
  {
    title: "Jeg ønsker profftilgang",
    text: "For advokater, PR-rådgivere, organisasjoner eller bedrifter som ønsker klientmapper, flere saker og credits.",
    href: "/advokater",
    label: "Les om proffløsning",
  },
  {
    title: "Jeg er journalist eller redaksjon",
    text: "For spørsmål om bruk av PresseSjekk før publisering, redaksjonell kontroll eller presseetisk kvalitetssikring.",
    href: "/journalister",
    label: "For journalister",
  },
];

const formTopics = [
  "Spørsmål om PresseSjekk",
  "Profftilgang",
  "Feil eller problem med rapport",
  "Presse/redaksjon",
  "Personvern eller sletting",
  "Annet",
];

export default function KontaktPage() {
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
              Kontakt
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Ta kontakt om PresseSjekk.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Har du spørsmål om en mediesak, profftilgang, rapporter,
              personvern eller hvordan PresseSjekk fungerer? Her kan du velge
              riktig vei videre.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/pressesjekk"
                className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800"
              >
                Start sjekk
              </Link>
              <Link
                href="/hvordan-det-fungerer"
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
              >
                Slik fungerer det
              </Link>
            </div>
          </section>

          <aside className="rounded-3xl border border-cyan-200 bg-cyan-50 p-7 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-800">
              Raskeste vei
            </p>
            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Start med en sjekk
            </h2>
            <p className="mt-4 leading-8 text-slate-700">
              Hvis spørsmålet gjelder en konkret artikkel, er det ofte best å
              starte med en gratis forhåndssjekk. Da får du samlet artikkel,
              tilsvar og dokumentasjon på ett sted.
            </p>

            <Link
              href="/pressesjekk"
              className="mt-6 block rounded-xl bg-cyan-500 px-5 py-4 text-center font-black text-slate-950 hover:bg-cyan-400"
            >
              Start gratis sjekk
            </Link>
          </aside>
        </div>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          {contactOptions.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
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

        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
              Kontaktskjema
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Send en melding
            </h2>
            <p className="mt-4 max-w-3xl leading-8 text-slate-700">
              Skjemaet er foreløpig en prototype. Når databasen og e-postsystemet
              kobles på, skal meldinger kunne sendes og logges sikkert.
            </p>

            <form className="mt-8 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-slate-700">
                    Navn
                  </label>
                  <input
                    type="text"
                    placeholder="Ditt navn"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">
                    E-post
                  </label>
                  <input
                    type="email"
                    placeholder="din@epost.no"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">
                  Hva gjelder henvendelsen?
                </label>
                <select className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500">
                  <option>Velg tema</option>
                  {formTopics.map((topic) => (
                    <option key={topic}>{topic}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">
                  Melding
                </label>
                <textarea
                  rows={7}
                  placeholder="Skriv kort hva du ønsker hjelp med..."
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-cyan-500"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />
                <span>
                  Jeg bekrefter at jeg er et menneske og ikke en robot.
                  Senere kan denne boksen erstattes med Google reCAPTCHA,
                  hCaptcha eller Cloudflare Turnstile.
                </span>
              </label>

              <button
                type="button"
                className="rounded-xl bg-cyan-500 px-6 py-4 font-black text-slate-950 hover:bg-cyan-400"
              >
                Send melding
              </button>
            </form>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-7 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
                Viktig
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Ikke send sensitive dokumenter her
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Kontaktskjemaet bør ikke brukes til å sende sensitive dokumenter
                før sikker opplasting er på plass. Dokumentasjon bør senere
                lastes opp direkte på en lagret sak.
              </p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-700">
                Skjult mottaker
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                E-post vises ikke offentlig
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Kontaktskjemaet skal senere sende meldinger til en skjult
                mottakeradresse på serversiden. E-postadressen bør ikke vises
                direkte på nettsiden, fordi den kan plukkes opp av roboter og
                spamverktøy.
              </p>
              <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">
                Teknisk løsning senere: mottaker legges som miljøvariabel, for
                eksempel CONTACT_TO_EMAIL, og brukes kun i serverkode.
              </p>
            </section>

            <section className="rounded-3xl bg-slate-950 p-7 text-white shadow-sm">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
                Profftilgang
              </p>
              <h2 className="mt-3 text-2xl font-black">
                For advokater og rådgivere
              </h2>
              <p className="mt-4 leading-8 text-slate-300">
                Proffbrukere bør kunne få klientmapper, flere saker, credits og
                rapportoversikt.
              </p>
              <Link
                href="/advokater"
                className="mt-6 inline-block rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950 hover:bg-cyan-300"
              >
                Les om proffløsning
              </Link>
            </section>
          </aside>
        </section>
      </section>

      <LightPublicFooter />
    </main>
  );
}
