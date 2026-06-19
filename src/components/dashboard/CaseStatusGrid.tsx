import type { DemoCase } from "@/types/case";

type CaseStatusGridProps = {
  item: DemoCase;
};

export function CaseStatusGrid({ item }: CaseStatusGridProps) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm text-slate-400">Status</p>
        <p className="mt-2 font-bold text-cyan-300">{item.status}</p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm text-slate-400">Risiko</p>
        <p className="mt-2 font-bold text-amber-300">{item.risk}</p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm text-slate-400">Neste steg</p>
        <p className="mt-2 font-bold">{item.nextStep}</p>
      </div>
    </div>
  );
}
