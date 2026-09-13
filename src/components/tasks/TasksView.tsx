"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  Button,
  DangerButton,
  Empty,
  ErrorNote,
  Field,
  Input,
  NumberInput,
  Select,
  Sheet,
  Spinner,
  Textarea,
  Toggle,
} from "@/components/ui";
import { useResource } from "@/hooks/useResource";
import { api, ApiClientError } from "@/lib/client";
import {
  CATEGORY_OPTIONS,
  PRIORITY_LABEL,
  RECURRENCE_LABEL,
  TASK_STATUS_LABEL,
  categoryMeta,
} from "@/lib/categories";
import { formatDateShort, formatDuration, todayInTimezone } from "@/lib/time";
import type { Task } from "@/lib/types";

type Filter = "open" | "done" | "all";

type TaskDraft = {
  title: string;
  description: string;
  category: string;
  priority: number;
  status: Task["status"];
  dueDate: string | null;
  estimateMinutes: number;
  recurrence: string;
  autoSchedule: boolean;
  notes: string;
};

const EMPTY_TASK: TaskDraft = {
  title: "",
  description: "",
  category: "tasks",
  priority: 3,
  status: "open",
  dueDate: null,
  estimateMinutes: 30,
  recurrence: "none",
  autoSchedule: false,
  notes: "",
};

export function TasksView() {
  const { data, loading, error, reload } = useResource<Task[]>("/api/tasks");
  const [filter, setFilter] = useState<Filter>("open");
  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const today = todayInTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const tasks = useMemo(() => data ?? [], [data]);

  const visible = useMemo(() => {
    if (filter === "open") return tasks.filter((t) => t.status === "open" || t.status === "in_progress");
    if (filter === "done") return tasks.filter((t) => t.status === "done");
    return tasks;
  }, [tasks, filter]);

  const overdue = visible.filter((t) => t.dueDate && t.dueDate < today);
  const dueToday = visible.filter((t) => t.dueDate === today);
  const rest = visible.filter((t) => !t.dueDate || t.dueDate > today);

  async function toggleStatus(task: Task) {
    setActionError(null);
    try {
      await api.patch(`/api/tasks/${task.id}`, { status: task.status === "done" ? "open" : "done" });
      void reload();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Aktion fehlgeschlagen");
    }
  }

  if (loading && !data) {
    return (
      <div className="flex justify-center py-20" style={{ color: "var(--ink-3)" }}>
        <Spinner />
      </div>
    );
  }
  if (error) return <ErrorNote>{error}</ErrorNote>;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[24px] font-semibold tracking-tight">Aufgaben</h1>
        <Button size="sm" variant="primary" onClick={() => setCreating(true)}>
          Neue Aufgabe
        </Button>
      </header>

      <div className="flex gap-1.5">
        {(["open", "done", "all"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className="rounded-full px-3.5 py-1.5 text-[13px] font-medium"
            style={{
              background: filter === f ? "var(--accent)" : "var(--surface-2)",
              color: filter === f ? "var(--accent-ink)" : "var(--ink-2)",
            }}
          >
            {f === "open" ? "Offen" : f === "done" ? "Erledigt" : "Alle"}
          </button>
        ))}
      </div>

      {actionError && <ErrorNote>{actionError}</ErrorNote>}

      {visible.length === 0 ? (
        <Empty
          title="Keine Aufgaben"
          hint="Alles abgearbeitet. Neue Aufgaben legst du oben oder über den Plus-Button an."
        />
      ) : (
        <div className="flex flex-col gap-5">
          <TaskGroup title="Überfällig" tasks={overdue} onToggle={toggleStatus} onOpen={setEditing} tone="danger" />
          <TaskGroup title="Heute fällig" tasks={dueToday} onToggle={toggleStatus} onOpen={setEditing} />
          <TaskGroup title={overdue.length + dueToday.length > 0 ? "Weitere" : "Alle"} tasks={rest} onToggle={toggleStatus} onOpen={setEditing} />
        </div>
      )}

      <TaskSheet
        open={creating}
        task={null}
        onClose={() => setCreating(false)}
        onSaved={() => {
          setCreating(false);
          void reload();
        }}
      />
      <TaskSheet
        open={editing !== null}
        task={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          void reload();
        }}
      />
    </div>
  );
}

function TaskGroup({
  title,
  tasks,
  onToggle,
  onOpen,
  tone,
}: {
  title: string;
  tasks: Task[];
  onToggle: (task: Task) => void;
  onOpen: (task: Task) => void;
  tone?: "danger";
}) {
  if (tasks.length === 0) return null;
  return (
    <section>
      <h2
        className="mb-2 text-[13px] font-semibold uppercase tracking-wider"
        style={{ color: tone === "danger" ? "var(--danger)" : "var(--ink-3)" }}
      >
        {title}
      </h2>
      <div className="flex flex-col gap-1.5">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onToggle={onToggle} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

function TaskRow({
  task,
  onToggle,
  onOpen,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onOpen: (task: Task) => void;
}) {
  const meta = categoryMeta(task.category);
  const done = task.status === "done";
  const doneSubtasks = task.subtasks.filter((s) => s.done).length;

  return (
    <div className="card flex items-center gap-3 px-3 py-3">
      <button
        type="button"
        aria-label={done ? "Als offen markieren" : "Als erledigt markieren"}
        onClick={() => onToggle(task)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[13px]"
        style={{
          borderColor: done ? "var(--accent)" : "var(--line)",
          background: done ? "var(--accent)" : "transparent",
          color: done ? "var(--accent-ink)" : "transparent",
        }}
      >
        ✓
      </button>
      <button type="button" onClick={() => onOpen(task)} className="min-w-0 flex-1 text-left">
        <p
          className={clsx("truncate text-[15px]", done && "line-through")}
          style={{ color: done ? "var(--ink-3)" : "var(--ink)" }}
        >
          {task.title}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 truncate text-[12px]" style={{ color: "var(--ink-3)" }}>
          <span style={{ color: meta.color }}>{meta.label}</span>
          <span>{formatDuration(task.estimateMinutes)}</span>
          {task.dueDate && <span>bis {formatDateShort(task.dueDate)}</span>}
          {task.subtasks.length > 0 && (
            <span>
              {doneSubtasks}/{task.subtasks.length} Schritte
            </span>
          )}
          {task.autoSchedule && <span>automatisch einplanen</span>}
          {task.priority <= 2 && <span>{PRIORITY_LABEL[task.priority]}</span>}
        </p>
      </button>
    </div>
  );
}

function TaskSheet({
  open,
  task,
  onClose,
  onSaved,
}: {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<TaskDraft>(() => ({ ...EMPTY_TASK }));
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; done: boolean }[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  // Sync the form when a different task is opened.
  if (open && task && loadedId !== task.id) {
    setLoadedId(task.id);
    setDraft({
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      estimateMinutes: task.estimateMinutes,
      recurrence: task.recurrence,
      autoSchedule: task.autoSchedule,
      notes: task.notes,
    });
    setSubtasks(task.subtasks.map((s) => ({ id: s.id, title: s.title, done: s.done })));
  }
  if (open && !task && loadedId !== "new") {
    setLoadedId("new");
    setDraft({ ...EMPTY_TASK });
    setSubtasks([]);
  }
  if (!open && loadedId !== null) setLoadedId(null);

  async function save() {
    if (!draft.title.trim()) {
      setError("Bitte einen Titel eingeben");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (task) {
        await api.patch(`/api/tasks/${task.id}`, draft);
      } else {
        await api.post("/api/tasks", draft);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function addSubtask() {
    if (!task || !newSubtask.trim()) return;
    try {
      const row = await api.post<{ id: string; title: string; done: boolean }>("/api/subtasks", {
        taskId: task.id,
        title: newSubtask,
        sortOrder: subtasks.length,
      });
      setSubtasks((s) => [...s, { id: row.id, title: row.title, done: row.done }]);
      setNewSubtask("");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    }
  }

  async function toggleSubtask(id: string, done: boolean) {
    setSubtasks((s) => s.map((x) => (x.id === id ? { ...x, done } : x)));
    try {
      await api.patch(`/api/subtasks/${id}`, { done });
    } catch {
      setSubtasks((s) => s.map((x) => (x.id === id ? { ...x, done: !done } : x)));
    }
  }

  async function removeSubtask(id: string) {
    setSubtasks((s) => s.filter((x) => x.id !== id));
    await api.del(`/api/subtasks/${id}`).catch(() => undefined);
  }

  async function remove() {
    if (!task) return;
    setBusy(true);
    try {
      await api.del(`/api/tasks/${task.id}`);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Löschen fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <Sheet
      open
      onClose={onClose}
      title={task ? "Aufgabe bearbeiten" : "Neue Aufgabe"}
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
          <Input
            autoFocus={!task}
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Was muss erledigt werden?"
          />
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
              value={draft.dueDate ?? ""}
              onChange={(e) => setDraft({ ...draft, dueDate: e.target.value || null })}
            />
          </Field>
          <Field label="Geschätzte Dauer">
            <NumberInput
              value={draft.estimateMinutes}
              onChange={(v) => setDraft({ ...draft, estimateMinutes: v })}
              suffix="Min"
              min={5}
              step={5}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value as typeof draft.status })}
            >
              {Object.entries(TASK_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Wiederholung">
            <Select
              value={draft.recurrence}
              onChange={(e) => setDraft({ ...draft, recurrence: e.target.value })}
            >
              {Object.entries(RECURRENCE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="rounded-xl px-3" style={{ background: "var(--surface-2)" }}>
          <Toggle
            checked={draft.autoSchedule}
            onChange={(v) => setDraft({ ...draft, autoSchedule: v })}
            label="Automatisch einplanen"
            hint="Der Tagesplaner sucht einen freien Zeitraum für diese Aufgabe."
          />
        </div>

        {task && (
          <div>
            <p className="mb-1.5 text-[13px] font-medium" style={{ color: "var(--ink-2)" }}>
              Unteraufgaben
            </p>
            <div className="flex flex-col gap-1.5">
              {subtasks.map((s) => (
                <div key={s.id} className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => toggleSubtask(s.id, !s.done)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px]"
                    style={{
                      borderColor: s.done ? "var(--accent)" : "var(--line)",
                      background: s.done ? "var(--accent)" : "transparent",
                      color: s.done ? "var(--accent-ink)" : "transparent",
                    }}
                  >
                    ✓
                  </button>
                  <span
                    className={clsx("min-w-0 flex-1 truncate text-[14px]", s.done && "line-through")}
                    style={{ color: s.done ? "var(--ink-3)" : "var(--ink)" }}
                  >
                    {s.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSubtask(s.id)}
                    aria-label="Unteraufgabe löschen"
                    style={{ color: "var(--ink-3)" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Schritt hinzufügen"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void addSubtask();
                    }
                  }}
                />
                <Button size="sm" onClick={addSubtask}>
                  +
                </Button>
              </div>
            </div>
          </div>
        )}

        <Field label="Notizen">
          <Textarea rows={2} value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
        </Field>

        {error && <ErrorNote>{error}</ErrorNote>}

        {task && (
          <DangerButton label="Aufgabe löschen" busy={busy} onConfirm={remove} />
        )}
      </div>
    </Sheet>
  );
}
