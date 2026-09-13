import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { sleepLogs } from "@/db/schema";
import { ok, readJson, withUser } from "@/lib/api";
import { sleepLogSchema } from "@/lib/validation";

export const GET = withUser(async ({ user }) => {
  const rows = await db
    .select()
    .from(sleepLogs)
    .where(eq(sleepLogs.userId, user.id))
    .orderBy(desc(sleepLogs.day))
    .limit(120);
  return ok(rows);
});

export const POST = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, sleepLogSchema);
  const [row] = await db
    .insert(sleepLogs)
    .values({ ...input, userId: user.id })
    .onConflictDoUpdate({
      target: [sleepLogs.userId, sleepLogs.day],
      set: { minutes: input.minutes, quality: input.quality },
    })
    .returning();
  return ok(row);
});
