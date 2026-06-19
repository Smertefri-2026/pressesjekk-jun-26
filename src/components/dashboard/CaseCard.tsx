import Link from "next/link";
import type { CaseSummary } from "@/types/case";

type CaseCardProps = {
  item: CaseSummary;
};

export function CaseCard({ item }: CaseCardProps) {
  return (
    <Link
      href={item.href}
      className="block rounded-3xl border border-white/10 bg-white/[0.03] p-6 hover:border-cyan-300/50"
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-sm text-cyan-300">
            {item.media} · {item.date}
          </p>
          <h3 className="mt-2 text-xl font-bold">{item.title}</h3>
          <p className="mt-3 text-sm text-slate-400">Status: {item.status}</p>
        </div>

        <div className="flex flex-col gap-2 md:items-end">
          <span className="rounded-full bg-amber-300/15 px-3 py-1 text-sm font-semibold text-amber-200">
            Risiko: {item.risk}
          </span>
          <span className="text-sm text-slate-300">{item.nextStep}</span>
        </div>
      </div>
    </Link>
  );
}
