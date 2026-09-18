import Link from "next/link";

export type PackagePlanCardTone = "default" | "accent" | "highlight";
export type PackagePlanCardCtaVariant = "filled-accent" | "filled-dark" | "outline";

export type PackagePlanCardProps = {
  tag: string;
  name: string;
  price: string;
  /** Valgfri "per sak"-linje under prisen, brukt av sakspakkene. */
  perCase?: string;
  description: string;
  features: readonly string[];
  ctaHref: string;
  ctaLabel: string;
  ctaVariant?: PackagePlanCardCtaVariant;
  tone?: PackagePlanCardTone;
  /** Bevarer eksisterende, lett avvikende typografi mellom enkeltkjøp/pakke/abonnement-kortene. */
  nameSize?: "md" | "lg";
  priceSize?: "sm" | "md";
};

const toneClasses: Record<PackagePlanCardTone, string> = {
  default: "border-slate-200 bg-white",
  accent: "border-red-300 bg-red-50",
  highlight: "border-amber-300 bg-amber-50",
};

const ctaClasses: Record<PackagePlanCardCtaVariant, string> = {
  "filled-accent": "bg-red-500 text-white hover:bg-red-600",
  "filled-dark": "bg-slate-950 text-white hover:bg-slate-800",
  outline: "border border-slate-300 bg-white text-slate-950 hover:bg-slate-100",
};

/**
 * Remøy AI Design System - PackagePlanCard.
 * Dekker den rene visningen av en pakke/plan (tag/navn/pris/funksjoner/CTA).
 * Data kommer alltid fra src/data/packagePlans.ts; kortet tar kun imot
 * ferdige verdier - sidene beholder sin egen logikk for hvilken CTA-tekst
 * og -lenke som gjelder for hvert enkelt plan-id.
 */
export function PackagePlanCard({
  tag,
  name,
  price,
  perCase,
  description,
  features,
  ctaHref,
  ctaLabel,
  ctaVariant = "filled-accent",
  tone = "default",
  nameSize = "md",
  priceSize = "md",
}: PackagePlanCardProps) {
  return (
    <article className={`flex h-full flex-col rounded-3xl border p-6 shadow-sm ${toneClasses[tone]}`}>
      <p className="inline-flex w-fit rounded-full bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-red-800">
        {tag}
      </p>

      <h3 className={`mt-5 font-black text-slate-950 ${nameSize === "lg" ? "text-3xl" : "text-2xl"}`}>{name}</h3>

      <p className={`mt-3 font-black text-slate-950 ${priceSize === "sm" ? "text-3xl" : "text-4xl"}`}>{price}</p>

      {perCase ? <p className="mt-2 text-sm font-black text-red-800">{perCase}</p> : null}

      <p className="mt-4 leading-8 text-slate-700">{description}</p>

      <ul className="mb-8 mt-6 grid flex-1 content-start gap-3 text-sm font-medium text-slate-700">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="text-red-700">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link href={ctaHref} className={`mt-auto block rounded-xl px-5 py-4 text-center font-black ${ctaClasses[ctaVariant]}`}>
        {ctaLabel}
      </Link>
    </article>
  );
}
