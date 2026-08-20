import { expect, type Page } from "@playwright/test";
import { CLASSIFICATION_QUESTIONS } from "../src/lib/alita/classification";

// TanStack Start's SSR shell renders static HTML before React hydrates and attaches event
// listeners; clicking that fast (as Playwright does) silently no-ops. `$_TSR` is deleted from
// `window` once hydration + the SSR stream both finish, so waiting for it to disappear is a
// reliable "the page is actually interactive now" signal.
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => (window as unknown as { $_TSR?: unknown }).$_TSR === undefined);
}

/**
 * Walks the first, consent-only phase of `/alita/start` (both checkboxes, then Continue).
 * Assumes the caller has already `goto("/alita/start")` and `waitForHydration`. Split out from
 * `completeIntake` so tests that need to assert on the business-profile/tier-confirm phases in
 * between can still reuse this instead of re-duplicating the consent step.
 */
export async function completeConsentStep(page: Page) {
  const checkboxes = page.getByRole("checkbox");
  await checkboxes.nth(0).waitFor({ state: "visible", timeout: 20000 });
  await checkboxes.nth(0).click();
  await checkboxes.nth(1).click();
  await page.getByRole("button", { name: "Continue" }).click();
}

/**
 * Walks the full intake flow — consent (both checkboxes), business profile, tier confirm — and
 * lands on the resulting Current Profile assessment's item-battery screen. Assumes the caller
 * has already `goto("/alita/start")` and `waitForHydration`. Centralised here (rather than
 * duplicated per spec file) specifically so a future intake-flow change only needs updating in
 * one place — this is exactly the kind of drift that broke every existing assessment-flow test
 * when the consent step was added.
 */
export async function completeIntake(
  page: Page,
  { businessName, tier = "A" }: { businessName: string; tier?: "A" | "B" | "C" },
) {
  await completeConsentStep(page);

  const nameField = page.getByLabel("Business name");
  await nameField.waitFor({ state: "visible", timeout: 20000 });
  await nameField.fill(businessName);
  for (const q of CLASSIFICATION_QUESTIONS) {
    await page.locator(`#${q.id}-${tier}`).click();
  }
  await page.getByRole("button", { name: "Continue" }).click();

  const startButton = page.getByRole("button", { name: "Start my assessment" });
  await startButton.waitFor({ state: "visible", timeout: 20000 });
  await startButton.click();
  await page.waitForURL(/\/alita\/assessment\//);
}

/**
 * Walks a Current Profile domain's 5-item battery — all 5 statements shown together on one page
 * — strongly agreeing with items 1..targetLevel and strongly disagreeing with the rest, then
 * accepts the computed value at the confirm step without overriding it. Produces exactly
 * `targetLevel` via the cumulative scoring rule, through the real UI.
 */
export async function answerDomainToLevel(page: Page, targetLevel: number, isLastDomain: boolean) {
  for (let itemLevel = 1; itemLevel <= 5; itemLevel++) {
    const scaleValue = itemLevel <= targetLevel ? 5 : 1;
    const option = page.getByTestId(`agree-scale-${itemLevel}-${scaleValue}`);
    await option.waitFor({ state: "visible", timeout: 20000 });
    await option.click();
  }
  const continueButton = page.getByRole("button", { name: "Continue" });
  await expect(continueButton).toBeEnabled({ timeout: 10000 });
  await continueButton.click();

  // Confirm phase — accept the computed value as-is.
  const confirmButton = page.getByRole("button", {
    name: isLastDomain ? "Finish" : "Confirm & continue",
  });
  await confirmButton.waitFor({ state: "visible", timeout: 20000 });
  await expect(confirmButton).toBeEnabled({ timeout: 10000 });
  await confirmButton.click();
}
