import { test, expect } from "@playwright/test";
import { CLASSIFICATION_QUESTIONS, type Tier } from "../src/lib/alita/classification";
import { DOMAINS } from "../src/lib/alita/domains";
import { DESCRIPTORS } from "../prisma/seed/descriptors.data";
import { ASSESSMENT_ITEMS } from "../prisma/seed/assessment-items.data";
import { completeConsentStep, waitForHydration } from "./helpers";

// Scenario 1 (brief Phase 9): classify into each of Tier A/B/C, complete an assessment,
// confirm the tier-appropriate text is shown at every step — both the item-battery statements
// (items phase) and the Annex A descriptor text (confirm phase) — matching the selected tier's
// register throughout, never mixing tiers within one assessment.

const TARGET_LEVEL = 3;

for (const tier of ["A", "B", "C"] as Tier[]) {
  test(`Tier ${tier} classification renders Tier ${tier} text throughout`, async ({ page }) => {
    test.setTimeout(150_000);
    await page.goto("/alita/start");
    await waitForHydration(page);
    await completeConsentStep(page);

    const nameField = page.getByLabel("Business name");
    await nameField.waitFor({ state: "visible", timeout: 20000 });
    await nameField.fill(`Test Business ${tier}`);

    for (const q of CLASSIFICATION_QUESTIONS) {
      await page.locator(`#${q.id}-${tier}`).click();
    }
    await page.getByRole("button", { name: "Continue" }).click();

    // Suggested tier screen — all 5 answers point at the same tier, so it must be suggested.
    await expect(page.getByText(`Tier ${tier} —`)).toBeVisible();
    await expect(page.getByText("Suggested", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Start my assessment" }).click();
    await page.waitForURL(/\/alita\/assessment\//);

    const otherTier = tier === "A" ? "B" : "A";

    for (let i = 0; i < DOMAINS.length; i++) {
      const domain = DOMAINS[i];
      const isLastDomain = i === DOMAINS.length - 1;

      // Items phase — all 5 statements for this domain are shown together on one page.
      const expectedItemText = ASSESSMENT_ITEMS.find(
        (item) => item.domainId === domain.id && item.level === 1 && item.tier === tier,
      )!.statementText;
      const otherTierItemText = ASSESSMENT_ITEMS.find(
        (item) => item.domainId === domain.id && item.level === 1 && item.tier === otherTier,
      )!.statementText;
      await page
        .getByText(expectedItemText, { exact: true })
        .waitFor({ state: "visible", timeout: 20000 });
      await expect(page.getByText(otherTierItemText, { exact: true })).toHaveCount(0);

      // Answer all 5 items to land exactly on TARGET_LEVEL via the cumulative rule.
      for (let itemLevel = 1; itemLevel <= 5; itemLevel++) {
        const scaleValue = itemLevel <= TARGET_LEVEL ? 5 : 1;
        const option = page.getByTestId(`agree-scale-${itemLevel}-${scaleValue}`);
        await option.waitFor({ state: "visible" });
        await option.click();
      }
      const itemsContinueButton = page.getByRole("button", { name: "Continue" });
      await expect(itemsContinueButton).toBeEnabled();
      await itemsContinueButton.click();

      // Confirm phase — check the Annex A descriptor text for the computed level is shown, in
      // the correct tier register, before advancing.
      const expectedDescriptorText = DESCRIPTORS.find(
        (d) => d.domainId === domain.id && d.level === TARGET_LEVEL && d.tier === tier,
      )!.text;
      const otherTierDescriptorText = DESCRIPTORS.find(
        (d) => d.domainId === domain.id && d.level === TARGET_LEVEL && d.tier === otherTier,
      )!.text;
      await page
        .getByText(expectedDescriptorText, { exact: true })
        .waitFor({ state: "visible", timeout: 20000 });
      await expect(page.getByText(otherTierDescriptorText, { exact: true })).toHaveCount(0);

      const confirmButton = page.getByRole("button", {
        name: isLastDomain ? "Finish" : "Confirm & continue",
      });
      await expect(confirmButton).toBeEnabled();
      await confirmButton.click();
    }

    await page.waitForURL(/\/alita\/results\//);
    await expect(page.getByText("Overall maturity:")).toBeVisible();
  });
}
