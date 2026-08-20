import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifyPassword } from "./researcher-password.server";
import {
  clearResearcherSession,
  createResearcherSession,
  getResearcherSession,
} from "./researcher-session.server";

const LoginSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });

export const researcherLogin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => LoginSchema.parse(d))
  .handler(async ({ data }) => {
    const { db } = await import("@/lib/db");
    const researcher = await db.researcher.findUnique({ where: { username: data.username } });
    if (!researcher || !verifyPassword(data.password, researcher.passwordHash)) {
      return { ok: false as const, error: "Invalid username or password." };
    }
    createResearcherSession(researcher.id);
    return { ok: true as const };
  });

export const researcherLogout = createServerFn({ method: "POST" }).handler(async () => {
  clearResearcherSession();
  return { ok: true };
});

export const getResearcherAuthStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { authenticated: getResearcherSession() !== null };
});
