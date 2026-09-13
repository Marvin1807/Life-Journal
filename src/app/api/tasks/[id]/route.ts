import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { taskUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withUser(async ({ user }, request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const input = await readJson(request, taskUpdateSchema);
  const completedAt = input.status === "done" ? new Date() : input.status ? null : undefined;

  const [row] = await db
    .update(tasks)
    .set({ ...input, ...(completedAt !== undefined ? { completedAt } : {}), updatedAt: new Date() })
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Aufgabe nicht gefunden", 404);
  return ok(row);
});

export const DELETE = withUser(async ({ user }, _r: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Aufgabe nicht gefunden", 404);
  return ok({ id });
});
