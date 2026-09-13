import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { calendarEvents } from "@/db/schema";
import { ok, readJson, searchParam, withUser } from "@/lib/api";
import { eventCreateSchema } from "@/lib/validation";
import { isValidDay } from "@/lib/time";

export const GET = withUser(async ({ user }, request: Request) => {
  const from = searchParam(request, "from");
  const to = searchParam(request, "to");

  const filters = [eq(calendarEvents.userId, user.id)];
  // Recurring events are expanded client-side, so they are always included.
  const rows = await db
    .select()
    .from(calendarEvents)
    .where(and(...filters))
    .orderBy(asc(calendarEvents.day), asc(calendarEvents.startMinute));

  if (from && to && isValidDay(from) && isValidDay(to)) {
    return ok(rows.filter((e) => e.recurrence !== "none" || (e.day >= from && e.day <= to)));
  }
  return ok(rows);
});

export const POST = withUser(async ({ user }, request: Request) => {
  const input = await readJson(request, eventCreateSchema);
  const [row] = await db
    .insert(calendarEvents)
    .values({ ...input, userId: user.id })
    .returning();
  return ok(row, 201);
});
