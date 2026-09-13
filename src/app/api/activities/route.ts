import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { activities, activityRules } from "@/db/schema";
import { ok, readJson, withUser } from "@/lib/api";
import { activityCreateSchema } from "@/lib/validation";

/** Activities always travel together with their scheduling rules. */
export const GET = withUser(async ({ user }) => {
  const rows = await db
    .select()
    .from(activities)
    .where(eq(activities.userId, user.id))
    .orderBy(asc(activities.archived), asc(activities.priority), asc(activities.name));

  const rules = await db
    .select()
    .from(activityRules)
    .where(eq(activityRules.userId, user.id))
    .orderBy(asc(activityRules.sortOrder));

  return ok(
    rows.map((activity) => ({
      ...activity,
      rules: rules.filter((r) => r.activityId === activity.id),
    })),
  );
});

export const POST = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, activityCreateSchema);
  const { rule, ...activity } = input;

  const [row] = await db
    .insert(activities)
    .values({ ...activity, userId: user.id })
    .returning();

  const [createdRule] = await db
    .insert(activityRules)
    .values({
      userId: user.id,
      activityId: row.id,
      weekdays: rule?.weekdays ?? [1, 2, 3, 4, 5, 6, 7],
      recurrence: rule?.recurrence ?? "weekly",
      preferredStart: rule?.preferredStart ?? 540,
      earliestStart: rule?.earliestStart ?? 0,
      latestStart: rule?.latestStart ?? 1380,
      durationMinutes: rule?.durationMinutes ?? row.defaultMinutes,
      enabled: rule?.enabled ?? true,
    })
    .returning();

  return ok({ ...row, rules: [createdRule] }, 201);
});
