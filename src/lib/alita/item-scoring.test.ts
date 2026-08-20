import { describe, expect, it } from "vitest";
import { computeCumulativeLevel, ENDORSEMENT_THRESHOLD } from "./item-scoring";

describe("computeCumulativeLevel", () => {
  it("clean run: L1-3 endorsed, L4-5 not -> Level 3", () => {
    expect(computeCumulativeLevel({ 1: 5, 2: 4, 3: 4, 4: 2, 5: 1 })).toBe(3);
  });

  it("broken run: L1 and L3 endorsed, L2 not -> Level 1 (highest unbroken run from the bottom)", () => {
    expect(computeCumulativeLevel({ 1: 5, 2: 2, 3: 5, 4: 5, 5: 5 })).toBe(1);
  });

  it("all endorsed -> Level 5", () => {
    expect(computeCumulativeLevel({ 1: 4, 2: 4, 3: 4, 4: 4, 5: 4 })).toBe(5);
  });

  it("nothing endorsed -> Level 0", () => {
    expect(computeCumulativeLevel({ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 })).toBe(0);
  });

  it("missing item treated as not endorsed, never inflates the level", () => {
    // L1 endorsed, L2 unanswered, L3 endorsed -> the L3 answer must not count for anything;
    // the highest unbroken run from the bottom is still just Level 1.
    expect(computeCumulativeLevel({ 1: 5, 3: 5 })).toBe(1);
  });

  it("completely empty battery -> Level 0, never higher than what was actually answered", () => {
    expect(computeCumulativeLevel({})).toBe(0);
  });

  it("respects the exact ENDORSEMENT_THRESHOLD boundary", () => {
    expect(computeCumulativeLevel({ 1: ENDORSEMENT_THRESHOLD })).toBe(1);
    expect(computeCumulativeLevel({ 1: ENDORSEMENT_THRESHOLD - 1 })).toBe(0);
  });
});
