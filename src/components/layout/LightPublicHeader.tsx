"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "/hvordan-det-fungerer", label: "Slik fungerer det" },
  { href: "/journalister", label: "Journalister" },
  { href: "/advokater", label: "Advokater" },
  { href: "/eksempelrapport", label: "Eksempelrapport" },
  { href: "/priser", label: "Priser" },
];

const mobileLinks = [
  ...navLinks,
  { href: "/min-side", label: "Min Side" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/personvern", label: "Personvern" },
  { href: "/vilkar", label: "Vilkår" },
];

export function LightPublicHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 sm:py-5">
          <Link href="/" className="block min-w-0">
            <h1 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
              PresseSjekk
            </h1>
            <p className="mt-1 hidden text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 sm:block">
              Strukturert kontroll av medieomtale
            </p>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/min-side"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
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

          <div className="flex items-center gap-2 sm:hidden">
            <Link
              href="/pressesjekk"
              className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800"
            >
              Start
            </Link>

            <button
              type="button"
              onClick={() => setIsOpen((value) => !value)}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black text-slate-950 hover:bg-slate-100"
              aria-expanded={isOpen}
              aria-label="Åpne meny"
            >
              Meny
            </button>
          </div>
        </div>

        {isOpen ? (
          <nav className="border-t border-slate-200 py-4 sm:hidden">
            <div className="grid gap-2">
              {mobileLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-100"
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/pressesjekk"
                onClick={() => setIsOpen(false)}
                className="mt-2 rounded-xl bg-cyan-500 px-4 py-3 text-center text-sm font-black text-slate-950 hover:bg-cyan-400"
              >
                Start gratis sjekk
              </Link>
            </div>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
