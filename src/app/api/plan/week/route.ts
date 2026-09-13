import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { dailyPlans, scheduleBlocks } from "@/db/schema";
import { ok, searchParam, withUser } from "@/lib/api";
import { loadSettings } from "@/lib/plan-service";
import { addDays, isValidDay, rangeDays, startOfWeek, todayInTimezone } from "@/lib/time";

/** Week overview with per-category totals (spec §35). */
export const GET = withUser(async ({ user }, request: Request) => {
  const settings = await loadSettings(user.id);
  const requested = searchParam(request, "from");
  const today = todayInTimezone(settings.timezone);
  const from = requested && isValidDay(requested) ? requested : startOfWeek(today, settings.weekStart);
  const to = addDays(from, 6);

  const rows = await db
    .select({
      day: dailyPlans.day,
      id: scheduleBlocks.id,
      title: scheduleBlocks.title,
      category: scheduleBlocks.category,
      icon: scheduleBlocks.icon,
      startMinute: scheduleBlocks.startMinute,
      endMinute: scheduleBlocks.endMinute,
      status: scheduleBlocks.status,
      isFixed: scheduleBlocks.isFixed,
    })
    .from(scheduleBlocks)
    .innerJoin(dailyPlans, eq(dailyPlans.id, scheduleBlocks.planId))
    .where(and(eq(scheduleBlocks.userId, user.id), gte(dailyPlans.day, from), lte(dailyPlans.day, to)))
    .orderBy(dailyPlans.day, scheduleBlocks.startMinute);

  const days = rangeDays(from, to).map((day) => ({
    day,
    blocks: rows.filter((r) => r.day === day),
  }));

  const byCategory: Record<string, number> = {};
  for (const row of rows) {
    if (row.category === "sleep") continue;
    byCategory[row.category] = (byCategory[row.category] ?? 0) + (row.endMinute - row.startMinute);
  }

  return ok({ from, to, days, byCategory, settings });
});
