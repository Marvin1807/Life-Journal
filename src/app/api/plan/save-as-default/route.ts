import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { activityRules, dailyPlans, scheduleBlocks } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { saveAsDefaultSchema } from "@/lib/validation";

/**
 * "Als Standard übernehmen" (spec §11): copies the times of today's blocks back
 * into the standard routine. Without a blockId the whole day is adopted.
 */
export const POST = withUser(async ({ user }, request: Request) => {
  const { day, blockId } = await readJson(request, saveAsDefaultSchema);

  const [plan] = await db
    .select()
    .from(dailyPlans)
    .where(and(eq(dailyPlans.userId, user.id), eq(dailyPlans.day, day)))
    .limit(1);
  if (!plan) throw new ApiError("Für diesen Tag gibt es keinen Plan", 404);

  const blocks = await db
    .select()
    .from(scheduleBlocks)
    .where(
      blockId
        ? and(eq(scheduleBlocks.planId, plan.id), eq(scheduleBlocks.id, blockId))
        : eq(scheduleBlocks.planId, plan.id),
    );

  const withActivity = blocks.filter((b) => b.activityId);
  if (withActivity.length === 0) {
    throw new ApiError("Dieser Block gehört zu keiner Aktivität und kann nicht übernommen werden", 400);
  }

  const rules = await db
    .select()
    .from(activityRules)
    .where(
      and(
        eq(activityRules.userId, user.id),
        inArray(
          activityRules.activityId,
          withActivity.map((b) => b.activityId as string),
        ),
      ),
    );

  let updated = 0;
  await db.transaction(async (tx) => {
    for (const block of withActivity) {
      const rule = rules.find((r) => r.activityId === block.activityId);
      if (!rule) continue;
      const duration = block.endMinute - block.startMinute;
      await tx
        .update(activityRules)
        .set({
          preferredStart: block.startMinute,
          durationMinutes: duration,
          updatedAt: new Date(),
        })
        .where(eq(activityRules.id, rule.id));
      updated += 1;
    }
  });

  return ok({ updated });
});
