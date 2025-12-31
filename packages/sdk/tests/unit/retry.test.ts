import { describe, expect, it } from "vitest";

import { XoliumError } from "../../src/errors/XoliumError.js";
import { computeDeterministicDelayMs } from "../../src/utils/retry.js";

describe("retry", () => {
  it("computes deterministic exponential backoff", () => {
    expect(computeDeterministicDelayMs(0, 100, 10_000)).toBe(100);
    expect(computeDeterministicDelayMs(1, 100, 10_000)).toBe(200);
    expect(computeDeterministicDelayMs(2, 100, 10_000)).toBe(400);
  });

  it("caps delay to maxDelayMs", () => {
    expect(computeDeterministicDelayMs(10, 100, 500)).toBe(500);
  });

  it("throws typed error on invalid attemptIndex", () => {
    expect(() => computeDeterministicDelayMs(-1, 100, 1000)).toThrow(XoliumError);
  });
});
