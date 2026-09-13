import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { taskSubtasks } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { subtaskUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withUser(async ({ user }, request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const input = await readJson(request, subtaskUpdateSchema);
  const [row] = await db
    .update(taskSubtasks)
    .set(input)
    .where(and(eq(taskSubtasks.id, id), eq(taskSubtasks.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Unteraufgabe nicht gefunden", 404);
  return ok(row);
});

export const DELETE = withUser(async ({ user }, _r: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(taskSubtasks)
    .where(and(eq(taskSubtasks.id, id), eq(taskSubtasks.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Unteraufgabe nicht gefunden", 404);
  return ok({ id });
});
