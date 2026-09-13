import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  dailyPlans,
  mealPlans,
  routineCompletions,
  scheduleBlocks,
  screenTimeLogs,
  sleepLogs,
  tasks,
  workoutSessions,
} from "@/db/schema";
import { ok, searchParam, withUser } from "@/lib/api";
import { loadSettings } from "@/lib/plan-service";
import {
  addDays,
  isValidDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  todayInTimezone,
} from "@/lib/time";

/**
 * Aggregated statistics for a week, month or year (spec §36).
 * No streaks, no pressure — just what actually happened.
 */
export const GET = withUser(async ({ user }, request: Request) => {
  const settings = await loadSettings(user.id);
  const today = todayInTimezone(settings.timezone);
  const range = searchParam(request, "range") ?? "week";
  const anchorParam = searchParam(request, "anchor");
  const anchor = anchorParam && isValidDay(anchorParam) ? anchorParam : today;

  let from: string;
  let to: string;
  if (range === "month") {
    from = startOfMonth(anchor);
    to = addDays(startOfMonth(addDays(from, 32)), -1);
  } else if (range === "year") {
    from = startOfYear(anchor);
    to = `${anchor.slice(0, 4)}-12-31`;
  } else {
    from = startOfWeek(anchor, settings.weekStart);
    to = addDays(from, 6);
  }

  /* planned vs. completed time per category */
  const blocks = await db
    .select({
      day: dailyPlans.day,
      category: scheduleBlocks.category,
      status: scheduleBlocks.status,
      minutes: sql<number>`sum(${scheduleBlocks.endMinute} - ${scheduleBlocks.startMinute})`,
      count: sql<number>`count(*)`,
    })
    .from(scheduleBlocks)
    .innerJoin(dailyPlans, eq(dailyPlans.id, scheduleBlocks.planId))
    .where(and(eq(scheduleBlocks.userId, user.id), gte(dailyPlans.day, from), lte(dailyPlans.day, to)))
    .groupBy(dailyPlans.day, scheduleBlocks.category, scheduleBlocks.status);

  const byCategory: Record<string, { planned: number; done: number }> = {};
  const byDay: Record<string, { planned: number; done: number }> = {};
  let plannedBlocks = 0;
  let doneBlocks = 0;

  for (const row of blocks) {
    const minutes = Number(row.minutes);
    const count = Number(row.count);
    if (row.category === "sleep") continue;

    byCategory[row.category] ??= { planned: 0, done: 0 };
    byDay[row.day] ??= { planned: 0, done: 0 };
    byCategory[row.category].planned += minutes;
    byDay[row.day].planned += minutes;
    plannedBlocks += count;

    if (row.status === "done") {
      byCategory[row.category].done += minutes;
      byDay[row.day].done += minutes;
      doneBlocks += count;
    }
  }

  /* tasks */
  const taskRows = await db
    .select({ status: tasks.status, count: sql<number>`count(*)` })
    .from(tasks)
    .where(eq(tasks.userId, user.id))
    .groupBy(tasks.status);

  const completedInRange = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, user.id),
        eq(tasks.status, "done"),
        gte(sql`${tasks.completedAt}::date`, from),
        lte(sql`${tasks.completedAt}::date`, to),
      ),
    );

  /* workouts */
  const workouts = await db
    .select({
      count: sql<number>`count(*)`,
      minutes: sql<number>`coalesce(sum(${workoutSessions.durationMinutes}), 0)`,
    })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, user.id),
        gte(workoutSessions.day, from),
        lte(workoutSessions.day, to),
      ),
    );

  /* screen time */
  const screen = await db
    .select({
      app: screenTimeLogs.app,
      minutes: sql<number>`coalesce(sum(${screenTimeLogs.minutes}), 0)`,
    })
    .from(screenTimeLogs)
    .where(
      and(eq(screenTimeLogs.userId, user.id), gte(screenTimeLogs.day, from), lte(screenTimeLogs.day, to)),
    )
    .groupBy(screenTimeLogs.app);

  /* sleep */
  const sleep = await db
    .select({
      avg: sql<number>`coalesce(avg(${sleepLogs.minutes}), 0)`,
      nights: sql<number>`count(*)`,
    })
    .from(sleepLogs)
    .where(and(eq(sleepLogs.userId, user.id), gte(sleepLogs.day, from), lte(sleepLogs.day, to)));

  /* routines */
  const routineRows = await db
    .select({
      done: sql<number>`count(*) filter (where ${routineCompletions.done})`,
      total: sql<number>`count(*)`,
    })
    .from(routineCompletions)
    .where(
      and(
        eq(routineCompletions.userId, user.id),
        gte(routineCompletions.day, from),
        lte(routineCompletions.day, to),
      ),
    );

  /* nutrition: how many planned meals were actually eaten */
  const mealRows = await db
    .select({
      total: sql<number>`count(*)`,
      eaten: sql<number>`count(*) filter (where ${mealPlans.eaten})`,
    })
    .from(mealPlans)
    .where(and(eq(mealPlans.userId, user.id), gte(mealPlans.day, from), lte(mealPlans.day, to)));

  const totalPlanned = Object.values(byCategory).reduce((a, c) => a + c.planned, 0);
  const totalDone = Object.values(byCategory).reduce((a, c) => a + c.done, 0);

  return ok({
    range,
    from,
    to,
    byCategory,
    byDay,
    totals: {
      plannedMinutes: totalPlanned,
      doneMinutes: totalDone,
      plannedBlocks,
      doneBlocks,
    },
    tasks: {
      byStatus: Object.fromEntries(taskRows.map((r) => [r.status, Number(r.count)])),
      completedInRange: Number(completedInRange[0]?.count ?? 0),
    },
    workouts: {
      count: Number(workouts[0]?.count ?? 0),
      minutes: Number(workouts[0]?.minutes ?? 0),
    },
    screenTime: screen.map((s) => ({ app: s.app, minutes: Number(s.minutes) })),
    sleep: {
      averageMinutes: Math.round(Number(sleep[0]?.avg ?? 0)),
      nights: Number(sleep[0]?.nights ?? 0),
    },
    routines: {
      done: Number(routineRows[0]?.done ?? 0),
      tracked: Number(routineRows[0]?.total ?? 0),
    },
    meals: {
      planned: Number(mealRows[0]?.total ?? 0),
      eaten: Number(mealRows[0]?.eaten ?? 0),
    },
  });
});
