// Admin server functions — require signed-in user with `admin` role.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .limit(1);
  if (error) throw new Error("role check failed");
  if (!data || data.length === 0) throw new Error("forbidden");
}

export const adminGetStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ count: total }, { count: completed }, { count: screened }] = await Promise.all([
      supabaseAdmin.from("responses").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("responses").select("id", { count: "exact", head: true }).eq("completed", true),
      supabaseAdmin.from("responses").select("id", { count: "exact", head: true }).eq("screened_in", true),
    ]);
    const { data: payoutAgg } = await supabaseAdmin
      .from("responses")
      .select("mpesa_payout_status")
      .eq("completed", true);
    const payouts = { sent: 0, submitted: 0, failed: 0, pending: 0 } as Record<string, number>;
    (payoutAgg ?? []).forEach((r) => {
      const k = (r.mpesa_payout_status as string) ?? "pending";
      payouts[k] = (payouts[k] ?? 0) + 1;
    });
    return {
      total: total ?? 0,
      completed: completed ?? 0,
      screened: screened ?? 0,
      partial: (screened ?? 0) - (completed ?? 0),
      payouts,
    };
  });

export const adminListResponses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        payoutStatus: z.string().optional(),
        completedOnly: z.boolean().optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { maskPhone } = await import("./session.server");
    let q = supabaseAdmin
      .from("responses")
      .select(
        "id, created_at, completed, screened_in, phone_encrypted, mpesa_payout_status, mpesa_transaction_id, mpesa_last_error, section_a",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 200);
    if (data.completedOnly) q = q.eq("completed", true);
    if (data.payoutStatus) q = q.eq("mpesa_payout_status", data.payoutStatus);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id as string,
      created_at: r.created_at as string,
      completed: r.completed as boolean,
      screened_in: r.screened_in as boolean,
      masked_phone: maskPhone((r.phone_encrypted as string | null) ?? ""),
      payout_status: (r.mpesa_payout_status as string) ?? "pending",
      mpesa_transaction_id: (r.mpesa_transaction_id as string | null) ?? null,
      payout_error: (r.mpesa_last_error as string | null) ?? null,
      sector: ((r.section_a as { A1?: string } | null)?.A1) ?? null,
    }));
  });

export const adminExportCsv = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("responses")
      .select("id, created_at, completed_at, screening, section_a, section_b, section_c, section_d, mpesa_payout_status")
      .eq("completed", true)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const rows = data ?? [];
    const headers = [
      "id",
      "created_at",
      "completed_at",
      "payout_status",
      "screening",
      "section_a",
      "section_b",
      "section_c",
      "section_d",
    ];
    const escape = (v: unknown) => {
      const s = typeof v === "string" ? v : JSON.stringify(v ?? "");
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.id,
          r.created_at,
          r.completed_at ?? "",
          r.mpesa_payout_status ?? "",
          r.screening,
          r.section_a,
          r.section_b,
          r.section_c,
          r.section_d,
        ]
          .map(escape)
          .join(","),
      ),
    ].join("\n");
    return { csv };
  });

export const adminRetryPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ responseId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { toMsisdn } = await import("./session.server");
    const { sendB2C } = await import("./daraja.server");

    const { data: row } = await supabaseAdmin
      .from("responses")
      .select("id, phone_encrypted, mpesa_payout_status")
      .eq("id", data.responseId)
      .single();
    if (!row) throw new Error("not found");
    if (row.mpesa_payout_status === "sent") return { ok: true, alreadySent: true };
    const phone = row.phone_encrypted as string | null;
    if (!phone) throw new Error("no phone on record");

    // Result URL not available here; webhook may not fire — that's fine for retry, status will be 'submitted'.
    const { data: attempt } = await supabaseAdmin
      .from("payout_attempts")
      .insert({ response_id: row.id, amount: 100, status: "pending" })
      .select("id")
      .single();
    const { ok, data: result } = await sendB2C({
      msisdn: toMsisdn(phone),
      amount: 100,
      responseId: row.id as string,
      resultUrl: "",
      remarks: "USIU Survey reward retry",
    });
    await supabaseAdmin
      .from("payout_attempts")
      .update({
        status: ok ? "submitted" : "failed",
        raw_response: result as never,
        conversation_id: result.ConversationID ?? null,
        originator_conversation_id: result.OriginatorConversationID ?? null,
      })
      .eq("id", attempt?.id ?? "");
    await supabaseAdmin
      .from("responses")
      .update({
        mpesa_payout_status: ok ? "submitted" : "failed",
        mpesa_last_error: ok ? null : (result.ResponseDescription ?? result.errorMessage ?? "B2C failed"),
      })
      .eq("id", row.id);
    return { ok };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .limit(1);
    return { isAdmin: !!(data && data.length > 0) };
  });
