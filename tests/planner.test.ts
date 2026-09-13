import { describe, it, expect } from "vitest";
import {
  planDay,
  findSlot,
  freeGaps,
  cascadeShift,
  rescheduleBlock,
  findOverlaps,
  type PlanItem,
  type PlanOptions,
} from "@/lib/planner";

const baseOptions: PlanOptions = {
  dayStart: 7 * 60,
  dayEnd: 23 * 60,
  bufferMinutes: 15,
  minFreeMinutes: 60,
  granularity: 5,
};

function item(partial: Partial<PlanItem> & { key: string; title: string }): PlanItem {
  return {
    category: "other",
    icon: "",
    description: "",
    durationMinutes: 60,
    priority: 3,
    isFixed: false,
    preferredStart: 12 * 60,
    earliestStart: 0,
    latestStart: 22 * 60,
    optional: false,
    ...partial,
  };
}

describe("freeGaps", () => {
  it("returns the whole window when nothing is occupied", () => {
    expect(freeGaps([], 420, 1380)).toEqual([{ start: 420, end: 1380 }]);
  });

  it("splits around occupied intervals and merges overlaps", () => {
    const gaps = freeGaps(
      [
        { start: 540, end: 720, fixed: true },
        { start: 660, end: 990, fixed: true },
      ],
      420,
      1380,
    );
    expect(gaps).toEqual([
      { start: 420, end: 540 },
      { start: 990, end: 1380 },
    ]);
  });
});

describe("findSlot", () => {
  it("places an item at its preferred time when free", () => {
    const start = findSlot([], 60, {
      earliest: 0,
      latest: 1380,
      preferred: 17 * 60,
      buffer: 15,
      windowStart: 420,
      windowEnd: 1380,
      granularity: 5,
    });
    expect(start).toBe(17 * 60);
  });

  it("keeps the buffer distance to neighbouring blocks", () => {
    const occupied = [{ start: 9 * 60, end: 16 * 60 + 30, fixed: true }];
    const start = findSlot(occupied, 60, {
      earliest: 0,
      latest: 1380,
      preferred: 16 * 60 + 30,
      buffer: 15,
      windowStart: 420,
      windowEnd: 1380,
      granularity: 5,
    });
    expect(start).not.toBeNull();
    expect(start!).toBeGreaterThanOrEqual(16 * 60 + 45);
  });

  it("respects earliest/latest bounds", () => {
    const start = findSlot([], 60, {
      earliest: 18 * 60,
      latest: 19 * 60,
      preferred: 8 * 60,
      buffer: 0,
      windowStart: 420,
      windowEnd: 1380,
      granularity: 5,
    });
    expect(start).toBe(18 * 60);
  });

  it("returns null when nothing fits", () => {
    const occupied = [{ start: 420, end: 1380, fixed: true }];
    const start = findSlot(occupied, 60, {
      earliest: 420,
      latest: 1300,
      preferred: 600,
      buffer: 0,
      windowStart: 420,
      windowEnd: 1380,
      granularity: 5,
    });
    expect(start).toBeNull();
  });
});

describe("planDay", () => {
  it("never moves fixed items", () => {
    const result = planDay(
      [
        item({ key: "work", title: "Arbeit", isFixed: true, fixedStart: 540, durationMinutes: 180, priority: 1 }),
        item({ key: "gym", title: "Fitness", preferredStart: 540, durationMinutes: 60, priority: 2 }),
      ],
      baseOptions,
    );
    const work = result.blocks.find((b) => b.key === "work")!;
    expect(work.startMinute).toBe(540);
    expect(work.endMinute).toBe(720);
    const gym = result.blocks.find((b) => b.key === "gym")!;
    expect(gym.startMinute === 540).toBe(false);
  });

  it("reports overlapping fixed items instead of deleting one", () => {
    const result = planDay(
      [
        item({ key: "a", title: "Termin A", isFixed: true, fixedStart: 600, durationMinutes: 60, priority: 1 }),
        item({ key: "b", title: "Termin B", isFixed: true, fixedStart: 630, durationMinutes: 60, priority: 1 }),
      ],
      baseOptions,
    );
    expect(result.blocks).toHaveLength(2);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].kind).toBe("fixed-overlap");
  });

  it("produces no overlapping flexible blocks", () => {
    const items: PlanItem[] = [
      item({ key: "work", title: "Arbeit", isFixed: true, fixedStart: 540, durationMinutes: 450, priority: 1 }),
      item({ key: "gym", title: "Fitness", preferredStart: 17 * 60, durationMinutes: 60, priority: 2, essential: true }),
      item({ key: "dinner", title: "Abendessen", preferredStart: 18 * 60 + 30, durationMinutes: 30, priority: 2, essential: true }),
      item({ key: "dev", title: "Weiterentwicklung", preferredStart: 19 * 60, durationMinutes: 60, priority: 3 }),
      item({ key: "netflix", title: "Netflix", preferredStart: 21 * 60, durationMinutes: 75, priority: 4 }),
    ];
    const result = planDay(items, baseOptions);
    const sorted = [...result.blocks].sort((a, b) => a.startMinute - b.startMinute);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].startMinute).toBeGreaterThanOrEqual(sorted[i - 1].endMinute);
    }
  });

  it("keeps at least the configured free time by dropping low-priority items", () => {
    const items: PlanItem[] = [
      item({ key: "work", title: "Arbeit", isFixed: true, fixedStart: 540, durationMinutes: 450, priority: 1 }),
      item({ key: "l1", title: "Netflix", preferredStart: 18 * 60, durationMinutes: 120, priority: 4 }),
      item({ key: "l2", title: "Gaming", preferredStart: 19 * 60, durationMinutes: 120, priority: 4 }),
      item({ key: "l3", title: "Social Media", preferredStart: 20 * 60, durationMinutes: 120, priority: 4 }),
    ];
    const result = planDay(items, { ...baseOptions, minFreeMinutes: 180 });
    expect(result.freeMinutes).toBeGreaterThanOrEqual(180);
    expect(result.unplaced.length).toBeGreaterThan(0);
  });

  it("still plans leisure when there is room (leisure is not discarded)", () => {
    const items: PlanItem[] = [
      item({ key: "work", title: "Arbeit", isFixed: true, fixedStart: 540, durationMinutes: 300, priority: 1 }),
      item({ key: "netflix", title: "Netflix", preferredStart: 21 * 60, durationMinutes: 75, priority: 4 }),
    ];
    const result = planDay(items, baseOptions);
    expect(result.blocks.some((b) => b.key === "netflix")).toBe(true);
  });

  it("protects essential items even when the free-time budget is exhausted", () => {
    const items: PlanItem[] = [
      item({ key: "work", title: "Arbeit", isFixed: true, fixedStart: 540, durationMinutes: 450, priority: 1 }),
      item({ key: "gym", title: "Fitness", preferredStart: 17 * 60, durationMinutes: 60, priority: 2, essential: true }),
    ];
    const result = planDay(items, { ...baseOptions, minFreeMinutes: 600 });
    expect(result.blocks.some((b) => b.key === "gym")).toBe(true);
  });

  it("does not plan anything into the sleep window", () => {
    const items: PlanItem[] = [
      item({ key: "work", title: "Arbeit", isFixed: true, fixedStart: 540, durationMinutes: 450, priority: 1 }),
      item({ key: "gym", title: "Fitness", preferredStart: 17 * 60, durationMinutes: 60, priority: 2 }),
      item({ key: "netflix", title: "Netflix", preferredStart: 22 * 60, durationMinutes: 90, priority: 4 }),
    ];
    const result = planDay(items, baseOptions);
    for (const block of result.blocks) {
      expect(block.startMinute).toBeGreaterThanOrEqual(baseOptions.dayStart);
      expect(block.endMinute).toBeLessThanOrEqual(baseOptions.dayEnd);
    }
  });

  it("gives leisure a second chance outside its preferred window instead of dropping it", () => {
    const items: PlanItem[] = [
      item({ key: "work", title: "Arbeit", isFixed: true, fixedStart: 540, durationMinutes: 300, priority: 1 }),
      item({
        key: "netflix",
        title: "Netflix",
        preferredStart: 21 * 60,
        earliestStart: 21 * 60,
        latestStart: 21 * 60 + 10,
        durationMinutes: 75,
        priority: 4,
      }),
      // Fills the preferred evening window completely.
      item({ key: "evening", title: "Abendblock", isFixed: true, fixedStart: 20 * 60, durationMinutes: 180, priority: 1 }),
    ];
    const result = planDay(items, baseOptions);
    const netflix = result.blocks.find((b) => b.key === "netflix");
    expect(netflix).toBeDefined();
    expect(netflix!.startMinute).toBeLessThan(20 * 60);
  });

  it("rejects an item whose earliest start lies inside the sleep window", () => {
    const result = planDay(
      [
        item({
          key: "late",
          title: "Späte Aufgabe",
          earliestStart: 23 * 60 + 30,
          latestStart: 23 * 60 + 45,
          preferredStart: 23 * 60 + 30,
          durationMinutes: 60,
          priority: 3,
        }),
      ],
      baseOptions,
    );
    expect(result.blocks).toHaveLength(0);
    expect(result.unplaced).toHaveLength(1);
  });

  it("summarises minutes per category", () => {
    const result = planDay(
      [
        item({ key: "work", title: "Arbeit", category: "work", isFixed: true, fixedStart: 540, durationMinutes: 180, priority: 1 }),
        item({ key: "gym", title: "Fitness", category: "fitness", preferredStart: 17 * 60, durationMinutes: 60, priority: 2 }),
      ],
      baseOptions,
    );
    expect(result.byCategory.work).toBe(180);
    expect(result.byCategory.fitness).toBe(60);
  });
});

describe("cascadeShift", () => {
  it("pushes following flexible blocks back", () => {
    const blocks = [
      { id: "gym", title: "Fitness", startMinute: 17 * 60, endMinute: 18 * 60, isFixed: false },
      { id: "shower", title: "Duschen", startMinute: 18 * 60, endMinute: 18 * 60 + 30, isFixed: false },
      { id: "dinner", title: "Abendessen", startMinute: 18 * 60 + 30, endMinute: 19 * 60, isFixed: false },
    ];
    const { blocks: moved, blocked } = cascadeShift(blocks, "gym", 18 * 60);
    expect(blocked).toHaveLength(0);
    const byId = Object.fromEntries(moved.map((b) => [b.id, b]));
    expect(byId.gym.startMinute).toBe(18 * 60);
    expect(byId.shower.startMinute).toBeGreaterThanOrEqual(19 * 60);
    expect(byId.dinner.startMinute).toBeGreaterThanOrEqual(byId.shower.endMinute);
  });

  it("reports fixed blocks that cannot be pushed", () => {
    const blocks = [
      { id: "gym", title: "Fitness", startMinute: 17 * 60, endMinute: 18 * 60, isFixed: false },
      { id: "call", title: "Fixer Termin", startMinute: 18 * 60, endMinute: 19 * 60, isFixed: true },
    ];
    const { blocked } = cascadeShift(blocks, "gym", 18 * 60);
    expect(blocked.map((b) => b.id)).toContain("call");
  });
});

describe("rescheduleBlock", () => {
  it("finds the next free slot after the current time", () => {
    const blocks = [
      { id: "gym", title: "Fitness", startMinute: 17 * 60, endMinute: 18 * 60, isFixed: false },
      { id: "dinner", title: "Abendessen", startMinute: 18 * 60 + 30, endMinute: 19 * 60, isFixed: true },
    ];
    const start = rescheduleBlock(blocks, "gym", {
      notBefore: 18 * 60,
      dayStart: 7 * 60,
      dayEnd: 23 * 60,
      buffer: 15,
      granularity: 5,
    });
    expect(start).not.toBeNull();
    expect(start!).toBeGreaterThanOrEqual(19 * 60);
  });
});

describe("findOverlaps", () => {
  it("detects a conflict when a block is dropped onto another", () => {
    const blocks = [
      { id: "a", title: "A", startMinute: 600, endMinute: 660, isFixed: true },
      { id: "b", title: "B", startMinute: 700, endMinute: 760, isFixed: false },
    ];
    expect(findOverlaps(blocks, 640, 720, "b").map((b) => b.id)).toEqual(["a"]);
    expect(findOverlaps(blocks, 800, 860, "b")).toHaveLength(0);
  });
});
