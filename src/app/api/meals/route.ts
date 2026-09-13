import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { foods, mealIngredients, meals } from "@/db/schema";
import { ok, readJson, withUser } from "@/lib/api";
import { mealCreateSchema } from "@/lib/validation";

/** Meals are always returned with their ingredients and computed nutrition. */
export const GET = withUser(async ({ user }) => {
  const rows = await db
    .select()
    .from(meals)
    .where(eq(meals.userId, user.id))
    .orderBy(asc(meals.slot), asc(meals.name));

  const ingredients = rows.length
    ? await db
        .select({
          id: mealIngredients.id,
          mealId: mealIngredients.mealId,
          foodId: mealIngredients.foodId,
          amount: mealIngredients.amount,
          sortOrder: mealIngredients.sortOrder,
          name: foods.name,
          unit: foods.unit,
          category: foods.category,
          referenceAmount: foods.referenceAmount,
          kcal: foods.kcal,
          protein: foods.protein,
          carbs: foods.carbs,
          fat: foods.fat,
        })
        .from(mealIngredients)
        .innerJoin(foods, eq(foods.id, mealIngredients.foodId))
        .where(
          inArray(
            mealIngredients.mealId,
            rows.map((r) => r.id),
          ),
        )
        .orderBy(asc(mealIngredients.sortOrder))
    : [];

  return ok(
    rows.map((meal) => {
      const own = ingredients.filter((i) => i.mealId === meal.id);
      const nutrition = own.reduce(
        (acc, i) => {
          const factor = Number(i.amount) / Math.max(0.0001, Number(i.referenceAmount));
          acc.kcal += Number(i.kcal) * factor;
          acc.protein += Number(i.protein) * factor;
          acc.carbs += Number(i.carbs) * factor;
          acc.fat += Number(i.fat) * factor;
          return acc;
        },
        { kcal: 0, protein: 0, carbs: 0, fat: 0 },
      );
      return {
        ...meal,
        ingredients: own,
        nutrition: {
          kcal: Math.round(nutrition.kcal),
          protein: Math.round(nutrition.protein * 10) / 10,
          carbs: Math.round(nutrition.carbs * 10) / 10,
          fat: Math.round(nutrition.fat * 10) / 10,
        },
      };
    }),
  );
});

export const POST = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, mealCreateSchema);
  const { ingredients, ...fields } = input;

  const [meal] = await db
    .insert(meals)
    .values({ ...fields, userId: user.id })
    .returning();

  if (ingredients?.length) {
    await db.insert(mealIngredients).values(
      ingredients.map((i, idx) => ({ ...i, userId: user.id, mealId: meal.id, sortOrder: idx })),
    );
  }

  return ok(meal, 201);
});
