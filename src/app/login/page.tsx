import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { LightPublicFooter } from "@/components/layout/LightPublicFooter";
import { LightPublicHeader } from "@/components/layout/LightPublicHeader";

const benefits = [
  "Lagre mediesaker på Min Side",
  "Kom tilbake og oppdater saken senere",
  "Se rapporter og rapportversjoner",
  "Bygg dokumentasjon steg for steg",
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <LightPublicHeader />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link href="/" className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">
          ← Tilbake til forsiden
        </Link>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_460px] lg:items-start">
          <section>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-700">
              Min Side
            </p>

            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Logg inn og lagre PresseSjekk-saker.
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-9 text-slate-700">
              Med en konto kan du lagre saker, dokumentere tilsvar, følge
              utviklingen og senere hente frem rapporter og klageutkast.
            </p>

            <div className="mt-8 grid max-w-2xl gap-3">
              {benefits.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 shadow-sm"
                >
                  <span className="mr-2 text-cyan-700">✓</span>
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-7">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-700">
                Viktig
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                Ikke last opp sensitive dokumenter ennå
              </h2>
              <p className="mt-4 leading-8 text-slate-700">
                I denne første versjonen lager vi innlogging og lagring av
                saker. Sikker dokumentopplasting kommer senere.
              </p>
            </div>
          </section>

          <AuthForm />
        </div>
      </section>

      <LightPublicFooter />
    </main>
  );
}
