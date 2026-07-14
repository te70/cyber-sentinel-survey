import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { adminGetResponse } from "@/lib/survey/admin.functions";
import {
  SECTION_A,
  SECTION_B_LIKERT,
  SECTION_C_BARRIERS,
  B7d_ITEMS,
  D1_ITEMS,
  D2_ITEMS,
  D3_ITEMS,
  D4_PROMPTS,
} from "@/lib/survey/schema";

type ResponseData = {
  id: string;
  created_at: string;
  completed_at: string | null;
  business_name: string | null;
  website_url: string | null;
  completed: boolean;
  screened_in: boolean;
  screening: unknown;
  section_a: unknown;
  section_b: unknown;
  section_c: unknown;
  section_d: unknown;
};

type JsonSection = Record<string, unknown>;

export function ResponseDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const getResponse = useServerFn(adminGetResponse);
  const q = useQuery({
    queryKey: ["admin-response", id],
    queryFn: () => getResponse({ data: { id } }),
  });

  const r = q.data as ResponseData | null | undefined;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-2xl h-full bg-background border-l flex flex-col shadow-xl">
        <header className="shrink-0 border-b px-6 py-4 flex items-start justify-between bg-background">
          <div>
            <h2 className="font-semibold text-sm">{r?.business_name ?? "Response"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">{id}</p>
            {r && (
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(r.created_at).toLocaleString()} ·{" "}
                {r.completed ? "✅ Completed" : r.screened_in ? "📝 Partial" : "Screened"}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 text-sm">
          {q.isLoading && (
            <p className="text-xs text-muted-foreground">Loading…</p>
          )}
          {q.isError && (
            <p className="text-xs text-destructive">Failed to load response.</p>
          )}
          {r && (
            <>
              {r.screening && <ScreeningSection data={r.screening as JsonSection} />}
              {r.section_a && <SectionAView data={r.section_a as JsonSection} />}
              {r.section_b && <SectionBView data={r.section_b as JsonSection} />}
              {r.section_c && <SectionCView data={r.section_c as JsonSection} />}
              {r.section_d && <SectionDView data={r.section_d as JsonSection} />}
              {!r.section_a && !r.section_b && !r.section_c && !r.section_d && (
                <p className="text-xs text-muted-foreground">No survey sections filled yet.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section wrappers ────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 pb-1.5 border-b">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function GroupBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </p>
      <div className="rounded-lg border overflow-hidden divide-y">{children}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-3 px-3 py-2">
      <span className="w-36 shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="text-xs">{value || "—"}</span>
    </div>
  );
}

function YNRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2">
      <YN value={value as string} />
      <span className="text-xs leading-relaxed">{label}</span>
    </div>
  );
}

function YN({ value }: { value: string | undefined }) {
  if (value === "yes")
    return (
      <span className="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
        YES
      </span>
    );
  if (value === "no")
    return (
      <span className="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
        NO
      </span>
    );
  return (
    <span className="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-bold bg-secondary text-muted-foreground">
      —
    </span>
  );
}

function Tags({ values }: { values: unknown }) {
  const arr = Array.isArray(values) ? (values as string[]) : [];
  if (arr.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {arr.map((v) => (
        <span key={v} className="rounded bg-secondary px-2 py-0.5 text-xs">
          {v}
        </span>
      ))}
    </div>
  );
}

// ─── Screening ───────────────────────────────────────────────────────────────

function ScreeningSection({ data }: { data: Record<string, unknown> }) {
  return (
    <Section title="Screening / Demographics">
      <div className="rounded-lg border overflow-hidden divide-y">
        <KV label="Full name" value={data.fullName as string} />
        <KV label="Age" value={data.age as string} />
        <KV label="Gender" value={data.gender as string} />
        <KV label="Education" value={data.education as string} />
        <KV label="Business name" value={data.businessName as string} />
        <KV label="Website" value={data.websiteUrl as string} />
        <KV label="Sector" value={data.q2_business_type as string} />
        <KV label="Role" value={data.q3_role as string} />
        <div className="flex gap-3 px-3 py-2">
          <span className="w-36 shrink-0 text-xs text-muted-foreground">Social platforms</span>
          <div className="text-xs">
            <Tags values={data.socialPlatforms} />
          </div>
        </div>
        <KV label="Social handle" value={data.socialHandle as string} />
        <KV label="Based in Nairobi" value={data.q1_nairobi ? "Yes" : "No"} />
        <KV label="Uses digital platform" value={data.q4_digital_platform ? "Yes" : "No"} />
      </div>
    </Section>
  );
}

// ─── Section A ───────────────────────────────────────────────────────────────

function SectionAView({ data }: { data: Record<string, unknown> }) {
  return (
    <Section title="Section A — Organisational Profile">
      <div className="rounded-lg border overflow-hidden divide-y">
        {(Object.entries(SECTION_A) as [string, { label: string; type: string }][]).map(
          ([key, q]) => (
            <div key={key} className="px-3 py-2 space-y-0.5">
              <p className="text-[11px] text-muted-foreground">{q.label}</p>
              <p className="text-xs font-medium">
                {Array.isArray(data[key])
                  ? (data[key] as string[]).join(", ") || "—"
                  : String(data[key] ?? "—")}
              </p>
            </div>
          ),
        )}
      </div>
    </Section>
  );
}

// ─── Section B ───────────────────────────────────────────────────────────────

function SectionBView({ data }: { data: Record<string, unknown> }) {
  return (
    <Section title="Section B — Cybersecurity Practices">
      {(
        Object.entries(SECTION_B_LIKERT) as [
          string,
          { title: string; items: readonly string[] },
        ][]
      ).map(([domain, { title, items }]) => (
        <GroupBlock key={domain} label={`${domain} — ${title}`}>
          {items.map((item, i) => (
            <YNRow key={`${domain}_${i + 1}`} label={item} value={data[`${domain}_${i + 1}`]} />
          ))}
        </GroupBlock>
      ))}

      <GroupBlock label="B7 — Threat Exposure">
        <div className="px-3 py-2 space-y-1">
          <p className="text-[11px] text-muted-foreground">Incident types experienced</p>
          <Tags values={data.B7a} />
        </div>
        <div className="flex gap-3 px-3 py-2">
          <span className="w-40 shrink-0 text-xs text-muted-foreground">Frequency</span>
          <span className="text-xs">{String(data.B7b ?? "—")}</span>
        </div>
        <div className="px-3 py-2 space-y-1">
          <p className="text-[11px] text-muted-foreground">Impact experienced</p>
          <Tags values={data.B7c} />
        </div>
        {B7d_ITEMS.map((item, i) => (
          <YNRow key={`B7d_${i + 1}`} label={item} value={data[`B7d_${i + 1}`]} />
        ))}
      </GroupBlock>
    </Section>
  );
}

// ─── Section C ───────────────────────────────────────────────────────────────

function SectionCView({ data }: { data: Record<string, unknown> }) {
  return (
    <Section title="Section C — Adoption Barriers">
      {(
        Object.entries(SECTION_C_BARRIERS) as [
          string,
          { title: string; items: readonly string[] },
        ][]
      ).map(([cat, { title, items }]) => (
        <GroupBlock key={cat} label={`${cat} — ${title}`}>
          {items.map((item, i) => (
            <YNRow key={`${cat}_${i + 1}`} label={item} value={data[`${cat}_${i + 1}`]} />
          ))}
        </GroupBlock>
      ))}

      {data.C5 != null && (
        <div className="text-xs">
          <span className="text-muted-foreground">Most significant barrier: </span>
          <span className="font-medium">{String(data.C5)}</span>
        </div>
      )}
    </Section>
  );
}

// ─── Section D ───────────────────────────────────────────────────────────────

function SectionDView({ data }: { data: Record<string, unknown> }) {
  const groups = [
    { key: "D1", label: "D1 — Usability", items: D1_ITEMS },
    { key: "D2", label: "D2 — Perceived Value", items: D2_ITEMS },
    { key: "D3", label: "D3 — Contextual Relevance", items: D3_ITEMS },
  ];

  return (
    <Section title="Section D — Model Usability">
      {groups.map(({ key, label, items }) => (
        <GroupBlock key={key} label={label}>
          {items.map((item, i) => (
            <YNRow key={`${key}_${i + 1}`} label={item} value={data[`${key}_${i + 1}`]} />
          ))}
        </GroupBlock>
      ))}

      <GroupBlock label="D4 — Open Feedback">
        {(Object.entries(D4_PROMPTS) as [string, string][]).map(([key, prompt]) => (
          <div key={key} className="px-3 py-2 space-y-1">
            <p className="text-[11px] text-muted-foreground">{prompt}</p>
            <p className="text-xs">{String(data[key] ?? "—")}</p>
          </div>
        ))}
      </GroupBlock>
    </Section>
  );
}
