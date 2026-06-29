import type { PackagePlanId } from "@/data/packagePlans";

export type StripeCheckoutPlan = {
  packageId: PackagePlanId;
  name: string;
  description: string;
  amount: number;
  currency: "nok";
  mode: "payment" | "subscription";
};

export const stripeCheckoutPlans: Record<PackagePlanId, StripeCheckoutPlan> = {
  report_pack: {
    packageId: "report_pack",
    name: "Rapportpakke",
    description: "PresseSjekk rapportpakke for én sak.",
    amount: 49000,
    currency: "nok",
    mode: "payment",
  },
  pfu_pack: {
    packageId: "pfu_pack",
    name: "PFU-pakke",
    description: "PresseSjekk PFU-pakke for én sak.",
    amount: 149000,
    currency: "nok",
    mode: "payment",
  },
  full_pack: {
    packageId: "full_pack",
    name: "Full dokumentpakke",
    description: "PresseSjekk full dokumentpakke for én sak.",
    amount: 299000,
    currency: "nok",
    mode: "payment",
  },
  investigation_pack: {
    packageId: "investigation_pack",
    name: "Utredningspakke",
    description: "PresseSjekk utredningspakke. Avklares manuelt før betaling.",
    amount: 10000000,
    currency: "nok",
    mode: "payment",
  },
  monthly_start: {
    packageId: "monthly_start",
    name: "Månedsavtale Start",
    description: "PresseSjekk profftilgang med 3 saker per måned.",
    amount: 129000,
    currency: "nok",
    mode: "subscription",
  },
  monthly_pro: {
    packageId: "monthly_pro",
    name: "Månedsavtale Pro",
    description: "PresseSjekk profftilgang med 15 saker per måned.",
    amount: 499000,
    currency: "nok",
    mode: "subscription",
  },
  monthly_agency: {
    packageId: "monthly_agency",
    name: "Månedsavtale Byrå",
    description: "PresseSjekk profftilgang med 50 saker per måned.",
    amount: 1499000,
    currency: "nok",
    mode: "subscription",
  },
  monthly_enterprise: {
    packageId: "monthly_enterprise",
    name: "Enterprise",
    description: "PresseSjekk enterprise. Avklares manuelt før betaling.",
    amount: 0,
    currency: "nok",
    mode: "subscription",
  },
};

export function getStripeCheckoutPlan(packageId: string) {
  if (!(packageId in stripeCheckoutPlans)) {
    return null;
  }

  return stripeCheckoutPlans[packageId as PackagePlanId];
}
