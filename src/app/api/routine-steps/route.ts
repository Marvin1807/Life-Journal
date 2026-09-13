import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { routineSteps, routines } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { routineStepCreateSchema } from "@/lib/validation";

export const POST = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, routineStepCreateSchema);
  const [parent] = await db
    .select({ id: routines.id })
    .from(routines)
    .where(and(eq(routines.id, input.routineId), eq(routines.userId, user.id)))
    .limit(1);
  if (!parent) throw new ApiError("Routine nicht gefunden", 404);

  const [row] = await db
    .insert(routineSteps)
    .values({ ...input, userId: user.id })
    .returning();
  return ok(row, 201);
});
