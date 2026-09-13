import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { goalMilestones, goals } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { milestoneUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withUser(async ({ user }, request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const input = await readJson(request, milestoneUpdateSchema);
  const [row] = await db
    .update(goalMilestones)
    .set(input)
    .where(and(eq(goalMilestones.id, id), eq(goalMilestones.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Meilenstein nicht gefunden", 404);

  // Keep the goal's progress in sync with its milestones.
  const siblings = await db
    .select()
    .from(goalMilestones)
    .where(and(eq(goalMilestones.goalId, row.goalId), eq(goalMilestones.userId, user.id)));

  if (siblings.length > 0) {
    const done = siblings.filter((m) => m.done).length;
    await db
      .update(goals)
      .set({ progress: Math.round((done / siblings.length) * 100), updatedAt: new Date() })
      .where(and(eq(goals.id, row.goalId), eq(goals.userId, user.id)));
  }

  return ok(row);
});

export const DELETE = withUser(async ({ user }, _r: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(goalMilestones)
    .where(and(eq(goalMilestones.id, id), eq(goalMilestones.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Meilenstein nicht gefunden", 404);
  return ok({ id });
});
