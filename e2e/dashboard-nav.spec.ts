import { test, expect } from "@playwright/test";
import { DOMAINS, type DomainId } from "../src/lib/alita/domains";
import { answerDomainToLevel, completeIntake, waitForHydration } from "./helpers";

// Confirms the dashboard is actually reachable (there's no login — the only path in is a saved
// link) and that it reflects real mixed state: a completed current assessment, no target set yet,
// and no training started yet — then that the shared SmePageHeader nav actually gets you around.

const LEVELS: Record<DomainId, number> = { D1: 3, D2: 3, D3: 3, D4: 3, D5: 3, D6: 3 };

test("dashboard is reachable from results, shows real state, and nav links work", async ({
  page,
}) => {
  test.setTimeout(150_000);
  await page.goto("/alita/start");
  await waitForHydration(page);
  await completeIntake(page, { businessName: "Dashboard Nav Test Co" });

  for (let i = 0; i < DOMAINS.length; i++) {
    await answerDomainToLevel(page, LEVELS[DOMAINS[i].id], i === DOMAINS.length - 1);
  }
  await page.waitForURL(/\/alita\/results\//);

  // The results page's SmePageHeader carries the only in-app path to the dashboard.
  const dashboardLink = page.getByRole("link", { name: "Dashboard", exact: true });
  await dashboardLink.waitFor({ state: "visible", timeout: 20000 });
  await dashboardLink.click();
  await page.waitForURL(/\/alita\/dashboard\//);
  await waitForHydration(page);

  // Current assessment: complete, shows a band and a report link.
  await page.getByText("Current assessment").waitFor({ state: "visible", timeout: 20000 });
  await expect(page.getByRole("link", { name: "View report" })).toBeVisible();

  // Target: nothing set yet.
  await expect(page.getByText("Decide where you want your business to be")).toBeVisible();
  await expect(page.getByRole("button", { name: "Set a target" })).toBeVisible();

  // Training: nothing started yet.
  await expect(page.getByText("You haven't started any lessons yet")).toBeVisible();

  const trainingLink = page.getByRole("link", { name: "Start training" });
  await trainingLink.click();
  await page.waitForURL(/\/training/);
  await waitForHydration(page);
  await expect(page.getByRole("heading", { name: "Training Hub" })).toBeVisible();

  // From Training Hub, the shared header nav gets back to the dashboard and to settings.
  const dashboardNavLink = page.getByRole("link", { name: "Dashboard", exact: true });
  await dashboardNavLink.waitFor({ state: "visible", timeout: 20000 });
  await dashboardNavLink.click();
  await page.waitForURL(/\/alita\/dashboard\//);

  const settingsNavLink = page.getByRole("link", { name: "Settings", exact: true });
  await settingsNavLink.waitFor({ state: "visible", timeout: 20000 });
  await settingsNavLink.click();
  await page.waitForURL(/\/alita\/settings\//);
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
});
