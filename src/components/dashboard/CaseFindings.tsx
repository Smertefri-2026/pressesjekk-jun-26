type CaseFindingsProps = {
  findings: string[];
};

export function CaseFindings({ findings }: CaseFindingsProps) {
  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-2xl font-bold">Mulige funn</h2>

      <ul className="mt-5 space-y-3 text-slate-300">
        {findings.map((finding) => (
          <li key={finding} className="flex gap-3">
            <span className="text-cyan-300">✓</span>
            <span>{finding}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
