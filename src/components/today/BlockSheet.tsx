"use client";

import { useEffect, useState } from "react";
import {
  Button,
  DangerButton,
  ErrorNote,
  Field,
  Input,
  Select,
  Sheet,
  Textarea,
  TimeInput,
} from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";
import { CATEGORY_OPTIONS, PRIORITY_LABEL, STATUS_LABEL, categoryMeta } from "@/lib/categories";
import { addDays, formatDuration, formatTime } from "@/lib/time";
import { RoutineChecklist } from "@/components/today/RoutineChecklist";
import type { Block } from "@/lib/types";

export function BlockSheet({
  block,
  day,
  onClose,
  onChanged,
}: {
  block: Block | null;
  day: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [draft, setDraft] = useState<Block | null>(block);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    setDraft(block);
    setError(null);
    setInfo(null);
  }, [block]);

  if (!draft) return null;
  const meta = categoryMeta(draft.category);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Aktion fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  const save = () =>
    run(async () => {
      await api.patch(`/api/plan/blocks/${draft.id}`, {
        title: draft.title,
        category: draft.category,
        description: draft.description,
        notes: draft.notes,
        startMinute: draft.startMinute,
        endMinute: draft.endMinute,
        priority: draft.priority,
        isFixed: draft.isFixed,
      });
      onClose();
    });

  const setStatus = (status: Block["status"]) =>
    run(async () => {
      await api.patch(`/api/plan/blocks/${draft.id}`, { status });
      onClose();
    });

  const rescheduleNow = () =>
    run(async () => {
      const res = await api.post<{ rescheduled: boolean; message?: string }>(
        `/api/plan/blocks/${draft.id}/reschedule`,
      );
      if (!res.rescheduled) {
        setInfo(res.message ?? "Kein freier Zeitraum gefunden");
      } else {
        onClose();
      }
    });

  const moveToTomorrow = () =>
    run(async () => {
      await api.post(`/api/plan/blocks/${draft.id}/move-to-day`, { day: addDays(day, 1) });
      onClose();
    });

  const saveAsDefault = () =>
    run(async () => {
      await api.post("/api/plan/save-as-default", { day, blockId: draft.id });
      setInfo("Die Zeit wurde in deine Standardroutine übernommen.");
    });

  const remove = () =>
    run(async () => {
      await api.del(`/api/plan/blocks/${draft.id}`);
      onClose();
    });

  return (
    <Sheet
      open
      onClose={onClose}
      title={draft.title || "Block"}
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
        <div
          className="flex items-center gap-3 rounded-xl px-3 py-3"
          style={{ background: `color-mix(in srgb, ${meta.color} 12%, transparent)` }}
        >
          <span className="text-xl">{draft.icon || meta.icon}</span>
          <div className="min-w-0">
            <p className="text-[14px] font-medium">
              {formatTime(draft.startMinute)} – {formatTime(draft.endMinute)}
            </p>
            <p className="text-[12px]" style={{ color: "var(--ink-2)" }}>
              {formatDuration(draft.endMinute - draft.startMinute)} · {STATUS_LABEL[draft.status]}
              {draft.isFixed ? " · Fix" : " · Flexibel"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" busy={busy} onClick={() => setStatus("done")}>
            ✓ Erledigt
          </Button>
          <Button size="sm" busy={busy} onClick={() => setStatus("skipped")}>
            Überspringen
          </Button>
          <Button size="sm" busy={busy} onClick={rescheduleNow}>
            Jetzt einplanen
          </Button>
          <Button size="sm" busy={busy} onClick={moveToTomorrow}>
            Morgen planen
          </Button>
        </div>

        {draft.routineId && (
          <RoutineChecklist routineId={draft.routineId} day={day} startMinute={draft.startMinute} />
        )}

        <Field label="Titel">
          <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start">
            <TimeInput
              value={draft.startMinute}
              onChange={(v) => setDraft({ ...draft, startMinute: v })}
            />
          </Field>
          <Field label="Ende">
            <TimeInput value={draft.endMinute} onChange={(v) => setDraft({ ...draft, endMinute: v })} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Kategorie">
            <Select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            >
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

        <Field label="Art">
          <Select
            value={draft.isFixed ? "fixed" : "flexible"}
            onChange={(e) => setDraft({ ...draft, isFixed: e.target.value === "fixed" })}
          >
            <option value="flexible">Flexibel — darf automatisch verschoben werden</option>
            <option value="fixed">Fix — bleibt an dieser Uhrzeit</option>
          </Select>
        </Field>

        <Field label="Notizen">
          <Textarea
            rows={3}
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            placeholder="Notizen zu diesem Block"
          />
        </Field>

        {info && (
          <p
            className="rounded-xl px-3 py-2.5 text-[13px]"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            {info}
          </p>
        )}
        {error && <ErrorNote>{error}</ErrorNote>}

        <div className="flex flex-col gap-2 border-t pt-4" style={{ borderColor: "var(--line)" }}>
          {draft.activityId && (
            <Button size="sm" busy={busy} onClick={saveAsDefault}>
              Als Standard übernehmen
            </Button>
          )}
<DangerButton label="Block löschen" busy={busy} onConfirm={remove} />
        </div>
      </div>
    </Sheet>
  );
}
