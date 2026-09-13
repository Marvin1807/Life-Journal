import { db } from "@/db";
import { scheduleBlocks } from "@/db/schema";
import { ok, readJson, withUser } from "@/lib/api";
import { getOrCreatePlan } from "@/lib/plan-service";
import { blockCreateSchema } from "@/lib/validation";

export const POST = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, blockCreateSchema);
  const { day, ...fields } = input;
  const plan = await getOrCreatePlan(user.id, day);

  const [row] = await db
    .insert(scheduleBlocks)
    .values({ ...fields, userId: user.id, planId: plan.id })
    .returning();

  return ok(row, 201);
});
