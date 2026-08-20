import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";

interface SmePageHeaderProps {
  smeId: string;
  name: string;
  tier: "A" | "B" | "C";
}

// Shared header for every SME-facing page (dashboard, results, settings, gaps, training hub) —
// gives each page a way back to the others. Before this, reaching any one of these pages was a
// dead end; there was no way to discover the others without a separately-saved link.
export function SmePageHeader({ smeId, name, tier }: SmePageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div className="flex items-center gap-2.5">
        <span className="font-semibold text-foreground">{name}</span>
        <Badge variant="secondary">Tier {tier}</Badge>
      </div>
      <nav className="flex items-center gap-4 text-sm text-muted-foreground">
        <Link
          to="/alita/dashboard/$smeId"
          params={{ smeId }}
          className="hover:text-foreground [&.active]:font-semibold [&.active]:text-foreground"
        >
          Dashboard
        </Link>
        <Link
          to="/training"
          search={{ smeId }}
          className="hover:text-foreground [&.active]:font-semibold [&.active]:text-foreground"
        >
          Training
        </Link>
        <Link
          to="/alita/settings/$smeId"
          params={{ smeId }}
          className="hover:text-foreground [&.active]:font-semibold [&.active]:text-foreground"
        >
          Settings
        </Link>
      </nav>
    </div>
  );
}
