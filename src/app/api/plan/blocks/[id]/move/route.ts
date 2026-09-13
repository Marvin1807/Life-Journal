import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { scheduleBlocks } from "@/db/schema";
import { ApiError, ok, readJson, withUser } from "@/lib/api";
import { loadSettings } from "@/lib/plan-service";
import { cascadeShift, findOverlaps, type SimpleBlock } from "@/lib/planner";
import { blockMoveSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

/**
 * Moves one block. `single` only moves this block and reports any conflict it
 * creates; `cascade` pushes the following flexible blocks back (spec §10).
 * Moving a block never touches the standard routine (spec §11).
 */
export const POST = withUser(async ({ user }, request: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const { startMinute, mode } = await readJson(request, blockMoveSchema);
  const settings = await loadSettings(user.id);

  const [block] = await db
    .select()
    .from(scheduleBlocks)
    .where(and(eq(scheduleBlocks.id, id), eq(scheduleBlocks.userId, user.id)))
    .limit(1);
  if (!block) throw new ApiError("Block nicht gefunden", 404);

  const siblings = await db
    .select()
    .from(scheduleBlocks)
    .where(eq(scheduleBlocks.planId, block.planId));

  const duration = block.endMinute - block.startMinute;
  const newEnd = startMinute + duration;
  if (newEnd > 1440) throw new ApiError("Der Block passt nicht mehr in den Tag", 422);

  const simple: SimpleBlock[] = siblings.map((b) => ({
    id: b.id,
    title: b.title,
    startMinute: b.startMinute,
    endMinute: b.endMinute,
    isFixed: b.isFixed,
    category: b.category,
  }));

  if (mode === "single") {
    const conflicts = findOverlaps(simple, startMinute, newEnd, id);
    await db
      .update(scheduleBlocks)
      .set({ startMinute, endMinute: newEnd, status: "moved", updatedAt: new Date() })
      .where(eq(scheduleBlocks.id, id));

    return ok({
      mode,
      moved: [{ id, startMinute, endMinute: newEnd }],
      conflicts: conflicts.map((c) => ({ id: c.id, title: c.title, startMinute: c.startMinute, endMinute: c.endMinute })),
    });
  }

  const { blocks: shifted, blocked } = cascadeShift(simple, id, startMinute, settings.bufferMinutes);
  const changed = shifted.filter((b) => {
    const before = simple.find((s) => s.id === b.id)!;
    return before.startMinute !== b.startMinute || before.endMinute !== b.endMinute;
  });

  if (changed.length > 0) {
    await db.transaction(async (tx) => {
      for (const b of changed) {
        await tx
          .update(scheduleBlocks)
          .set({
            startMinute: b.startMinute,
            endMinute: b.endMinute,
            status: b.id === id ? "moved" : undefined,
            updatedAt: new Date(),
          })
          .where(and(eq(scheduleBlocks.id, b.id), eq(scheduleBlocks.userId, user.id)));
      }
    });
  }

  return ok({
    mode,
    moved: changed.map((b) => ({ id: b.id, startMinute: b.startMinute, endMinute: b.endMinute })),
    conflicts: blocked.map((b) => ({ id: b.id, title: b.title, startMinute: b.startMinute, endMinute: b.endMinute })),
  });
});
