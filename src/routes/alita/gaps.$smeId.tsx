import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DOMAINS, type DomainId } from "@/lib/alita/domains";
import { getAssessmentGaps } from "@/lib/alita/alita.functions";

export const Route = createFileRoute("/alita/gaps/$smeId")({
  component: GapsScreen,
});

interface GapItem {
  domainId: DomainId;
  gapSize: number;
  priority: "High" | "Medium" | "Low";
}

const PRIORITY_VARIANT: Record<GapItem["priority"], "default" | "secondary" | "outline"> = {
  High: "default",
  Medium: "secondary",
  Low: "outline",
};

function GapsScreen() {
  const { smeId } = Route.useParams();
  const [items, setItems] = useState<GapItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAssessmentGaps({ data: { smeId } }).then((res) => {
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setItems([...res.items].sort((a, b) => b.gapSize - a.gapSize) as GapItem[]);
    });
  }, [smeId]);

  const domainLabel = (id: DomainId) => DOMAINS.find((d) => d.id === id)?.label ?? id;

  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground">Where to focus next</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ranked by how much improving each area would move you toward your target.
        </p>

        {error && (
          <Card className="mt-6 p-5 text-sm text-muted-foreground">
            {error} Complete both a current assessment and a target profile to see your gap list.
          </Card>
        )}

        {!error && !items && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}

        {items && items.length === 0 && (
          <Card className="mt-6 p-5 text-sm text-muted-foreground">
            No gaps found — your target matches (or is below) your current levels in every area.
          </Card>
        )}

        {items && items.length > 0 && (
          <ol className="mt-6 space-y-3">
            {items.map((item) => (
              <li key={item.domainId}>
                <Card className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-semibold text-foreground">{domainLabel(item.domainId)}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {item.gapSize} level{item.gapSize === 1 ? "" : "s"} to close
                    </p>
                  </div>
                  <Badge variant={PRIORITY_VARIANT[item.priority]}>{item.priority}</Badge>
                </Card>
              </li>
            ))}
          </ol>
        )}

        <Button variant="outline" asChild className="mt-8 w-full">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
