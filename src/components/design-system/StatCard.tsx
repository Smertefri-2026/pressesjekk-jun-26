import Link from "next/link";
import type { ReactNode } from "react";

export type StatCardProps = {
  href: string;
  label: string;
  value: ReactNode;
  cta: string;
  /** Rødt bakgrunn/kant fremfor nøytral hvit kort-bunn. */
  tone?: "accent" | "default";
  /** Fargen på selve etikett-teksten, uavhengig av `tone`. */
  labelTone?: "accent" | "muted";
  /** Større, balansert tall-typografi på desktop - for tellere. */
  large?: boolean;
};

/**
 * Remøy AI Design System - StatCard.
 * Ett responsivt kort som dekker mønsteret som tidligere ble hånd-kodet i
 * to nesten identiske versjoner (mobil/desktop) på Min side-dashbordet.
 */
export function StatCard({ href, label, value, cta, tone = "default", labelTone = "muted", large = false }: StatCardProps) {
  return (
    <Link
      href={href}
      className={`rounded-3xl border p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md md:p-6 ${
        tone === "accent" ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className={`text-xs font-bold md:text-base ${labelTone === "accent" ? "text-red-800" : "text-slate-500"}`}>
        {label}
      </p>
      <p
        className={`mt-3 text-3xl font-black text-slate-950 md:mt-4 ${
          large ? "md:[text-wrap:balance] md:text-5xl" : ""
        }`}
      >
        {value}
      </p>
      <p
        className={`mt-2 text-[11px] font-semibold leading-5 md:mt-3 md:text-sm ${
          tone === "accent" ? "text-red-800" : "text-red-700"
        }`}
      >
        {cta}
      </p>
    </Link>
  );
}
