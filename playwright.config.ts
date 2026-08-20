import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// Needed for specs that talk to Postgres directly (see training-completion-celebration.spec.ts)
// — Playwright's own Node process doesn't load .env automatically, unlike `vite dev` in the
// webServer child process. Same fix already applied to vitest.config.ts for the same reason.
config();

export default defineConfig({
  testDir: "./e2e",
  // Sequential execution — safer against a single `vite dev` process + local Postgres than
  // parallel workers, and the full suite still runs in a few minutes.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
