// Server functions for the survey flow. Client-safe to import (handlers stripped).
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie, getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabase as supabasePublic } from "@/integrations/supabase/client";

import { PHONE_REGEX } from "./schema";

const SESSION_COOKIE = "survey_session";

function setSessionCookie(token: string, maxAgeSec: number) {
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSec,
  });
}

// ---------- Public counter ----------
export const getCompletedCount = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabasePublic.rpc("get_completed_count");
  if (error) {
    console.error("get_completed_count error", error);
    return { count: 0 };
  }
  return { count: (data as number) ?? 0 };
});

// ---------- Screening ----------
const ScreeningSchema = z.object({
  q1_nairobi: z.boolean(),
  q2_business_type: z.string().min(1),
  q3_role: z.string().min(1),
  q4_digital_platform: z.boolean(),
  phone: z.string().regex(PHONE_REGEX, "Use 07XXXXXXXX or 01XXXXXXXX"),
  consent: z.boolean(),
});

export const submitScreening = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ScreeningSchema.parse(d))
  .handler(async ({ data }) => {
    const { hashPhone, signSession, SESSION_TTL_MS } = await import("./session.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!data.consent) return { ok: false as const, reason: "consent_required" };
    if (!data.q1_nairobi) return { ok: false as const, reason: "ineligible" };
    if (data.q2_business_type === "NONE") return { ok: false as const, reason: "ineligible" };
    if (data.q3_role === "NONE") return { ok: false as const, reason: "ineligible" };
    if (!data.q4_digital_platform) return { ok: false as const, reason: "ineligible" };

    const phoneHash = hashPhone(data.phone);

    // Dedup: completed already?
    const { data: completedRows } = await supabaseAdmin
      .from("responses")
      .select("id")
      .eq("phone_hash", phoneHash)
      .eq("completed", true)
      .limit(1);
    if (completedRows && completedRows.length > 0) {
      return { ok: false as const, reason: "duplicate" };
    }

    // Resume an existing partial if there is exactly one.
    const { data: partial } = await supabaseAdmin
      .from("responses")
      .select("id")
      .eq("phone_hash", phoneHash)
      .eq("completed", false)
      .order("created_at", { ascending: false })
      .limit(1);

    const userAgent = getRequestHeader("user-agent") ?? null;
    const ipHeader =
      getRequestHeader("cf-connecting-ip") ??
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;

    let responseId: string;
    if (partial && partial.length > 0) {
      responseId = partial[0].id as string;
      await supabaseAdmin
        .from("responses")
        .update({
          screened_in: true,
          consented_at: new Date().toISOString(),
          screening: {
            q1_nairobi: data.q1_nairobi,
            q2_business_type: data.q2_business_type,
            q3_role: data.q3_role,
            q4_digital_platform: data.q4_digital_platform,
          },
          ip_address: ipHeader,
          user_agent: userAgent,
        })
        .eq("id", responseId);
    } else {
      const { data: inserted, error } = await supabaseAdmin
        .from("responses")
        .insert({
          phone_hash: phoneHash,
          phone_encrypted: data.phone, // stored only until payout; redact on completion if you want stronger privacy
          screened_in: true,
          consented_at: new Date().toISOString(),
          screening: {
            q1_nairobi: data.q1_nairobi,
            q2_business_type: data.q2_business_type,
            q3_role: data.q3_role,
            q4_digital_platform: data.q4_digital_platform,
          },
          ip_address: ipHeader,
          user_agent: userAgent,
        })
        .select("id")
        .single();
      if (error || !inserted) {
        console.error("screening insert failed", error);
        return { ok: false as const, reason: "server_error" };
      }
      responseId = inserted.id as string;
    }

    const exp = Date.now() + SESSION_TTL_MS;
    const token = signSession({ rid: responseId, ph: phoneHash, exp });
    setSessionCookie(token, Math.floor(SESSION_TTL_MS / 1000));

    return { ok: true as const, responseId };
  });

// ---------- Save section ----------
const SaveSchema = z.object({
  section: z.enum(["section_a", "section_b", "section_c", "section_d"]),
  payload: z.record(z.string(), z.unknown()),
});

export const saveSection = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SaveSchema.parse(d))
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const token = getCookie(SESSION_COOKIE);
    const session = verifySession(token);
    if (!session) return { ok: false as const, reason: "no_session" };

    const update = { [data.section]: data.payload as never };
    const { error } = await supabaseAdmin
      .from("responses")
      .update(update as never)
      .eq("id", session.rid)
      .eq("completed", false);
    if (error) {
      console.error("saveSection error", error);
      return { ok: false as const, reason: "server_error" };
    }
    return { ok: true as const };
  });

// ---------- Complete + payout ----------
export const completeSurvey = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        section_d: z.record(z.string(), z.unknown()),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { verifySession, toMsisdn, maskPhone } = await import("./session.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendB2C } = await import("./daraja.server");

    const token = getCookie(SESSION_COOKIE);
    const session = verifySession(token);
    if (!session) return { ok: false as const, reason: "no_session" as const };

    const { data: row, error: fetchErr } = await supabaseAdmin
      .from("responses")
      .select("id, phone_encrypted, completed, mpesa_payout_status")
      .eq("id", session.rid)
      .single();
    if (fetchErr || !row) return { ok: false as const, reason: "not_found" as const };
    if (row.completed && row.mpesa_payout_status === "sent") {
      return {
        ok: true as const,
        masked: maskPhone(row.phone_encrypted ?? ""),
        payoutStatus: "sent" as const,
      };
    }

    // Mark completed
    await supabaseAdmin
      .from("responses")
      .update({
        section_d: data.section_d,
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", session.rid);

    // Build callback URL
    const host =
      getRequestHeader("x-forwarded-host") ??
      getRequestHeader("host") ??
      "";
    const proto = getRequestHeader("x-forwarded-proto") ?? "https";
    const resultUrl = host
      ? `${proto}://${host}/api/public/daraja/result`
      : "";

    const phone = row.phone_encrypted as string | null;
    if (!phone) {
      await supabaseAdmin
        .from("responses")
        .update({ mpesa_payout_status: "failed", mpesa_last_error: "missing phone" })
        .eq("id", session.rid);
      return { ok: true as const, masked: "0XXXXXXXXX", payoutStatus: "failed" as const };
    }

    const masked = maskPhone(phone);

    // Insert pending attempt
    const { data: attempt } = await supabaseAdmin
      .from("payout_attempts")
      .insert({ response_id: session.rid, amount: 100, status: "pending" })
      .select("id")
      .single();

    try {
      const { ok, data: result } = await sendB2C({
        msisdn: toMsisdn(phone),
        amount: 100,
        responseId: session.rid,
        resultUrl,
        remarks: "USIU Cybersecurity Survey reward",
      });

      await supabaseAdmin
        .from("payout_attempts")
        .update({
          conversation_id: result.ConversationID ?? null,
          originator_conversation_id: result.OriginatorConversationID ?? null,
          raw_response: result as never,
          status: ok ? "submitted" : "failed",
        })
        .eq("id", attempt?.id ?? "");

      await supabaseAdmin
        .from("responses")
        .update({
          mpesa_payout_status: ok ? "submitted" : "failed",
          mpesa_last_error: ok ? null : (result.ResponseDescription ?? result.errorMessage ?? "B2C failed"),
        })
        .eq("id", session.rid);

      deleteCookie(SESSION_COOKIE, { path: "/" });
      return {
        ok: true as const,
        masked,
        payoutStatus: ok ? ("submitted" as const) : ("failed" as const),
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("B2C error", msg);
      await supabaseAdmin
        .from("payout_attempts")
        .update({ status: "failed", raw_response: { error: msg } as never })
        .eq("id", attempt?.id ?? "");
      await supabaseAdmin
        .from("responses")
        .update({ mpesa_payout_status: "failed", mpesa_last_error: msg })
        .eq("id", session.rid);
      deleteCookie(SESSION_COOKIE, { path: "/" });
      return { ok: true as const, masked, payoutStatus: "failed" as const };
    }
  });

// ---------- Resume helper ----------
export const getSessionInfo = createServerFn({ method: "GET" }).handler(async () => {
  const { verifySession } = await import("./session.server");
  const token = getCookie(SESSION_COOKIE);
  const session = verifySession(token);
  if (!session) return { active: false as const };
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("responses")
    .select("section_a, section_b, section_c, section_d, completed")
    .eq("id", session.rid)
    .single();
  return {
    active: true as const,
    completed: data?.completed ?? false,
    saved: {
      a: data?.section_a ?? null,
      b: data?.section_b ?? null,
      c: data?.section_c ?? null,
      d: data?.section_d ?? null,
    },
  };
});
