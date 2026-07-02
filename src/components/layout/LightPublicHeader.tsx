"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { supabase } from "@/lib/supabase/client";

const navLinks = [
  { href: "/hvordan-det-fungerer", label: "Slik fungerer det" },
  { href: "/proff", label: "Proff" },
  { href: "/eksempelrapport", label: "Eksempelrapport" },
  { href: "/priser", label: "Priser" },
  { href: "/om", label: "Om" },
  { href: "/kontakt", label: "Kontakt" },
];

const mobileLinks = navLinks;

export function LightPublicHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      setUser(session?.user ?? null);
      setHasCheckedAuth(true);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setHasCheckedAuth(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const accountHref = user ? "/min-side" : "/login";
  const accountLabel = hasCheckedAuth && user ? "Min side" : "Logg inn";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur supports-backdrop-filter:bg-white/85">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="hidden items-center justify-between py-4 sm:flex sm:py-5">
            <BrandLogo size="header" />

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

            <div className="flex items-center gap-3">
              <Link
                href={accountHref}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100"
              >
                {accountLabel}
              </Link>
              <Link
                href="/pressesjekk"
                className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white hover:bg-orange-600"
              >
                Start sjekk
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 py-3 sm:hidden">
            <div className="min-w-0 flex-1">
              <BrandLogo size="header" />
            </div>

            <div className="flex shrink-0 items-center justify-end gap-1.5">
              <Link
                href={accountHref}
                className="rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-[11px] font-black text-slate-950 hover:bg-slate-100"
              >
                {accountLabel}
              </Link>

              <Link
                href="/pressesjekk"
                className="rounded-xl bg-orange-500 px-2.5 py-2 text-[11px] font-black text-white hover:bg-orange-600"
              >
                Start
              </Link>

              <button
                type="button"
                onClick={() => setIsOpen((value) => !value)}
                className="flex h-10 w-8 shrink-0 items-center justify-center bg-transparent text-2xl font-black leading-none text-slate-950 hover:text-orange-600"
                aria-expanded={isOpen}
                aria-label={isOpen ? "Lukk meny" : "Åpne meny"}
              >
                {isOpen ? "×" : "☰"}
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
              </div>
            </nav>
          ) : null}
        </div>
      </header>

      <div className="h-18.25 sm:h-23" aria-hidden="true" />
    </>
  );
}
