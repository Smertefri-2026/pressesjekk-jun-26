import { describe, expect, it } from "vitest";
import { checkRateLimit } from "./rateLimit";

describe("checkRateLimit", () => {
  it("tillater forespørsler opp til grensen, blokkerer deretter", () => {
    const key = `test-${Math.random()}`;
    const options = { max: 3, windowMs: 60_000 };

    expect(checkRateLimit(key, options).allowed).toBe(true);
    expect(checkRateLimit(key, options).allowed).toBe(true);
    expect(checkRateLimit(key, options).allowed).toBe(true);

    const fourth = checkRateLimit(key, options);
    expect(fourth.allowed).toBe(false);
    expect(fourth.retryAfterMs).toBeGreaterThan(0);
  });

  it("holder ulike nøkler (f.eks. ulike IP-er) helt separate", () => {
    const options = { max: 1, windowMs: 60_000 };

    const a = checkRateLimit(`a-${Math.random()}`, options);
    const b = checkRateLimit(`b-${Math.random()}`, options);

    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
  });
});
