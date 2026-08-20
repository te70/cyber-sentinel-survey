import { test, expect } from "@playwright/test";
import { waitForHydration } from "./helpers";

// Unauthenticated visitors get a login prompt (not the download button), a logged-in researcher
// can download, and — critically — the server function endpoint itself rejects an unauthenticated
// request with 403, not just the UI hiding a button (replaying the exact request URL a real
// authenticated call used, but from a cookie-less request context).

test("researcher export requires login, and the endpoint itself hard-403s when unauthenticated", async ({
  page,
  browser,
}) => {
  test.setTimeout(60_000);

  // Unauthenticated: UI shows a login prompt, not a download button.
  await page.goto("/research/export");
  await waitForHydration(page);
  await page
    .getByRole("link", { name: "Go to login" })
    .waitFor({ state: "visible", timeout: 20000 });
  await expect(page.getByRole("button", { name: "Download export" })).toHaveCount(0);

  // Log in and capture the exact request URL the authenticated download uses.
  await page.getByRole("link", { name: "Go to login" }).click();
  await page.waitForURL(/\/research\/login/);
  await waitForHydration(page);
  const usernameField = page.getByLabel("Username");
  await usernameField.waitFor({ state: "visible", timeout: 20000 });
  await usernameField.fill(process.env.RESEARCHER_USERNAME ?? "researcher");
  await page
    .getByLabel("Password")
    .fill(process.env.RESEARCHER_INITIAL_PASSWORD ?? "dev-researcher-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  // Post-login lands on the dashboard now (the new primary researcher landing) — navigate to
  // Export via the shared researcher nav, exercising that link along the way.
  await page.waitForURL(/\/research\/dashboard/);
  await waitForHydration(page);
  const exportNavLink = page.getByRole("link", { name: "Export", exact: true });
  await exportNavLink.waitFor({ state: "visible", timeout: 20000 });
  await exportNavLink.click();
  await page.waitForURL(/\/research\/export/);
  await waitForHydration(page);

  // Server function URLs encode {file, export} as a base64 path segment
  // (/_serverFn/<base64>?payload=...), not as readable text — decode each candidate to find the
  // one that's actually generateResearchExport.
  let exportRequestUrl: string | null = null;
  page.on("request", (req) => {
    const match = /\/_serverFn\/([^/?]+)/.exec(req.url());
    if (!match) return;
    try {
      const decoded = Buffer.from(match[1], "base64").toString("utf-8");
      if (decoded.includes("generateResearchExport")) exportRequestUrl = req.url();
    } catch {
      // not a valid base64 segment — ignore
    }
  });

  const downloadButton = page.getByRole("button", { name: "Download export" });
  await downloadButton.waitFor({ state: "visible", timeout: 20000 });
  const downloadPromise = page.waitForEvent("download", { timeout: 30000 });
  await downloadButton.click();
  await downloadPromise;
  expect(exportRequestUrl).toBeTruthy();

  // Replay that exact URL from a brand-new, cookie-less browser context — the endpoint itself
  // must reject it, independent of any UI.
  const freshContext = await browser.newContext();
  const response = await freshContext.request.get(exportRequestUrl!);
  expect(response.status()).toBe(403);
  await freshContext.close();
});
