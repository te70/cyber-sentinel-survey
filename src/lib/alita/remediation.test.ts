import { describe, expect, it } from "vitest";
import { buildRemediationChain, buildRemediationPlan, DEFAULT_TARGET_LEVEL } from "./remediation";
import type { DomainId } from "./domains";

describe("buildRemediationPlan", () => {
  it("pins D4 first when the awareness gate is active, regardless of gap-size priority", () => {
    // D4 gap is only 1 (small), but D1/D3 have larger gaps against the default target of 3 —
    // without gate-pinning, D4 would rank behind them.
    const current: Record<DomainId, number> = { D1: 0, D2: 3, D3: 0, D4: 1, D5: 3, D6: 3 };
    const plan = buildRemediationPlan(current, null);
    expect(plan[0].domainId).toBe("D4");
    expect(plan[0].gatePinned).toBe(true);
  });

  it("does not pin D4 when it's at or above the gate threshold", () => {
    const current: Record<DomainId, number> = { D1: 0, D2: 3, D3: 0, D4: 2, D5: 3, D6: 3 };
    const plan = buildRemediationPlan(current, null);
    expect(plan.every((e) => !e.gatePinned)).toBe(true);
  });

  it("falls back to DEFAULT_TARGET_LEVEL (3) when no Target Profile exists", () => {
    const current: Record<DomainId, number> = { D1: 2, D2: 5, D3: 5, D4: 5, D5: 5, D6: 5 };
    const plan = buildRemediationPlan(current, null);
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({
      domainId: "D1",
      currentLevel: 2,
      effectiveTarget: DEFAULT_TARGET_LEVEL,
    });
  });

  it("excludes domains already at or above their effective target", () => {
    const current: Record<DomainId, number> = { D1: 3, D2: 3, D3: 3, D4: 3, D5: 3, D6: 3 };
    const plan = buildRemediationPlan(current, null);
    expect(plan).toHaveLength(0);
  });

  it("uses an explicit Target Profile over the default when one exists", () => {
    const current: Record<DomainId, number> = { D1: 1, D2: 5, D3: 5, D4: 5, D5: 5, D6: 5 };
    const target: Partial<Record<DomainId, number>> = { D1: 5 };
    const plan = buildRemediationPlan(current, target);
    expect(plan[0]).toMatchObject({ domainId: "D1", effectiveTarget: 5 });
  });
});

describe("buildRemediationChain", () => {
  it("returns adjacent-step pairs across a multi-level gap", () => {
    expect(buildRemediationChain(1, 4)).toEqual([
      { fromLevel: 1, toLevel: 2 },
      { fromLevel: 2, toLevel: 3 },
      { fromLevel: 3, toLevel: 4 },
    ]);
  });

  it("returns a single pair for an adjacent-level gap", () => {
    expect(buildRemediationChain(2, 3)).toEqual([{ fromLevel: 2, toLevel: 3 }]);
  });
});
