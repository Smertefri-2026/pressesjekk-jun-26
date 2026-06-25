const plans = [
  {
    name: "Rask sjekk",
    price: "0 kr",
    text: "Kort sammendrag, mulig risikonivå og problemområder.",
  },
  {
    name: "PresseSjekk Enkel",
    price: "490 kr",
    text: "Rapportpakke for én artikkel med presseetisk vurdering.",
  },
  {
    name: "PresseSjekk + PFU",
    price: "790 kr",
    text: "Rapportpakke, tilsvarsvurdering og PFU-klageutkast.",
  },
];

export function PricingPreviewSection() {
  return (
    <section className="bg-white px-6 py-20 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-700">
          Priser
        </p>
        <h2 className="mt-3 text-3xl font-bold md:text-5xl">
          Start med rask sjekk – velg rapportpakke ved behov
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className="rounded-3xl border border-slate-200 p-6 shadow-sm"
            >
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="mt-4 text-4xl font-bold">{plan.price}</p>
              <p className="mt-4 leading-7 text-slate-600">{plan.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
