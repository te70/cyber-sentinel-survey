import { test, expect } from "@playwright/test";
import { CLASSIFICATION_QUESTIONS } from "../src/lib/alita/classification";
import { DOMAINS, type DomainId } from "../src/lib/alita/domains";
import { waitForHydration } from "./helpers";

// Complete an assessment with D4 low (gate active) and confirm the results screen's Action
// Plan pins D4 first with the gate explanation, regardless of other domains' gap-size priority.

// D1/D2 have larger raw gaps against the default target (3) than D4 does — without gate-pinning
// they'd outrank D4 on priority alone. This proves the pin, not just that D4 appears.
const LEVELS: Record<DomainId, number> = { D1: 0, D2: 0, D3: 5, D4: 1, D5: 5, D6: 5 };

test("Action Plan pins D4 first when the awareness gate is active", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/alita/start");
  await waitForHydration(page);
  await page.getByLabel("Business name").fill("Gate Pinning Test Co");

  for (const q of CLASSIFICATION_QUESTIONS) {
    await page.locator(`#${q.id}-A`).click();
  }
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Start my assessment" }).click();
  await page.waitForURL(/\/alita\/assessment\//);

  for (let i = 0; i < DOMAINS.length; i++) {
    const domain = DOMAINS[i];
    const level = LEVELS[domain.id];
    const option = page.getByTestId(`level-option-${level}`);
    await option.waitFor({ state: "visible" });
    await option.click();
    const isLast = i === DOMAINS.length - 1;
    const nextButton = page.getByRole("button", { name: isLast ? "Finish" : "Next" });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
  }

  await page.waitForURL(/\/alita\/results\//);
  await page.getByText("Your Action Plan").waitFor();

  // D1 and D2 have larger raw gaps than D4 against the default target — without gate-pinning
  // they'd outrank D4 on priority. Confirm D4's card renders first anyway, with the pin banner.
  const firstCard = page.locator('[data-testid^="action-plan-"]').first();
  await expect(firstCard).toHaveAttribute("data-testid", "action-plan-D4");
  await expect(firstCard).toContainText("capping your overall score");
  await expect(page.getByTestId("action-plan-D4")).toContainText("Awareness & Training");
});
