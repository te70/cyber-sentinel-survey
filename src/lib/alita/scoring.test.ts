import { describe, expect, it } from "vitest";
import { DOMAIN_IDS, DOMAIN_WEIGHTS } from "./domains";
import {
  applyAwarenessGate,
  calculateRawComposite,
  getBandLabel,
  type DomainScores,
} from "./scoring";

describe("weights", () => {
  it("sum to 1.0", () => {
    const sum = DOMAIN_IDS.reduce((s, id) => s + DOMAIN_WEIGHTS[id], 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });
});

describe("Section 10.1 worked example", () => {
  it("D1=4, D2=3, D3=5, D4=1, D5=4, D6=3 -> raw 3.13, gated 1.9, band Initial", () => {
    const scores: DomainScores = { D1: 4, D2: 3, D3: 5, D4: 1, D5: 4, D6: 3 };
    const raw = calculateRawComposite(scores);
    expect(raw).toBeCloseTo(3.13, 10);

    const { composite, gated } = applyAwarenessGate(raw, scores.D4);
    expect(gated).toBe(true);
    expect(composite).toBeCloseTo(1.9, 10);
    expect(getBandLabel(composite)).toBe("Initial");
  });
});

describe("awareness gate boundary", () => {
  it("does NOT apply when D4 is exactly at the threshold (2)", () => {
    const scores: DomainScores = { D1: 4, D2: 3, D3: 5, D4: 2, D5: 4, D6: 3 };
    const raw = calculateRawComposite(scores);
    const { composite, gated } = applyAwarenessGate(raw, scores.D4);
    expect(gated).toBe(false);
    expect(composite).toBeCloseTo(raw, 10);
  });

  it("applies when D4 is one below the threshold (1)", () => {
    const { gated } = applyAwarenessGate(3.13, 1);
    expect(gated).toBe(true);
  });
});

describe("extremes", () => {
  it("all domains at 0 -> composite 0, band Non-existent", () => {
    const scores: DomainScores = { D1: 0, D2: 0, D3: 0, D4: 0, D5: 0, D6: 0 };
    const raw = calculateRawComposite(scores);
    expect(raw).toBe(0);
    const { composite, gated } = applyAwarenessGate(raw, scores.D4);
    expect(gated).toBe(true); // D4=0 < 2
    expect(composite).toBe(0);
    expect(getBandLabel(composite)).toBe("Non-existent");
  });

  it("all domains at 5 -> composite 5, band Optimising, gate not applied", () => {
    const scores: DomainScores = { D1: 5, D2: 5, D3: 5, D4: 5, D5: 5, D6: 5 };
    const raw = calculateRawComposite(scores);
    expect(raw).toBeCloseTo(5, 10);
    const { composite, gated } = applyAwarenessGate(raw, scores.D4);
    expect(gated).toBe(false);
    expect(getBandLabel(composite)).toBe("Optimising");
  });
});
