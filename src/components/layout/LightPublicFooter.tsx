import Link from "next/link";

export function LightPublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 text-sm text-slate-600 lg:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <p className="text-lg font-black text-slate-950">PresseSjekk</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
            Strukturert kontroll av medieomtale
          </p>
          <p className="mt-4 max-w-2xl leading-7">
            PresseSjekk gir veiledende analyser og dokumenthjelp. Tjenesten
            erstatter ikke advokat, PFU, redaktøransvar eller domstolene.
          </p>
        </div>

        <nav className="flex flex-wrap gap-4 font-semibold lg:justify-end">
          <Link href="/pressesjekk" className="hover:text-slate-950">
            Start sjekk
          </Link>
          <Link href="/hvordan-det-fungerer" className="hover:text-slate-950">
            Slik fungerer det
          </Link>
          <Link href="/journalister" className="hover:text-slate-950">
            Journalister
          </Link>
          <Link href="/advokater" className="hover:text-slate-950">
            Advokater
          </Link>
          <Link href="/eksempelrapport" className="hover:text-slate-950">
            Eksempelrapport
          </Link>
          <Link href="/priser" className="hover:text-slate-950">
            Priser
          </Link>
          <Link href="/min-side" className="hover:text-slate-950">
            Min Side
          </Link>
          <Link href="/kontakt" className="hover:text-slate-950">
            Kontakt
          </Link>
          <Link href="/personvern" className="hover:text-slate-950">
            Personvern
          </Link>
          <Link href="/vilkar" className="hover:text-slate-950">
            Vilkår
          </Link>
        </nav>
      </div>
    </footer>
  );
}
