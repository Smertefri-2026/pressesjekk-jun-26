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
  case_bundle_3: {
    packageId: "case_bundle_3",
    name: "3 saker",
    description: "PresseSjekk sakspakke med 3 rapportpakke-saker.",
    amount: 139000,
    currency: "nok",
    mode: "payment",
  },
  case_bundle_5: {
    packageId: "case_bundle_5",
    name: "5 saker",
    description: "PresseSjekk sakspakke med 5 rapportpakke-saker.",
    amount: 219000,
    currency: "nok",
    mode: "payment",
  },
  case_bundle_10: {
    packageId: "case_bundle_10",
    name: "10 saker",
    description: "PresseSjekk sakspakke med 10 rapportpakke-saker.",
    amount: 399000,
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
