import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { workoutSessions, workoutSets } from "@/db/schema";
import { ok, readJson, searchParam, withUser } from "@/lib/api";
import { workoutStartSchema } from "@/lib/validation";

export const GET = withUser(async ({ user }, request: Request) => {
  const day = searchParam(request, "day");
  const rows = await db
    .select()
    .from(workoutSessions)
    .where(
      day
        ? and(eq(workoutSessions.userId, user.id), eq(workoutSessions.day, day))
        : eq(workoutSessions.userId, user.id),
    )
    .orderBy(desc(workoutSessions.day))
    .limit(day ? 20 : 60);

  const sets = rows.length
    ? await db
        .select()
        .from(workoutSets)
        .where(
          inArray(
            workoutSets.sessionId,
            rows.map((r) => r.id),
          ),
        )
    : [];

  return ok(rows.map((s) => ({ ...s, sets: sets.filter((x) => x.sessionId === s.id) })));
});

/** Starts a workout session (spec §25). */
export const POST = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, workoutStartSchema);
  const [row] = await db
    .insert(workoutSessions)
    .values({ ...input, userId: user.id })
    .returning();
  return ok({ ...row, sets: [] }, 201);
});
