import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutSessions, workoutSets } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { workoutFinishSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

/** Saves the logged sets and closes the session. */
export const POST = withUser(async ({ user }, request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const input = await readJson(request, workoutFinishSchema);

  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, user.id)))
    .limit(1);
  if (!session) throw new ApiError("Training nicht gefunden", 404);

  const finishedAt = new Date();
  const duration =
    input.durationMinutes ??
    Math.max(1, Math.round((finishedAt.getTime() - session.startedAt.getTime()) / 60000));

  await db.transaction(async (tx) => {
    await tx.delete(workoutSets).where(eq(workoutSets.sessionId, id));
    if (input.sets.length > 0) {
      await tx.insert(workoutSets).values(
        input.sets.map((s) => ({ ...s, userId: user.id, sessionId: id })),
      );
    }
    await tx
      .update(workoutSessions)
      .set({
        finishedAt,
        durationMinutes: duration,
        perceivedEffort: input.perceivedEffort ?? session.perceivedEffort,
        notes: input.notes ?? session.notes,
      })
      .where(eq(workoutSessions.id, id));
  });

  const sets = await db.select().from(workoutSets).where(eq(workoutSets.sessionId, id));
  const [updated] = await db.select().from(workoutSessions).where(eq(workoutSessions.id, id));

  return ok({ ...updated, sets });
});
