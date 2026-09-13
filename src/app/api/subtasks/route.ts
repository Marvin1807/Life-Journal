import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { taskSubtasks, tasks } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { subtaskCreateSchema } from "@/lib/validation";

export const POST = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, subtaskCreateSchema);
  const [parent] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, input.taskId), eq(tasks.userId, user.id)))
    .limit(1);
  if (!parent) throw new ApiError("Aufgabe nicht gefunden", 404);

  const [row] = await db
    .insert(taskSubtasks)
    .values({ ...input, userId: user.id })
    .returning();
  return ok(row, 201);
});
