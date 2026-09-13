import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { exercises, workoutSessions, workoutSets } from "@/db/schema";
import { ok, searchParam, withUser } from "@/lib/api";

/** Progress per exercise over time, plus the current personal best (spec §25). */
export const GET = withUser(async ({ user }, request: Request) => {
  const exerciseId = searchParam(request, "exerciseId");

  const rows = await db
    .select({
      day: workoutSessions.day,
      exerciseId: workoutSets.exerciseId,
      exerciseName: exercises.name,
      reps: workoutSets.reps,
      weight: workoutSets.weight,
      volume: sql<number>`(${workoutSets.reps} * ${workoutSets.weight})`,
    })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.sessionId))
    .innerJoin(exercises, eq(exercises.id, workoutSets.exerciseId))
    .where(
      exerciseId
        ? and(eq(workoutSets.userId, user.id), eq(workoutSets.exerciseId, exerciseId))
        : eq(workoutSets.userId, user.id),
    )
    .orderBy(desc(workoutSessions.day))
    .limit(500);

  const best = new Map<string, { name: string; weight: number; reps: number; day: string }>();
  for (const r of rows) {
    const w = Number(r.weight);
    const current = best.get(r.exerciseId);
    if (!current || w > current.weight || (w === current.weight && r.reps > current.reps)) {
      best.set(r.exerciseId, { name: r.exerciseName, weight: w, reps: r.reps, day: r.day });
    }
  }

  return ok({
    sets: rows,
    personalBests: Array.from(best.entries()).map(([id, v]) => ({ exerciseId: id, ...v })),
  });
});
