import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { mealPlans, meals, workoutPlans } from "@/db/schema";
import { ok, readJson, withUser } from "@/lib/api";
import { loadSettings } from "@/lib/plan-service";
import { mealPlanGenerateSchema } from "@/lib/validation";
import { addDays, weekdayOf } from "@/lib/time";

const SLOT_START: Record<string, number> = {
  breakfast: 7 * 60 + 30,
  lunch: 12 * 60,
  snack: 15 * 60 + 30,
  dinner: 18 * 60 + 30,
  late: 21 * 60,
};

/**
 * Fills the meal plan for the coming days. Meals rotate through what the user
 * created, honouring training/rest-day restrictions and the diet setting
 * (vegetarian by default — no meat or fish is ever proposed, spec §26).
 */
export const POST = withUser(async ({ user }, request: Request) => {
  const { from, days, overwrite } = await readJson(request, mealPlanGenerateSchema);
  const settings = await loadSettings(user.id);

  const all = await db
    .select()
    .from(meals)
    .where(and(eq(meals.userId, user.id), eq(meals.archived, false)));

  if (all.length === 0) {
    return ok({ created: 0, message: "Lege zuerst Mahlzeiten an." });
  }

  const plans = await db
    .select()
    .from(workoutPlans)
    .where(and(eq(workoutPlans.userId, user.id), eq(workoutPlans.archived, false)));

  const to = addDays(from, days - 1);
  const existing = await db
    .select()
    .from(mealPlans)
    .where(and(eq(mealPlans.userId, user.id), gte(mealPlans.day, from), lte(mealPlans.day, to)));

  const slots: ("breakfast" | "lunch" | "snack" | "dinner")[] =
    settings.mealsPerDay >= 4
      ? ["breakfast", "lunch", "snack", "dinner"]
      : settings.mealsPerDay === 3
        ? ["breakfast", "lunch", "dinner"]
        : ["lunch", "dinner"];

  const rows: (typeof mealPlans.$inferInsert)[] = [];
  const counters: Record<string, number> = {};

  for (let i = 0; i < days; i++) {
    const day = addDays(from, i);
    const weekday = weekdayOf(day);
    const isTrainingDay =
      settings.trainingDays.includes(weekday) || plans.some((p) => p.weekdays.includes(weekday));

    for (const slot of slots) {
      const taken = existing.find((e) => e.day === day && e.slot === slot);
      if (taken && !overwrite) continue;

      const candidates = all.filter(
        (m) =>
          m.slot === slot &&
          (!m.trainingDayOnly || isTrainingDay) &&
          (!m.restDayOnly || !isTrainingDay),
      );
      if (candidates.length === 0) continue;

      const index = counters[slot] ?? 0;
      counters[slot] = index + 1;
      const meal = candidates[index % candidates.length];

      rows.push({
        userId: user.id,
        day,
        slot,
        mealId: meal.id,
        startMinute: SLOT_START[slot],
      });
    }
  }

  if (rows.length > 0) {
    await db
      .insert(mealPlans)
      .values(rows)
      .onConflictDoUpdate({
        target: [mealPlans.userId, mealPlans.day, mealPlans.slot],
        set: {
          mealId: sql`excluded.meal_id`,
          startMinute: sql`excluded.start_minute`,
        },
      });
  }

  return ok({ created: rows.length, from, to });
});