// Integration tests that hit the real dev Postgres database via Prisma directly — new territory
// for this project's vitest suite (every other test is pure-logic/pure-data). Consent filtering
// and pseudonymisation are inherently DB-state concerns; there's no meaningful way to unit-test
// them without a database, and this project has no test-DB-isolation infrastructure to build
// that out properly, so these tests run against the same dev DB the seed scripts already use,
// cleaning up their own rows afterward.
import { afterEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildResearchExportWorkbook, getConsentedSmes } from "./export.functions";
import ExcelJS from "exceljs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set — required for integration tests.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const createdSmeIds: string[] = [];

async function createTestSme(name: string) {
  const sme = await db.sme.create({
    data: {
      name,
      q1Answer: "A",
      q2Answer: "A",
      q3Answer: "A",
      q4Answer: "A",
      q5Answer: "A",
      tierSuggested: "A",
      tier: "A",
    },
  });
  createdSmeIds.push(sme.id);
  return sme;
}

afterEach(async () => {
  const ids = createdSmeIds.splice(0);
  if (ids.length === 0) return;
  await db.smePseudonym.deleteMany({ where: { smeId: { in: ids } } });
  await db.consentRecord.deleteMany({ where: { smeId: { in: ids } } });
  await db.sme.deleteMany({ where: { id: { in: ids } } });
});

describe("getConsentedSmes", () => {
  it("excludes an SME with revoked research-participation consent", async () => {
    const consented = await createTestSme("Consented Test Co");
    const revoked = await createTestSme("Revoked Test Co");

    await db.consentRecord.create({
      data: { smeId: consented.id, consentType: "research_participation", version: "1.0" },
    });
    const revokedRecord = await db.consentRecord.create({
      data: { smeId: revoked.id, consentType: "research_participation", version: "1.0" },
    });
    await db.consentRecord.update({
      where: { id: revokedRecord.id },
      data: { revokedAt: new Date() },
    });

    const result = await getConsentedSmes(db);
    const ids = result.map((s) => s.id);
    expect(ids).toContain(consented.id);
    expect(ids).not.toContain(revoked.id);
  });

  it("excludes an SME with no consent record at all", async () => {
    const noConsent = await createTestSme("No Consent Test Co");
    const result = await getConsentedSmes(db);
    expect(result.map((s) => s.id)).not.toContain(noConsent.id);
  });
});

describe("buildResearchExportWorkbook", () => {
  it("never includes a business name anywhere in the workbook, and pseudonyms are stable", async () => {
    const businessName = "Totally Unique Business Name Ltd 12345";
    const sme = await createTestSme(businessName);
    await db.consentRecord.create({
      data: { smeId: sme.id, consentType: "research_participation", version: "1.0" },
    });

    const { base64 } = await buildResearchExportWorkbook(db);
    const buffer = Buffer.from(base64, "base64");

    // Look up this SME's own pseudonym directly, rather than scanning the workbook for "any
    // cell starting with SME-" — other consented SMEs (e.g. left behind by e2e runs) mean the
    // workbook can contain many pseudonyms, and a generic scan can pick up the wrong one.
    const pseudonymRow = await db.smePseudonym.findUnique({ where: { smeId: sme.id } });
    expect(pseudonymRow).not.toBeNull();
    const pseudonym = pseudonymRow!.pseudonym;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    let foundName = false;
    let foundPseudonym = false;
    for (const worksheet of workbook.worksheets) {
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          const value = String(cell.value ?? "");
          if (value.includes(businessName)) foundName = true;
          if (value === pseudonym) foundPseudonym = true;
        });
      });
    }

    expect(foundName).toBe(false);
    expect(foundPseudonym).toBe(true);

    // Calling again assigns the same pseudonym rather than a new one.
    await buildResearchExportWorkbook(db);
    const pseudonymRowAfter = await db.smePseudonym.findUnique({ where: { smeId: sme.id } });
    expect(pseudonymRowAfter?.pseudonym).toBe(pseudonym);
  });
});
