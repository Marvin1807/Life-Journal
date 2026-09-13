import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { goalMilestones, goals } from "@/db/schema";
import { ok, readJson, withUser } from "@/lib/api";
import { goalCreateSchema } from "@/lib/validation";

export const GET = withUser(async ({ user }) => {
  const rows = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, user.id))
    .orderBy(asc(goals.status), asc(goals.priority), asc(goals.title));

  const milestones = rows.length
    ? await db
        .select()
        .from(goalMilestones)
        .where(
          inArray(
            goalMilestones.goalId,
            rows.map((r) => r.id),
          ),
        )
        .orderBy(asc(goalMilestones.sortOrder))
    : [];

  return ok(rows.map((g) => ({ ...g, milestones: milestones.filter((m) => m.goalId === g.id) })));
});

export const POST = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, goalCreateSchema);
  const [row] = await db
    .insert(goals)
    .values({ ...input, userId: user.id })
    .returning();
  return ok({ ...row, milestones: [] }, 201);
});
