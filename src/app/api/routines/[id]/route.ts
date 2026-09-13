import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { routines } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { routineUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withUser(async ({ user }, request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const input = await readJson(request, routineUpdateSchema);
  const [row] = await db
    .update(routines)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(routines.id, id), eq(routines.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Routine nicht gefunden", 404);
  return ok(row);
});

export const DELETE = withUser(async ({ user }, _r: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(routines)
    .where(and(eq(routines.id, id), eq(routines.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Routine nicht gefunden", 404);
  return ok({ id });
});
