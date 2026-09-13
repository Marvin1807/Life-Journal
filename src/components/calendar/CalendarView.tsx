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
  Select,
  Sheet,
  Spinner,
  Textarea,
  TimeInput,
  Toggle,
} from "@/components/ui";
import { useResource } from "@/hooks/useResource";
import { api, ApiClientError } from "@/lib/client";
import { CATEGORY_OPTIONS, RECURRENCE_LABEL, categoryMeta } from "@/lib/categories";
import {
  MONTH_LONG,
  addDays,
  endOfMonth,
  formatDateLong,
  formatDuration,
  formatTime,
  rangeDays,
  recurrenceMatches,
  startOfMonth,
  startOfWeek,
  todayInTimezone,
  weekdayLabel,
  weekdayOf,
} from "@/lib/time";
import type { CalendarEvent, Settings } from "@/lib/types";

type View = "day" | "week" | "month";

type WeekPayload = {
  from: string;
  to: string;
  days: { day: string; blocks: { id: string; title: string; category: string; startMinute: number; endMinute: number; status: string }[] }[];
  byCategory: Record<string, number>;
  settings: Settings;
};

export function CalendarView() {
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const today = todayInTimezone(tz);
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState(today);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [creating, setCreating] = useState<string | null>(null);

  const events = useResource<CalendarEvent[]>("/api/events");
  const weekStart = startOfWeek(anchor, 1);
  const week = useResource<WeekPayload>(`/api/plan/week?from=${weekStart}`);

  const allEvents = useMemo(() => events.data ?? [], [events.data]);

  /** Expands recurring events into concrete days. */
  const eventsOn = useMemo(() => {
    return (day: string) =>
      allEvents
        .filter((ev) =>
          ev.recurrence === "none"
            ? ev.day === day
            : (!ev.recurrenceUntil || day <= ev.recurrenceUntil) &&
              recurrenceMatches(ev.recurrence, ev.day, day),
        )
        .sort((a, b) => a.startMinute - b.startMinute);
  }, [allEvents]);

  function shift(delta: number) {
    if (view === "day") setAnchor((a) => addDays(a, delta));
    else if (view === "week") setAnchor((a) => addDays(a, delta * 7));
    else setAnchor((a) => (delta > 0 ? addDays(endOfMonth(a), 1) : addDays(startOfMonth(a), -1)));
  }

  const title =
    view === "month"
      ? `${MONTH_LONG[Number(anchor.slice(5, 7)) - 1]} ${anchor.slice(0, 4)}`
      : view === "week"
        ? `KW ab ${weekStart.slice(8)}.${weekStart.slice(5, 7)}.`
        : formatDateLong(anchor);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[24px] font-semibold tracking-tight">Kalender</h1>
        <Button size="sm" variant="primary" onClick={() => setCreating(anchor)}>
          Neuer Termin
        </Button>
      </header>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {(["day", "week", "month"] as View[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className="rounded-full px-3.5 py-1.5 text-[13px] font-medium"
              style={{
                background: view === v ? "var(--accent)" : "var(--surface-2)",
                color: view === v ? "var(--accent-ink)" : "var(--ink-2)",
              }}
            >
              {v === "day" ? "Tag" : v === "week" ? "Woche" : "Monat"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Zurück"
            onClick={() => shift(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setAnchor(today)}
            className="rounded-full px-3 py-1.5 text-[12px] font-medium"
            style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}
          >
            Heute
          </button>
          <button
            type="button"
            aria-label="Weiter"
            onClick={() => shift(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}
          >
            ›
          </button>
        </div>
      </div>

      <p className="text-[14px] font-medium" style={{ color: "var(--ink-2)" }}>
        {title}
      </p>

      {events.error && <ErrorNote>{events.error}</ErrorNote>}
      {events.loading && !events.data && (
        <div className="flex justify-center py-16" style={{ color: "var(--ink-3)" }}>
          <Spinner />
        </div>
      )}

      {view === "day" && (
        <DayView day={anchor} events={eventsOn(anchor)} onOpen={setEditing} onAdd={() => setCreating(anchor)} />
      )}

      {view === "week" && (
        <WeekView
          weekStart={weekStart}
          today={today}
          eventsOn={eventsOn}
          blocks={week.data?.days ?? []}
          onPickDay={(d) => {
            setAnchor(d);
            setView("day");
          }}
        />
      )}

      {view === "month" && (
        <MonthView
          anchor={anchor}
          today={today}
          eventsOn={eventsOn}
          onPickDay={(d) => {
            setAnchor(d);
            setView("day");
          }}
        />
      )}

      {week.data && view === "week" && (
        <section>
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
            Wochenstatistik
          </h2>
          <Card className="flex flex-col gap-2">
            {Object.entries(week.data.byCategory).length === 0 ? (
              <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
                Für diese Woche ist noch nichts geplant.
              </p>
            ) : (
              Object.entries(week.data.byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, minutes]) => {
                  const meta = categoryMeta(cat);
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: meta.color }} />
                      <span className="min-w-0 flex-1 truncate text-[14px]">{meta.label}</span>
                      <span className="shrink-0 text-[13px] tabular-nums" style={{ color: "var(--ink-2)" }}>
                        {formatDuration(minutes)}
                      </span>
                    </div>
                  );
                })
            )}
          </Card>
        </section>
      )}

      <EventSheet
        open={creating !== null || editing !== null}
        event={editing}
        defaultDay={creating ?? anchor}
        onClose={() => {
          setCreating(null);
          setEditing(null);
        }}
        onSaved={() => {
          setCreating(null);
          setEditing(null);
          void events.reload();
          void week.reload();
        }}
      />
    </div>
  );
}

function DayView({
  day,
  events,
  onOpen,
  onAdd,
}: {
  day: string;
  events: CalendarEvent[];
  onOpen: (ev: CalendarEvent) => void;
  onAdd: () => void;
}) {
  if (events.length === 0) {
    return (
      <Empty
        title="Keine Termine an diesem Tag"
        hint="Termine sind fixe Zeiten, die der Tagesplaner nicht verschiebt."
        action={
          <Button size="sm" onClick={onAdd}>
            Termin anlegen
          </Button>
        }
      />
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      {events.map((ev) => {
        const meta = categoryMeta(ev.category);
        return (
          <button
            key={`${ev.id}-${day}`}
            type="button"
            onClick={() => onOpen(ev)}
            className="card flex items-center gap-3 px-3.5 py-3 text-left"
          >
            <span className="h-9 w-[3px] shrink-0 rounded-full" style={{ background: meta.color }} />
            <span className="w-[44px] shrink-0 text-[12px] tabular-nums" style={{ color: "var(--ink-2)" }}>
              {ev.allDay ? "Ganztags" : formatTime(ev.startMinute)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] font-medium">{ev.title}</span>
              <span className="block truncate text-[12px]" style={{ color: "var(--ink-3)" }}>
                {!ev.allDay && `${formatTime(ev.startMinute)}–${formatTime(ev.endMinute)}`}
                {ev.location && ` · ${ev.location}`}
                {ev.recurrence !== "none" && ` · ${RECURRENCE_LABEL[ev.recurrence]}`}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function WeekView({
  weekStart,
  today,
  eventsOn,
  blocks,
  onPickDay,
}: {
  weekStart: string;
  today: string;
  eventsOn: (day: string) => CalendarEvent[];
  blocks: { day: string; blocks: { id: string; title: string; category: string; startMinute: number; endMinute: number }[] }[];
  onPickDay: (day: string) => void;
}) {
  const days = rangeDays(weekStart, addDays(weekStart, 6));
  return (
    <div className="flex flex-col gap-1.5">
      {days.map((day) => {
        const dayEvents = eventsOn(day);
        const dayBlocks = blocks.find((b) => b.day === day)?.blocks ?? [];
        const isToday = day === today;
        return (
          <button
            key={day}
            type="button"
            onClick={() => onPickDay(day)}
            className="card flex gap-3 px-3.5 py-3 text-left"
            style={isToday ? { borderColor: "var(--accent)" } : undefined}
          >
            <span className="w-[42px] shrink-0">
              <span
                className="block text-[11px] font-semibold uppercase"
                style={{ color: isToday ? "var(--accent)" : "var(--ink-3)" }}
              >
                {weekdayLabel(weekdayOf(day))}
              </span>
              <span className="block text-[19px] font-semibold tabular-nums">{Number(day.slice(8))}</span>
            </span>
            <span className="min-w-0 flex-1 pt-0.5">
              {dayEvents.length === 0 && dayBlocks.length === 0 ? (
                <span className="text-[13px]" style={{ color: "var(--ink-3)" }}>
                  Nichts geplant
                </span>
              ) : (
                <>
                  <span className="mb-1 flex flex-wrap gap-1">
                    {dayBlocks
                      .filter((b) => b.category !== "sleep")
                      .slice(0, 10)
                      .map((b) => (
                        <span
                          key={b.id}
                          className="h-1.5 w-6 rounded-full"
                          style={{ background: categoryMeta(b.category).color }}
                          title={b.title}
                        />
                      ))}
                  </span>
                  <span className="block truncate text-[13px]" style={{ color: "var(--ink-2)" }}>
                    {dayEvents.length > 0
                      ? dayEvents.map((e) => `${formatTime(e.startMinute)} ${e.title}`).join(" · ")
                      : `${dayBlocks.filter((b) => b.category !== "sleep").length} Blöcke geplant`}
                  </span>
                </>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MonthView({
  anchor,
  today,
  eventsOn,
  onPickDay,
}: {
  anchor: string;
  today: string;
  eventsOn: (day: string) => CalendarEvent[];
  onPickDay: (day: string) => void;
}) {
  const first = startOfMonth(anchor);
  const last = endOfMonth(anchor);
  const gridStart = startOfWeek(first, 1);
  const gridEnd = addDays(startOfWeek(last, 1), 6);
  const days = rangeDays(gridStart, gridEnd);

  return (
    <div>
      <div className="mb-1.5 grid grid-cols-7 gap-1">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((l) => (
          <div key={l} className="text-center text-[11px] font-medium" style={{ color: "var(--ink-3)" }}>
            {l}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = day.slice(0, 7) === anchor.slice(0, 7);
          const isToday = day === today;
          const dayEvents = eventsOn(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => onPickDay(day)}
              className="flex aspect-square flex-col items-center justify-start rounded-xl px-1 pt-1.5"
              style={{
                background: isToday ? "var(--accent-soft)" : "var(--surface)",
                border: `1px solid ${isToday ? "var(--accent)" : "var(--line)"}`,
                opacity: inMonth ? 1 : 0.4,
              }}
            >
              <span
                className="text-[13px] font-medium tabular-nums"
                style={{ color: isToday ? "var(--accent)" : "var(--ink)" }}
              >
                {Number(day.slice(8))}
              </span>
              <span className="mt-1 flex flex-wrap justify-center gap-0.5">
                {dayEvents.slice(0, 3).map((ev, i) => (
                  <span
                    key={`${ev.id}-${i}`}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: categoryMeta(ev.category).color }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type EventDraft = {
  title: string;
  description: string;
  location: string;
  category: string;
  day: string;
  startMinute: number;
  endMinute: number;
  allDay: boolean;
  recurrence: string;
  recurrenceUntil: string | null;
  isFixed: boolean;
};

function EventSheet({
  open,
  event,
  defaultDay,
  onClose,
  onSaved,
}: {
  open: boolean;
  event: CalendarEvent | null;
  defaultDay: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const makeDraft = (): EventDraft =>
    event
      ? {
          title: event.title,
          description: event.description,
          location: event.location,
          category: event.category,
          day: event.day,
          startMinute: event.startMinute,
          endMinute: event.endMinute,
          allDay: event.allDay,
          recurrence: event.recurrence,
          recurrenceUntil: event.recurrenceUntil,
          isFixed: event.isFixed,
        }
      : {
          title: "",
          description: "",
          location: "",
          category: "other",
          day: defaultDay,
          startMinute: 9 * 60,
          endMinute: 10 * 60,
          allDay: false,
          recurrence: "none",
          recurrenceUntil: null,
          isFixed: true,
        };

  const [draft, setDraft] = useState<EventDraft>(makeDraft);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = event ? event.id : `new-${defaultDay}`;
  if (open && loadedKey !== key) {
    setLoadedKey(key);
    setDraft(makeDraft());
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
      if (event) await api.patch(`/api/events/${event.id}`, draft);
      else await api.post("/api/events", draft);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!event) return;
    setBusy(true);
    try {
      await api.del(`/api/events/${event.id}`);
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
      title={event ? "Termin bearbeiten" : "Neuer Termin"}
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
            autoFocus={!event}
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </Field>

        <Field label="Datum">
          <Input type="date" value={draft.day} onChange={(e) => setDraft({ ...draft, day: e.target.value })} />
        </Field>

        <div className="rounded-xl px-3" style={{ background: "var(--surface-2)" }}>
          <Toggle checked={draft.allDay} onChange={(v) => setDraft({ ...draft, allDay: v })} label="Ganztägig" />
        </div>

        {!draft.allDay && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">
              <TimeInput value={draft.startMinute} onChange={(v) => setDraft({ ...draft, startMinute: v })} />
            </Field>
            <Field label="Ende">
              <TimeInput value={draft.endMinute} onChange={(v) => setDraft({ ...draft, endMinute: v })} />
            </Field>
          </div>
        )}

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

        {draft.recurrence !== "none" && (
          <Field label="Wiederholen bis" hint="Leer lassen für unbegrenzt">
            <Input
              type="date"
              value={draft.recurrenceUntil ?? ""}
              onChange={(e) => setDraft({ ...draft, recurrenceUntil: e.target.value || null })}
            />
          </Field>
        )}

        <Field label="Ort">
          <Input value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
        </Field>

        <Field label="Notiz">
          <Textarea
            rows={2}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </Field>

        <div className="rounded-xl px-3" style={{ background: "var(--surface-2)" }}>
          <Toggle
            checked={draft.isFixed}
            onChange={(v) => setDraft({ ...draft, isFixed: v })}
            label="Fixer Termin"
            hint="Fixe Termine werden vom Tagesplaner nie verschoben."
          />
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}

        {event && (
          <DangerButton label="Termin löschen" busy={busy} onConfirm={remove} />
        )}
      </div>
    </Sheet>
  );
}
