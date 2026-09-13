"use client";

import { useMemo, useState } from "react";
import {
  Button,
  DangerButton,
  Card,
  Empty,
  ErrorNote,
  Field,
  Input,
  NumberInput,
  Select,
  Sheet,
  Spinner,
  Textarea,
  WeekdayPicker,
} from "@/components/ui";
import { WorkoutRunner } from "@/components/fitness/WorkoutRunner";
import { useResource } from "@/hooks/useResource";
import { api, ApiClientError } from "@/lib/client";
import { formatDateShort, formatDuration, todayInTimezone, weekdayLabel, weekdayOf } from "@/lib/time";
import type { Exercise, WorkoutPlan, WorkoutSession } from "@/lib/types";

type Tab = "plans" | "exercises" | "history";
type Equipment = { id: string; name: string; available: boolean };
type History = {
  sets: { day: string; exerciseId: string; exerciseName: string; reps: number; weight: string }[];
  personalBests: { exerciseId: string; name: string; weight: number; reps: number; day: string }[];
};

export function FitnessView() {
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const today = todayInTimezone(tz);
  const weekday = weekdayOf(today);

  const [tab, setTab] = useState<Tab>("plans");
  const plans = useResource<WorkoutPlan[]>("/api/workout-plans");
  const exercises = useResource<Exercise[]>("/api/exercises");
  const equipment = useResource<Equipment[]>("/api/equipment");
  const sessions = useResource<WorkoutSession[]>("/api/workouts");
  const history = useResource<History>("/api/workouts/history");

  const [running, setRunning] = useState<{ plan: WorkoutPlan | null; session: WorkoutSession } | null>(null);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [creatingExercise, setCreatingExercise] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todaysPlan = (plans.data ?? []).find((p) => !p.archived && p.weekdays.includes(weekday)) ?? null;
  const openSession = (sessions.data ?? []).find((s) => s.day === today && !s.finishedAt) ?? null;

  async function start(plan: WorkoutPlan | null) {
    setError(null);
    try {
      const session = await api.post<WorkoutSession>("/api/workouts", {
        planId: plan?.id ?? null,
        name: plan?.name ?? "Freies Training",
        day: today,
      });
      setRunning({ plan, session });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Training konnte nicht gestartet werden");
    }
  }

  function reloadAll() {
    void sessions.reload();
    void history.reload();
    void plans.reload();
  }

  if (plans.loading && !plans.data) {
    return (
      <div className="flex justify-center py-20" style={{ color: "var(--ink-3)" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[24px] font-semibold tracking-tight">Fitness</h1>
      </header>

      {error && <ErrorNote>{error}</ErrorNote>}

      {/* Today */}
      <Card className="flex flex-col gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
            Heute · {weekdayLabel(weekday, true)}
          </p>
          <p className="mt-0.5 text-[18px] font-semibold">{todaysPlan ? todaysPlan.name : "Ruhetag"}</p>
          {todaysPlan && (
            <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
              {todaysPlan.items?.length ?? 0} Übungen · ca. {formatDuration(todaysPlan.estimatedMinutes)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {openSession ? (
            <Button
              variant="primary"
              className="flex-1"
              onClick={() =>
                setRunning({
                  plan: (plans.data ?? []).find((p) => p.id === openSession.planId) ?? null,
                  session: openSession,
                })
              }
            >
              Training fortsetzen
            </Button>
          ) : (
            <Button variant="primary" className="flex-1" onClick={() => start(todaysPlan)}>
              {todaysPlan ? "Training starten" : "Freies Training starten"}
            </Button>
          )}
        </div>
      </Card>

      <div className="flex gap-1.5">
        {(["plans", "exercises", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="rounded-full px-3.5 py-1.5 text-[13px] font-medium"
            style={{
              background: tab === t ? "var(--accent)" : "var(--surface-2)",
              color: tab === t ? "var(--accent-ink)" : "var(--ink-2)",
            }}
          >
            {t === "plans" ? "Trainingspläne" : t === "exercises" ? "Übungen" : "Verlauf"}
          </button>
        ))}
      </div>

      {tab === "plans" && (
        <section className="flex flex-col gap-2">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCreatingPlan(true)}>
              Neuer Plan
            </Button>
          </div>
          {(plans.data ?? []).length === 0 ? (
            <Empty title="Noch keine Trainingspläne" hint="Lege einen Plan an und weise ihm Wochentage zu." />
          ) : (
            (plans.data ?? []).map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setEditingPlan(plan)}
                className="card flex items-center gap-3 px-3.5 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{plan.name}</span>
                  <span className="block truncate text-[12px]" style={{ color: "var(--ink-3)" }}>
                    {plan.weekdays.length > 0
                      ? plan.weekdays.map((d) => weekdayLabel(d)).join(", ")
                      : "Kein Wochentag"}{" "}
                    · {plan.items?.length ?? 0} Übungen
                  </span>
                </span>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    void start(plan);
                  }}
                >
                  Start
                </Button>
              </button>
            ))
          )}
        </section>
      )}

      {tab === "exercises" && (
        <section className="flex flex-col gap-2">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCreatingExercise(true)}>
              Neue Übung
            </Button>
          </div>
          <EquipmentEditor equipment={equipment.data ?? []} onChanged={() => void equipment.reload()} />
          {(exercises.data ?? []).map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setEditingExercise(ex)}
              className="card flex items-center gap-3 px-3.5 py-3 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">{ex.name}</span>
                <span className="block truncate text-[12px]" style={{ color: "var(--ink-3)" }}>
                  {ex.muscleGroup} · {ex.equipmentName} · {ex.defaultSets}×{ex.defaultReps}
                  {Number(ex.defaultWeight) > 0 && ` · ${ex.defaultWeight} kg`}
                </span>
              </span>
            </button>
          ))}
        </section>
      )}

      {tab === "history" && (
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
              Bestleistungen
            </h2>
            {(history.data?.personalBests ?? []).length === 0 ? (
              <Empty title="Noch keine Trainingsdaten" hint="Starte ein Training, um deinen Fortschritt zu sehen." />
            ) : (
              <Card className="flex flex-col gap-2">
                {(history.data?.personalBests ?? []).map((pb) => (
                  <div key={pb.exerciseId} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-[14px]">{pb.name}</span>
                    <span className="shrink-0 text-[13px] tabular-nums" style={{ color: "var(--ink-2)" }}>
                      {pb.weight > 0 ? `${pb.weight} kg × ${pb.reps}` : `${pb.reps} Wdh`}
                    </span>
                  </div>
                ))}
              </Card>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
              Einheiten
            </h2>
            <div className="flex flex-col gap-1.5">
              {(sessions.data ?? []).filter((s) => s.finishedAt).length === 0 ? (
                <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
                  Noch keine abgeschlossenen Trainings.
                </p>
              ) : (
                (sessions.data ?? [])
                  .filter((s) => s.finishedAt)
                  .map((s) => (
                    <div key={s.id} className="card flex items-center gap-3 px-3.5 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium">{s.name}</span>
                        <span className="block text-[12px]" style={{ color: "var(--ink-3)" }}>
                          {formatDateShort(s.day)} · {formatDuration(s.durationMinutes)} ·{" "}
                          {s.sets?.length ?? 0} Sätze
                        </span>
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </section>
      )}

      {running && (
        <WorkoutRunner
          plan={running.plan}
          session={running.session}
          onClose={() => setRunning(null)}
          onFinished={() => {
            setRunning(null);
            reloadAll();
          }}
        />
      )}

      <PlanSheet
        open={creatingPlan || editingPlan !== null}
        plan={editingPlan}
        exercises={exercises.data ?? []}
        onClose={() => {
          setCreatingPlan(false);
          setEditingPlan(null);
        }}
        onSaved={() => {
          setCreatingPlan(false);
          setEditingPlan(null);
          void plans.reload();
        }}
      />

      <ExerciseSheet
        open={creatingExercise || editingExercise !== null}
        exercise={editingExercise}
        equipment={equipment.data ?? []}
        onClose={() => {
          setCreatingExercise(false);
          setEditingExercise(null);
        }}
        onSaved={() => {
          setCreatingExercise(false);
          setEditingExercise(null);
          void exercises.reload();
          void plans.reload();
        }}
      />
    </div>
  );
}

function EquipmentEditor({ equipment, onChanged }: { equipment: Equipment[]; onChanged: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.post("/api/equipment", { name });
      setName("");
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item: Equipment) {
    await api.patch(`/api/equipment/${item.id}`, { available: !item.available });
    onChanged();
  }

  async function remove(item: Equipment) {
    await api.del(`/api/equipment/${item.id}`);
    onChanged();
  }

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
        Equipment
      </p>
      <div className="flex flex-wrap gap-1.5">
        {equipment.map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px]"
            style={{
              background: item.available ? "var(--accent-soft)" : "var(--surface-2)",
              color: item.available ? "var(--accent)" : "var(--ink-3)",
            }}
          >
            <button type="button" onClick={() => toggle(item)}>
              {item.name}
            </button>
            <button type="button" onClick={() => remove(item)} aria-label={`${item.name} entfernen`}>
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Equipment hinzufügen"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void add();
            }
          }}
        />
        <Button size="sm" busy={busy} onClick={add}>
          +
        </Button>
      </div>
    </Card>
  );
}

function PlanSheet({
  open,
  plan,
  exercises,
  onClose,
  onSaved,
}: {
  open: boolean;
  plan: WorkoutPlan | null;
  exercises: Exercise[];
  onClose: () => void;
  onSaved: () => void;
}) {
  type Item = { exerciseId: string; sets: number; reps: number; weight: string; restSeconds: number };
  const [name, setName] = useState("");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [minutes, setMinutes] = useState(60);
  const [items, setItems] = useState<Item[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = plan ? plan.id : "new";
  if (open && loadedKey !== key) {
    setLoadedKey(key);
    setName(plan?.name ?? "");
    setWeekdays(plan?.weekdays ?? []);
    setMinutes(plan?.estimatedMinutes ?? 60);
    setItems(
      (plan?.items ?? []).map((i) => ({
        exerciseId: i.exerciseId,
        sets: i.sets,
        reps: i.reps,
        weight: i.weight,
        restSeconds: i.restSeconds,
      })),
    );
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
      const payload = { name, weekdays, estimatedMinutes: minutes, exercises: items };
      if (plan) await api.patch(`/api/workout-plans/${plan.id}`, payload);
      else await api.post("/api/workout-plans", payload);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!plan) return;
    setBusy(true);
    try {
      await api.del(`/api/workout-plans/${plan.id}`);
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const available = exercises.filter((e) => !e.archived);

  return (
    <Sheet
      open
      onClose={onClose}
      title={plan ? "Trainingsplan" : "Neuer Trainingsplan"}
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
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Oberkörper A" />
        </Field>

        <Field label="Wochentage">
          <WeekdayPicker value={weekdays} onChange={setWeekdays} />
        </Field>

        <Field label="Geschätzte Dauer">
          <NumberInput value={minutes} onChange={setMinutes} suffix="Min" min={10} step={5} />
        </Field>

        <div>
          <p className="mb-1.5 text-[13px] font-medium" style={{ color: "var(--ink-2)" }}>
            Übungen
          </p>
          <div className="flex flex-col gap-2">
            {items.map((item, index) => {
              const ex = available.find((e) => e.id === item.exerciseId);
              return (
                <div key={index} className="rounded-xl px-3 py-2.5" style={{ background: "var(--surface-2)" }}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium">
                      {ex?.name ?? "Übung"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setItems(items.filter((_, i) => i !== index))}
                      aria-label="Übung entfernen"
                      style={{ color: "var(--ink-3)" }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <NumberInput
                      value={item.sets}
                      onChange={(v) => setItems(items.map((x, i) => (i === index ? { ...x, sets: v } : x)))}
                      suffix="Sätze"
                      min={1}
                    />
                    <NumberInput
                      value={item.reps}
                      onChange={(v) => setItems(items.map((x, i) => (i === index ? { ...x, reps: v } : x)))}
                      suffix="Wdh"
                      min={1}
                    />
                    <NumberInput
                      value={Number(item.weight)}
                      onChange={(v) =>
                        setItems(items.map((x, i) => (i === index ? { ...x, weight: String(v) } : x)))
                      }
                      suffix="kg"
                      min={0}
                      step={0.5}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Select
            className="mt-2"
            value=""
            onChange={(e) => {
              const ex = available.find((x) => x.id === e.target.value);
              if (!ex) return;
              setItems([
                ...items,
                {
                  exerciseId: ex.id,
                  sets: ex.defaultSets,
                  reps: ex.defaultReps,
                  weight: ex.defaultWeight,
                  restSeconds: ex.restSeconds,
                },
              ]);
            }}
          >
            <option value="">Übung hinzufügen …</option>
            {available.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.muscleGroup})
              </option>
            ))}
          </Select>
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}

        {plan && (
          <DangerButton label="Plan löschen" busy={busy} onConfirm={remove} />
        )}
      </div>
    </Sheet>
  );
}

function ExerciseSheet({
  open,
  exercise,
  equipment,
  onClose,
  onSaved,
}: {
  open: boolean;
  exercise: Exercise | null;
  equipment: Equipment[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const blank = {
    name: "",
    muscleGroup: "",
    equipmentName: "Körpergewicht",
    description: "",
    defaultSets: 3,
    defaultReps: 10,
    defaultWeight: "0",
    defaultDurationSeconds: 0,
    restSeconds: 90,
    difficulty: 2,
    notes: "",
  };
  const [draft, setDraft] = useState(blank);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = exercise ? exercise.id : "new";
  if (open && loadedKey !== key) {
    setLoadedKey(key);
    setDraft(
      exercise
        ? {
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            equipmentName: exercise.equipmentName,
            description: exercise.description,
            defaultSets: exercise.defaultSets,
            defaultReps: exercise.defaultReps,
            defaultWeight: exercise.defaultWeight,
            defaultDurationSeconds: exercise.defaultDurationSeconds,
            restSeconds: exercise.restSeconds,
            difficulty: exercise.difficulty,
            notes: exercise.notes,
          }
        : blank,
    );
    setError(null);
  }
  if (!open && loadedKey !== null) setLoadedKey(null);

  async function save() {
    if (!draft.name.trim()) {
      setError("Bitte einen Namen eingeben");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (exercise) await api.patch(`/api/exercises/${exercise.id}`, draft);
      else await api.post("/api/exercises", draft);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!exercise) return;
    setBusy(true);
    try {
      await api.del(`/api/exercises/${exercise.id}`);
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <Sheet
      open
      onClose={onClose}
      title={exercise ? "Übung bearbeiten" : "Neue Übung"}
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
        <Field label="Name">
          <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Muskelgruppe">
            <Input
              value={draft.muscleGroup}
              onChange={(e) => setDraft({ ...draft, muscleGroup: e.target.value })}
              placeholder="z. B. Brust"
            />
          </Field>
          <Field label="Equipment">
            <Select
              value={draft.equipmentName}
              onChange={(e) => setDraft({ ...draft, equipmentName: e.target.value })}
            >
              {equipment.length === 0 && <option value="Körpergewicht">Körpergewicht</option>}
              {equipment.map((eq) => (
                <option key={eq.id} value={eq.name}>
                  {eq.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Sätze">
            <NumberInput value={draft.defaultSets} onChange={(v) => setDraft({ ...draft, defaultSets: v })} min={1} />
          </Field>
          <Field label="Wdh.">
            <NumberInput value={draft.defaultReps} onChange={(v) => setDraft({ ...draft, defaultReps: v })} min={1} />
          </Field>
          <Field label="Gewicht">
            <NumberInput
              value={Number(draft.defaultWeight)}
              onChange={(v) => setDraft({ ...draft, defaultWeight: String(v) })}
              suffix="kg"
              min={0}
              step={0.5}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dauer" hint="Für Halteübungen wie Plank. 0 = nach Wiederholungen.">
            <NumberInput
              value={draft.defaultDurationSeconds}
              onChange={(v) => setDraft({ ...draft, defaultDurationSeconds: v })}
              suffix="Sek"
              min={0}
              step={5}
            />
          </Field>
          <Field label="Pause">
            <NumberInput
              value={draft.restSeconds}
              onChange={(v) => setDraft({ ...draft, restSeconds: v })}
              suffix="Sek"
              min={0}
              step={15}
            />
          </Field>
          <Field label="Schwierigkeit">
            <Select
              value={String(draft.difficulty)}
              onChange={(e) => setDraft({ ...draft, difficulty: Number(e.target.value) })}
            >
              <option value="1">Leicht</option>
              <option value="2">Mittel</option>
              <option value="3">Schwer</option>
            </Select>
          </Field>
        </div>
        <Field label="Beschreibung">
          <Textarea
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </Field>

        {error && <ErrorNote>{error}</ErrorNote>}

        {exercise && (
          <DangerButton label="Übung löschen" busy={busy} onConfirm={remove} />
        )}
      </div>
    </Sheet>
  );
}
