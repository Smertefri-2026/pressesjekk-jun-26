import Link from "next/link";
import { TurnstileBox } from "@/components/contact/TurnstileBox";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

const contactOptions = [
  {
    title: "Jeg er omtalt i media",
    text: "Gjelder det en konkret artikkel eller omtale, er det ofte best å starte med rask sjekk og deretter opprette en lagret sak.",
    href: "/pressesjekk",
    label: "Start rask sjekk",
  },
  {
    title: "Jeg ønsker profftilgang",
    text: "For advokater, PR-rådgivere, organisasjoner, virksomheter og andre som trenger flere saker, rapportpakker eller løpende dokumentasjon.",
    href: "/proff",
    label: "Les om proff",
  },
  {
    title: "Jeg vurderer utredningspakke",
    text: "For større eller mer alvorlige saker der dokumentasjon, tidslinje, rapporter, PFU-spor og videre vurdering bør samles i én strukturert pakke.",
    href: "#kontaktskjema",
    label: "Send henvendelse",
  },
];

const formTopics = [
  "Spørsmål om PresseSjekk",
  "Rask sjekk eller rapport",
  "Utredningspakke",
  "Profftilgang",
  "Teknisk feil eller problem",
  "Personvern eller sletting",
  "Presse, redaksjon eller samarbeid",
  "Annet",
];

export default function KontaktPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link href="/" className="text-sm font-semibold text-red-700 hover:text-red-900">
          ← Tilbake til forsiden
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_390px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-700">
              Kontakt
            </p>

            <h1 className="mt-4 max-w-4xl [text-wrap:balance] text-4xl font-black sm:text-5xl tracking-tight text-slate-950 md:text-7xl">
              Ta kontakt om PresseSjekk.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Har du spørsmål om PresseSjekk, rapportpakker, profftilgang,
              personvern, teknisk hjelp eller en større utredningspakke? Send
              en kort melding, så kan vi hjelpe deg videre.
            </p>

          </section>

          <figure className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:block">
            <img
              src="/images/kontakt2.png"
              alt="Illustrasjon av kontaktdialog, dokumentkort og saksmappe i PresseSjekk."
              className="h-full min-h-[390px] w-full object-cover"
            />
          </figure>
        </div>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_420px]">
          <div id="kontaktskjema" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
              Kontaktskjema
            </p>
            <h2 className="mt-3 text-4xl font-black text-slate-950">
              Send en melding
            </h2>
            <p className="mt-4 max-w-3xl leading-8 text-slate-700">
              Bruk skjemaet for spørsmål om tjenesten, priser, profftilgang,
              personvern, tekniske problemer eller større saker. Ikke send
              sensitive dokumenter gjennom kontaktskjemaet.
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
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700">
                    E-post
                  </label>
                  <input
                    type="email"
                    placeholder="din@epost.no"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">
                  Hva gjelder henvendelsen?
                </label>
                <select className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500">
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
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-950 outline-none focus:border-red-500"
                />
              </div>

              <TurnstileBox />

              <button
                type="button"
                className="rounded-xl bg-red-500 px-6 py-4 font-black text-slate-950 hover:bg-red-500"
              >
                Send melding
              </button>
            </form>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-7 lg:hidden">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-red-700">
                Raskeste vei
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Gjelder det en konkret artikkel?
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Da bør du vanligvis starte med rask sjekk. Hvis saken gjelder
                deg eller virksomheten din, kan du senere opprette en lagret sak
                og samle artikkel, tilsvar og dokumentasjon.
              </p>
              <Link
                href="/pressesjekk"
                className="mt-6 block rounded-xl bg-red-500 px-5 py-4 text-center font-black text-white hover:bg-orange-600"
              >
                Start rask sjekk
              </Link>
            </section>

            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
                Viktig
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Ikke send sensitive dokumenter her
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                Ikke lim inn sensitive personopplysninger, hele dokumentpakker
                eller private vedlegg i kontaktskjemaet. Dokumentasjon bør
                legges inn i en lagret sak når du har opprettet saken.
              </p>
            </section>

            <section className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-sm">
              <figure className="border-b border-white/10 bg-white/[0.04]">
                <img
                  src="/images/kontakt1.png"
                  alt="Illustrasjon av proffbrukere, saksmapper og dokumentflyt."
                  className="h-48 w-full object-cover"
                  loading="lazy"
                />
              </figure>

              <div className="p-5 sm:p-7">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-300">
                  Proff og utredning
                </p>
                <h2 className="mt-3 text-2xl font-black">
                  For profesjonelle brukere
                </h2>
              <p className="mt-4 leading-8 text-slate-300">
                Proffbrukere kan jobbe med flere mediesaker, rapportpakker,
                dokumentpakker, intern dokumentasjon og utredningsgrunnlag over
                tid.
              </p>
                <Link
                  href="/proff"
                  className="mt-6 inline-block rounded-xl bg-red-500 px-5 py-3 font-black text-white hover:bg-orange-600"
                >
                  Les om proff
                </Link>
              </div>
            </section>
          </aside>
        </section>

        <section className="mt-16 grid gap-6 md:grid-cols-3">
          {contactOptions.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
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
      </section>

      <LightPublicFooter />
    </main>
  );
}
