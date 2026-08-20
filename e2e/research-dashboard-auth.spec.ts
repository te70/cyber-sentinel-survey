import { test, expect } from "@playwright/test";
import { waitForHydration } from "./helpers";

// Same guard shape as researcher-export-auth.spec.ts: unauthenticated visitors get a login
// prompt, a logged-in researcher sees real aggregate numbers, and the server function itself
// hard-403s an unauthenticated request — not just the UI hiding content.

test("research dashboard requires login, renders real data once signed in, and the endpoint itself hard-403s when unauthenticated", async ({
  page,
  browser,
}) => {
  test.setTimeout(60_000);

  // Unauthenticated: login prompt, not dashboard content.
  await page.goto("/research/dashboard");
  await waitForHydration(page);
  await page
    .getByRole("link", { name: "Go to login" })
    .waitFor({ state: "visible", timeout: 20000 });
  await expect(page.getByText("Population")).toHaveCount(0);

  await page.getByRole("link", { name: "Go to login" }).click();
  await page.waitForURL(/\/research\/login/);
  await waitForHydration(page);
  const usernameField = page.getByLabel("Username");
  await usernameField.waitFor({ state: "visible", timeout: 20000 });
  await usernameField.fill(process.env.RESEARCHER_USERNAME ?? "researcher");
  await page
    .getByLabel("Password")
    .fill(process.env.RESEARCHER_INITIAL_PASSWORD ?? "dev-researcher-password");

  // Capture the exact getResearchDashboard request URL as it fires.
  let dashboardRequestUrl: string | null = null;
  page.on("request", (req) => {
    const match = /\/_serverFn\/([^/?]+)/.exec(req.url());
    if (!match) return;
    try {
      const decoded = Buffer.from(match[1], "base64").toString("utf-8");
      if (decoded.includes("getResearchDashboard")) dashboardRequestUrl = req.url();
    } catch {
      // not a valid base64 segment — ignore
    }
  });

  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/research\/dashboard/);
  await waitForHydration(page);

  // Authenticated: real aggregate sections render.
  await page.getByText("Population").waitFor({ state: "visible", timeout: 20000 });
  await expect(page.getByText("Consented SMEs")).toBeVisible();
  await expect(page.getByText("Maturity results")).toBeVisible();
  await expect(page.getByText("Training engagement")).toBeVisible();
  await expect(page.getByText("DPA readiness")).toBeVisible();

  expect(dashboardRequestUrl).toBeTruthy();

  // Replay that exact URL from a brand-new, cookie-less browser context.
  const freshContext = await browser.newContext();
  const response = await freshContext.request.get(dashboardRequestUrl!);
  expect(response.status()).toBe(403);
  await freshContext.close();
});
