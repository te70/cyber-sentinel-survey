// Admin server functions — localStorage bypass mode.
// Supabase and auth middleware removed; all functions return stub data.
// Re-wire to Supabase once the service role key is available.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const checkIsAdmin = createServerFn({ method: "GET" }).handler(async () => {
  return { isAdmin: true };
});

export const adminGetStats = createServerFn({ method: "GET" }).handler(async () => {
  return {
    total: 0,
    completed: 0,
    screened: 0,
    partial: 0,
    payouts: { sent: 0, submitted: 0, failed: 0, pending: 0 },
  };
});

export const adminListResponses = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        payoutStatus: z.string().optional(),
        completedOnly: z.boolean().optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data: _data }) => {
    return [] as {
      id: string;
      created_at: string;
      completed: boolean;
      screened_in: boolean;
      masked_phone: string;
      payout_status: string;
      mpesa_transaction_id: string | null;
      payout_error: string | null;
      sector: string | null;
    }[];
  });

export const adminExportCsv = createServerFn({ method: "GET" }).handler(async () => {
  const headers = ["id", "created_at", "completed_at", "payout_status", "section_a", "section_b", "section_c", "section_d"];
  return { csv: headers.join(",") + "\n" };
});

export const adminRetryPayout = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ responseId: z.string().uuid() }).parse(d))
  .handler(async ({ data: _data }) => {
    return { ok: true };
  });
