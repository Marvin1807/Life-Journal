import { ok, readJson, withUser } from "@/lib/api";
import { generateDayPlan } from "@/lib/plan-service";
import { planGenerateSchema } from "@/lib/validation";

export const POST = withUser(async ({ user }, request: Request) => {
  const { day, keepCompleted } = await readJson(request, planGenerateSchema);
  const result = await generateDayPlan(user.id, day, { keepCompleted });
  return ok({
    day,
    blocks: result.blocks,
    conflicts: result.conflicts,
    unplaced: result.unplaced,
    freeMinutes: result.freeMinutes,
    plannedMinutes: result.plannedMinutes,
    byCategory: result.byCategory,
  });
});
