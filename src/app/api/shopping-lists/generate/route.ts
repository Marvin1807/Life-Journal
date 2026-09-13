import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { foods, mealIngredients, mealPlans, shoppingListItems, shoppingLists } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { shoppingGenerateSchema } from "@/lib/validation";
import { formatDateShort } from "@/lib/time";

/**
 * Builds a shopping list from the meal plan of a date range. Identical foods
 * are summed up instead of listed multiple times (spec §31).
 */
export const POST = withUser(async ({ user }, request: Request) => {
  const { from, to, name } = await readJson(request, shoppingGenerateSchema);
  if (to < from) throw new ApiError("Das Enddatum liegt vor dem Startdatum", 422);

  const rows = await db
    .select({
      foodId: mealIngredients.foodId,
      amount: mealIngredients.amount,
      name: foods.name,
      unit: foods.unit,
      category: foods.category,
    })
    .from(mealPlans)
    .innerJoin(mealIngredients, eq(mealIngredients.mealId, mealPlans.mealId))
    .innerJoin(foods, eq(foods.id, mealIngredients.foodId))
    .where(and(eq(mealPlans.userId, user.id), gte(mealPlans.day, from), lte(mealPlans.day, to)));

  // Sum identical foods: 3 x 200 g Tofu becomes one entry with 600 g.
  const aggregated = new Map<
    string,
    { foodId: string; name: string; unit: string; category: string; amount: number }
  >();

  for (const row of rows) {
    const current = aggregated.get(row.foodId);
    const amount = Number(row.amount);
    if (current) {
      current.amount += amount;
    } else {
      aggregated.set(row.foodId, {
        foodId: row.foodId,
        name: row.name,
        unit: row.unit,
        category: row.category,
        amount,
      });
    }
  }

  const [list] = await db
    .insert(shoppingLists)
    .values({
      userId: user.id,
      name: name || `Einkauf ${formatDateShort(from)}–${formatDateShort(to)}`,
      fromDay: from,
      toDay: to,
    })
    .returning();

  const items = Array.from(aggregated.values());
  if (items.length > 0) {
    await db.insert(shoppingListItems).values(
      items.map((i) => ({
        userId: user.id,
        listId: list.id,
        foodId: i.foodId,
        name: i.name,
        category: i.category,
        amount: String(Math.round(i.amount * 100) / 100),
        unit: i.unit,
      })),
    );
  }

  const saved = await db
    .select()
    .from(shoppingListItems)
    .where(eq(shoppingListItems.listId, list.id));

  return ok({ ...list, items: saved }, 201);
});
