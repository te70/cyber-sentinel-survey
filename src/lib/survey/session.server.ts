// Server-only helpers: sign/verify session cookies, hash phone numbers.
import { createHmac, timingSafeEqual, createHash } from "node:crypto";

const COOKIE_NAME = "survey_session";

function getSecret(): string {
  const s = process.env.SURVEY_SESSION_SECRET;
  if (!s) throw new Error("SURVEY_SESSION_SECRET not configured");
  return s;
}

export function b64url(buf: Buffer | string): string {
  const b = typeof buf === "string" ? Buffer.from(buf) : buf;
  return b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(s: string): Buffer {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

export interface SurveySession {
  rid: string; // response_id
  ph: string; // phone_hash
  exp: number; // epoch ms
}

export function signSession(payload: SurveySession): string {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(createHmac("sha256", getSecret()).update(body).digest());
  return `${body}.${sig}`;
}

export function verifySession(token: string | null | undefined): SurveySession | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = b64url(createHmac("sha256", getSecret()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(b64urlDecode(body).toString("utf8")) as SurveySession;
    if (!payload.rid || !payload.ph || !payload.exp) return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function normalisePhone(raw: string): string {
  const trimmed = raw.trim().replace(/\s|-/g, "");
  return trimmed;
}

/** Convert 07XX… / 01XX… to 2547XX… / 2541XX… for Daraja. */
export function toMsisdn(localPhone: string): string {
  return `254${localPhone.slice(1)}`;
}

export function hashPhone(phone: string): string {
  // Salted with the session secret so the hash isn't a global rainbow target.
  return createHash("sha256")
    .update(`${getSecret()}|${phone}`)
    .digest("hex");
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return "0XXXXXXXXX";
  return `${phone.slice(0, 4)}XX${phone.slice(-2)}`;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours
