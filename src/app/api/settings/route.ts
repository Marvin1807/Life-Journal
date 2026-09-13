import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings as settingsTable, users } from "@/db/schema";
import { ok, readJson, withUser } from "@/lib/api";
import { loadSettings } from "@/lib/plan-service";
import { settingsUpdateSchema } from "@/lib/validation";

export const GET = withUser(async ({ user }) => {
  const settings = await loadSettings(user.id);
  return ok({ settings, user });
});

export const PATCH = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, settingsUpdateSchema);
  const { name, ...rest } = input;

  if (typeof name === "string") {
    await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, user.id));
  }

  await loadSettings(user.id); // make sure a row exists

  let settings;
  if (Object.keys(rest).length > 0) {
    const [row] = await db
      .update(settingsTable)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(settingsTable.userId, user.id))
      .returning();
    settings = row;
  } else {
    settings = await loadSettings(user.id);
  }

  return ok({ settings, user: { ...user, name: name ?? user.name } });
});
