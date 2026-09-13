import { and, asc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { mealPlans, meals } from "@/db/schema";
import { ApiError, ok, readJson, searchParam, withUser } from "@/lib/api";
import { mealPlanSetSchema } from "@/lib/validation";
import { addDays, isValidDay, todayInTimezone } from "@/lib/time";
import { loadSettings } from "@/lib/plan-service";

export const GET = withUser(async ({ user }, request: Request) => {
  const settings = await loadSettings(user.id);
  const from = searchParam(request, "from");
  const to = searchParam(request, "to");
  const start = from && isValidDay(from) ? from : todayInTimezone(settings.timezone);
  const end = to && isValidDay(to) ? to : addDays(start, 6);

  const rows = await db
    .select({
      id: mealPlans.id,
      day: mealPlans.day,
      slot: mealPlans.slot,
      mealId: mealPlans.mealId,
      startMinute: mealPlans.startMinute,
      eaten: mealPlans.eaten,
      name: meals.name,
      prepMinutes: meals.prepMinutes,
    })
    .from(mealPlans)
    .innerJoin(meals, eq(meals.id, mealPlans.mealId))
    .where(and(eq(mealPlans.userId, user.id), gte(mealPlans.day, start), lte(mealPlans.day, end)))
    .orderBy(asc(mealPlans.day), asc(mealPlans.startMinute));

  return ok({ from: start, to: end, entries: rows });
});

/** Assigns (or clears) a meal for one day and slot. */
export const PUT = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, mealPlanSetSchema);

  if (input.mealId === null) {
    await db
      .delete(mealPlans)
      .where(
        and(
          eq(mealPlans.userId, user.id),
          eq(mealPlans.day, input.day),
          eq(mealPlans.slot, input.slot),
        ),
      );
    return ok({ removed: true });
  }

  const [meal] = await db
    .select({ id: meals.id })
    .from(meals)
    .where(and(eq(meals.id, input.mealId), eq(meals.userId, user.id)))
    .limit(1);
  if (!meal) throw new ApiError("Mahlzeit nicht gefunden", 404);

  const defaultStart: Record<string, number> = {
    breakfast: 7 * 60 + 30,
    lunch: 12 * 60,
    snack: 15 * 60 + 30,
    dinner: 18 * 60 + 30,
    late: 21 * 60,
  };

  const [row] = await db
    .insert(mealPlans)
    .values({
      userId: user.id,
      day: input.day,
      slot: input.slot,
      mealId: input.mealId,
      startMinute: input.startMinute ?? defaultStart[input.slot] ?? 12 * 60,
    })
    .onConflictDoUpdate({
      target: [mealPlans.userId, mealPlans.day, mealPlans.slot],
      set: {
        mealId: input.mealId,
        startMinute: input.startMinute ?? defaultStart[input.slot] ?? 12 * 60,
      },
    })
    .returning();

  return ok(row);
});
