export function ArticleInputForm() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm font-semibold text-blue-300">Steg 2</p>
      <h2 className="mt-2 text-2xl font-bold">Legg inn artikkel</h2>

      <div className="mt-5 space-y-4">
        <input
          type="text"
          placeholder="Lim inn URL til artikkelen..."
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none placeholder:text-slate-500 focus:border-blue-300"
        />

        <textarea
          placeholder="Eller lim inn artikkeltekst her..."
          rows={7}
          className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-4 text-white outline-none placeholder:text-slate-500 focus:border-blue-300"
        />

        <div className="rounded-2xl border border-dashed border-white/20 bg-slate-900 p-5 text-sm text-slate-300">
          PDF-opplasting kommer senere. Først bygger vi skjema og brukerflyt.
        </div>
      </div>
    </div>
  );
}
