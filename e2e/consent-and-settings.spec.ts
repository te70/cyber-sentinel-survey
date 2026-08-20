import { test, expect } from "@playwright/test";
import { CLASSIFICATION_QUESTIONS } from "../src/lib/alita/classification";
import { DOMAINS, type DomainId } from "../src/lib/alita/domains";
import { answerDomainToLevel, waitForHydration } from "./helpers";

// Both consent checkboxes are required (separately) to proceed, both get recorded, and
// revoking research participation from settings actually changes the recorded state.

const LEVELS: Record<DomainId, number> = { D1: 3, D2: 3, D3: 3, D4: 3, D5: 3, D6: 3 };

test("consent is required, recorded, and revocable from settings", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto("/alita/start");
  await waitForHydration(page);

  // Continue is disabled until both checkboxes are checked, not just one.
  const continueButton = page.getByRole("button", { name: "Continue" });
  await expect(continueButton).toBeDisabled();

  const checkboxes = page.getByRole("checkbox");
  await checkboxes.nth(0).click();
  await expect(continueButton).toBeDisabled();
  await checkboxes.nth(1).click();
  await expect(continueButton).toBeEnabled();
  await continueButton.click();

  await page.getByLabel("Business name").fill("Consent Flow Test Co");
  for (const q of CLASSIFICATION_QUESTIONS) {
    await page.locator(`#${q.id}-A`).click();
  }
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Start my assessment" }).click();
  await page.waitForURL(/\/alita\/assessment\//);

  for (let i = 0; i < DOMAINS.length; i++) {
    const level = LEVELS[DOMAINS[i].id];
    const isLastDomain = i === DOMAINS.length - 1;
    await answerDomainToLevel(page, level, isLastDomain);
  }

  await page.waitForURL(/\/alita\/results\//);
  await page.getByRole("link", { name: "Privacy & consent settings" }).click();
  await page.waitForURL(/\/alita\/settings\//);

  // Both consent types were recorded as Active.
  await expect(page.getByText("Privacy notice")).toBeVisible();
  await expect(page.getByText(/v1\.0 · Active/).first()).toBeVisible();

  const revokeButton = page.getByRole("button", { name: "Revoke research participation" });
  await expect(revokeButton).toBeEnabled();
  await revokeButton.click();

  await expect(page.getByRole("button", { name: "Already revoked" })).toBeVisible();
  await expect(page.getByText(/v1\.0 · Revoked/)).toBeVisible();
});
