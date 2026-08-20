import { test, expect } from "@playwright/test";
import { DOMAINS } from "../src/lib/alita/domains";
import { answerDomainToLevel, completeIntake, waitForHydration } from "./helpers";

// Confirms per-item auto-save + resume actually work end to end: earlier domains stay confirmed,
// answers already saved for the interrupted domain survive a reload, and you land back exactly
// where you left off instead of restarting at domain 1.

test("reloading mid-domain resumes at the same domain with earlier answers pre-filled", async ({
  page,
}) => {
  test.setTimeout(150_000);
  await page.goto("/alita/start");
  await waitForHydration(page);
  await completeIntake(page, { businessName: "Resume Test Co" });

  // Fully confirm domains 1 and 2.
  await answerDomainToLevel(page, 3, false);
  await answerDomainToLevel(page, 3, false);

  // Domain 3: answer items 1 and 2 only, wait for auto-save to confirm before reloading.
  await page.getByTestId("agree-scale-1-5").waitFor({ state: "visible", timeout: 20000 });
  await page.getByTestId("agree-scale-1-5").click();
  await page.getByText("Saved").first().waitFor({ state: "visible", timeout: 10000 });
  await page.getByTestId("agree-scale-2-5").click();
  await page.getByText("Saved").nth(1).waitFor({ state: "visible", timeout: 10000 });

  await page.reload();
  await waitForHydration(page);

  // Still on domain 3 (index 2), not restarted at domain 1.
  await expect(page.getByText(`Step 3 of ${DOMAINS.length}`)).toBeVisible();
  await expect(page.getByText(DOMAINS[2].label).first()).toBeVisible();

  // Items 1 and 2's prior selections are pre-filled, not blank.
  await expect(page.getByTestId("agree-scale-1-5").getByRole("radio")).toBeChecked();
  await expect(page.getByTestId("agree-scale-2-5").getByRole("radio")).toBeChecked();
});
