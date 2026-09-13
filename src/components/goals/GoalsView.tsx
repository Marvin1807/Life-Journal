"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  Button,
  DangerButton,
  Card,
  Empty,
  ErrorNote,
  Field,
  Input,
  NumberInput,
  ProgressBar,
  Select,
  Sheet,
  Spinner,
  Textarea,
  Toggle,
} from "@/components/ui";
import { useResource } from "@/hooks/useResource";
import { api, ApiClientError } from "@/lib/client";
import { CATEGORY_OPTIONS, PRIORITY_LABEL, categoryMeta } from "@/lib/categories";
import { formatDateShort, formatDuration } from "@/lib/time";
import type { Goal } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  active: "Aktiv",
  paused: "Pausiert",
  done: "Erreicht",
  archived: "Archiviert",
};

export function GoalsView() {
  const goals = useResource<Goal[]>("/api/goals");
  const [editing, setEditing] = useState<Goal | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (goals.loading && !goals.data) {
    return (
      <div className="flex justify-center py-20" style={{ color: "var(--ink-3)" }}>
        <Spinner />
      </div>
    );
  }

  const active = (goals.data ?? []).filter((g) => g.status === "active");
  const others = (goals.data ?? []).filter((g) => g.status !== "active");

  async function toggleMilestone(goalId: string, milestoneId: string, done: boolean) {
    setError(null);
    try {
      await api.patch(`/api/milestones/${milestoneId}`, { done });
      void goals.reload();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Aktion fehlgeschlagen");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[24px] font-semibold tracking-tight">Ziele</h1>
        <Button size="sm" variant="primary" onClick={() => setCreating(true)}>
          Neues Ziel
        </Button>
      </header>

      {error && <ErrorNote>{error}</ErrorNote>}

      {(goals.data ?? []).length === 0 ? (
        <Empty
          title="Noch keine Ziele"
          hint="Ein Ziel beschreibt, woran du längerfristig arbeiten willst — mit einer Wochenzeit, die der Tagesplaner berücksichtigt."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {active.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onOpen={setEditing} onToggleMilestone={toggleMilestone} />
          ))}
          {others.length > 0 && (
            <>
              <h2 className="mt-2 text-[13px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
                Nicht aktiv
              </h2>
              {others.map((goal) => (
                <GoalCard key={goal.id} goal={goal} onOpen={setEditing} onToggleMilestone={toggleMilestone} />
              ))}
            </>
          )}
        </div>
      )}

      <GoalSheet
        open={creating || editing !== null}
        goal={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          void goals.reload();
        }}
      />
    </div>
  );
}

function GoalCard({
  goal,
  onOpen,
  onToggleMilestone,
}: {
  goal: Goal;
  onOpen: (goal: Goal) => void;
  onToggleMilestone: (goalId: string, milestoneId: string, done: boolean) => void;
}) {
  const meta = categoryMeta(goal.category);
  return (
    <Card className="flex flex-col gap-3">
      <button type="button" onClick={() => onOpen(goal)} className="text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[16px] font-semibold">{goal.title}</p>
            <p className="mt-0.5 text-[12px]" style={{ color: "var(--ink-3)" }}>
              <span style={{ color: meta.color }}>{meta.label}</span> ·{" "}
              {formatDuration(goal.weeklyMinutes)} pro Woche
              {goal.deadline && ` · bis ${formatDateShort(goal.deadline)}`}
              {goal.status !== "active" && ` · ${STATUS_LABEL[goal.status]}`}
            </p>
          </div>
          <span className="shrink-0 text-[15px] font-semibold tabular-nums">{goal.progress}%</span>
        </div>
        {goal.description && (
          <p className="mt-2 text-[13px]" style={{ color: "var(--ink-2)" }}>
            {goal.description}
          </p>
        )}
      </button>

      <ProgressBar value={goal.progress} color={meta.color} />

      {goal.milestones.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {goal.milestones.map((m) => (
            <div key={m.id} className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onToggleMilestone(goal.id, m.id, !m.done)}
                aria-label={m.done ? "Meilenstein zurücknehmen" : "Meilenstein erreicht"}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px]"
                style={{
                  borderColor: m.done ? meta.color : "var(--line)",
                  background: m.done ? meta.color : "transparent",
                  color: m.done ? "#fff" : "transparent",
                }}
              >
                ✓
              </button>
              <span
                className={clsx("min-w-0 flex-1 truncate text-[14px]", m.done && "line-through")}
                style={{ color: m.done ? "var(--ink-3)" : "var(--ink)" }}
              >
                {m.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function GoalSheet({
  open,
  goal,
  onClose,
  onSaved,
}: {
  open: boolean;
  goal: Goal | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const blank = {
    title: "",
    description: "",
    category: "development",
    priority: 3,
    status: "active" as Goal["status"],
    deadline: null as string | null,
    progress: 0,
    weeklyMinutes: 300,
    autoPlan: true,
  };
  const [draft, setDraft] = useState(blank);
  const [milestones, setMilestones] = useState<{ id: string; title: string; done: boolean }[]>([]);
  const [newMilestone, setNewMilestone] = useState("");
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = goal ? goal.id : "new";
  if (open && loadedKey !== key) {
    setLoadedKey(key);
    setDraft(
      goal
        ? {
            title: goal.title,
            description: goal.description,
            category: goal.category,
            priority: goal.priority,
            status: goal.status,
            deadline: goal.deadline,
            progress: goal.progress,
            weeklyMinutes: goal.weeklyMinutes,
            autoPlan: goal.autoPlan,
          }
        : blank,
    );
    setMilestones((goal?.milestones ?? []).map((m) => ({ id: m.id, title: m.title, done: m.done })));
    setError(null);
  }
  if (!open && loadedKey !== null) setLoadedKey(null);

  async function save() {
    if (!draft.title.trim()) {
      setError("Bitte einen Titel eingeben");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (goal) await api.patch(`/api/goals/${goal.id}`, draft);
      else await api.post("/api/goals", draft);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function addMilestone() {
    if (!goal || !newMilestone.trim()) return;
    try {
      const row = await api.post<{ id: string; title: string; done: boolean }>("/api/milestones", {
        goalId: goal.id,
        title: newMilestone,
        sortOrder: milestones.length,
      });
      setMilestones((m) => [...m, { id: row.id, title: row.title, done: row.done }]);
      setNewMilestone("");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    }
  }

  async function removeMilestone(id: string) {
    setMilestones((m) => m.filter((x) => x.id !== id));
    await api.del(`/api/milestones/${id}`).catch(() => undefined);
  }

  async function remove() {
    if (!goal) return;
    setBusy(true);
    try {
      await api.del(`/api/goals/${goal.id}`);
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
      title={goal ? "Ziel bearbeiten" : "Neues Ziel"}
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
        <Field label="Titel">
          <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </Field>

        <Field label="Beschreibung">
          <Textarea
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Kategorie">
            <Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priorität">
            <Select
              value={String(draft.priority)}
              onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })}
            >
              {[1, 2, 3, 4].map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Deadline">
            <Input
              type="date"
              value={draft.deadline ?? ""}
              onChange={(e) => setDraft({ ...draft, deadline: e.target.value || null })}
            />
          </Field>
          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as Goal["status"] })}
            >
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Geplante Zeit pro Woche">
          <NumberInput
            value={draft.weeklyMinutes}
            onChange={(v) => setDraft({ ...draft, weeklyMinutes: v })}
            suffix="Min"
            min={0}
            step={15}
          />
        </Field>

        <Field label="Fortschritt">
          <NumberInput
            value={draft.progress}
            onChange={(v) => setDraft({ ...draft, progress: Math.max(0, Math.min(100, v)) })}
            suffix="%"
            min={0}
            max={100}
            step={5}
          />
        </Field>

        <div className="rounded-xl px-3" style={{ background: "var(--surface-2)" }}>
          <Toggle
            checked={draft.autoPlan}
            onChange={(v) => setDraft({ ...draft, autoPlan: v })}
            label="Automatisch einplanen"
            hint="Der Tagesplaner verteilt die Wochenzeit auf deine Weiterentwicklungs-Blöcke."
          />
        </div>

        {goal && (
          <div>
            <p className="mb-1.5 text-[13px] font-medium" style={{ color: "var(--ink-2)" }}>
              Meilensteine
            </p>
            <div className="flex flex-col gap-1.5">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5">
                  <span className="min-w-0 flex-1 truncate text-[14px]">{m.title}</span>
                  <button
                    type="button"
                    onClick={() => removeMilestone(m.id)}
                    aria-label="Meilenstein löschen"
                    style={{ color: "var(--ink-3)" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  placeholder="Meilenstein hinzufügen"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void addMilestone();
                    }
                  }}
                />
                <Button size="sm" onClick={addMilestone}>
                  +
                </Button>
              </div>
            </div>
          </div>
        )}

        {error && <ErrorNote>{error}</ErrorNote>}

        {goal && (
          <DangerButton label="Ziel löschen" busy={busy} onConfirm={remove} />
        )}
      </div>
    </Sheet>
  );
}
