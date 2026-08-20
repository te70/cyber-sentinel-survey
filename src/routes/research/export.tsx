import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ResearcherPageHeader } from "@/components/alita/ResearcherPageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { generateResearchExport } from "@/lib/alita/export.functions";
import { getResearcherAuthStatus } from "@/lib/researcher-auth.functions";

// Unlisted researcher-only route — not linked from any nav, and gated by a real session cookie.
// The server function itself also checks the session (see requireResearcherSession in
// export.functions.ts), so there's no unguarded network path even if this UI were bypassed.
export const Route = createFileRoute("/research/export")({
  component: ExportScreen,
});

function base64ToBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function ExportScreen() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getResearcherAuthStatus().then((res) => setAuthenticated(res.authenticated));
  }, []);

  async function handleDownload() {
    setBusy(true);
    setError(null);
    try {
      const { base64 } = await generateResearchExport();
      const blob = base64ToBlob(base64);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `alita-research-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // The session cookie (8-hour expiry) may have lapsed between page load and this click —
      // check auth status again so a stale session shows "please sign in again" rather than a
      // generic failure that leaves someone stuck with no path forward.
      const { authenticated: stillAuthenticated } = await getResearcherAuthStatus();
      if (!stillAuthenticated) {
        setAuthenticated(false);
      } else {
        setError("Couldn't generate the export. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (authenticated === null) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-5">
        <Card className="w-full max-w-sm p-6 text-center">
          <p className="text-sm text-muted-foreground">You need to sign in to view this page.</p>
          <Button className="mt-4 w-full" asChild>
            <Link to="/research/login">Go to login</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-md">
        <ResearcherPageHeader />
        <h1 className="text-xl font-bold text-foreground">Research export</h1>
        <Card className="mt-4 p-5">
          <p className="text-sm text-muted-foreground">
            Downloads a pseudonymised .xlsx workbook (Data Dictionary, Profile, Assessments,
            Targets, Training, Item Responses) covering only SMEs with active research participation
            consent.
          </p>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <Button className="mt-4 w-full" onClick={handleDownload} disabled={busy}>
            {busy ? "Generating…" : "Download export"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
