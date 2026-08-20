import { test, expect } from "@playwright/test";
import { DOMAINS, type DomainId } from "../src/lib/alita/domains";
import { answerDomainToLevel, completeIntake, waitForHydration } from "./helpers";

// Scenario 2 (brief Phase 9, re-run through the item battery per the follow-up brief's Phase
// 8): produce the Section 10.1 worked-example scores through the real multi-item assessment
// UI — not a directly-injected score — and confirm the results screen shows band "Initial"
// with the gate-explanation note, alongside the ungated per-domain radar chart. This proves the
// cumulative item-battery pipeline reproduces the same regression-tested output the original
// direct-injection version already confirmed.

const WORKED_EXAMPLE_LEVELS: Record<DomainId, number> = {
  D1: 4,
  D2: 3,
  D3: 5,
  D4: 1,
  D5: 4,
  D6: 3,
};

test("Section 10.1 worked example, via the item battery -> Initial band with gate note", async ({
  page,
}) => {
  test.setTimeout(150_000);
  await page.goto("/alita/start");
  await waitForHydration(page);
  await completeIntake(page, { businessName: "Worked Example Business" });

  for (let i = 0; i < DOMAINS.length; i++) {
    const domain = DOMAINS[i];
    const isLastDomain = i === DOMAINS.length - 1;
    await answerDomainToLevel(page, WORKED_EXAMPLE_LEVELS[domain.id], isLastDomain);
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
