"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { categoryMeta } from "@/lib/categories";
import { formatDuration, formatTime } from "@/lib/time";
import type { Block } from "@/lib/types";

export type Gap = { startMinute: number; endMinute: number };

type Row =
  | { kind: "block"; block: Block }
  | { kind: "gap"; gap: Gap };

/** Builds the timeline rows: blocks plus the free time between them. */
export function buildRows(blocks: Block[], dayStart: number, dayEnd: number): Row[] {
  const sorted = [...blocks].sort((a, b) => a.startMinute - b.startMinute);
  const rows: Row[] = [];
  let cursor = dayStart;

  for (const block of sorted) {
    if (block.startMinute > cursor && block.startMinute <= dayEnd) {
      const gapEnd = Math.min(block.startMinute, dayEnd);
      if (gapEnd - cursor >= 10) rows.push({ kind: "gap", gap: { startMinute: cursor, endMinute: gapEnd } });
    }
    rows.push({ kind: "block", block });
    cursor = Math.max(cursor, block.endMinute);
  }

  if (dayEnd - cursor >= 10) rows.push({ kind: "gap", gap: { startMinute: cursor, endMinute: dayEnd } });
  return rows;
}

export function Timeline({
  blocks,
  dayStart,
  dayEnd,
  nowMinute,
  isToday,
  onOpen,
  onDrop,
  onQuickStatus,
}: {
  blocks: Block[];
  dayStart: number;
  dayEnd: number;
  nowMinute: number;
  isToday: boolean;
  onOpen: (block: Block) => void;
  onDrop: (blockId: string, startMinute: number) => void;
  onQuickStatus: (block: Block, status: Block["status"]) => void;
}) {
  const rows = buildRows(blocks, dayStart, dayEnd);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const [targetMinute, setTargetMinute] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<Map<string, HTMLElement>>(new Map());
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPoint = useRef<{ x: number; y: number } | null>(null);

  const clearPress = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }, []);

  /** Maps a pointer position to the start minute of the row underneath. */
  const minuteAt = useCallback(
    (clientY: number): number | null => {
      let best: { minute: number; distance: number } | null = null;
      for (const [key, el] of rowRefs.current) {
        if (key === dragId) continue;
        const rect = el.getBoundingClientRect();
        if (clientY >= rect.top && clientY <= rect.bottom) {
          const minute = Number(el.dataset.start);
          if (Number.isFinite(minute)) return minute;
        }
        const distance = Math.min(Math.abs(clientY - rect.top), Math.abs(clientY - rect.bottom));
        const minute = Number(el.dataset.start);
        if (Number.isFinite(minute) && (!best || distance < best.distance)) {
          best = { minute, distance };
        }
      }
      return best?.minute ?? null;
    },
    [dragId],
  );

  useEffect(() => {
    if (!dragId) return;

    const onMove = (e: PointerEvent) => {
      e.preventDefault();
      setDragY(e.clientY);
      setTargetMinute(minuteAt(e.clientY));
    };
    const onUp = (e: PointerEvent) => {
      const minute = minuteAt(e.clientY);
      const id = dragId;
      setDragId(null);
      setTargetMinute(null);
      if (id && minute !== null) onDrop(id, minute);
    };
    const onCancel = () => {
      setDragId(null);
      setTargetMinute(null);
    };

    document.addEventListener("pointermove", onMove, { passive: false });
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onCancel);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onCancel);
      document.body.style.overflow = "";
    };
  }, [dragId, minuteAt, onDrop]);

  if (rows.length === 0) {
    return (
      <div className="card px-5 py-10 text-center">
        <p className="text-[15px] font-medium">Für heute ist noch nichts geplant.</p>
        <p className="mt-1 text-[13px]" style={{ color: "var(--ink-3)" }}>
          Erstelle deinen Tagesplan oder füge einen Block hinzu.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5 select-none">
      {rows.map((row) => {
        if (row.kind === "gap") {
          const key = `gap-${row.gap.startMinute}`;
          const isTarget = targetMinute === row.gap.startMinute && dragId !== null;
          return (
            <div
              key={key}
              data-start={row.gap.startMinute}
              ref={(el) => {
                if (el) rowRefs.current.set(key, el);
                else rowRefs.current.delete(key);
              }}
              className="flex items-center gap-3 rounded-xl border border-dashed px-3 py-2.5 transition-colors"
              style={{
                borderColor: isTarget ? "var(--accent)" : "var(--line)",
                background: isTarget ? "var(--accent-soft)" : "transparent",
              }}
            >
              <span className="w-[42px] shrink-0 text-[12px] tabular-nums" style={{ color: "var(--ink-3)" }}>
                {formatTime(row.gap.startMinute)}
              </span>
              <span className="text-[13px]" style={{ color: "var(--ink-3)" }}>
                Frei · {formatDuration(row.gap.endMinute - row.gap.startMinute)}
              </span>
            </div>
          );
        }

        const block = row.block;
        const meta = categoryMeta(block.category);
        const isNow =
          isToday && nowMinute >= block.startMinute && nowMinute < block.endMinute && block.status !== "done";
        const isDone = block.status === "done";
        const isSkipped = block.status === "skipped";
        const isDragging = dragId === block.id;
        const isOvernight = block.category === "sleep" && block.endMinute >= 1440 && block.description !== "";
        const isTarget = targetMinute === block.startMinute && dragId !== null && !isDragging;

        return (
          <div
            key={block.id}
            data-start={block.startMinute}
            ref={(el) => {
              if (el) rowRefs.current.set(block.id, el);
              else rowRefs.current.delete(block.id);
            }}
            className={clsx("relative flex gap-2.5 rounded-2xl px-3 py-3 transition-shadow", isDragging && "opacity-40")}
            style={{
              background: isNow ? `color-mix(in srgb, ${meta.color} 13%, var(--surface))` : "var(--surface)",
              border: `1px solid ${isNow ? meta.color : isTarget ? "var(--accent)" : "var(--line)"}`,
              boxShadow: isNow ? `0 0 0 1px ${meta.color}` : "var(--shadow)",
            }}
          >
            <span
              className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
              style={{ background: meta.color, opacity: isDone || isSkipped ? 0.35 : 1 }}
            />

            <div className="w-[42px] shrink-0 pt-0.5">
              <p className="text-[12px] font-semibold tabular-nums" style={{ color: "var(--ink-2)" }}>
                {formatTime(block.startMinute)}
              </p>
              <p className="text-[11px] tabular-nums" style={{ color: "var(--ink-3)" }}>
                {formatTime(block.endMinute)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpen(block)}
              className="min-w-0 flex-1 text-left"
            >
              <p
                className={clsx("truncate text-[15px] font-medium", (isDone || isSkipped) && "line-through")}
                style={{ color: isDone || isSkipped ? "var(--ink-3)" : "var(--ink)" }}
              >
                {block.icon || meta.icon} {block.title}
              </p>
              <p className="mt-0.5 truncate text-[12px]" style={{ color: "var(--ink-3)" }}>
                {/* Sleep runs past midnight, so its block length is not the
                    time actually slept — the description carries that. */}
                {isOvernight ? block.description : formatDuration(block.endMinute - block.startMinute)}
                {block.isFixed && " · Fix"}
                {isNow && " · Läuft gerade"}
                {!isOvernight && block.description && ` · ${block.description}`}
              </p>
            </button>

            <div className="flex shrink-0 items-center gap-1">
              {!isDone && (
                <button
                  type="button"
                  aria-label="Als erledigt markieren"
                  onClick={() => onQuickStatus(block, "done")}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[15px]"
                  style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}
                >
                  ✓
                </button>
              )}
              {isDone && (
                <button
                  type="button"
                  aria-label="Erledigt zurücknehmen"
                  onClick={() => onQuickStatus(block, "planned")}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[15px]"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  ✓
                </button>
              )}
              <button
                type="button"
                aria-label="Block verschieben"
                onPointerDown={(e) => {
                  startPoint.current = { x: e.clientX, y: e.clientY };
                  const y = e.clientY;
                  pressTimer.current = setTimeout(() => {
                    setDragId(block.id);
                    setDragY(y);
                    if (navigator.vibrate) navigator.vibrate(8);
                  }, 180);
                }}
                onPointerUp={clearPress}
                onPointerLeave={clearPress}
                onPointerCancel={clearPress}
                className="flex h-9 w-7 cursor-grab touch-none items-center justify-center rounded-lg"
                style={{ color: "var(--ink-3)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="6" r="1.6" />
                  <circle cx="15" cy="6" r="1.6" />
                  <circle cx="9" cy="12" r="1.6" />
                  <circle cx="15" cy="12" r="1.6" />
                  <circle cx="9" cy="18" r="1.6" />
                  <circle cx="15" cy="18" r="1.6" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}

      {dragId && (
        <div
          className="pointer-events-none fixed left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2 text-[13px] font-medium shadow-lg"
          style={{ top: dragY - 46, background: "var(--accent)", color: "var(--accent-ink)" }}
        >
          {targetMinute !== null ? `Verschieben auf ${formatTime(targetMinute)}` : "Position wählen"}
        </div>
      )}
    </div>
  );
}
