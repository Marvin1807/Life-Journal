"use client";

import { useEffect, useState } from "react";
import { Button, ErrorNote, Field, NumberInput, Sheet, Textarea } from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";
import { formatDuration } from "@/lib/time";
import type { WorkoutPlan, WorkoutSession } from "@/lib/types";

type LoggedSet = {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weight: string;
  done: boolean;
};

/** Runs a workout: every set is logged and saved to the database on finish. */
export function WorkoutRunner({
  plan,
  session,
  onClose,
  onFinished,
}: {
  plan: WorkoutPlan | null;
  session: WorkoutSession;
  onClose: () => void;
  onFinished: () => void;
}) {
  const [sets, setSets] = useState<LoggedSet[]>([]);
  const [notes, setNotes] = useState("");
  const [effort, setEffort] = useState(7);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = new Date(session.startedAt).getTime();
    const tick = () => setElapsed(Math.max(0, Math.round((Date.now() - started) / 60000)));
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  }, [session.startedAt]);

  useEffect(() => {
    if (!plan?.items) return;
    const initial: LoggedSet[] = [];
    for (const item of plan.items) {
      for (let i = 1; i <= item.sets; i++) {
        initial.push({
          exerciseId: item.exerciseId,
          exerciseName: item.name,
          setNumber: i,
          reps: item.reps,
          weight: item.weight,
          done: false,
        });
      }
    }
    setSets(initial);
  }, [plan]);

  const grouped = sets.reduce<Record<string, LoggedSet[]>>((acc, s) => {
    (acc[s.exerciseId] ??= []).push(s);
    return acc;
  }, {});

  const doneCount = sets.filter((s) => s.done).length;

  function update(exerciseId: string, setNumber: number, patch: Partial<LoggedSet>) {
    setSets((current) =>
      current.map((s) => (s.exerciseId === exerciseId && s.setNumber === setNumber ? { ...s, ...patch } : s)),
    );
  }

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/api/workouts/${session.id}/finish`, {
        durationMinutes: Math.max(1, elapsed),
        perceivedEffort: effort,
        notes,
        sets: sets
          .filter((s) => s.done)
          .map((s) => ({
            exerciseId: s.exerciseId,
            setNumber: s.setNumber,
            reps: s.reps,
            weight: s.weight,
            durationSeconds: 0,
            done: true,
            notes: "",
          })),
      });
      onFinished();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function abort() {
    setBusy(true);
    try {
      await api.del(`/api/workouts/${session.id}`);
      onFinished();
    } catch {
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={session.name}
      footer={
        <>
          <Button className="flex-1" busy={busy} onClick={abort}>
            Abbrechen
          </Button>
          <Button variant="primary" className="flex-1" busy={busy} onClick={finish}>
            Training speichern
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div
          className="flex items-center justify-between rounded-xl px-3.5 py-3"
          style={{ background: "var(--accent-soft)" }}
        >
          <span className="text-[14px] font-medium" style={{ color: "var(--accent)" }}>
            {formatDuration(elapsed)} · {doneCount}/{sets.length} Sätze
          </span>
        </div>

        {Object.entries(grouped).map(([exerciseId, exerciseSets]) => (
          <div key={exerciseId} className="card px-3.5 py-3">
            <p className="mb-2 text-[15px] font-medium">{exerciseSets[0].exerciseName}</p>
            <div className="flex flex-col gap-2">
              {exerciseSets.map((s) => (
                <div key={s.setNumber} className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-[13px] tabular-nums" style={{ color: "var(--ink-3)" }}>
                    {s.setNumber}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <NumberInput
                      value={s.reps}
                      onChange={(v) => update(exerciseId, s.setNumber, { reps: v })}
                      suffix="Wdh"
                      min={0}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <NumberInput
                      value={Number(s.weight)}
                      onChange={(v) => update(exerciseId, s.setNumber, { weight: String(v) })}
                      suffix="kg"
                      min={0}
                      step={0.5}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label={s.done ? "Satz zurücknehmen" : "Satz abhaken"}
                    onClick={() => update(exerciseId, s.setNumber, { done: !s.done })}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 text-[15px]"
                    style={{
                      borderColor: s.done ? "var(--accent)" : "var(--line)",
                      background: s.done ? "var(--accent)" : "transparent",
                      color: s.done ? "var(--accent-ink)" : "var(--ink-3)",
                    }}
                  >
                    ✓
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {sets.length === 0 && (
          <p className="text-[14px]" style={{ color: "var(--ink-2)" }}>
            Dieser Plan enthält noch keine Übungen. Du kannst das Training trotzdem speichern und die
            Dauer festhalten.
          </p>
        )}

        <Field label="Anstrengung (0–10)">
          <NumberInput value={effort} onChange={setEffort} min={0} max={10} />
        </Field>

        <Field label="Notizen">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Wie lief es?" />
        </Field>

        {error && <ErrorNote>{error}</ErrorNote>}
      </div>
    </Sheet>
  );
}
