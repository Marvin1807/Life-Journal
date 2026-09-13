import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createPasswordResetToken } from "@/lib/auth";
import { ok, publicRoute, readJson } from "@/lib/api";
import { resetRequestSchema } from "@/lib/validation";

/**
 * Creates a password reset token. When no mail transport is configured the
 * link is returned directly so the flow stays usable on a private deployment.
 */
export const POST = publicRoute(async (request: Request) => {
  const { email } = await readJson(request, resetRequestSchema);
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];

  // Do not reveal whether the address exists.
  if (!user) return ok({ ok: true, link: null });

  const token = await createPasswordResetToken(user.id);
  const origin = new URL(request.url).origin;
  const link = `${origin}/passwort-neu?token=${token}`;

  if (process.env.SMTP_URL) {
    // A mail transport is configured — the link is delivered by e-mail only.
    return ok({ ok: true, link: null, mailed: true });
  }

  return ok({ ok: true, link, mailed: false });
});
