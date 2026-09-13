import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { taskSubtasks, tasks } from "@/db/schema";
import { ok, readJson, searchParam, withUser } from "@/lib/api";
import { taskCreateSchema } from "@/lib/validation";

export const GET = withUser(async ({ user }, request: Request) => {
  const status = searchParam(request, "status");
  const rows = await db
    .select()
    .from(tasks)
    .where(
      status && ["open", "in_progress", "done", "postponed"].includes(status)
        ? and(eq(tasks.userId, user.id), eq(tasks.status, status as "open"))
        : eq(tasks.userId, user.id),
    )
    .orderBy(asc(tasks.status), asc(tasks.priority), asc(tasks.dueDate), desc(tasks.createdAt));

  const subtasks = rows.length
    ? await db
        .select()
        .from(taskSubtasks)
        .where(
          inArray(
            taskSubtasks.taskId,
            rows.map((r) => r.id),
          ),
        )
        .orderBy(asc(taskSubtasks.sortOrder))
    : [];

  return ok(rows.map((t) => ({ ...t, subtasks: subtasks.filter((s) => s.taskId === t.id) })));
});

export const POST = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, taskCreateSchema);
  const [row] = await db
    .insert(tasks)
    .values({ ...input, userId: user.id })
    .returning();
  return ok({ ...row, subtasks: [] }, 201);
});
