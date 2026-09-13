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
  Select,
  Sheet,
  Textarea,
  TimeInput,
  Toggle,
  WeekdayPicker,
} from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";
import { CATEGORY_OPTIONS, MEAL_SLOT_LABEL, PRIORITY_LABEL, categoryMeta } from "@/lib/categories";
import { formatDuration, formatTime, weekdayLabel } from "@/lib/time";
import type { Activity } from "@/lib/types";

/** Editor for the standard routine: activities and their scheduling rules. */
export function ActivitiesEditor({
  activities,
  onChanged,
}: {
  activities: Activity[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<Activity | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px]" style={{ color: "var(--ink-2)" }}>
          Deine Standardroutine. Sie ändert sich nicht, wenn du einen einzelnen Tag verschiebst.
        </p>
        <Button size="sm" onClick={() => setCreating(true)}>
          Neu
        </Button>
      </div>

      {activities.length === 0 ? (
        <Empty title="Keine Aktivitäten" hint="Lege fest, was zu einem typischen Tag gehört." />
      ) : (
        activities.map((activity) => {
          const meta = categoryMeta(activity.category);
          const rule = activity.rules[0];
          return (
            <button
              key={activity.id}
              type="button"
              onClick={() => setEditing(activity)}
              className="card flex items-center gap-3 px-3.5 py-3 text-left"
              style={{ opacity: activity.archived ? 0.5 : 1 }}
            >
              <span className="h-9 w-[3px] shrink-0 rounded-full" style={{ background: meta.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">
                  {activity.icon} {activity.name}
                </span>
                <span className="block truncate text-[12px]" style={{ color: "var(--ink-3)" }}>
                  {rule ? `${formatTime(rule.preferredStart)} · ` : ""}
                  {formatDuration(rule?.durationMinutes ?? activity.defaultMinutes)} ·{" "}
                  {activity.isFixed ? "Fix" : "Flexibel"}
                  {rule && rule.weekdays.length < 7 && ` · ${rule.weekdays.map((d) => weekdayLabel(d)).join(", ")}`}
                  {!activity.autoPlan && " · nicht automatisch"}
                </span>
              </span>
            </button>
          );
        })
      )}

      <ActivitySheet
        open={creating || editing !== null}
        activity={editing}
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

function ActivitySheet({
  open,
  activity,
  onClose,
  onSaved,
}: {
  open: boolean;
  activity: Activity | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const blank = {
    name: "",
    category: "other",
    icon: "",
    description: "",
    mealSlot: null as string | null,
    defaultMinutes: 30,
    isFixed: false,
    isOptional: false,
    priority: 3,
    autoPlan: true,
    archived: false,
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    preferredStart: 9 * 60,
    earliestStart: 0,
    latestStart: 22 * 60,
  };
  const [draft, setDraft] = useState(blank);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = activity ? activity.id : "new";
  if (open && loadedKey !== key) {
    setLoadedKey(key);
    const rule = activity?.rules[0];
    setDraft(
      activity
        ? {
            name: activity.name,
            category: activity.category,
            icon: activity.icon,
            description: activity.description,
            mealSlot: activity.mealSlot,
            defaultMinutes: rule?.durationMinutes ?? activity.defaultMinutes,
            isFixed: activity.isFixed,
            isOptional: activity.isOptional,
            priority: activity.priority,
            autoPlan: activity.autoPlan,
            archived: activity.archived,
            weekdays: rule?.weekdays ?? [1, 2, 3, 4, 5, 6, 7],
            preferredStart: rule?.preferredStart ?? 9 * 60,
            earliestStart: rule?.earliestStart ?? 0,
            latestStart: rule?.latestStart ?? 22 * 60,
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
      const payload = {
        name: draft.name,
        category: draft.category,
        icon: draft.icon,
        description: draft.description,
        mealSlot: draft.category === "meal" ? draft.mealSlot : null,
        defaultMinutes: draft.defaultMinutes,
        isFixed: draft.isFixed,
        isOptional: draft.isOptional,
        priority: draft.priority,
        autoPlan: draft.autoPlan,
        archived: draft.archived,
        rule: {
          weekdays: draft.weekdays,
          recurrence: "weekly",
          preferredStart: draft.preferredStart,
          earliestStart: draft.isFixed ? draft.preferredStart : draft.earliestStart,
          latestStart: draft.isFixed ? draft.preferredStart : draft.latestStart,
          durationMinutes: draft.defaultMinutes,
          enabled: true,
        },
      };
      if (activity) await api.patch(`/api/activities/${activity.id}`, payload);
      else await api.post("/api/activities", payload);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!activity) return;
    setBusy(true);
    try {
      await api.del(`/api/activities/${activity.id}`);
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
      title={activity ? "Aktivität bearbeiten" : "Neue Aktivität"}
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
              value={draft.icon}
              onChange={(e) => setDraft({ ...draft, icon: e.target.value.slice(0, 2) })}
              placeholder="🏋️"
              className="text-center"
            />
          </Field>
          <Field label="Name">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
        </div>

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
          <Field label="Standarddauer">
            <NumberInput
              value={draft.defaultMinutes}
              onChange={(v) => setDraft({ ...draft, defaultMinutes: v })}
              suffix="Min"
              min={5}
              step={5}
            />
          </Field>
        </div>

        {draft.category === "meal" && (
          <Field label="Mahlzeit im Essensplan" hint="Verknüpft den Block mit deinem Wochen-Ernährungsplan.">
            <Select
              value={draft.mealSlot ?? ""}
              onChange={(e) => setDraft({ ...draft, mealSlot: e.target.value || null })}
            >
              <option value="">Keine Zuordnung</option>
              {Object.entries(MEAL_SLOT_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Wochentage">
          <WeekdayPicker value={draft.weekdays} onChange={(v) => setDraft({ ...draft, weekdays: v })} />
        </Field>

        <Field label="Bevorzugte Uhrzeit">
          <TimeInput
            value={draft.preferredStart}
            onChange={(v) => setDraft({ ...draft, preferredStart: v })}
          />
        </Field>

        <div className="rounded-xl px-3" style={{ background: "var(--surface-2)" }}>
          <Toggle
            checked={draft.isFixed}
            onChange={(v) => setDraft({ ...draft, isFixed: v })}
            label="Fixe Aktivität"
            hint="Fixe Aktivitäten werden nie automatisch verschoben."
          />
        </div>

        {!draft.isFixed && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Frühester Start">
              <TimeInput
                value={draft.earliestStart}
                onChange={(v) => setDraft({ ...draft, earliestStart: v })}
              />
            </Field>
            <Field label="Spätester Start">
              <TimeInput value={draft.latestStart} onChange={(v) => setDraft({ ...draft, latestStart: v })} />
            </Field>
          </div>
        )}

        <Field label="Priorität" hint="Bestimmt, was zuerst eingeplant wird.">
          <Select
            value={String(draft.priority)}
            onChange={(e) => setDraft({ ...draft, priority: Number(e.target.value) })}
          >
            {[1, 2, 3, 4].map((p) => (
              <option key={p} value={p}>
                {p} — {PRIORITY_LABEL[p]}
              </option>
            ))}
          </Select>
        </Field>

        <div className="rounded-xl px-3" style={{ background: "var(--surface-2)" }}>
          <Toggle
            checked={draft.autoPlan}
            onChange={(v) => setDraft({ ...draft, autoPlan: v })}
            label="Automatisch einplanen"
          />
          <Toggle
            checked={draft.isOptional}
            onChange={(v) => setDraft({ ...draft, isOptional: v })}
            label="Optional"
            hint="Darf entfallen, wenn der Tag sonst zu voll wird."
          />
          <Toggle
            checked={draft.archived}
            onChange={(v) => setDraft({ ...draft, archived: v })}
            label="Archiviert"
          />
        </div>

        <Field label="Beschreibung">
          <Textarea
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </Field>

        {error && <ErrorNote>{error}</ErrorNote>}

        {activity && (
          <DangerButton label="Aktivität löschen" busy={busy} onConfirm={remove} />
        )}
      </div>
    </Sheet>
  );
}
