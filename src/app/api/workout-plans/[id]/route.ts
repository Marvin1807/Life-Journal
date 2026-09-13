import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutPlanExercises, workoutPlans } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { workoutPlanUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withUser(async ({ user }, request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const input = await readJson(request, workoutPlanUpdateSchema);
  const { exercises: exerciseItems, ...fields } = input;

  let plan;
  if (Object.keys(fields).length > 0) {
    [plan] = await db
      .update(workoutPlans)
      .set({ ...fields, updatedAt: new Date() })
      .where(and(eq(workoutPlans.id, id), eq(workoutPlans.userId, user.id)))
      .returning();
  } else {
    [plan] = await db
      .select()
      .from(workoutPlans)
      .where(and(eq(workoutPlans.id, id), eq(workoutPlans.userId, user.id)))
      .limit(1);
  }
  if (!plan) throw new ApiError("Trainingsplan nicht gefunden", 404);

  if (exerciseItems) {
    await db.transaction(async (tx) => {
      await tx.delete(workoutPlanExercises).where(eq(workoutPlanExercises.planId, id));
      if (exerciseItems.length > 0) {
        await tx.insert(workoutPlanExercises).values(
          exerciseItems.map((e, i) => ({ ...e, userId: user.id, planId: id, sortOrder: i })),
        );
      }
    });
  }

  return ok(plan);
});

export const DELETE = withUser(async ({ user }, _r: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(workoutPlans)
    .where(and(eq(workoutPlans.id, id), eq(workoutPlans.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Trainingsplan nicht gefunden", 404);
  return ok({ id });
});
