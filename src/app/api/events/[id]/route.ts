import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { calendarEvents } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { eventUpdateSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withUser(async ({ user }, request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const input = await readJson(request, eventUpdateSchema);
  const [row] = await db
    .update(calendarEvents)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Termin nicht gefunden", 404);
  return ok(row);
});

export const DELETE = withUser(async ({ user }, _r: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const [row] = await db
    .delete(calendarEvents)
    .where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, user.id)))
    .returning();
  if (!row) throw new ApiError("Termin nicht gefunden", 404);
  return ok({ id });
});
