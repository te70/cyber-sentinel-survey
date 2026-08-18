import { describe, expect, it } from "vitest";
import { REMEDIATION_GUIDANCE } from "../../../prisma/seed/remediation.data";
import { DOMAIN_IDS } from "./domains";

const TRANSITIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
];
const TIERS = ["A", "B", "C"] as const;

describe("remediation guidance seed integrity", () => {
  it("has exactly 90 rows (6 domains x 5 transitions x 3 tiers)", () => {
    expect(REMEDIATION_GUIDANCE.length).toBe(90);
  });

  it("has every (domain, tier, fromLevel, toLevel) adjacent transition exactly once, no gaps or duplicates", () => {
    const seen = new Set<string>();
    for (const row of REMEDIATION_GUIDANCE) {
      const key = `${row.domainId}|${row.tier}|${row.fromLevel}|${row.toLevel}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }

    for (const domainId of DOMAIN_IDS) {
      for (const [fromLevel, toLevel] of TRANSITIONS) {
        for (const tier of TIERS) {
          const key = `${domainId}|${tier}|${fromLevel}|${toLevel}`;
          expect(seen.has(key)).toBe(true);
        }
      }
    }
  });

  it("has non-empty whatsWrong and howToImprove text for every row", () => {
    for (const row of REMEDIATION_GUIDANCE) {
      expect(row.whatsWrong.trim().length).toBeGreaterThan(0);
      expect(row.howToImprove.trim().length).toBeGreaterThan(0);
    }
  });

  it("marks every row as draft, pending researcher review", () => {
    for (const row of REMEDIATION_GUIDANCE) {
      expect(row.status).toBe("draft");
    }
  });
});
