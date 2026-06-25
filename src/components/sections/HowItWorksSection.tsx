const steps = [
  "Legg inn artikkel",
  "Svar på tilsvar-spørsmål",
  "Få gratis forhåndsvurdering",
  "Velg rapportpakke",
  "Generer PFU-klage",
];

export function HowItWorksSection() {
  return (
    <section className="border-t border-white/10 bg-slate-900 px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
          Slik fungerer det
        </p>
        <h2 className="mt-3 text-3xl font-bold text-white md:text-5xl">
          Fra artikkel til strukturert vurdering
        </h2>

        <div className="mt-10 grid gap-5 md:grid-cols-5">
          {steps.map((step, index) => (
            <div
              key={step}
              className="rounded-2xl border border-white/10 bg-white/3 p-5 text-white"
            >
              <span className="text-sm text-cyan-300">Steg {index + 1}</span>
              <h3 className="mt-3 font-semibold">{step}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
