"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Button,
  ErrorNote,
  Field,
  Input,
  NumberInput,
  Select,
  Sheet,
  TimeInput,
} from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";
import { CATEGORY_OPTIONS, MEAL_SLOT_LABEL } from "@/lib/categories";
import { todayInTimezone } from "@/lib/time";
import type { Meal, WorkoutPlan } from "@/lib/types";

type Kind = "task" | "event" | "block" | "activity" | "meal" | "workout" | "note";

const KIND_LABEL: Record<Kind, string> = {
  task: "Aufgabe",
  event: "Termin",
  block: "Zeitblock",
  activity: "Aktivität",
  meal: "Mahlzeit",
  workout: "Training",
  note: "Notiz",
};

/** Quick capture (spec §41): as few steps as possible for the common cases. */
export function QuickAdd({
  open,
  onClose,
  timezone,
}: {
  open: boolean;
  onClose: () => void;
  timezone: string;
}) {
  const router = useRouter();
  // Always the user's own day, not the browser's — they can differ around
  // midnight or when travelling.
  const today = todayInTimezone(timezone);

  const [kind, setKind] = useState<Kind>("task");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("tasks");
  const [day, setDay] = useState(today);

  // Keep the default date current when the sheet is reopened on a new day.
  useEffect(() => {
    if (open) setDay(todayInTimezone(timezone));
  }, [open, timezone]);
  const [start, setStart] = useState(9 * 60);
  const [minutes, setMinutes] = useState(30);
  const [slot, setSlot] = useState("dinner");
  const [mealId, setMealId] = useState("");
  const [planId, setPlanId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [meals, setMeals] = useState<Meal[]>([]);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);

  // Only load the extra lists when a type that needs them is selected.
  useEffect(() => {
    if (!open) return;
    if (kind === "meal" && meals.length === 0) {
      api.get<Meal[]>("/api/meals").then(setMeals).catch(() => undefined);
    }
    if (kind === "workout" && plans.length === 0) {
      api.get<WorkoutPlan[]>("/api/workout-plans").then(setPlans).catch(() => undefined);
    }
  }, [open, kind, meals.length, plans.length]);

  function reset() {
    setTitle("");
    setMinutes(30);
    setError(null);
  }

  const needsTitle = kind !== "meal" && kind !== "workout";

  async function save() {
    if (needsTitle && !title.trim()) {
      setError("Bitte einen Titel eingeben");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      switch (kind) {
        case "task":
          await api.post("/api/tasks", { title, category, estimateMinutes: minutes });
          break;

        case "note":
          await api.post("/api/tasks", { title, category: "other", notes: title, estimateMinutes: 10 });
          break;

        case "event":
          await api.post("/api/events", {
            title,
            category,
            day,
            startMinute: start,
            endMinute: Math.min(1440, start + minutes),
          });
          break;

        case "block":
          await api.post("/api/plan/blocks", {
            day,
            title,
            category,
            startMinute: start,
            endMinute: Math.min(1440, start + minutes),
          });
          break;

        case "activity":
          await api.post("/api/activities", {
            name: title,
            category,
            defaultMinutes: minutes,
            rule: {
              weekdays: [1, 2, 3, 4, 5, 6, 7],
              recurrence: "weekly",
              preferredStart: start,
              earliestStart: Math.max(0, start - 120),
              latestStart: Math.min(1439, start + 120),
              durationMinutes: minutes,
              enabled: true,
            },
          });
          break;

        case "meal": {
          if (!mealId) {
            setError("Bitte eine Mahlzeit auswählen");
            setBusy(false);
            return;
          }
          await api.put("/api/meal-plans", { day, slot, mealId });
          break;
        }

        case "workout": {
          const plan = plans.find((p) => p.id === planId) ?? null;
          await api.post("/api/workouts", {
            planId: plan?.id ?? null,
            name: plan?.name ?? "Freies Training",
            day,
          });
          break;
        }
      }

      reset();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  const placeholder: Record<Kind, string> = {
    task: "Was muss erledigt werden?",
    event: "Worum geht es?",
    block: "Was planst du?",
    activity: "Name der Aktivität",
    meal: "",
    workout: "",
    note: "Woran willst du denken?",
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Schnell erfassen"
      footer={
        <>
          <Button className="flex-1" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" className="flex-1" busy={busy} onClick={save}>
            {kind === "workout" ? "Training starten" : "Speichern"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-1.5">
          {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k);
                setError(null);
              }}
              className="truncate rounded-xl px-1.5 py-2.5 text-[12px] font-medium"
              style={{
                background: kind === k ? "var(--accent)" : "var(--surface-2)",
                color: kind === k ? "var(--accent-ink)" : "var(--ink-2)",
              }}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>

        {needsTitle && (
          <Field label={kind === "note" ? "Notiz" : "Titel"}>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={placeholder[kind]}
              onKeyDown={(e) => {
                if (e.key === "Enter") void save();
              }}
            />
          </Field>
        )}

        {kind === "meal" && (
          <>
            <Field label="Mahlzeit">
              <Select value={mealId} onChange={(e) => setMealId(e.target.value)}>
                <option value="">Bitte auswählen …</option>
                {meals
                  .filter((m) => !m.archived)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Zeitpunkt">
              <Select value={slot} onChange={(e) => setSlot(e.target.value)}>
                {Object.entries(MEAL_SLOT_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )}

        {kind === "workout" && (
          <Field label="Trainingsplan" hint="Ohne Auswahl wird ein freies Training gestartet.">
            <Select value={planId} onChange={(e) => setPlanId(e.target.value)}>
              <option value="">Freies Training</option>
              {plans
                .filter((p) => !p.archived)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </Select>
          </Field>
        )}

        {(kind === "task" || kind === "event" || kind === "block" || kind === "activity") && (
          <Field label="Kategorie">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {(kind === "event" || kind === "block" || kind === "meal" || kind === "workout") && (
          <Field label="Datum">
            <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
          </Field>
        )}

        {(kind === "event" || kind === "block" || kind === "activity") && (
          <Field label={kind === "activity" ? "Bevorzugte Uhrzeit" : "Startzeit"}>
            <TimeInput value={start} onChange={setStart} />
          </Field>
        )}

        {(kind === "task" || kind === "event" || kind === "block" || kind === "activity") && (
          <Field label={kind === "task" ? "Geschätzte Dauer" : "Dauer"}>
            <NumberInput value={minutes} onChange={setMinutes} suffix="Min" min={5} step={5} />
          </Field>
        )}

        {error && <ErrorNote>{error}</ErrorNote>}
      </div>
    </Sheet>
  );
}
