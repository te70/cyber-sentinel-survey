// Daraja B2C async result callback. Public — verifies by matching ConversationID
// against a pending payout_attempts row we created server-side.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/daraja/result")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            Result?: {
              ResultCode?: number;
              ResultDesc?: string;
              ConversationID?: string;
              OriginatorConversationID?: string;
              TransactionID?: string;
              ResultParameters?: { ResultParameter: { Key: string; Value: string | number }[] };
            };
          };

          const r = body.Result;
          if (!r?.ConversationID) {
            return new Response(JSON.stringify({ ok: false }), { status: 200 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: attempt } = await supabaseAdmin
            .from("payout_attempts")
            .select("id, response_id")
            .eq("conversation_id", r.ConversationID)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!attempt) {
            return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200 });
          }

          const success = r.ResultCode === 0;
          await supabaseAdmin
            .from("payout_attempts")
            .update({
              status: success ? "sent" : "failed",
              result_payload: body as never,
            })
            .eq("id", attempt.id);

          await supabaseAdmin
            .from("responses")
            .update({
              mpesa_payout_status: success ? "sent" : "failed",
              mpesa_transaction_id: r.TransactionID ?? null,
              mpesa_last_error: success ? null : (r.ResultDesc ?? "B2C failed"),
            })
            .eq("id", attempt.response_id as string);

          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        } catch (e) {
          console.error("daraja result handler error", e);
          return new Response(JSON.stringify({ ok: false }), { status: 200 });
        }
      },
    },
  },
});
