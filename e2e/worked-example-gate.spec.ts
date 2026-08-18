import { test, expect } from "@playwright/test";
import { CLASSIFICATION_QUESTIONS } from "../src/lib/alita/classification";
import { DOMAINS, type DomainId } from "../src/lib/alita/domains";
import { waitForHydration } from "./helpers";

// Scenario 2 (brief Phase 9): submit the Section 10.1 worked-example scores through the real
// UI and confirm the results screen shows band "Initial" with the gate-explanation note,
// alongside the ungated per-domain radar chart (all six domain levels rendered as scored).

const WORKED_EXAMPLE_LEVELS: Record<DomainId, number> = {
  D1: 4,
  D2: 3,
  D3: 5,
  D4: 1,
  D5: 4,
  D6: 3,
};

test("Section 10.1 worked example -> Initial band with gate note", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/alita/start");
  await waitForHydration(page);
  await page.getByLabel("Business name").fill("Worked Example Business");

  for (const q of CLASSIFICATION_QUESTIONS) {
    await page.locator(`#${q.id}-A`).click();
  }
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Start my assessment" }).click();
  await page.waitForURL(/\/alita\/assessment\//);

  for (let i = 0; i < DOMAINS.length; i++) {
    const domain = DOMAINS[i];
    const level = WORKED_EXAMPLE_LEVELS[domain.id];
    const option = page.getByTestId(`level-option-${level}`);
    await option.waitFor({ state: "visible" });
    await option.click();
    const isLast = i === DOMAINS.length - 1;
    const nextButton = page.getByRole("button", { name: isLast ? "Finish" : "Next" });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
  }

  await page.waitForURL(/\/alita\/results\//);
  await expect(page.getByText("Overall maturity:")).toBeVisible();
  await expect(page.getByText("Initial", { exact: true })).toBeVisible();
  await expect(page.getByText(/capped at "Initial"/)).toBeVisible();
  await expect(page.getByText(/3\.13/)).toBeVisible();

  // Ungated per-domain scores are still shown in full, never hidden by the gate.
  for (const domain of DOMAINS) {
    const card = page.locator("div", { hasText: domain.label }).last();
    await expect(card).toBeVisible();
  }
});
