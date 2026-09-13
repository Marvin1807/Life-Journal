import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { consumePasswordResetToken, destroyAllSessions, hashPassword } from "@/lib/auth";
import { ApiError, ok, publicRoute, readJson } from "@/lib/api";
import { resetConfirmSchema } from "@/lib/validation";

export const POST = publicRoute(async (request: Request) => {
  const { token, password } = await readJson(request, resetConfirmSchema);
  const userId = await consumePasswordResetToken(token);
  if (!userId) throw new ApiError("Der Link ist ungültig oder abgelaufen", 400);

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), updatedAt: new Date() })
    .where(eq(users.id, userId));

  // Every existing session becomes invalid after a password reset.
  await destroyAllSessions(userId);

  return ok({ ok: true });
});
