import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { workoutSessions } from "@/db/schema";
import { ApiError, ok, withUser } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export const DELETE = withUser(async ({ user }, _r: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(workoutSessions)
    .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Training nicht gefunden", 404);
  return ok({ id });
});
