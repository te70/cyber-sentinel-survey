import { describe, expect, it } from "vitest";
import { LESSONS } from "../../../prisma/seed/lessons.data";

const TIERS = ["A", "B", "C"] as const;

describe("lessons seed integrity", () => {
  it("has exactly 27 lessons (9 topics x 3 tiers)", () => {
    expect(LESSONS.length).toBe(27);
  });

  it("has D4 with the most topics (4), matching the brief's D4-heavy instruction", () => {
    const byDomainTopics = new Map<string, Set<number>>();
    for (const l of LESSONS) {
      if (!byDomainTopics.has(l.domainId)) byDomainTopics.set(l.domainId, new Set());
      byDomainTopics.get(l.domainId)!.add(l.sortOrder);
    }
    expect(byDomainTopics.get("D4")!.size).toBe(4);
    for (const domainId of ["D1", "D2", "D3", "D5", "D6"]) {
      expect(byDomainTopics.get(domainId)!.size).toBe(1);
    }
  });

  it("every topic has all 3 tiers present", () => {
    const seen = new Map<string, Set<string>>();
    for (const l of LESSONS) {
      const key = `${l.domainId}|${l.sortOrder}`;
      if (!seen.has(key)) seen.set(key, new Set());
      seen.get(key)!.add(l.tier);
    }
    for (const tiers of seen.values()) {
      for (const tier of TIERS) expect(tiers.has(tier)).toBe(true);
    }
  });

  it("has exactly 2 quiz questions per lesson, each with a valid correctIndex", () => {
    for (const lesson of LESSONS) {
      expect(lesson.quiz).toHaveLength(2);
      for (const q of lesson.quiz) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
      }
    }
  });

  it("marks every lesson as draft, pending researcher review", () => {
    for (const lesson of LESSONS) {
      expect(lesson.status).toBe("draft");
    }
  });
});
