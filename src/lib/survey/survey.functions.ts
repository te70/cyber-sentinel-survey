import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { PHONE_REGEX } from "./schema";

const SESSION_COOKIE = "survey_session";

function setSessionCookie(token: string, maxAgeSec: number) {
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSec,
  });
}

// ---------- Public counter ----------
export const getCompletedCount = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { db } = await import("@/lib/db");
    const count = await db.response.count({ where: { completed: true } });
    return { count };
  } catch {
    return { count: 0 };
  }
});

// ---------- OWASP Website Scan ----------
const ScanSchema = z.object({ url: z.string().min(1) });

export const scanWebsite = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ScanSchema.parse(d))
  .handler(async ({ data }) => {
    let url = data.url.trim();
    if (!url.startsWith("http")) url = `https://${url}`;

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timer);

      const h = Object.fromEntries(res.headers.entries());
      const finalHttps = res.url.startsWith("https://");

      const checks: Record<string, { name: string; pass: boolean; description: string }> = {
        https:       { name: "HTTPS Encryption",        pass: finalHttps,                                         description: "All traffic is encrypted between visitors and your website." },
        hsts:        { name: "Force HTTPS (HSTS)",       pass: !!h["strict-transport-security"],                  description: "Browsers are told to always use HTTPS, preventing downgrade attacks." },
        xframe:      { name: "Clickjacking Protection",  pass: !!h["x-frame-options"] || !!h["content-security-policy"], description: "Your site cannot be embedded in another page to trick your visitors." },
        xcontent:    { name: "Content Type Security",    pass: !!h["x-content-type-options"],                     description: "Browsers won't misinterpret files, preventing certain injection attacks." },
        csp:         { name: "Content Security Policy",  pass: !!h["content-security-policy"],                    description: "Controls what scripts and resources can load on your site." },
        referrer:    { name: "Referrer Policy",          pass: !!h["referrer-policy"],                            description: "Controls what URL information is shared when visitors click links." },
        permissions: { name: "Permissions Policy",       pass: !!h["permissions-policy"] || !!h["feature-policy"], description: "Restricts browser features like camera, microphone, and location." },
      };

      const passCount = Object.values(checks).filter((c) => c.pass).length;
      const score = Math.round((passCount / Object.keys(checks).length) * 100);

      return { ok: true as const, checks, score, finalUrl: res.url, statusCode: res.status };
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.name === "AbortError"
          ? "The website took too long to respond."
          : "Could not reach the website. Please check the URL and try again.";
      return { ok: false as const, error: msg };
    }
  });

// ---------- Screening ----------
const ScreeningSchema = z.object({
  q1_nairobi: z.boolean(),
  q2_business_type: z.string().min(1),
  q3_role: z.string().min(1),
  q4_digital_platform: z.boolean(),
  fullName: z.string().min(1),
  businessName: z.string().min(1),
  websiteUrl: z.string().optional(),
  socialPlatforms: z.array(z.string()).optional(),
  socialHandle: z.string().optional(),
  age: z.string().min(1),
  gender: z.string().min(1),
  education: z.string().min(1),
  phone: z.string().regex(PHONE_REGEX, "Use 07XXXXXXXX or 01XXXXXXXX"),
  consent: z.boolean(),
  privacyConsent: z.boolean(),
  termsConsent: z.boolean(),
});

export const submitScreening = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ScreeningSchema.parse(d))
  .handler(async ({ data }) => {
    const { signSession, SESSION_TTL_MS, hashPhone } = await import("./session.server");

    if (!data.consent || !data.privacyConsent || !data.termsConsent)
      return { ok: false as const, reason: "consent_required" as const };
    if (!data.q1_nairobi) return { ok: false as const, reason: "ineligible" as const };
    if (data.q2_business_type === "NONE") return { ok: false as const, reason: "ineligible" as const };
    if (data.q3_role === "NONE") return { ok: false as const, reason: "ineligible" as const };
    if (!data.q4_digital_platform) return { ok: false as const, reason: "ineligible" as const };

    const phoneHash = hashPhone(data.phone);
    let responseId = crypto.randomUUID() as string;

    try {
      const { db } = await import("@/lib/db");

      // Duplicate check
      const existing = await db.response.findFirst({
        where: { phoneHash, completed: true },
        select: { id: true },
      });
      if (existing) return { ok: false as const, reason: "duplicate" as const };

      const inserted = await db.response.create({
        data: {
          id: responseId,
          phoneHash,
          screenedIn: true,
          consentedAt: new Date(),
          businessName: data.businessName,
          websiteUrl: data.websiteUrl ?? null,
          screening: {
            q1_nairobi: data.q1_nairobi,
            q2_business_type: data.q2_business_type,
            q3_role: data.q3_role,
            q4_digital_platform: data.q4_digital_platform,
            fullName: data.fullName,
            businessName: data.businessName,
            websiteUrl: data.websiteUrl,
            socialPlatforms: data.socialPlatforms,
            socialHandle: data.socialHandle,
            age: data.age,
            gender: data.gender,
            education: data.education,
          },
        },
        select: { id: true },
      });

      responseId = inserted.id;
    } catch (err) {
      console.error("[screening] DB error, continuing in session-only mode:", err);
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
    const token = getCookie(SESSION_COOKIE);
    const session = verifySession(token);
    if (!session) return { ok: false as const, reason: "no_session" as const };

    const colMap: Record<string, string> = {
      section_a: "sectionA",
      section_b: "sectionB",
      section_c: "sectionC",
      section_d: "sectionD",
    };

    try {
      const { db } = await import("@/lib/db");
      await db.response.update({
        where: { id: session.rid },
        data: { [colMap[data.section]]: data.payload },
      });
    } catch (err) {
      console.error("[saveSection] DB error:", err);
    }

    return { ok: true as const };
  });

// ---------- Complete ----------
const CompleteSchema = z.object({
  section_a: z.record(z.string(), z.unknown()).optional(),
  section_b: z.record(z.string(), z.unknown()).optional(),
  section_c: z.record(z.string(), z.unknown()).optional(),
  section_d: z.record(z.string(), z.unknown()),
});

export const completeSurvey = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CompleteSchema.parse(d))
  .handler(async ({ data }) => {
    const { verifySession } = await import("./session.server");

    const token = getCookie(SESSION_COOKIE);
    const session = verifySession(token);
    if (!session) return { ok: false as const, reason: "no_session" as const };

    try {
      const { db } = await import("@/lib/db");
      const { Prisma } = await import("@prisma/client");
      await db.response.update({
        where: { id: session.rid },
        data: {
          sectionA: (data.section_a ?? Prisma.DbNull) as object,
          sectionB: (data.section_b ?? Prisma.DbNull) as object,
          sectionC: (data.section_c ?? Prisma.DbNull) as object,
          sectionD: data.section_d as object,
          completed: true,
          completedAt: new Date(),
        },
      });
    } catch (err) {
      console.error("[completeSurvey] DB error:", err);
    }

    deleteCookie(SESSION_COOKIE, { path: "/" });

    return { ok: true as const };
  });

// ---------- Resume helper ----------
export const getSessionInfo = createServerFn({ method: "GET" }).handler(async () => {
  const { verifySession } = await import("./session.server");
  const token = getCookie(SESSION_COOKIE);
  const session = verifySession(token);
  if (!session) return { active: false as const };

  return {
    active: true as const,
    completed: false,
    saved: { a: null, b: null, c: null, d: null },
  };
});
