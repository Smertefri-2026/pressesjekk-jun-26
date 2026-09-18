import { describe, expect, it } from "vitest";
import {
  allPackagePlans,
  deferredPackageIds,
  isV1Purchasable,
  v1PurchasablePackageIds,
} from "./packagePlans";

describe("v1-pakkebegrensning (server-side håndhevet i Stripe-rutene)", () => {
  it("tillater de fire enkeltpakkene, inkludert Utredningspakken", () => {
    expect(v1PurchasablePackageIds.sort()).toEqual(
      ["full_pack", "investigation_pack", "pfu_pack", "report_pack"].sort()
    );
  });

  it("isV1Purchasable godtar kun v1-pakkene", () => {
    for (const id of v1PurchasablePackageIds) {
      expect(isV1Purchasable(id)).toBe(true);
    }
  });

  it("isV1Purchasable avviser alle pakker som ikke er eksplisitt i v1-scope, inkludert sakspakker/abonnement", () => {
    const nonV1Ids = allPackagePlans
      .map((plan) => plan.id)
      .filter((id) => !(v1PurchasablePackageIds as string[]).includes(id));

    expect(nonV1Ids.length).toBeGreaterThan(0);

    for (const id of nonV1Ids) {
      expect(isV1Purchasable(id)).toBe(false);
    }
  });

  it("deferredPackageIds og v1PurchasablePackageIds overlapper aldri", () => {
    const overlap = deferredPackageIds.filter((id) =>
      (v1PurchasablePackageIds as string[]).includes(id)
    );

    expect(overlap).toEqual([]);
  });
});
