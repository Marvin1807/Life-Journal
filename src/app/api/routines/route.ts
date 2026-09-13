import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { routineSteps, routines } from "@/db/schema";
import { ok, readJson, withUser } from "@/lib/api";
import { routineCreateSchema } from "@/lib/validation";

export const GET = withUser(async ({ user }) => {
  const rows = await db
    .select()
    .from(routines)
    .where(eq(routines.userId, user.id))
    .orderBy(asc(routines.startMinute));

  const steps = rows.length
    ? await db
        .select()
        .from(routineSteps)
        .where(
          inArray(
            routineSteps.routineId,
            rows.map((r) => r.id),
          ),
        )
        .orderBy(asc(routineSteps.sortOrder))
    : [];

  return ok(rows.map((r) => ({ ...r, steps: steps.filter((s) => s.routineId === r.id) })));
});

export const POST = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, routineCreateSchema);
  const [row] = await db
    .insert(routines)
    .values({ ...input, userId: user.id })
    .returning();
  return ok({ ...row, steps: [] }, 201);
});
