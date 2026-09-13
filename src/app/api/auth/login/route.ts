import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";
import { ApiError, ok, publicRoute, readJson } from "@/lib/api";
import { loginSchema } from "@/lib/validation";
import { seedUser } from "@/lib/seed";

export const POST = publicRoute(async (request: Request) => {
  const { email, password } = await readJson(request, loginSchema);

  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];

  // Always run the hash comparison so the response time does not reveal
  // whether the account exists.
  const valid = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi");

  if (!user || !valid) throw new ApiError("E-Mail-Adresse oder Passwort ist falsch", 401);

  await seedUser(user.id);
  await createSession(user.id, request.headers.get("user-agent") ?? "");

  return ok({ user: { id: user.id, email: user.email, name: user.name } });
});
