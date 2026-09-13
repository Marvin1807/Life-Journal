import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { exercises, workoutPlanExercises, workoutPlans } from "@/db/schema";
import { ok, readJson, withUser } from "@/lib/api";
import { workoutPlanCreateSchema } from "@/lib/validation";

export const GET = withUser(async ({ user }) => {
  const plans = await db
    .select()
    .from(workoutPlans)
    .where(eq(workoutPlans.userId, user.id))
    .orderBy(asc(workoutPlans.name));

  const items = plans.length
    ? await db
        .select({
          id: workoutPlanExercises.id,
          planId: workoutPlanExercises.planId,
          exerciseId: workoutPlanExercises.exerciseId,
          sets: workoutPlanExercises.sets,
          reps: workoutPlanExercises.reps,
          weight: workoutPlanExercises.weight,
          restSeconds: workoutPlanExercises.restSeconds,
          sortOrder: workoutPlanExercises.sortOrder,
          name: exercises.name,
          muscleGroup: exercises.muscleGroup,
          equipmentName: exercises.equipmentName,
        })
        .from(workoutPlanExercises)
        .innerJoin(exercises, eq(exercises.id, workoutPlanExercises.exerciseId))
        .where(
          inArray(
            workoutPlanExercises.planId,
            plans.map((p) => p.id),
          ),
        )
        .orderBy(asc(workoutPlanExercises.sortOrder))
    : [];

  return ok(plans.map((p) => ({ ...p, items: items.filter((i) => i.planId === p.id) })));
});

export const POST = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, workoutPlanCreateSchema);
  const { exercises: exerciseItems, ...fields } = input;

  const [plan] = await db
    .insert(workoutPlans)
    .values({ ...fields, userId: user.id })
    .returning();

  if (exerciseItems?.length) {
    await db.insert(workoutPlanExercises).values(
      exerciseItems.map((e, i) => ({ ...e, userId: user.id, planId: plan.id, sortOrder: i })),
    );
  }

  return ok({ ...plan, items: [] }, 201);
});
