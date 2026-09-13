import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { scheduleBlocks } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { getOrCreatePlan } from "@/lib/plan-service";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

/** "Morgen planen" — moves a block to another day's plan (spec §42). */
export const POST = withUser(async ({ user }, request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const { day } = await readJson(request, schema);

  const [block] = await db
    .select()
    .from(scheduleBlocks)
    .where(and(eq(scheduleBlocks.id, id), eq(scheduleBlocks.userId, user.id)))
    .limit(1);
  if (!block) throw new ApiError("Block nicht gefunden", 404);

  const target = await getOrCreatePlan(user.id, day);
  const [row] = await db
    .update(scheduleBlocks)
    .set({ planId: target.id, status: "planned", updatedAt: new Date() })
    .where(eq(scheduleBlocks.id, id))
    .returning();

  return ok({ block: row, day });
});
