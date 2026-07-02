import type { DemoCase } from "@/types/case";

type CaseArticleCardProps = {
  item: DemoCase;
};

export function CaseArticleCard({ item }: CaseArticleCardProps) {
  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-2xl font-bold">Artikkel</h2>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-slate-400">Medium</p>
          <p className="mt-1 font-semibold">{item.media}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Publisert</p>
          <p className="mt-1 font-semibold">{item.publishedAt}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Artikkeltype</p>
          <p className="mt-1 font-semibold">{item.articleType}</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Sjekket før</p>
          <p className="mt-1 font-semibold text-blue-300">
            {item.checkedCount} ganger
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
        <p className="text-sm text-slate-400">URL</p>
        <p className="mt-2 break-words text-slate-300">{item.url}</p>
      </div>
    </section>
  );
}
