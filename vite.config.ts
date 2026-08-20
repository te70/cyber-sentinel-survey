import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
    }),
    react(),
  ],
  // playwright/playwright-core are server-only (used from pdf.functions.ts to render the PDF
  // export) and pull in Node-native CJS internals (chromium-bidi) that break Vite's client-side
  // dependency pre-bundling scan if it tries to touch them.
  optimizeDeps: {
    exclude: ["playwright", "playwright-core"],
  },
  ssr: {
    external: ["playwright", "playwright-core"],
  },
});
