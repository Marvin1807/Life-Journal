import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { routineSteps } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { routineStepUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withUser(async ({ user }, request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const input = await readJson(request, routineStepUpdateSchema);
  const [row] = await db
    .update(routineSteps)
    .set(input)
    .where(and(eq(routineSteps.id, id), eq(routineSteps.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Schritt nicht gefunden", 404);
  return ok(row);
});

export const DELETE = withUser(async ({ user }, _r: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(routineSteps)
    .where(and(eq(routineSteps.id, id), eq(routineSteps.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Schritt nicht gefunden", 404);
  return ok({ id });
});
