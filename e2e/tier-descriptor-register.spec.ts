import { test, expect } from "@playwright/test";
import { CLASSIFICATION_QUESTIONS, type Tier } from "../src/lib/alita/classification";
import { DOMAINS } from "../src/lib/alita/domains";
import { DESCRIPTORS } from "../prisma/seed/descriptors.data";
import { waitForHydration } from "./helpers";

// Scenario 1 (brief Phase 9): classify into each of Tier A/B/C, complete an assessment,
// confirm the descriptor text shown at every step matches the selected tier's register.

for (const tier of ["A", "B", "C"] as Tier[]) {
  test(`Tier ${tier} classification renders Tier ${tier} descriptor text throughout`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto("/alita/start");
    await waitForHydration(page);
    await page.getByLabel("Business name").fill(`Test Business ${tier}`);

    for (const q of CLASSIFICATION_QUESTIONS) {
      await page.locator(`#${q.id}-${tier}`).click();
    }
    await page.getByRole("checkbox").click();
    await page.getByRole("button", { name: "Continue" }).click();

    // Suggested tier screen — all 5 answers point at the same tier, so it must be suggested.
    await expect(page.getByText(`Tier ${tier} —`)).toBeVisible();
    await expect(page.getByText("Suggested", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Start my assessment" }).click();
    await page.waitForURL(/\/alita\/assessment\//);

    for (let i = 0; i < DOMAINS.length; i++) {
      const domain = DOMAINS[i];
      const expectedLevel0Text = DESCRIPTORS.find(
        (d) => d.domainId === domain.id && d.level === 0 && d.tier === tier,
      )!.text;
      const otherTier = tier === "A" ? "B" : "A";
      const otherTierLevel0Text = DESCRIPTORS.find(
        (d) => d.domainId === domain.id && d.level === 0 && d.tier === otherTier,
      )!.text;

      await expect(page.getByText(expectedLevel0Text, { exact: true })).toBeVisible();
      await expect(page.getByText(otherTierLevel0Text, { exact: true })).toHaveCount(0);

      await page.getByTestId("level-option-3").click();
      const isLast = i === DOMAINS.length - 1;
      await page.getByRole("button", { name: isLast ? "Finish" : "Next" }).click();
    }

    await page.waitForURL(/\/alita\/results\//);
    await expect(page.getByText("Overall maturity:")).toBeVisible();
  });
}
