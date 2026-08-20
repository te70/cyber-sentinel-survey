// Integration tests hitting the real dev Postgres database via Prisma directly — same pattern as
// consent-export.integration.test.ts and dashboard.integration.test.ts. These check the actual
// seeded content plus the two mechanism changes from the training-content-expansion pass:
// priority-ranked remediation cross-links and audience-filtered lesson queries.
import { describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { pickLessonForDomain } from "./remediation.functions";
import { queryLessons } from "./training.functions";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set — required for integration tests.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const TIERS = ["A", "B", "C"] as const;

describe("pickLessonForDomain (remediation-guidance cross-link)", () => {
  it("picks the priority breach-notification lesson for D5, not the general sortOrder-1 lesson", async () => {
    for (const tier of TIERS) {
      const lesson = await pickLessonForDomain(db, "D5", tier);
      expect(lesson).not.toBeNull();
      expect(lesson!.title).toBe("What to do within 72 hours of a data breach");
      expect(lesson!.priority).toBe(10);
    }
  });

  it("picks the priority impersonation lesson for both D3 and D6", async () => {
    for (const domainId of ["D3", "D6"] as const) {
      for (const tier of TIERS) {
        const lesson = await pickLessonForDomain(db, domainId, tier);
        expect(lesson).not.toBeNull();
        expect(lesson!.title).toBe("Spotting and responding to a cloned business page");
      }
    }
  });
});

describe("queryLessons (Training Hub audience filter)", () => {
  it("staff filter never returns an owner-only lesson", async () => {
    const rows = await queryLessons(db, { tier: "A", audience: "staff" });
    expect(rows.length).toBeGreaterThan(0);
    for (const l of rows) expect(l.audience).not.toBe("owner");
  });

  it("owner filter never returns a staff-only lesson", async () => {
    const rows = await queryLessons(db, { tier: "A", audience: "owner" });
    expect(rows.length).toBeGreaterThan(0);
    for (const l of rows) expect(l.audience).not.toBe("staff");
  });

  it("staff filter includes both-tagged lessons alongside staff-only ones", async () => {
    const rows = await queryLessons(db, { tier: "A", audience: "staff" });
    const audiences = new Set(rows.map((l) => l.audience));
    expect(audiences.has("staff")).toBe(true);
    expect(audiences.has("both")).toBe(true);
  });

  it("no filter returns everything, including owner- and staff-only lessons", async () => {
    const rows = await queryLessons(db, { tier: "A" });
    const audiences = new Set(rows.map((l) => l.audience));
    expect(audiences.has("owner")).toBe(true);
    expect(audiences.has("staff")).toBe(true);
    expect(audiences.has("both")).toBe(true);
  });
});
