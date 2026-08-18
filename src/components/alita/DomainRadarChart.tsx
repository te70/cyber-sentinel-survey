import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

export interface DomainRadarPoint {
  domainId: string;
  label: string;
  level: number;
}

export function DomainRadarChart({ points }: { points: DomainRadarPoint[] }) {
  const data = points.map((p) => ({ domain: `${p.domainId}`, fullLabel: p.label, level: p.level }));

  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="domain"
            tick={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 5]}
            tickCount={6}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          />
          <Radar
            name="Maturity level"
            dataKey="level"
            stroke="var(--chart-5)"
            fill="var(--chart-3)"
            fillOpacity={0.45}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
