import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { mealIngredients, meals } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { mealUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withUser(async ({ user }, request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const input = await readJson(request, mealUpdateSchema);
  const { ingredients, ...fields } = input;

  let meal;
  if (Object.keys(fields).length > 0) {
    [meal] = await db
      .update(meals)
      .set({ ...fields, updatedAt: new Date() })
      .where(and(eq(meals.id, id), eq(meals.userId, user.id)))
      .returning();
  } else {
    [meal] = await db
      .select()
      .from(meals)
      .where(and(eq(meals.id, id), eq(meals.userId, user.id)))
      .limit(1);
  }
  if (!meal) throw new ApiError("Mahlzeit nicht gefunden", 404);

  if (ingredients) {
    await db.transaction(async (tx) => {
      await tx.delete(mealIngredients).where(eq(mealIngredients.mealId, id));
      if (ingredients.length > 0) {
        await tx.insert(mealIngredients).values(
          ingredients.map((i, idx) => ({ ...i, userId: user.id, mealId: id, sortOrder: idx })),
        );
      }
    });
  }

  return ok(meal);
});

export const DELETE = withUser(async ({ user }, _r: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(meals)
    .where(and(eq(meals.id, id), eq(meals.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Mahlzeit nicht gefunden", 404);
  return ok({ id });
});
