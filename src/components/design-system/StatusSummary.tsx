import type { BadgeTone } from "./Badge";

export type StatusSummaryItem = {
  label: string;
  count: number;
  tone?: BadgeTone;
};

const DOT_TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-slate-400",
  info: "bg-blue-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

/**
 * Remøy AI Design System — StatusSummary.
 * Kompakt "N av kategori X"-rutenett. Viser alltid konkrete, forklarbare
 * antall - ALDRI en samlet prosent eller poengsum. Produktnøytral: tar kun
 * imot ferdige label/count-par, ingen domenekunnskap om claims/dokumenter.
 */
export function StatusSummary({ items, className = "" }: { items: StatusSummaryItem[]; className?: string }) {
  return (
    <dl className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${className}`}>
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
            <span
              aria-hidden="true"
              className={`h-2 w-2 shrink-0 rounded-full ${DOT_TONE_CLASSES[item.tone ?? "neutral"]}`}
            />
            {item.label}
          </dt>
          <dd className="mt-1 text-2xl font-black text-slate-950">{item.count}</dd>
        </div>
      ))}
    </dl>
  );
}
