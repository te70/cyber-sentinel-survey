import { test, expect } from "@playwright/test";
import { DOMAINS, type DomainId } from "../src/lib/alita/domains";
import { answerDomainToLevel, completeIntake, waitForHydration } from "./helpers";

// Confirms the Training Hub's Owner/Staff/Everyone toggle actually filters the visible lesson
// list — not just a UI control with no effect. Uses the D5 breach-notification pair (Phase 2 of
// the training-expansion pass) as a known owner-only/staff-only fixture: one lesson tagged
// "owner", a companion tagged "staff", both real seeded content rather than test fixtures.

const OWNER_LESSON = "What to do within 72 hours of a data breach";
const STAFF_LESSON = "Who to tell if you spot a possible data breach";

const LEVELS: Record<DomainId, number> = { D1: 3, D2: 3, D3: 3, D4: 3, D5: 3, D6: 3 };

test("Owner/Staff/Everyone toggle filters the Training Hub lesson list", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto("/alita/start");
  await waitForHydration(page);
  await completeIntake(page, { businessName: "Audience Filter Test Co" });

  for (let i = 0; i < DOMAINS.length; i++) {
    await answerDomainToLevel(page, LEVELS[DOMAINS[i].id], i === DOMAINS.length - 1);
  }
  await page.waitForURL(/\/alita\/results\//);

  const trainingLink = page.getByRole("link", { name: "Training", exact: true });
  await trainingLink.waitFor({ state: "visible", timeout: 20000 });
  await trainingLink.click();
  await page.waitForURL(/\/training/);
  await waitForHydration(page);

  // "Everyone" (default): both the owner- and staff-only lessons are visible.
  await expect(page.getByText(OWNER_LESSON)).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(STAFF_LESSON)).toBeVisible();

  // "Owner": only the owner-tagged lesson.
  await page.getByRole("button", { name: "Owner" }).click();
  await expect(page.getByText(OWNER_LESSON)).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(STAFF_LESSON)).toHaveCount(0);

  // "Staff": only the staff-tagged lesson.
  await page.getByRole("button", { name: "Staff" }).click();
  await expect(page.getByText(STAFF_LESSON)).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(OWNER_LESSON)).toHaveCount(0);

  // Back to "Everyone": both again.
  await page.getByRole("button", { name: "Everyone" }).click();
  await expect(page.getByText(OWNER_LESSON)).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(STAFF_LESSON)).toBeVisible();
});
