import { describe, expect, it } from "vitest";
import { ASSESSMENT_ITEMS } from "../../../prisma/seed/assessment-items.data";
import { DOMAIN_IDS } from "./domains";

const LEVELS = [1, 2, 3, 4, 5];
const TIERS = ["A", "B", "C"] as const;

describe("assessment items seed integrity", () => {
  it("has exactly 90 rows (6 domains x 5 levels x 3 tiers)", () => {
    expect(ASSESSMENT_ITEMS.length).toBe(90);
  });

  it("has every (domain, tier, level 1-5) combination exactly once, no gaps or duplicates", () => {
    const seen = new Set<string>();
    for (const row of ASSESSMENT_ITEMS) {
      const key = `${row.domainId}|${row.tier}|${row.level}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }

    for (const domainId of DOMAIN_IDS) {
      for (const level of LEVELS) {
        for (const tier of TIERS) {
          expect(seen.has(`${domainId}|${tier}|${level}`)).toBe(true);
        }
      }
    }
  });

  it("has no Level 0 items (Level 0 is the default when nothing is endorsed)", () => {
    expect(ASSESSMENT_ITEMS.some((row) => row.level === 0)).toBe(false);
  });

  it("has non-empty statement text and a source descriptor reference for every row", () => {
    for (const row of ASSESSMENT_ITEMS) {
      expect(row.statementText.trim().length).toBeGreaterThan(0);
      expect(row.sourceDescriptorRef.trim().length).toBeGreaterThan(0);
    }
  });

  it("marks every row as draft, pending researcher review", () => {
    for (const row of ASSESSMENT_ITEMS) {
      expect(row.status).toBe("draft");
    }
  });
});
