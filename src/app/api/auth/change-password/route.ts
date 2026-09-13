import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { changePasswordSchema } from "@/lib/validation";

export const POST = withUser(async ({ user }, request: Request) => {
  const { currentPassword, newPassword } = await readJson(request, changePasswordSchema);
  const rows = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  const row = rows[0];
  if (!row) throw new ApiError("Nicht gefunden", 404);

  if (!(await verifyPassword(currentPassword, row.passwordHash))) {
    throw new ApiError("Das aktuelle Passwort ist falsch", 400);
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  return ok({ ok: true });
});
