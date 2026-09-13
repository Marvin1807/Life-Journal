"use client";

import { useState } from "react";
import {
  Button,
  DangerButton,
  Empty,
  ErrorNote,
  Field,
  Input,
  NumberInput,
  Sheet,
  TimeInput,
  Toggle,
  WeekdayPicker,
} from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";
import { formatDuration, formatTime, weekdayLabel } from "@/lib/time";
import type { Routine, RoutineStep } from "@/lib/types";

export function RoutinesEditor({ routines, onChanged }: { routines: Routine[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<Routine | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px]" style={{ color: "var(--ink-2)" }}>
          Morgen- und Abendroutinen aus einzelnen Schritten.
        </p>
        <Button size="sm" onClick={() => setCreating(true)}>
          Neu
        </Button>
      </div>

      {routines.length === 0 ? (
        <Empty title="Keine Routinen" hint="Eine Routine bündelt kleine Schritte zu einem Block." />
      ) : (
        routines.map((routine) => {
          const total = (routine.steps ?? []).reduce((sum, s) => sum + s.durationMinutes, 0);
          return (
            <button
              key={routine.id}
              type="button"
              onClick={() => setEditing(routine)}
              className="card flex items-center gap-3 px-3.5 py-3 text-left"
              style={{ opacity: routine.enabled ? 1 : 0.5 }}
            >
              <span className="text-xl">{routine.icon || "✨"}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{routine.name}</span>
                <span className="block truncate text-[12px]" style={{ color: "var(--ink-3)" }}>
                  {formatTime(routine.startMinute)} · {formatDuration(total)} ·{" "}
                  {(routine.steps ?? []).length} Schritte
                  {routine.weekdays.length < 7 && ` · ${routine.weekdays.map((d) => weekdayLabel(d)).join(", ")}`}
                </span>
              </span>
            </button>
          );
        })
      )}

      <RoutineSheet
        open={creating || editing !== null}
        routine={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          onChanged();
        }}
      />
    </div>
  );
}

function RoutineSheet({
  open,
  routine,
  onClose,
  onSaved,
}: {
  open: boolean;
  routine: Routine | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [start, setStart] = useState(7 * 60);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [enabled, setEnabled] = useState(true);
  const [autoPlan, setAutoPlan] = useState(true);
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [newStep, setNewStep] = useState("");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = routine ? routine.id : "new";
  if (open && loadedKey !== key) {
    setLoadedKey(key);
    setName(routine?.name ?? "");
    setIcon(routine?.icon ?? "");
    setStart(routine?.startMinute ?? 7 * 60);
    setWeekdays(routine?.weekdays ?? [1, 2, 3, 4, 5, 6, 7]);
    setEnabled(routine?.enabled ?? true);
    setAutoPlan(routine?.autoPlan ?? true);
    setSteps(routine?.steps ?? []);
    setError(null);
  }
  if (!open && loadedKey !== null) setLoadedKey(null);

  async function save() {
    if (!name.trim()) {
      setError("Bitte einen Namen eingeben");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = { name, icon, startMinute: start, weekdays, enabled, autoPlan };
      if (routine) await api.patch(`/api/routines/${routine.id}`, payload);
      else await api.post("/api/routines", payload);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function addStep() {
    if (!routine || !newStep.trim()) return;
    try {
      const row = await api.post<RoutineStep>("/api/routine-steps", {
        routineId: routine.id,
        title: newStep,
        durationMinutes: 5,
        sortOrder: steps.length,
      });
      setSteps((s) => [...s, row]);
      setNewStep("");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    }
  }

  async function updateStep(id: string, patch: Partial<RoutineStep>) {
    setSteps((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    await api.patch(`/api/routine-steps/${id}`, patch).catch(() => undefined);
  }

  async function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[index], next[target]] = [next[target], next[index]];
    setSteps(next);
    await Promise.all(
      next.map((s, i) => api.patch(`/api/routine-steps/${s.id}`, { sortOrder: i }).catch(() => undefined)),
    );
  }

  async function removeStep(id: string) {
    setSteps((s) => s.filter((x) => x.id !== id));
    await api.del(`/api/routine-steps/${id}`).catch(() => undefined);
  }

  async function remove() {
    if (!routine) return;
    setBusy(true);
    try {
      await api.del(`/api/routines/${routine.id}`);
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  let cursor = start;

  return (
    <Sheet
      open
      onClose={onClose}
      title={routine ? "Routine bearbeiten" : "Neue Routine"}
      footer={
        <>
          <Button className="flex-1" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" className="flex-1" busy={busy} onClick={save}>
            Speichern
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[64px_1fr] gap-3">
          <Field label="Icon">
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value.slice(0, 2))}
              placeholder="🌅"
              className="text-center"
            />
          </Field>
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        </div>

        <Field label="Startzeit">
          <TimeInput value={start} onChange={setStart} />
        </Field>

        <Field label="Wochentage">
          <WeekdayPicker value={weekdays} onChange={setWeekdays} />
        </Field>

        <div className="rounded-xl px-3" style={{ background: "var(--surface-2)" }}>
          <Toggle checked={enabled} onChange={setEnabled} label="Aktiv" />
          <Toggle checked={autoPlan} onChange={setAutoPlan} label="Automatisch einplanen" />
        </div>

        {routine ? (
          <div>
            <p className="mb-1.5 text-[13px] font-medium" style={{ color: "var(--ink-2)" }}>
              Schritte
            </p>
            <div className="flex flex-col gap-2">
              {steps.map((step, index) => {
                const stepStart = cursor;
                cursor += step.durationMinutes;
                return (
                  <div key={step.id} className="flex items-center gap-2">
                    <span className="w-[42px] shrink-0 text-[12px] tabular-nums" style={{ color: "var(--ink-3)" }}>
                      {formatTime(stepStart)}
                    </span>
                    <Input
                      value={step.title}
                      onChange={(e) => updateStep(step.id, { title: e.target.value })}
                      className="min-w-0 flex-1"
                    />
                    <div className="w-[92px] shrink-0">
                      <NumberInput
                        value={step.durationMinutes}
                        onChange={(v) => updateStep(step.id, { durationMinutes: Math.max(1, v) })}
                        suffix="Min"
                        min={1}
                      />
                    </div>
                    <div className="flex shrink-0 flex-col">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        aria-label="Nach oben"
                        style={{ color: "var(--ink-3)", lineHeight: 1 }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        aria-label="Nach unten"
                        style={{ color: "var(--ink-3)", lineHeight: 1 }}
                      >
                        ▼
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStep(step.id)}
                      aria-label="Schritt löschen"
                      style={{ color: "var(--ink-3)" }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              <div className="flex gap-2">
                <Input
                  value={newStep}
                  onChange={(e) => setNewStep(e.target.value)}
                  placeholder="Schritt hinzufügen"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void addStep();
                    }
                  }}
                />
                <Button size="sm" onClick={addStep}>
                  +
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
            Speichere die Routine zuerst — danach kannst du die einzelnen Schritte anlegen.
          </p>
        )}

        {error && <ErrorNote>{error}</ErrorNote>}

        {routine && (
          <DangerButton label="Routine löschen" busy={busy} onConfirm={remove} />
        )}
      </div>
    </Sheet>
  );
}
