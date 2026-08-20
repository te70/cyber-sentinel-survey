import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface BarPoint {
  label: string;
  value: number;
}

// Generic horizontal bar chart reused for both band distribution (counts) and per-domain
// completion rates (%) on the researcher dashboard — same recharts primitives as
// DomainRadarChart, just a different chart type.
export function SimpleBarChart({
  points,
  valueSuffix = "",
}: {
  points: BarPoint[];
  valueSuffix?: string;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid stroke="var(--border)" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={130}
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
          />
          <Tooltip
            formatter={(v: number) => [`${v}${valueSuffix}`, ""]}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" fill="var(--chart-4)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
