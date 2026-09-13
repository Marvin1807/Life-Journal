/**
 * Pure day-planning engine.
 *
 * No database, no I/O — everything in here is deterministic so it can be unit
 * tested. The caller (plan-service) collects the day's candidates from the
 * database, runs `planDay`, and persists the result.
 *
 * Core principles (see the product spec):
 *  - fixed items are never moved or silently dropped; overlaps are reported
 *  - flexible items are placed close to their preferred time inside their window
 *  - a configurable buffer is kept between activities
 *  - a minimum amount of free time per day is protected from low-priority items
 *  - leisure is a first-class citizen, not filler that gets removed
 */

export type Category =
  | "sleep"
  | "work"
  | "meal"
  | "fitness"
  | "routine"
  | "development"
  | "chores"
  | "tasks"
  | "leisure"
  | "social"
  | "relationship"
  | "health"
  | "other";

export type PlanRefs = {
  activityId?: string | null;
  taskId?: string | null;
  goalId?: string | null;
  workoutPlanId?: string | null;
  mealId?: string | null;
  eventId?: string | null;
  routineId?: string | null;
};

export type PlanItem = PlanRefs & {
  key: string;
  title: string;
  category: Category;
  icon: string;
  description: string;
  durationMinutes: number;
  /** 1 = essential (sleep/work/fixed) .. 4 = discretionary leisure */
  priority: number;
  isFixed: boolean;
  /** required for fixed items */
  fixedStart?: number;
  preferredStart: number;
  earliestStart: number;
  latestStart: number;
  optional: boolean;
  /** Protected items ignore the free-time budget (meals, training, sleep). */
  essential?: boolean;
};

export type PlannedBlock = PlanRefs & {
  key: string;
  title: string;
  category: Category;
  icon: string;
  description: string;
  startMinute: number;
  endMinute: number;
  priority: number;
  isFixed: boolean;
};

export type Conflict = {
  kind: "fixed-overlap" | "unplaceable";
  message: string;
  items: { key: string; title: string; startMinute?: number; endMinute?: number }[];
};

export type PlanOptions = {
  dayStart: number; // wake time
  dayEnd: number; // sleep time
  bufferMinutes: number;
  minFreeMinutes: number;
  granularity: number; // snap flexible starts to this grid
};

export type PlanResult = {
  blocks: PlannedBlock[];
  conflicts: Conflict[];
  unplaced: { key: string; title: string; reason: string }[];
  freeMinutes: number;
  plannedMinutes: number;
  byCategory: Record<string, number>;
};

type Interval = { start: number; end: number; fixed: boolean };

const MINUTES_PER_DAY = 1440;

function snap(value: number, grid: number): number {
  if (grid <= 1) return Math.round(value);
  return Math.round(value / grid) * grid;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Free gaps inside [windowStart, windowEnd] given sorted occupied intervals. */
export function freeGaps(
  occupied: Interval[],
  windowStart: number,
  windowEnd: number,
): { start: number; end: number }[] {
  const sorted = [...occupied].sort((a, b) => a.start - b.start);
  const gaps: { start: number; end: number }[] = [];
  let cursor = windowStart;

  for (const iv of sorted) {
    if (iv.end <= windowStart || iv.start >= windowEnd) continue;
    const s = Math.max(iv.start, windowStart);
    if (s > cursor) gaps.push({ start: cursor, end: s });
    cursor = Math.max(cursor, Math.min(iv.end, windowEnd));
  }
  if (cursor < windowEnd) gaps.push({ start: cursor, end: windowEnd });
  return gaps.filter((g) => g.end > g.start);
}

export function totalFree(
  occupied: Interval[],
  windowStart: number,
  windowEnd: number,
): number {
  return freeGaps(occupied, windowStart, windowEnd).reduce((sum, g) => sum + (g.end - g.start), 0);
}

/**
 * Finds the start minute closest to `preferred` where `duration` fits, keeping
 * `buffer` minutes distance to neighbouring activities. Returns null when the
 * item cannot be placed inside its window.
 */
export function findSlot(
  occupied: Interval[],
  duration: number,
  opts: {
    earliest: number;
    latest: number;
    preferred: number;
    buffer: number;
    windowStart: number;
    windowEnd: number;
    granularity: number;
  },
): number | null {
  const { earliest, latest, preferred, buffer, windowStart, windowEnd, granularity } = opts;
  if (duration <= 0) return null;

  const lowerBound = Math.max(earliest, windowStart);
  const upperBound = Math.min(latest, windowEnd - duration);
  if (lowerBound > upperBound) return null;

  const gaps = freeGaps(occupied, windowStart, windowEnd);
  const candidates: number[] = [];

  for (const gap of gaps) {
    // keep buffer distance to whatever sits before/after this gap
    const hasBefore = occupied.some((iv) => Math.abs(iv.end - gap.start) < 1 && iv.end > windowStart);
    const hasAfter = occupied.some((iv) => Math.abs(iv.start - gap.end) < 1 && iv.start < windowEnd);
    const usableStart = gap.start + (hasBefore ? buffer : 0);
    const usableEnd = gap.end - (hasAfter ? buffer : 0);
    if (usableEnd - usableStart < duration) continue;

    const min = Math.max(usableStart, lowerBound);
    const max = Math.min(usableEnd - duration, upperBound);
    if (min > max) continue;

    // preferred start, clamped into this gap, plus both gap edges
    const clampedPreferred = Math.min(Math.max(preferred, min), max);
    for (const raw of [clampedPreferred, min, max]) {
      const snapped = Math.min(Math.max(snap(raw, granularity), min), max);
      candidates.push(snapped);
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => Math.abs(a - preferred) - Math.abs(b - preferred) || a - b);
  return candidates[0];
}

function addInterval(list: Interval[], start: number, end: number, fixed: boolean): void {
  list.push({ start, end, fixed });
  list.sort((a, b) => a.start - b.start);
}

/**
 * Builds a concrete day plan from the given candidate items.
 */
export function planDay(items: PlanItem[], options: PlanOptions): PlanResult {
  const { bufferMinutes, minFreeMinutes, granularity } = options;
  const dayStart = Math.max(0, Math.min(MINUTES_PER_DAY, options.dayStart));
  const dayEnd = Math.max(dayStart, Math.min(MINUTES_PER_DAY, options.dayEnd));

  const occupied: Interval[] = [];
  const blocks: PlannedBlock[] = [];
  const conflicts: Conflict[] = [];
  const unplaced: { key: string; title: string; reason: string }[] = [];

  /* ---------------------------- 1. fixed items --------------------------- */

  const fixed = items
    .filter((i) => i.isFixed)
    .map((i) => ({ ...i, fixedStart: i.fixedStart ?? i.preferredStart }))
    .sort((a, b) => (a.fixedStart! - b.fixedStart!) || a.priority - b.priority);

  for (const item of fixed) {
    const start = Math.max(0, Math.min(MINUTES_PER_DAY, item.fixedStart!));
    const end = Math.min(MINUTES_PER_DAY, start + item.durationMinutes);
    if (end <= start) {
      unplaced.push({ key: item.key, title: item.title, reason: "Dauer ist 0 Minuten" });
      continue;
    }

    const clash = blocks.find((b) => b.isFixed && overlaps(start, end, b.startMinute, b.endMinute));
    if (clash) {
      conflicts.push({
        kind: "fixed-overlap",
        message: `Zeitkonflikt: „${item.title}" überschneidet sich mit „${clash.title}".`,
        items: [
          { key: clash.key, title: clash.title, startMinute: clash.startMinute, endMinute: clash.endMinute },
          { key: item.key, title: item.title, startMinute: start, endMinute: end },
        ],
      });
      // Both are kept — the user decides (spec §43).
    }

    blocks.push({
      key: item.key,
      title: item.title,
      category: item.category,
      icon: item.icon,
      description: item.description,
      startMinute: start,
      endMinute: end,
      priority: item.priority,
      isFixed: true,
      activityId: item.activityId ?? null,
      taskId: item.taskId ?? null,
      goalId: item.goalId ?? null,
      workoutPlanId: item.workoutPlanId ?? null,
      mealId: item.mealId ?? null,
      eventId: item.eventId ?? null,
      routineId: item.routineId ?? null,
    });
    addInterval(occupied, start, end, true);
  }

  /* --------------------------- 2. flexible items -------------------------- */

  const flexible = items
    .filter((i) => !i.isFixed)
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        Number(a.optional) - Number(b.optional) ||
        a.preferredStart - b.preferredStart,
    );

  /** Items that did not fit their preferred window get a second, relaxed try. */
  const retry: PlanItem[] = [];

  // Free time available for planning inside the waking window.
  const windowMinutes = Math.max(0, dayEnd - dayStart);
  const fixedMinutes = blocks
    .filter((b) => b.endMinute > dayStart && b.startMinute < dayEnd)
    .reduce((sum, b) => sum + (Math.min(b.endMinute, dayEnd) - Math.max(b.startMinute, dayStart)), 0);

  // How much of the waking day may still be filled while keeping `minFreeMinutes` free.
  let discretionaryBudget = Math.max(0, windowMinutes - fixedMinutes - minFreeMinutes);

  for (const item of flexible) {
    if (item.durationMinutes <= 0) {
      unplaced.push({ key: item.key, title: item.title, reason: "Dauer ist 0 Minuten" });
      continue;
    }

    const protectedItem = item.essential === true || item.priority <= 2;

    if (!protectedItem && item.durationMinutes > discretionaryBudget) {
      unplaced.push({
        key: item.key,
        title: item.title,
        reason: "Nicht eingeplant, damit genügend freie Zeit übrig bleibt",
      });
      continue;
    }

    const start = findSlot(occupied, item.durationMinutes, {
      earliest: item.earliestStart,
      latest: item.latestStart,
      preferred: item.preferredStart,
      buffer: bufferMinutes,
      windowStart: dayStart,
      windowEnd: dayEnd,
      granularity,
    });

    if (start === null) {
      retry.push(item);
      continue;
    }

    const end = start + item.durationMinutes;
    blocks.push({
      key: item.key,
      title: item.title,
      category: item.category,
      icon: item.icon,
      description: item.description,
      startMinute: start,
      endMinute: end,
      priority: item.priority,
      isFixed: false,
      activityId: item.activityId ?? null,
      taskId: item.taskId ?? null,
      goalId: item.goalId ?? null,
      workoutPlanId: item.workoutPlanId ?? null,
      mealId: item.mealId ?? null,
      eventId: item.eventId ?? null,
      routineId: item.routineId ?? null,
    });
    addInterval(occupied, start, end, false);
    if (!protectedItem) discretionaryBudget -= item.durationMinutes;
  }

  /* ---------------------- 3. relaxed pass for leftovers -------------------- *
   * The buffer between activities is a preference, not a hard rule: a day
   * where everything sits back to back is better than a day where the buffer
   * pushed real activities out. Anything that did not fit in the first pass is
   * therefore retried without the buffer.
   *
   * Discretionary activities — anything the user marked optional, plus
   * low-priority leisure — additionally get to leave their preferred window
   * rather than being dropped (spec §33). Items with a window the user
   * deliberately narrowed keep it and are reported as unplaced instead.
   */

  for (const item of retry) {
    const protectedItem = item.essential === true || item.priority <= 2;
    const mayRelax = item.optional || item.priority >= 4;

    if (!protectedItem && item.durationMinutes > discretionaryBudget) {
      unplaced.push({
        key: item.key,
        title: item.title,
        reason: "Nicht eingeplant, damit genügend freie Zeit übrig bleibt",
      });
      continue;
    }

    const attempts: { earliest: number; latest: number; buffer: number }[] = [
      { earliest: item.earliestStart, latest: item.latestStart, buffer: 0 },
    ];
    if (mayRelax) {
      attempts.push({ earliest: dayStart, latest: dayEnd, buffer: bufferMinutes });
      attempts.push({ earliest: dayStart, latest: dayEnd, buffer: 0 });
    }

    let start: number | null = null;
    for (const attempt of attempts) {
      start = findSlot(occupied, item.durationMinutes, {
        earliest: attempt.earliest,
        latest: Math.min(attempt.latest, dayEnd - item.durationMinutes),
        preferred: item.preferredStart,
        buffer: attempt.buffer,
        windowStart: dayStart,
        windowEnd: dayEnd,
        granularity,
      });
      if (start !== null) break;
    }

    if (start === null) {
      unplaced.push({
        key: item.key,
        title: item.title,
        reason: mayRelax
          ? "Kein freier Zeitraum mehr im Tag"
          : "Kein freier Zeitraum im erlaubten Zeitfenster",
      });
      if (!item.optional && protectedItem) {
        conflicts.push({
          kind: "unplaceable",
          message: `„${item.title}" konnte nicht eingeplant werden — der Tag ist voll.`,
          items: [{ key: item.key, title: item.title }],
        });
      }
      continue;
    }

    const end = start + item.durationMinutes;
    blocks.push({
      key: item.key,
      title: item.title,
      category: item.category,
      icon: item.icon,
      description: item.description,
      startMinute: start,
      endMinute: end,
      priority: item.priority,
      isFixed: false,
      activityId: item.activityId ?? null,
      taskId: item.taskId ?? null,
      goalId: item.goalId ?? null,
      workoutPlanId: item.workoutPlanId ?? null,
      mealId: item.mealId ?? null,
      eventId: item.eventId ?? null,
      routineId: item.routineId ?? null,
    });
    addInterval(occupied, start, end, false);
    if (!protectedItem) discretionaryBudget -= item.durationMinutes;
  }

  blocks.sort((a, b) => a.startMinute - b.startMinute || a.endMinute - b.endMinute);

  /* ------------------------------ 4. summary ------------------------------ */

  const byCategory: Record<string, number> = {};
  let plannedMinutes = 0;
  for (const b of blocks) {
    const minutes = b.endMinute - b.startMinute;
    byCategory[b.category] = (byCategory[b.category] ?? 0) + minutes;
    if (b.category !== "sleep") plannedMinutes += minutes;
  }

  const freeMinutes = totalFree(
    occupied.filter((iv) => iv.end > dayStart && iv.start < dayEnd),
    dayStart,
    dayEnd,
  );

  return { blocks, conflicts, unplaced, freeMinutes, plannedMinutes, byCategory };
}

/* ------------------------------------------------------------------ *
 * Interactive helpers (drag & drop, "jetzt einplanen", conflict checks)
 * ------------------------------------------------------------------ */

export type SimpleBlock = {
  id: string;
  title: string;
  startMinute: number;
  endMinute: number;
  isFixed: boolean;
  category?: string;
};

/** Blocks (other than `exceptId`) that overlap the given range. */
export function findOverlaps<T extends SimpleBlock>(
  blocks: T[],
  start: number,
  end: number,
  exceptId?: string,
): T[] {
  return blocks.filter(
    (b) => b.id !== exceptId && overlaps(start, end, b.startMinute, b.endMinute),
  );
}

/**
 * Moves one block and pushes the following *flexible* blocks back just enough
 * to remove the overlap it caused ("Restlichen Tag automatisch anpassen").
 * Fixed blocks are never moved; blocks that would be pushed past midnight stay
 * where they are and are reported.
 */
export function cascadeShift(
  blocks: SimpleBlock[],
  movedId: string,
  newStart: number,
  bufferMinutes = 0,
): { blocks: SimpleBlock[]; blocked: SimpleBlock[] } {
  const sorted = [...blocks].sort((a, b) => a.startMinute - b.startMinute);
  const moved = sorted.find((b) => b.id === movedId);
  if (!moved) return { blocks: sorted, blocked: [] };

  const duration = moved.endMinute - moved.startMinute;
  const result = sorted.map((b) =>
    b.id === movedId ? { ...b, startMinute: newStart, endMinute: newStart + duration } : { ...b },
  );
  result.sort((a, b) => a.startMinute - b.startMinute);

  const blocked: SimpleBlock[] = [];
  let cursorEnd = -Infinity;
  let cursorTitleId = "";

  for (const block of result) {
    if (block.startMinute < cursorEnd) {
      const shiftTo = cursorEnd + (block.id === cursorTitleId ? 0 : bufferMinutes);
      const len = block.endMinute - block.startMinute;
      if (block.isFixed || shiftTo + len > MINUTES_PER_DAY) {
        blocked.push(block);
      } else {
        block.startMinute = shiftTo;
        block.endMinute = shiftTo + len;
      }
    }
    cursorEnd = Math.max(cursorEnd, block.endMinute);
    cursorTitleId = block.id;
  }

  result.sort((a, b) => a.startMinute - b.startMinute);
  return { blocks: result, blocked };
}

/**
 * Finds the next possible slot for a single block today ("Jetzt einplanen"),
 * starting from `notBefore`.
 */
export function rescheduleBlock(
  blocks: SimpleBlock[],
  blockId: string,
  opts: {
    notBefore: number;
    dayStart: number;
    dayEnd: number;
    buffer: number;
    granularity: number;
  },
): number | null {
  const target = blocks.find((b) => b.id === blockId);
  if (!target) return null;
  const duration = target.endMinute - target.startMinute;
  const occupied: Interval[] = blocks
    .filter((b) => b.id !== blockId)
    .map((b) => ({ start: b.startMinute, end: b.endMinute, fixed: b.isFixed }));

  return findSlot(occupied, duration, {
    earliest: opts.notBefore,
    latest: opts.dayEnd - duration,
    preferred: opts.notBefore,
    buffer: opts.buffer,
    windowStart: Math.min(opts.dayStart, opts.notBefore),
    windowEnd: opts.dayEnd,
    granularity: opts.granularity,
  });
}
