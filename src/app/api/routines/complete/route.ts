import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { routineCompletions } from "@/db/schema";
import { ok, readJson, withUser } from "@/lib/api";
import { routineCompleteSchema } from "@/lib/validation";

export const POST = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, routineCompleteSchema);
  const [row] = await db
    .insert(routineCompletions)
    .values({ ...input, userId: user.id })
    .onConflictDoUpdate({
      target: [routineCompletions.routineId, routineCompletions.day],
      set: { completedSteps: input.completedSteps, done: input.done },
    })
    .returning();
  return ok(row);
});

export const GET = withUser(async ({ user }, request: Request) => {
  const day = new URL(request.url).searchParams.get("day");
  const rows = await db
    .select()
    .from(routineCompletions)
    .where(
      day
        ? and(eq(routineCompletions.userId, user.id), eq(routineCompletions.day, day))
        : eq(routineCompletions.userId, user.id),
    );
  return ok(rows);
});
