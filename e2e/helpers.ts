import type { Page } from "@playwright/test";

// TanStack Start's SSR shell renders static HTML before React hydrates and attaches event
// listeners; clicking that fast (as Playwright does) silently no-ops. `$_TSR` is deleted from
// `window` once hydration + the SSR stream both finish, so waiting for it to disappear is a
// reliable "the page is actually interactive now" signal.
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => (window as unknown as { $_TSR?: unknown }).$_TSR === undefined);
}
