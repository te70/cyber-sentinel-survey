import { createHmac, timingSafeEqual } from "node:crypto";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";

const COOKIE_NAME = "researcher_session";
const MAX_AGE_SEC = 60 * 60 * 8; // 8 hours

function getSecret(): string {
  const secret = process.env.RESEARCHER_SESSION_SECRET;
  if (!secret) throw new Error("RESEARCHER_SESSION_SECRET is not set in environment variables.");
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createResearcherSession(researcherId: string) {
  const expires = Date.now() + MAX_AGE_SEC * 1000;
  const payload = `${researcherId}.${expires}`;
  const token = `${payload}.${sign(payload)}`;
  setCookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export function clearResearcherSession() {
  deleteCookie(COOKIE_NAME, { path: "/" });
}

/** Returns the researcherId if a valid, unexpired session cookie is present, otherwise null. */
export function getResearcherSession(): string | null {
  const token = getCookie(COOKIE_NAME);
  if (!token) return null;

  const [researcherId, expiresStr, signature] = token.split(".");
  if (!researcherId || !expiresStr || !signature) return null;

  const payload = `${researcherId}.${expiresStr}`;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  if (Date.now() > Number(expiresStr)) return null;
  return researcherId;
}

export class ResearcherAuthError extends Error {
  constructor() {
    super("Researcher authentication required.");
    this.name = "ResearcherAuthError";
  }
}

/** Throws (and sets a 403 status) if there's no valid researcher session. Call this at the top
 * of any server function handler that must hard-reject unauthenticated requests, not just hide
 * a UI button. */
export async function requireResearcherSession(): Promise<string> {
  const researcherId = getResearcherSession();
  if (!researcherId) {
    const { setResponseStatus } = await import("@tanstack/react-start/server");
    setResponseStatus(403);
    throw new ResearcherAuthError();
  }
  return researcherId;
}
