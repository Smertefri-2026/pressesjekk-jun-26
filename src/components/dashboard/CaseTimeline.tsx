import type { TimelineItem } from "@/types/case";

type CaseTimelineProps = {
  timeline: TimelineItem[];
};

export function CaseTimeline({ timeline }: CaseTimelineProps) {
  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-2xl font-bold">Tidslinje</h2>

      <div className="mt-6 space-y-4">
        {timeline.map((item) => (
          <div
            key={`${item.date}-${item.title}`}
            className="rounded-2xl border border-white/10 bg-slate-900 p-5"
          >
            <p className="text-sm text-cyan-300">{item.date}</p>
            <h3 className="mt-2 font-bold">{item.title}</h3>
            <p className="mt-2 leading-7 text-slate-300">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
