import { test, expect } from "@playwright/test";
import { CLASSIFICATION_QUESTIONS } from "../src/lib/alita/classification";
import { DOMAINS, type DomainId } from "../src/lib/alita/domains";
import { waitForHydration } from "./helpers";

// Complete a lesson's quiz and confirm it shows as completed on a repeat Training Hub visit —
// supports the "ongoing check, not a one-time report" framing (T4/T18).

// All domains at Level 1 guarantees at least one Action Plan entry with a "Learn more" link.
const LOW_LEVELS: Record<DomainId, number> = { D1: 1, D2: 1, D3: 1, D4: 1, D5: 1, D6: 1 };

test("completing a lesson quiz marks it done on the Training Hub", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/alita/start");
  await waitForHydration(page);
  await page.getByLabel("Business name").fill("Training Completion Test Co");

  for (const q of CLASSIFICATION_QUESTIONS) {
    await page.locator(`#${q.id}-A`).click();
  }
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Start my assessment" }).click();
  await page.waitForURL(/\/alita\/assessment\//);

  for (let i = 0; i < DOMAINS.length; i++) {
    const level = LOW_LEVELS[DOMAINS[i].id];
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

  const learnMoreLink = page.getByRole("link", { name: "Learn more →" }).first();
  await learnMoreLink.waitFor({ state: "visible" });
  await learnMoreLink.click();
  await page.waitForURL(/\/training\/.+smeId=/);

  const url = new URL(page.url());
  const smeId = url.searchParams.get("smeId");
  expect(smeId).toBeTruthy();

  // Answer every quiz question with option 0 — the point is exercising the completion flow,
  // not necessarily scoring 100%.
  await page.getByTestId("quiz-question-0").waitFor({ state: "visible" });
  const questionCards = page.locator('[data-testid^="quiz-question-"]');
  const count = await questionCards.count();
  for (let i = 0; i < count; i++) {
    const card = questionCards.nth(i);
    const radio = card.getByRole("radio").first();
    await radio.waitFor({ state: "visible" });
    await radio.click();
  }
  const submitButton = page.getByRole("button", { name: "Check my answers" });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
  await page.getByText(/Nice work/).waitFor();

  await page.getByRole("link", { name: "Back to Training Hub" }).click();
  await page.waitForURL(/\/training(\/|\?|$)/);
  await expect(page.getByText("Done").first()).toBeVisible();
});
