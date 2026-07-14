import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const checkIsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  return { isAdmin: true };
});

export const adminGetStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { db } = await import("@/lib/db");
    const [total, completed, screened] = await Promise.all([
      db.response.count(),
      db.response.count({ where: { completed: true } }),
      db.response.count({ where: { screenedIn: true } }),
    ]);
    return {
      total,
      completed,
      screened,
      partial: screened - completed,
    };
  } catch {
    return { total: 0, completed: 0, screened: 0, partial: 0 };
  }
});

export const adminListResponses = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({
      completedOnly: z.boolean().optional(),
      limit: z.number().int().min(1).max(500).optional(),
    }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    try {
      const { db } = await import("@/lib/db");
      const rows = await db.response.findMany({
        where: data.completedOnly ? { completed: true } : undefined,
        take: data.limit ?? 200,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          completed: true,
          screenedIn: true,
          businessName: true,
          screening: true,
        },
      });
      return rows.map((r) => ({
        id: r.id,
        created_at: r.createdAt.toISOString(),
        completed: r.completed,
        screened_in: r.screenedIn,
        business_name: r.businessName ?? null,
        sector: (r.screening as Record<string, unknown> | null)?.q2_business_type as string | null ?? null,
      }));
    } catch {
      return [] as {
        id: string;
        created_at: string;
        completed: boolean;
        screened_in: boolean;
        business_name: string | null;
        sector: string | null;
      }[];
    }
  });

export const adminGetResponse = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const r = await db.response.findUniqueOrThrow({ where: { id: data.id } });
    return {
      id: r.id,
      created_at: r.createdAt.toISOString(),
      completed_at: r.completedAt?.toISOString() ?? null,
      business_name: r.businessName ?? null,
      website_url: r.websiteUrl ?? null,
      completed: r.completed,
      screened_in: r.screenedIn,
      screening: r.screening,
      section_a: r.sectionA,
      section_b: r.sectionB,
      section_c: r.sectionC,
      section_d: r.sectionD,
    };
  });

export const adminExportCsv = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { db } = await import("@/lib/db");
    const rows = await db.response.findMany({
      where: { completed: true },
      orderBy: { createdAt: "asc" },
    });
    const headers = ["id", "created_at", "completed_at", "business_name", "section_a", "section_b", "section_c", "section_d"];
    const lines = rows.map((r) =>
      [
        r.id,
        r.createdAt.toISOString(),
        r.completedAt?.toISOString() ?? "",
        r.businessName ?? "",
        JSON.stringify(r.sectionA ?? {}),
        JSON.stringify(r.sectionB ?? {}),
        JSON.stringify(r.sectionC ?? {}),
        JSON.stringify(r.sectionD ?? {}),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    return { csv: [headers.join(","), ...lines].join("\n") };
  } catch {
    return { csv: "" };
  }
});
