import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { config } from "dotenv";

config();

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["src/**/*.test.ts", "prisma/**/*.test.ts"],
    // Integration tests hit the real dev DB (see consent-export.integration.test.ts) and grow
    // slower as repeated e2e/manual runs accumulate more fixture rows there — the 5s default
    // has already been outgrown once. Not a substitute for real test-DB isolation, just headroom.
    testTimeout: 20000,
  },
});
