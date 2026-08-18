// Manual/CI-triggerable check that every seeded tool recommendation URL still resolves.
// Run with `npm run check:tools`. Not recurring infrastructure — standing up an actual
// scheduled job/alerting pipeline for this is a hosting decision left to the researcher.

import { TOOLS } from "../prisma/seed/tools.data";

const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; AlitaToolLinkCheck/1.0)" };

async function fetchOnce(url: string, method: "HEAD" | "GET") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(url, {
      method,
      redirect: "follow",
      signal: controller.signal,
      headers: HEADERS,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function checkUrl(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  // Some sites reject HEAD, and network calls in CI can be transiently flaky — try HEAD then
  // GET, twice each, before declaring a real failure.
  for (const method of ["HEAD", "GET"] as const) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetchOnce(url, method);
        if (res.ok) return { ok: true, status: res.status };
        if (res.status !== 405 && res.status !== 403) return { ok: false, status: res.status };
      } catch (err) {
        if (attempt === 1 && method === "GET") {
          return { ok: false, error: err instanceof Error ? err.message : String(err) };
        }
      }
    }
  }
  return { ok: false, error: "exhausted retries" };
}

async function main() {
  console.log(`Checking ${TOOLS.length} seeded tool URLs...\n`);
  let failures = 0;

  for (const tool of TOOLS) {
    const result = await checkUrl(tool.url);
    if (result.ok) {
      console.log(`OK    ${tool.status ?? ""} ${tool.name} — ${tool.url}`);
    } else {
      failures++;
      console.log(`FAIL  ${result.status ?? result.error} ${tool.name} — ${tool.url}`);
    }
  }

  console.log(`\n${TOOLS.length - failures}/${TOOLS.length} URLs OK.`);
  if (failures > 0) {
    console.log(`${failures} URL(s) need attention — verify manually before pilot use.`);
    process.exitCode = 1;
  }
}

main();
