import { describe, expect, it } from "vitest";
import { LESSONS } from "../../../prisma/seed/lessons.data";

const TIERS = ["A", "B", "C"] as const;

describe("lessons seed integrity", () => {
  it("has exactly 84 lessons (28 topics x 3 tiers, including the D3/D6 impersonation duplication)", () => {
    // Original 9 + Phase 2/3 priority (4, with impersonation counted once per domain = the
    // "D5 owner + D5 staff + D3 impersonation + D6 impersonation" 4 topics) + Phase 4/5 (15) =
    // 28 topics x 3 tiers = 84. See the header comment in lessons.data.ts for the full breakdown.
    expect(LESSONS.length).toBe(84);
  });

  it("has D3 and D5 with the most topics (5), reflecting the priority + Phase 4 content added there", () => {
    const byDomainTopics = new Map<string, Set<number>>();
    for (const l of LESSONS) {
      if (!byDomainTopics.has(l.domainId)) byDomainTopics.set(l.domainId, new Set());
      byDomainTopics.get(l.domainId)!.add(l.sortOrder);
    }
    expect(byDomainTopics.get("D3")!.size).toBe(5);
    expect(byDomainTopics.get("D5")!.size).toBe(5);
    for (const domainId of ["D1", "D2", "D4", "D6"]) {
      expect(byDomainTopics.get(domainId)!.size).toBe(4);
    }
    expect(byDomainTopics.get("GEN")!.size).toBe(2);
  });

  it("no two topics within the same domain share a sortOrder", () => {
    const seen = new Map<string, number>();
    for (const l of LESSONS) {
      const key = `${l.domainId}|${l.sortOrder}|${l.tier}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    for (const [key, count] of seen) {
      expect(count, `${key} should have exactly one lesson`).toBe(1);
    }
  });

  it("every lesson has a non-empty sourceRef, no untraceable content", () => {
    for (const lesson of LESSONS) {
      expect(lesson.sourceRef.trim().length).toBeGreaterThan(0);
    }
  });

  it("the D5 breach-notification lesson outranks the general D5 lesson by priority", () => {
    const d5Priority = LESSONS.filter((l) => l.domainId === "D5" && l.priority > 0);
    expect(d5Priority.length).toBe(3); // owner-facing, one per tier
    for (const l of d5Priority) {
      expect(l.audience).toBe("owner");
      expect(l.title).toBe("What to do within 72 hours of a data breach");
    }
  });

  it("the D5 staff companion lesson is staff-only and not priority-ranked", () => {
    const staffLessons = LESSONS.filter(
      (l) => l.domainId === "D5" && l.title === "Who to tell if you spot a possible data breach",
    );
    expect(staffLessons.length).toBe(3);
    for (const l of staffLessons) {
      expect(l.audience).toBe("staff");
      expect(l.priority).toBe(0);
    }
  });

  it("the impersonation lesson is tagged priority + both-audience on both D3 and D6", () => {
    const impersonation = LESSONS.filter(
      (l) => l.title === "Spotting and responding to a cloned business page",
    );
    expect(impersonation.length).toBe(6); // 3 tiers x 2 domains
    for (const l of impersonation) {
      expect(["D3", "D6"]).toContain(l.domainId);
      expect(l.priority).toBe(10);
      expect(l.audience).toBe("both");
      expect(l.sourceRef).toMatch(/Section 9 emerging pattern E3/);
      expect(l.sourceRef).toMatch(/NOT yet in Annex A's formal 0-5 descriptors/);
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
