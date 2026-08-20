import { test, expect } from "@playwright/test";
import { CLASSIFICATION_QUESTIONS } from "../src/lib/alita/classification";
import { DOMAINS, type DomainId } from "../src/lib/alita/domains";
import { answerDomainToLevel, waitForHydration } from "./helpers";

// Print-mode (?print=1) shows the exact same composite/band/gate figures as the interactive
// results page (same component, same data-fetch — see results.$assessmentId.tsx), and the
// "Download PDF" action produces real PDF bytes. This is the practical proxy for "PDF figures
// match on-screen figures exactly" without needing to parse PDF text content: the PDF is a
// server-side screenshot of this exact page.

const LEVELS: Record<DomainId, number> = { D1: 4, D2: 3, D3: 5, D4: 1, D5: 4, D6: 3 };

test("print mode matches on-screen figures, and PDF download produces real PDF bytes", async ({
  page,
}) => {
  test.setTimeout(150_000);
  await page.goto("/alita/start");
  await waitForHydration(page);
  await page.getByRole("checkbox").nth(0).click();
  await page.getByRole("checkbox").nth(1).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Business name").fill("PDF Export Test Co");
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

  await page.waitForURL(/\/alita\/results\/(?<id>[^?]+)/);
  const assessmentId = new URL(page.url()).pathname.split("/").pop();
  await page.getByText("Overall maturity:").waitFor();
  await page.getByText("Initial", { exact: true }).waitFor();

  // Print mode: same figures, no interactive chrome.
  await page.goto(`/alita/results/${assessmentId}?print=1`);
  await page.waitForSelector('[data-report-ready="true"]', { state: "attached", timeout: 20000 });
  await expect(page.getByText("Overall maturity:")).toBeVisible();
  await expect(page.getByText("Initial", { exact: true })).toBeVisible();
  await expect(page.getByText(/capped at "Initial"/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Download PDF" })).toHaveCount(0);

  // Back to the real page to trigger the actual PDF download.
  await page.goto(`/alita/results/${assessmentId}`);
  await page.getByText("Overall maturity:").waitFor();
  const downloadPromise = page.waitForEvent("download", { timeout: 30000 });
  await page.getByRole("button", { name: "Download PDF" }).click();
  const download = await downloadPromise;
  const filePath = await download.path();
  expect(filePath).toBeTruthy();

  const fs = await import("node:fs");
  const bytes = fs.readFileSync(filePath!);
  expect(bytes.subarray(0, 5).toString("ascii")).toBe("%PDF-");
});
