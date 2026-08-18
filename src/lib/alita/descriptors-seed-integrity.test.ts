import { describe, expect, it } from "vitest";
import { DESCRIPTORS } from "../../../prisma/seed/descriptors.data";
import { DOMAIN_IDS } from "./domains";

const LEVELS = [0, 1, 2, 3, 4, 5];
const TIERS = ["A", "B", "C"] as const;

describe("descriptor seed integrity", () => {
  it("has exactly 108 rows (6 domains x 6 levels x 3 tiers)", () => {
    expect(DESCRIPTORS.length).toBe(108);
  });

  it("has every (domain, level, tier) combination exactly once, no gaps or duplicates", () => {
    const seen = new Set<string>();
    for (const row of DESCRIPTORS) {
      const key = `${row.domainId}|${row.level}|${row.tier}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }

    for (const domainId of DOMAIN_IDS) {
      for (const level of LEVELS) {
        for (const tier of TIERS) {
          const key = `${domainId}|${level}|${tier}`;
          expect(seen.has(key)).toBe(true);
        }
      }
    }
  });

  it("has non-empty text for every row", () => {
    for (const row of DESCRIPTORS) {
      expect(row.text.trim().length).toBeGreaterThan(0);
    }
  });
});
