import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { goalUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withUser(async ({ user }, request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const input = await readJson(request, goalUpdateSchema);
  const [row] = await db
    .update(goals)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(goals.id, id), eq(goals.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Ziel nicht gefunden", 404);
  return ok(row);
});

export const DELETE = withUser(async ({ user }, _r: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Ziel nicht gefunden", 404);
  return ok({ id });
});
