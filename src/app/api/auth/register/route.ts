import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPassword } from "@/lib/auth";
import { ApiError, ok, publicRoute, readJson } from "@/lib/api";
import { registerSchema } from "@/lib/validation";
import { seedUser } from "@/lib/seed";

export const POST = publicRoute(async (request: Request) => {
  const { email, password, name } = await readJson(request, registerSchema);

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) throw new ApiError("Diese E-Mail-Adresse ist bereits registriert", 409);

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash: await hashPassword(password), name })
    .returning({ id: users.id, email: users.email, name: users.name });

  await seedUser(user.id);
  await createSession(user.id, request.headers.get("user-agent") ?? "");

  return ok({ user }, 201);
});
