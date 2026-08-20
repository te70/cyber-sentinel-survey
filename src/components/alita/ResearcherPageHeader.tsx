import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { researcherLogout } from "@/lib/researcher-auth.functions";

// Shared header for the two researcher-only pages (dashboard, export) — same justification as
// SmePageHeader, just for a smaller, single-role nav.
export function ResearcherPageHeader() {
  const navigate = useNavigate();

  async function handleLogout() {
    await researcherLogout();
    navigate({ to: "/research/login" });
  }

  return (
    <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
      <nav className="flex items-center gap-4 text-sm text-muted-foreground">
        <Link
          to="/research/dashboard"
          className="hover:text-foreground [&.active]:font-semibold [&.active]:text-foreground"
        >
          Dashboard
        </Link>
        <Link
          to="/research/export"
          className="hover:text-foreground [&.active]:font-semibold [&.active]:text-foreground"
        >
          Export
        </Link>
      </nav>
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        Sign out
      </Button>
    </div>
  );
}
