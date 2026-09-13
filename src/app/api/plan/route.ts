import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { calendarEvents, mealPlans, meals, routines, workoutPlans, workoutSessions } from "@/db/schema";
import { ok, searchParam, withUser } from "@/lib/api";
import { loadBlocks, loadSettings } from "@/lib/plan-service";
import { isValidDay, todayInTimezone, weekdayOf } from "@/lib/time";

/** Everything the "Heute" page needs for one day, in a single request. */
export const GET = withUser(async ({ user }, request: Request) => {
  const settings = await loadSettings(user.id);
  const requested = searchParam(request, "day");
  const day = requested && isValidDay(requested) ? requested : todayInTimezone(settings.timezone);
  const weekday = weekdayOf(day);

  const { plan, blocks } = await loadBlocks(user.id, day);

  const events = await db
    .select()
    .from(calendarEvents)
    .where(and(eq(calendarEvents.userId, user.id), eq(calendarEvents.day, day)));

  const dayMeals = await db
    .select({
      id: mealPlans.id,
      slot: mealPlans.slot,
      mealId: mealPlans.mealId,
      startMinute: mealPlans.startMinute,
      eaten: mealPlans.eaten,
      name: meals.name,
      prepMinutes: meals.prepMinutes,
    })
    .from(mealPlans)
    .innerJoin(meals, eq(meals.id, mealPlans.mealId))
    .where(and(eq(mealPlans.userId, user.id), eq(mealPlans.day, day)));

  const plans = await db
    .select()
    .from(workoutPlans)
    .where(and(eq(workoutPlans.userId, user.id), eq(workoutPlans.archived, false)));
  const workout = plans.find((p) => p.weekdays.includes(weekday)) ?? null;

  const sessions = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, user.id), eq(workoutSessions.day, day)));

  const dayRoutines = await db
    .select()
    .from(routines)
    .where(and(eq(routines.userId, user.id), eq(routines.enabled, true)));

  return ok({
    day,
    weekday,
    settings,
    plan,
    blocks,
    events,
    meals: dayMeals,
    workout,
    workoutSessions: sessions,
    routines: dayRoutines.filter((r) => r.weekdays.includes(weekday)),
  });
});
