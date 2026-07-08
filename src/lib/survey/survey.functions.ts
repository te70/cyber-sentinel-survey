// Server functions for the survey flow — localStorage bypass mode.
// Supabase DB calls are removed; session cookie is still signed with
// SURVEY_SESSION_SECRET so the flow is stateless-but-authenticated.
// All survey answers are persisted client-side in localStorage.
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { PHONE_REGEX } from "./schema";

const SESSION_COOKIE = "survey_session";

function setSessionCookie(token: string, maxAgeSec: number) {
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: false, // allow http in local dev
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSec,
  });
}

// ---------- Public counter ----------
export const getCompletedCount = createServerFn({ method: "GET" }).handler(async () => {
  // localStorage bypass — return 0 until Supabase is connected
  return { count: 0 };
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
    const { signSession, SESSION_TTL_MS, hashPhone } = await import("./session.server");

    if (!data.consent) return { ok: false as const, reason: "consent_required" };
    if (!data.q1_nairobi) return { ok: false as const, reason: "ineligible" };
    if (data.q2_business_type === "NONE") return { ok: false as const, reason: "ineligible" };
    if (data.q3_role === "NONE") return { ok: false as const, reason: "ineligible" };
    if (!data.q4_digital_platform) return { ok: false as const, reason: "ineligible" };

    // Generate a local response ID — no DB insert
    const responseId = crypto.randomUUID();
    const phoneHash = hashPhone(data.phone);

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
  .handler(async ({ data: _data }) => {
    const { verifySession } = await import("./session.server");
    const token = getCookie(SESSION_COOKIE);
    const session = verifySession(token);
    if (!session) return { ok: false as const, reason: "no_session" };

    // localStorage bypass — client stores data locally, server just confirms session is valid
    return { ok: true as const };
  });

// ---------- Complete ----------
export const completeSurvey = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ section_d: z.record(z.string(), z.unknown()) }).parse(d),
  )
  .handler(async ({ data: _data }) => {
    const { verifySession } = await import("./session.server");

    const token = getCookie(SESSION_COOKIE);
    const session = verifySession(token);
    if (!session) return { ok: false as const, reason: "no_session" as const };

    deleteCookie(SESSION_COOKIE, { path: "/" });

    // localStorage bypass — payout is skipped until Daraja credentials are configured
    const masked = "07XXXXXXXX";
    return { ok: true as const, masked, payoutStatus: "pending" as const };
  });

// ---------- Resume helper ----------
export const getSessionInfo = createServerFn({ method: "GET" }).handler(async () => {
  const { verifySession } = await import("./session.server");
  const token = getCookie(SESSION_COOKIE);
  const session = verifySession(token);
  if (!session) return { active: false as const };

  // localStorage bypass — saved sections come from localStorage on the client side
  return {
    active: true as const,
    completed: false,
    saved: { a: null, b: null, c: null, d: null },
  };
});
