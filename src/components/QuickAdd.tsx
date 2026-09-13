"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ErrorNote, Field, Input, NumberInput, Select, Sheet, TimeInput } from "@/components/ui";
import { api, ApiClientError } from "@/lib/client";
import { CATEGORY_OPTIONS } from "@/lib/categories";
import { todayInTimezone } from "@/lib/time";

type Kind = "task" | "event" | "block" | "note";

const KIND_LABEL: Record<Kind, string> = {
  task: "Aufgabe",
  event: "Termin",
  block: "Zeitblock",
  note: "Notiz",
};

/** Quick capture (spec §41): as few steps as possible. */
export function QuickAdd({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const today = todayInTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const [kind, setKind] = useState<Kind>("task");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("tasks");
  const [day, setDay] = useState(today);
  const [start, setStart] = useState(9 * 60);
  const [minutes, setMinutes] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setMinutes(30);
    setError(null);
  }

  async function save() {
    if (!title.trim()) {
      setError("Bitte einen Titel eingeben");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (kind === "task") {
        await api.post("/api/tasks", { title, category, estimateMinutes: minutes });
      } else if (kind === "note") {
        await api.post("/api/tasks", {
          title,
          category: "other",
          notes: title,
          estimateMinutes: 10,
        });
      } else if (kind === "event") {
        await api.post("/api/events", {
          title,
          category,
          day,
          startMinute: start,
          endMinute: Math.min(1440, start + minutes),
        });
      } else {
        await api.post("/api/plan/blocks", {
          day,
          title,
          category,
          startMinute: start,
          endMinute: Math.min(1440, start + minutes),
        });
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
            Speichern
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
              className="rounded-xl py-2.5 text-[13px] font-medium"
              style={{
                background: kind === k ? "var(--accent)" : "var(--surface-2)",
                color: kind === k ? "var(--accent-ink)" : "var(--ink-2)",
              }}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>

        <Field label={kind === "note" ? "Notiz" : "Titel"}>
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              kind === "task"
                ? "Was muss erledigt werden?"
                : kind === "event"
                  ? "Worum geht es?"
                  : kind === "block"
                    ? "Was planst du?"
                    : "Woran willst du denken?"
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") void save();
            }}
          />
        </Field>

        {kind !== "note" && (
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

        {(kind === "event" || kind === "block") && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Datum">
              <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
            </Field>
            <Field label="Startzeit">
              <TimeInput value={start} onChange={setStart} />
            </Field>
          </div>
        )}

        {kind !== "note" && (
          <Field label={kind === "task" ? "Geschätzte Dauer" : "Dauer"}>
            <NumberInput value={minutes} onChange={setMinutes} suffix="Min" min={5} step={5} />
          </Field>
        )}

        {error && <ErrorNote>{error}</ErrorNote>}
      </div>
    </Sheet>
  );
}
