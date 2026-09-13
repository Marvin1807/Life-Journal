import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { dailyPlans, scheduleBlocks } from "@/db/schema";
import { ApiError, ok, withUser } from "@/lib/api";
import { loadSettings } from "@/lib/plan-service";
import { rescheduleBlock, type SimpleBlock } from "@/lib/planner";
import { minutesNowInTimezone, todayInTimezone, weekdayOf } from "@/lib/time";

type Params = { params: Promise<{ id: string }> };

/** "Jetzt einplanen" — finds the next free slot for a block today (spec §42). */
export const POST = withUser(async ({ user }, _request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const settings = await loadSettings(user.id);

  const [block] = await db
    .select()
    .from(scheduleBlocks)
    .where(and(eq(scheduleBlocks.id, id), eq(scheduleBlocks.userId, user.id)))
    .limit(1);
  if (!block) throw new ApiError("Block nicht gefunden", 404);

  const [plan] = await db.select().from(dailyPlans).where(eq(dailyPlans.id, block.planId)).limit(1);
  const today = todayInTimezone(settings.timezone);
  const isToday = plan?.day === today;
  const now = minutesNowInTimezone(settings.timezone);

  const siblings = await db
    .select()
    .from(scheduleBlocks)
    .where(eq(scheduleBlocks.planId, block.planId));

  const simple: SimpleBlock[] = siblings.map((b) => ({
    id: b.id,
    title: b.title,
    startMinute: b.startMinute,
    endMinute: b.endMinute,
    isFixed: b.isFixed,
  }));

  const weekday = weekdayOf(plan?.day ?? today);
  const isWorkDay = settings.workDays.includes(weekday);
  const dayStart = isWorkDay ? settings.wakeTime : settings.wakeTimeFreeDay;
  const dayEnd = isWorkDay ? settings.sleepTime : settings.sleepTimeFreeDay;

  const start = rescheduleBlock(simple, id, {
    notBefore: isToday ? Math.max(now, dayStart) : dayStart,
    dayStart,
    dayEnd,
    buffer: settings.bufferMinutes,
    granularity: settings.planningGranularity,
  });

  if (start === null) {
    return ok({
      rescheduled: false,
      message: "Heute ist kein passender Zeitraum mehr frei. Verschiebe den Block auf morgen.",
    });
  }

  const duration = block.endMinute - block.startMinute;
  const [row] = await db
    .update(scheduleBlocks)
    .set({ startMinute: start, endMinute: start + duration, status: "planned", updatedAt: new Date() })
    .where(eq(scheduleBlocks.id, id))
    .returning();

  return ok({ rescheduled: true, block: row });
});
