"use client";

import { useMemo, useState } from "react";
import { Button, Card, ErrorNote, Field, Input, NumberInput, Select, Sheet, Spinner } from "@/components/ui";
import { useResource } from "@/hooks/useResource";
import { api, ApiClientError } from "@/lib/client";
import { categoryMeta } from "@/lib/categories";
import { formatDateShort, formatDuration, todayInTimezone } from "@/lib/time";

type Range = "week" | "month" | "year";

type Stats = {
  range: string;
  from: string;
  to: string;
  byCategory: Record<string, { planned: number; done: number }>;
  byDay: Record<string, { planned: number; done: number }>;
  totals: { plannedMinutes: number; doneMinutes: number; plannedBlocks: number; doneBlocks: number };
  tasks: { byStatus: Record<string, number>; completedInRange: number };
  workouts: { count: number; minutes: number };
  screenTime: { app: string; minutes: number }[];
  sleep: { averageMinutes: number; nights: number };
  routines: { done: number; tracked: number };
  meals: { planned: number; eaten: number };
};

type SettingsPayload = { settings: { socialMediaLimit: number; timezone: string } };

const RANGE_LABEL: Record<Range, string> = { week: "Woche", month: "Monat", year: "Jahr" };

export function StatsView() {
  const [range, setRange] = useState<Range>("week");
  const stats = useResource<Stats>(`/api/stats?range=${range}`);
  const settings = useResource<SettingsPayload>("/api/settings");
  const [logging, setLogging] = useState(false);

  if (stats.loading && !stats.data) {
    return (
      <div className="flex justify-center py-20" style={{ color: "var(--ink-3)" }}>
        <Spinner />
      </div>
    );
  }
  if (stats.error) return <ErrorNote>{stats.error}</ErrorNote>;
  const data = stats.data;
  if (!data) return null;

  const categories = Object.entries(data.byCategory).sort((a, b) => b[1].planned - a[1].planned);
  const maxPlanned = Math.max(1, ...categories.map(([, v]) => v.planned));
  const screenTotal = data.screenTime.reduce((sum, s) => sum + s.minutes, 0);
  const dailyLimit = settings.data?.settings.socialMediaLimit ?? 45;
  const days = Object.keys(data.byDay).length || 1;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[24px] font-semibold tracking-tight">Statistiken</h1>
        <Button size="sm" onClick={() => setLogging(true)}>
          Zeit erfassen
        </Button>
      </header>

      <div className="flex gap-1.5">
        {(["week", "month", "year"] as Range[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className="rounded-full px-3.5 py-1.5 text-[13px] font-medium"
            style={{
              background: range === r ? "var(--accent)" : "var(--surface-2)",
              color: range === r ? "var(--accent-ink)" : "var(--ink-2)",
            }}
          >
            {RANGE_LABEL[r]}
          </button>
        ))}
      </div>

      <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
        {formatDateShort(data.from)} – {formatDateShort(data.to)}
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="Geplante Zeit" value={formatDuration(data.totals.plannedMinutes)} />
        <Stat label="Davon erledigt" value={formatDuration(data.totals.doneMinutes)} />
        <Stat
          label="Blöcke erledigt"
          value={`${data.totals.doneBlocks} / ${data.totals.plannedBlocks}`}
        />
        <Stat label="Aufgaben erledigt" value={String(data.tasks.completedInRange)} />
        <Stat label="Trainings" value={`${data.workouts.count} · ${formatDuration(data.workouts.minutes)}`} />
        <Stat
          label="Schlaf ⌀"
          value={data.sleep.nights > 0 ? formatDuration(data.sleep.averageMinutes) : "Keine Daten"}
        />
      </div>

      <section>
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
          Zeit nach Bereich
        </h2>
        <Card className="flex flex-col gap-3">
          {categories.length === 0 ? (
            <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
              Für diesen Zeitraum gibt es noch keine geplanten Blöcke.
            </p>
          ) : (
            categories.map(([cat, value]) => {
              const meta = categoryMeta(cat);
              return (
                <div key={cat}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="truncate text-[14px]">{meta.label}</span>
                    <span className="shrink-0 text-[13px] tabular-nums" style={{ color: "var(--ink-2)" }}>
                      {formatDuration(value.planned)}
                      {value.done > 0 && (
                        <span style={{ color: "var(--ink-3)" }}> · {formatDuration(value.done)} erledigt</span>
                      )}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(value.planned / maxPlanned) * 100}%`,
                        background: `color-mix(in srgb, ${meta.color} 45%, transparent)`,
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${value.planned > 0 ? (value.done / value.planned) * 100 : 0}%`,
                          background: meta.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
          Bildschirmzeit
        </h2>
        <Card className="flex flex-col gap-2.5">
          {data.screenTime.length === 0 ? (
            <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
              Noch keine Bildschirmzeit erfasst. Du kannst sie oben manuell eintragen — eine automatische
              Erfassung ist im Browser nicht möglich.
            </p>
          ) : (
            <>
              <p className="text-[14px]">
                {formatDuration(Math.round(screenTotal / days))} pro Tag ·{" "}
                <span style={{ color: screenTotal / days > dailyLimit ? "var(--danger)" : "var(--ink-3)" }}>
                  Limit {formatDuration(dailyLimit)}
                </span>
              </p>
              {data.screenTime
                .sort((a, b) => b.minutes - a.minutes)
                .map((s) => (
                  <div key={s.app} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-[14px]">{s.app}</span>
                    <span className="shrink-0 text-[13px] tabular-nums" style={{ color: "var(--ink-2)" }}>
                      {formatDuration(s.minutes)}
                    </span>
                  </div>
                ))}
            </>
          )}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
          Weiteres
        </h2>
        <Card className="flex flex-col gap-2">
          <Row label="Routinen abgeschlossen" value={`${data.routines.done} / ${data.routines.tracked}`} />
          <Row label="Mahlzeiten gegessen" value={`${data.meals.eaten} / ${data.meals.planned} geplant`} />
          <Row label="Offene Aufgaben" value={String(data.tasks.byStatus.open ?? 0)} />
          <Row label="Verschobene Aufgaben" value={String(data.tasks.byStatus.postponed ?? 0)} />
        </Card>
        <p className="mt-2 text-[12px]" style={{ color: "var(--ink-3)" }}>
          Diese Zahlen sollen dir helfen, deinen Alltag zu verstehen — nicht dich unter Druck setzen.
        </p>
      </section>

      <TrackingSheet
        open={logging}
        onClose={() => setLogging(false)}
        onSaved={() => {
          setLogging(false);
          void stats.reload();
        }}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
        {label}
      </p>
      <p className="mt-1 truncate text-[16px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="min-w-0 flex-1 truncate text-[14px]">{label}</span>
      <span className="shrink-0 text-[13px] tabular-nums" style={{ color: "var(--ink-2)" }}>
        {value}
      </span>
    </div>
  );
}

const APPS = ["Instagram", "TikTok", "YouTube", "Reddit", "Netflix", "Gaming", "Sonstiges"];

function TrackingSheet({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const [day, setDay] = useState(() => todayInTimezone(tz));
  const [app, setApp] = useState("Instagram");
  const [minutes, setMinutes] = useState(30);
  const [sleepMinutes, setSleepMinutes] = useState(480);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveScreen() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/screen-time", { day, app, minutes });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function saveSleep() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/sleep", { day, minutes: sleepMinutes, quality: 0 });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <Sheet open onClose={onClose} title="Zeit erfassen">
      <div className="flex flex-col gap-4">
        <Field label="Tag">
          <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        </Field>

        <div className="card flex flex-col gap-3 p-3.5">
          <p className="text-[14px] font-medium">Bildschirmzeit</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="App">
              <Select value={app} onChange={(e) => setApp(e.target.value)}>
                {APPS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Dauer">
              <NumberInput value={minutes} onChange={setMinutes} suffix="Min" min={0} step={5} />
            </Field>
          </div>
          <Button size="sm" busy={busy} onClick={saveScreen}>
            Bildschirmzeit speichern
          </Button>
        </div>

        <div className="card flex flex-col gap-3 p-3.5">
          <p className="text-[14px] font-medium">Schlaf</p>
          <Field label="Schlafdauer">
            <NumberInput value={sleepMinutes} onChange={setSleepMinutes} suffix="Min" min={0} step={15} />
          </Field>
          <Button size="sm" busy={busy} onClick={saveSleep}>
            Schlaf speichern
          </Button>
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}
      </div>
    </Sheet>
  );
}
