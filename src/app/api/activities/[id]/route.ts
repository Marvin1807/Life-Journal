import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { activities, activityRules } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { activityUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withUser(async ({ user }, request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const input = await readJson(request, activityUpdateSchema);
  const { rule, ...fields } = input;

  let row;
  if (Object.keys(fields).length > 0) {
    [row] = await db
      .update(activities)
      .set({ ...fields, updatedAt: new Date() })
      .where(and(eq(activities.id, id), eq(activities.userId, user.id)))
      .returning();
  } else {
    [row] = await db
      .select()
      .from(activities)
      .where(and(eq(activities.id, id), eq(activities.userId, user.id)))
      .limit(1);
  }

  if (!row) throw new ApiError("Aktivität nicht gefunden", 404);

  if (rule) {
    const existing = await db
      .select()
      .from(activityRules)
      .where(and(eq(activityRules.activityId, id), eq(activityRules.userId, user.id)))
      .limit(1);

    if (existing[0]) {
      await db
        .update(activityRules)
        .set({ ...rule, updatedAt: new Date() })
        .where(eq(activityRules.id, existing[0].id));
    } else {
      await db.insert(activityRules).values({
        userId: user.id,
        activityId: id,
        weekdays: rule.weekdays ?? [1, 2, 3, 4, 5, 6, 7],
        recurrence: rule.recurrence ?? "weekly",
        preferredStart: rule.preferredStart ?? 540,
        earliestStart: rule.earliestStart ?? 0,
        latestStart: rule.latestStart ?? 1380,
        durationMinutes: rule.durationMinutes ?? row.defaultMinutes,
        enabled: rule.enabled ?? true,
      });
    }
  }

  const rules = await db
    .select()
    .from(activityRules)
    .where(and(eq(activityRules.activityId, id), eq(activityRules.userId, user.id)));

  return ok({ ...row, rules });
});

export const DELETE = withUser(async ({ user }, _request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(activities)
    .where(and(eq(activities.id, id), eq(activities.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Aktivität nicht gefunden", 404);
  return ok({ id });
});
