import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { goalMilestones, goals } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { milestoneCreateSchema } from "@/lib/validation";

export const POST = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, milestoneCreateSchema);
  const [goal] = await db
    .select({ id: goals.id })
    .from(goals)
    .where(and(eq(goals.id, input.goalId), eq(goals.userId, user.id)))
    .limit(1);
  if (!goal) throw new ApiError("Ziel nicht gefunden", 404);

  const [row] = await db
    .insert(goalMilestones)
    .values({ ...input, userId: user.id })
    .returning();
  return ok(row, 201);
});
