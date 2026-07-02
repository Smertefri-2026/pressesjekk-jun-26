import Link from "next/link";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_390px] lg:items-center">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-blue-700">
              404 / Siden finnes ikke
            </p>

            <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Denne siden er visst blitt avindeksert.
            </h1>

            <p className="mt-7 max-w-3xl text-xl leading-9 text-slate-700">
              Enten har lenken blitt flyttet, slettet eller så har den aldri
              eksistert. Heldigvis kan du fortsatt finne veien tilbake til
              PresseSjekk.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800"
              >
                Til forsiden
              </Link>
              <Link
                href="/pressesjekk"
                className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-bold text-slate-950 hover:bg-slate-100"
              >
                Start sjekk
              </Link>
              <Link
                href="/kontakt"
                className="rounded-xl border border-blue-300 bg-blue-50 px-6 py-4 font-bold text-blue-900 hover:bg-blue-100"
              >
                Kontakt oss
              </Link>
            </div>
          </section>

          <aside className="rounded-3xl border border-blue-200 bg-blue-50 p-7 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-800">
              Feil side, riktig spor
            </p>

            <h2 className="mt-4 text-3xl font-black text-slate-950">
              Kanskje du leter etter dette?
            </h2>

            <div className="mt-6 grid gap-3">
              <Link
                href="/hvordan-det-fungerer"
                className="rounded-2xl bg-white p-4 font-black text-slate-950 shadow-sm hover:bg-slate-50"
              >
                Slik fungerer det
              </Link>
              <Link
                href="/priser"
                className="rounded-2xl bg-white p-4 font-black text-slate-950 shadow-sm hover:bg-slate-50"
              >
                Priser og pakker
              </Link>
              <Link
                href="/proff"
                className="rounded-2xl bg-white p-4 font-black text-slate-950 shadow-sm hover:bg-slate-50"
              >
                Proffløsning
              </Link>
              <Link
                href="/eksempelrapport"
                className="rounded-2xl bg-white p-4 font-black text-slate-950 shadow-sm hover:bg-slate-50"
              >
                Eksempelrapport
              </Link>
            </div>

            <p className="mt-6 text-sm leading-7 text-slate-600">
              404 betyr bare at siden ikke finnes. Det betyr ikke at saken er
              tapt.
            </p>
          </aside>
        </div>
      </section>

      <LightPublicFooter />
    </main>
  );
}
