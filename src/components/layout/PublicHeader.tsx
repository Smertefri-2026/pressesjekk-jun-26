import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="flex items-center justify-between border-b border-white/10 pb-6">
      <Link href="/" className="block">
        <p className="text-sm uppercase tracking-[0.3em] text-blue-300">
          PresseSjekk.no
        </p>
        <h1 className="mt-2 text-2xl font-bold text-white">PresseSjekk</h1>
      </Link>

      <nav className="hidden gap-8 text-sm text-slate-300 md:flex">
        <Link href="/hvordan-det-fungerer" className="hover:text-white">
          Slik fungerer det
        </Link>
        <Link href="/priser" className="hover:text-white">
          Priser
        </Link>
        <Link href="/pressesjekk" className="hover:text-white">
          Start sjekk
        </Link>
      </nav>
    </header>
  );
}
