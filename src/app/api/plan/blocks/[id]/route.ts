import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { scheduleBlocks } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { blockUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withUser(async ({ user }, request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const input = await readJson(request, blockUpdateSchema);

  const [current] = await db
    .select()
    .from(scheduleBlocks)
    .where(and(eq(scheduleBlocks.id, id), eq(scheduleBlocks.userId, user.id)))
    .limit(1);
  if (!current) throw new ApiError("Block nicht gefunden", 404);

  const start = input.startMinute ?? current.startMinute;
  const end = input.endMinute ?? current.endMinute;
  if (end <= start) throw new ApiError("Das Ende muss nach dem Start liegen", 422);

  const completedAt =
    input.status === "done" ? new Date() : input.status ? null : current.completedAt;

  const [row] = await db
    .update(scheduleBlocks)
    .set({ ...input, completedAt, updatedAt: new Date() })
    .where(and(eq(scheduleBlocks.id, id), eq(scheduleBlocks.userId, user.id)))
    .returning();

  return ok(row);
});

export const DELETE = withUser(async ({ user }, _request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(scheduleBlocks)
    .where(and(eq(scheduleBlocks.id, id), eq(scheduleBlocks.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Block nicht gefunden", 404);
  return ok({ id });
});
