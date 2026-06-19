export function CaseDocumentationSummary() {
  const items = [
    { label: "Kontakt før publisering", value: "Ja, e-post" },
    { label: "Konkrete beskyldninger", value: "Delvis" },
    { label: "Rettsstatus", value: "Ikke avgjort" },
    { label: "Vedlegg", value: "3 dokumenter" },
  ];

  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-2xl font-bold">
        Tilsvar, rettsstatus og dokumentasjon
      </h2>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/10 bg-slate-900 p-5"
          >
            <p className="text-sm text-slate-400">{item.label}</p>
            <p className="mt-2 font-semibold">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
