import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { screenTimeLogs } from "@/db/schema";
import { ok, readJson, searchParam, withUser } from "@/lib/api";
import { screenTimeSchema } from "@/lib/validation";
import { addDays, isValidDay, todayInTimezone } from "@/lib/time";
import { loadSettings } from "@/lib/plan-service";

export const GET = withUser(async ({ user }, request: Request) => {
  const settings = await loadSettings(user.id);
  const from = searchParam(request, "from");
  const to = searchParam(request, "to");
  const today = todayInTimezone(settings.timezone);
  const start = from && isValidDay(from) ? from : addDays(today, -6);
  const end = to && isValidDay(to) ? to : today;

  const rows = await db
    .select()
    .from(screenTimeLogs)
    .where(
      and(eq(screenTimeLogs.userId, user.id), gte(screenTimeLogs.day, start), lte(screenTimeLogs.day, end)),
    );
  return ok(rows);
});

/** Manual entry — no OS integration exists on the web (spec §34). */
export const POST = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, screenTimeSchema);
  const [row] = await db
    .insert(screenTimeLogs)
    .values({ ...input, userId: user.id })
    .onConflictDoUpdate({
      target: [screenTimeLogs.userId, screenTimeLogs.day, screenTimeLogs.app],
      set: { minutes: input.minutes },
    })
    .returning();
  return ok(row);
});
