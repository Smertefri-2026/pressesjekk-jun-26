import Link from "next/link";

export function LightPublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <Link href="/" className="block">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-700">
            PresseSjekk.no
          </p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">
            PresseSjekk
          </h1>
          <p className="mt-1 hidden text-xs font-medium text-slate-500 sm:block">
            Strukturert kontroll av medieomtale
          </p>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
          <Link href="/hvordan-det-fungerer" className="hover:text-slate-950">
            Slik fungerer det
          </Link>
          <Link href="/for-journalister" className="hover:text-slate-950">
            For journalister
          </Link>
          <Link href="/for-advokater" className="hover:text-slate-950">
            For advokater
          </Link>
          <Link href="/priser" className="hover:text-slate-950">
            Priser
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/min-side"
            className="hidden rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100 sm:block"
          >
            Min Side
          </Link>
          <Link
            href="/pressesjekk"
            className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            Start sjekk
          </Link>
        </div>
      </div>
    </header>
  );
}
