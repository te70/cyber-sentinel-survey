import { test, expect, devices } from "@playwright/test";
import { DOMAINS, type DomainId } from "../src/lib/alita/domains";
import { answerDomainToLevel, completeIntake, waitForHydration } from "./helpers";

// Emulated mobile/slow-connection smoke pass — a mid-range Android viewport/UA plus CDP
// network + CPU throttling. This is a proxy for the target user base (Nairobi SMEs on mobile
// data), not a substitute for testing on physical hardware; treat a pass here as "didn't
// obviously break," not as real-device QA.

test.use({ ...devices["Pixel 5"] });

const LEVELS: Record<DomainId, number> = { D1: 3, D2: 3, D3: 3, D4: 3, D5: 3, D6: 3 };

test("dashboard and a full assessment flow complete on an emulated mid-range Android + throttled connection", async ({
  page,
  context,
}) => {
  test.setTimeout(240_000);

  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  // Roughly "Slow 4G" — throttled enough to be meaningful without making the test itself flaky.
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    latency: 150,
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.goto("/alita/start");
  await waitForHydration(page);
  await completeIntake(page, { businessName: "Mobile Smoke Test Co" });

  for (let i = 0; i < DOMAINS.length; i++) {
    await answerDomainToLevel(page, LEVELS[DOMAINS[i].id], i === DOMAINS.length - 1);
  }
  await page.waitForURL(/\/alita\/results\//, { timeout: 60000 });
  await expect(page.getByText("Overall maturity:")).toBeVisible({ timeout: 30000 });

  const dashboardLink = page.getByRole("link", { name: "Dashboard", exact: true });
  await dashboardLink.waitFor({ state: "visible", timeout: 30000 });
  await dashboardLink.click();
  await page.waitForURL(/\/alita\/dashboard\//, { timeout: 30000 });
  await expect(page.getByText("Current assessment")).toBeVisible({ timeout: 30000 });
});
