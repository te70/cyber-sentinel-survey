import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GenerateAssessmentPdfSchema = z.object({ assessmentId: z.string().uuid() });

// Renders the exact same on-screen results component (in print mode — see
// results.$assessmentId.tsx's `?print=1` handling) via a real headless browser, so the PDF and
// the in-app report can never diverge on figures. Playwright is already a project dependency
// with a working, sandbox-verified Chromium download (used for e2e tests) — reused here instead
// of adding a second browser-automation dependency (e.g. Puppeteer).
export const generateAssessmentPdf = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => GenerateAssessmentPdfSchema.parse(d))
  .handler(async ({ data }) => {
    const { chromium } = await import("playwright");

    const siteUrl = process.env.SITE_URL ?? "http://localhost:5173";
    const printUrl = `${siteUrl}/alita/results/${data.assessmentId}?print=1`;

    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.goto(printUrl, { waitUntil: "networkidle" });
      // The marker is deliberately hidden (display:none) — it's a machine-readable "data has
      // loaded" signal, not meant to be seen — so wait for it to attach, not become visible.
      await page.waitForSelector('[data-report-ready="true"]', {
        state: "attached",
        timeout: 20_000,
      });

      const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
      return { base64: Buffer.from(pdfBuffer).toString("base64") };
    } finally {
      await browser.close();
    }
  });
