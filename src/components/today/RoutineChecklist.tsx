"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { Spinner } from "@/components/ui";
import { api } from "@/lib/client";
import { formatTime } from "@/lib/time";
import type { Routine } from "@/lib/types";

type Completion = { routineId: string; day: string; completedSteps: string[]; done: boolean };

/**
 * Step-by-step checklist for a routine block (spec §19). Progress is stored per
 * day so the statistics can show how often a routine was actually completed.
 */
export function RoutineChecklist({
  routineId,
  day,
  startMinute,
}: {
  routineId: string;
  day: string;
  startMinute: number;
}) {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [routines, completions] = await Promise.all([
          api.get<Routine[]>("/api/routines"),
          api.get<Completion[]>(`/api/routines/complete?day=${day}`),
        ]);
        if (cancelled) return;
        setRoutine(routines.find((r) => r.id === routineId) ?? null);
        setChecked(completions.find((c) => c.routineId === routineId)?.completedSteps ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [routineId, day]);

  async function toggle(stepId: string) {
    const next = checked.includes(stepId) ? checked.filter((id) => id !== stepId) : [...checked, stepId];
    setChecked(next);
    const total = routine?.steps?.length ?? 0;
    await api
      .post("/api/routines/complete", {
        routineId,
        day,
        completedSteps: next,
        done: total > 0 && next.length === total,
      })
      .catch(() => undefined);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4" style={{ color: "var(--ink-3)" }}>
        <Spinner />
      </div>
    );
  }
  if (!routine || !routine.steps || routine.steps.length === 0) return null;

  let cursor = startMinute;

  return (
    <div>
      <p className="mb-1.5 text-[13px] font-medium" style={{ color: "var(--ink-2)" }}>
        Schritte ({checked.length}/{routine.steps.length})
      </p>
      <div className="flex flex-col gap-1.5">
        {routine.steps.map((step) => {
          const stepStart = cursor;
          cursor += step.durationMinutes;
          const isChecked = checked.includes(step.id);
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => toggle(step.id)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-left"
              style={{ background: "var(--surface-2)" }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px]"
                style={{
                  borderColor: isChecked ? "var(--accent)" : "var(--line)",
                  background: isChecked ? "var(--accent)" : "transparent",
                  color: isChecked ? "var(--accent-ink)" : "transparent",
                }}
              >
                ✓
              </span>
              <span className="w-[42px] shrink-0 text-[12px] tabular-nums" style={{ color: "var(--ink-3)" }}>
                {formatTime(stepStart)}
              </span>
              <span
                className={clsx("min-w-0 flex-1 truncate text-[14px]", isChecked && "line-through")}
                style={{ color: isChecked ? "var(--ink-3)" : "var(--ink)" }}
              >
                {step.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
