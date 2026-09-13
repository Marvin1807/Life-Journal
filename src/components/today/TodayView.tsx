"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, ErrorNote, ProgressBar, SectionTitle, Sheet, Spinner } from "@/components/ui";
import { Timeline } from "@/components/today/Timeline";
import { BlockSheet } from "@/components/today/BlockSheet";
import { useResource } from "@/hooks/useResource";
import { useNow } from "@/hooks/useNow";
import { api, ApiClientError } from "@/lib/client";
import { categoryMeta } from "@/lib/categories";
import {
  addDays,
  formatDateLong,
  formatDuration,
  formatTime,
  minutesNowInTimezone,
  todayInTimezone,
} from "@/lib/time";
import type { Block, DayPayload, GenerateResponse } from "@/lib/types";

type MoveRequest = { blockId: string; startMinute: number; conflicts: { id: string; title: string }[] };

export function TodayView() {
  const now = useNow(30_000);
  const [offset, setOffset] = useState(0);

  const browserTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  // The user's configured timezone decides which day "heute" is. Until the
  // settings have loaded we fall back to the browser's timezone and correct
  // ourselves once the real value arrives.
  const [loadedTimezone, setLoadedTimezone] = useState<string | null>(null);
  const activeTz = loadedTimezone ?? browserTz;
  const baseDay = todayInTimezone(activeTz, now);
  const day = addDays(baseDay, offset);

  const { data, error, loading, reload } = useResource<DayPayload>(`/api/plan?day=${day}`);

  useEffect(() => {
    if (data?.settings.timezone && data.settings.timezone !== loadedTimezone) {
      setLoadedTimezone(data.settings.timezone);
    }
  }, [data?.settings.timezone, loadedTimezone]);
  const [selected, setSelected] = useState<Block | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<GenerateResponse | null>(null);
  const [moveRequest, setMoveRequest] = useState<MoveRequest | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const settings = data?.settings;
  const nowMinute = minutesNowInTimezone(activeTz, now);
  const isToday = offset === 0;

  const isWorkDay = settings ? settings.workDays.includes(data!.weekday) : true;
  const dayStart = settings ? (isWorkDay ? settings.wakeTime : settings.wakeTimeFreeDay) : 7 * 60;
  const dayEnd = settings ? (isWorkDay ? settings.sleepTime : settings.sleepTimeFreeDay) : 23 * 60;

  const blocks = useMemo(
    () => [...(data?.blocks ?? [])].sort((a, b) => a.startMinute - b.startMinute),
    [data],
  );

  const activeBlock = blocks.find(
    (b) => isToday && nowMinute >= b.startMinute && nowMinute < b.endMinute && b.status !== "done",
  );
  const upcoming = blocks.filter((b) => b.startMinute >= (isToday ? nowMinute : dayStart));
  const nextBlock = upcoming.find((b) => b.id !== activeBlock?.id) ?? null;
  const afterNext = upcoming.filter((b) => b.id !== activeBlock?.id && b.id !== nextBlock?.id)[0] ?? null;

  const doneCount = blocks.filter((b) => b.status === "done").length;
  const relevant = blocks.filter((b) => b.category !== "sleep");
  const plannedMinutes = relevant.reduce((sum, b) => sum + (b.endMinute - b.startMinute), 0);
  const freeMinutes = Math.max(0, dayEnd - dayStart - plannedMinutes);
  const dayProgress = isToday
    ? Math.max(0, Math.min(100, ((nowMinute - dayStart) / Math.max(1, dayEnd - dayStart)) * 100))
    : offset > 0
      ? 0
      : 100;

  const missed = isToday
    ? blocks.filter((b) => b.endMinute <= nowMinute && b.status === "planned" && b.category !== "sleep")
    : [];

  const refresh = useCallback(() => {
    void reload();
  }, [reload]);

  async function generate() {
    setGenerating(true);
    setActionError(null);
    try {
      const result = await api.post<GenerateResponse>("/api/plan/generate", { day, keepCompleted: true });
      setGenResult(result);
      refresh();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Planung fehlgeschlagen");
    } finally {
      setGenerating(false);
    }
  }

  async function quickStatus(block: Block, status: Block["status"]) {
    setActionError(null);
    try {
      await api.patch(`/api/plan/blocks/${block.id}`, { status });
      refresh();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Aktion fehlgeschlagen");
    }
  }

  async function handleDrop(blockId: string, startMinute: number) {
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.startMinute === startMinute) return;

    setActionError(null);
    try {
      const res = await api.post<{ conflicts: { id: string; title: string }[] }>(
        `/api/plan/blocks/${blockId}/move`,
        { startMinute, mode: "single" },
      );
      refresh();
      if (res.conflicts.length > 0) {
        setMoveRequest({ blockId, startMinute, conflicts: res.conflicts });
      }
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Verschieben fehlgeschlagen");
    }
  }

  async function resolveCascade() {
    if (!moveRequest) return;
    try {
      await api.post(`/api/plan/blocks/${moveRequest.blockId}/move`, {
        startMinute: moveRequest.startMinute,
        mode: "cascade",
      });
      refresh();
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Anpassen fehlgeschlagen");
    } finally {
      setMoveRequest(null);
    }
  }

  async function adoptDay() {
    setActionError(null);
    try {
      const res = await api.post<{ updated: number }>("/api/plan/save-as-default", { day });
      setActionError(null);
      alertUpdated(res.updated);
    } catch (err) {
      setActionError(err instanceof ApiClientError ? err.message : "Übernehmen fehlgeschlagen");
    }
  }

  const [adopted, setAdopted] = useState<number | null>(null);
  function alertUpdated(count: number) {
    setAdopted(count);
    setTimeout(() => setAdopted(null), 4000);
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
      {/* Header */}
      <header>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-medium" style={{ color: "var(--accent)" }}>
              {isToday ? "Heute" : offset === 1 ? "Morgen" : offset === -1 ? "Gestern" : ""}
            </p>
            <h1 className="text-[21px] font-semibold leading-tight tracking-tight sm:text-[24px]">
              {formatDateLong(day)}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Vorheriger Tag"
              onClick={() => setOffset((o) => o - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}
            >
              ‹
            </button>
            {offset !== 0 && (
              <button
                type="button"
                onClick={() => setOffset(0)}
                className="rounded-full px-3 py-1.5 text-[12px] font-medium"
                style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}
              >
                Heute
              </button>
            )}
            <button
              type="button"
              aria-label="Nächster Tag"
              onClick={() => setOffset((o) => o + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}
            >
              ›
            </button>
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 flex items-baseline justify-between text-[12px]" style={{ color: "var(--ink-3)" }}>
            <span>
              {isToday ? `${formatTime(nowMinute)} Uhr` : `${formatTime(dayStart)}–${formatTime(dayEnd)}`}
            </span>
            <span>
              {doneCount}/{relevant.length} erledigt · {formatDuration(freeMinutes)} frei
            </span>
          </div>
          <ProgressBar value={dayProgress} />
        </div>
      </header>

      {actionError && <ErrorNote>{actionError}</ErrorNote>}
      {adopted !== null && (
        <p
          className="rounded-xl px-3 py-2.5 text-[13px]"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          {adopted} {adopted === 1 ? "Aktivität wurde" : "Aktivitäten wurden"} in die Standardroutine
          übernommen.
        </p>
      )}

      {/* Now / next */}
      <section>
        <SectionTitle>Jetzt</SectionTitle>
        <div className="flex flex-col gap-2">
          {activeBlock ? (
            <FocusCard block={activeBlock} tone="now" onClick={() => setSelected(activeBlock)} />
          ) : (
            <Card className="px-4 py-4">
              <p className="text-[15px] font-medium">
                {isToday ? "Gerade ist nichts geplant." : "Noch nichts für diesen Tag geplant."}
              </p>
              <p className="mt-0.5 text-[13px]" style={{ color: "var(--ink-3)" }}>
                {isToday
                  ? "Freie Zeit gehört genauso zum Tag wie alles andere."
                  : "Erstelle den Tagesplan, wenn du so weit bist."}
              </p>
            </Card>
          )}
          {nextBlock && <FocusCard block={nextBlock} tone="next" onClick={() => setSelected(nextBlock)} />}
          {afterNext && <FocusCard block={afterNext} tone="later" onClick={() => setSelected(afterNext)} />}
        </div>
      </section>

      {/* Not completed yet */}
      {missed.length > 0 && (
        <section>
          <SectionTitle>Noch offen</SectionTitle>
          <Card className="flex flex-col gap-2.5">
            <p className="text-[13px]" style={{ color: "var(--ink-2)" }}>
              {missed.length === 1
                ? "Ein Block ist vorbei, ohne abgehakt zu sein. Kein Problem — was möchtest du damit machen?"
                : `${missed.length} Blöcke sind vorbei, ohne abgehakt zu sein. Kein Problem — was möchtest du damit machen?`}
            </p>
            {missed.slice(0, 3).map((block) => (
              <div key={block.id} className="flex flex-wrap items-center gap-2">
                <span className="mr-auto min-w-0 truncate text-[14px]">
                  {formatTime(block.startMinute)} {block.title}
                </span>
                <Button size="sm" onClick={() => void rescheduleNow(block, refresh, setActionError)}>
                  Jetzt planen
                </Button>
                <Button size="sm" onClick={() => void quickStatus(block, "skipped")}>
                  Überspringen
                </Button>
                <Button size="sm" onClick={() => void moveToTomorrow(block, day, refresh, setActionError)}>
                  Morgen
                </Button>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* Timeline */}
      <section>
        <SectionTitle
          action={
            <div className="flex gap-2">
              <Button size="sm" busy={generating} onClick={generate}>
                Tagesplan erstellen
              </Button>
            </div>
          }
        >
          Tagesplan
        </SectionTitle>
        <Timeline
          blocks={blocks}
          dayStart={dayStart}
          dayEnd={dayEnd}
          nowMinute={nowMinute}
          isToday={isToday}
          onOpen={setSelected}
          onDrop={handleDrop}
          onQuickStatus={quickStatus}
        />
        {blocks.length > 0 && (
          <button
            type="button"
            onClick={adoptDay}
            className="mt-3 w-full text-center text-[13px]"
            style={{ color: "var(--ink-3)" }}
          >
            Diesen Tagesablauf als Standard übernehmen
          </button>
        )}
      </section>

      {/* Day summary */}
      {data && (
        <section>
          <SectionTitle>Überblick</SectionTitle>
          <div className="grid grid-cols-2 gap-2.5">
            <SummaryCard
              label="Training"
              value={
                data.workout
                  ? data.workout.name
                  : data.settings.trainingDays.includes(data.weekday)
                    ? "Geplant"
                    : "Ruhetag"
              }
              hint={
                data.workoutSessions.length > 0
                  ? `${data.workoutSessions.length} Einheit${data.workoutSessions.length === 1 ? "" : "en"} erfasst`
                  : undefined
              }
            />
            <SummaryCard
              label="Mahlzeiten"
              value={data.meals.length > 0 ? `${data.meals.length} geplant` : "Nicht geplant"}
              hint={data.meals.map((m) => m.name).slice(0, 2).join(", ") || undefined}
            />
            <SummaryCard label="Freie Zeit" value={formatDuration(freeMinutes)} hint={`Ziel: mindestens ${formatDuration(data.settings.minFreeMinutes)}`} />
            <SummaryCard label="Verplant" value={formatDuration(plannedMinutes)} hint={`${relevant.length} Blöcke`} />
          </div>
        </section>
      )}

      <BlockSheet block={selected} day={day} onClose={() => setSelected(null)} onChanged={refresh} />

      {/* Result of the automatic planner */}
      <Sheet
        open={genResult !== null}
        onClose={() => setGenResult(null)}
        title="Tagesplan erstellt"
        footer={
          <Button variant="primary" className="flex-1" onClick={() => setGenResult(null)}>
            Verstanden
          </Button>
        }
      >
        {genResult && (
          <div className="flex flex-col gap-4 text-[14px]">
            <p>
              {genResult.blocks.length} Blöcke geplant · {formatDuration(genResult.freeMinutes)} freie Zeit
              bleibt übrig.
            </p>

            {genResult.conflicts.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="font-medium" style={{ color: "var(--danger)" }}>
                  Zeitkonflikt erkannt
                </p>
                {genResult.conflicts.map((c, i) => (
                  <div key={i} className="rounded-xl px-3 py-2.5" style={{ background: "var(--danger-soft)" }}>
                    <p className="text-[13px]" style={{ color: "var(--danger)" }}>
                      {c.message}
                    </p>
                  </div>
                ))}
                <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
                  Beide Einträge bleiben erhalten. Entscheide selbst, welcher verschoben wird.
                </p>
              </div>
            )}

            {genResult.unplaced.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <p className="font-medium">Nicht eingeplant</p>
                {genResult.unplaced.map((u, i) => (
                  <p key={i} className="text-[13px]" style={{ color: "var(--ink-2)" }}>
                    {u.title} — {u.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </Sheet>

      {/* Conflict after a drag & drop */}
      <Sheet
        open={moveRequest !== null}
        onClose={() => setMoveRequest(null)}
        title="Zeitkonflikt erkannt"
        footer={
          <>
            <Button className="flex-1" onClick={() => setMoveRequest(null)}>
              Nur diesen Block
            </Button>
            <Button variant="primary" className="flex-1" onClick={resolveCascade}>
              Rest anpassen
            </Button>
          </>
        }
      >
        {moveRequest && (
          <div className="flex flex-col gap-3 text-[14px]">
            <p>Der verschobene Block überschneidet sich mit:</p>
            <ul className="flex flex-col gap-1.5">
              {moveRequest.conflicts.map((c) => (
                <li key={c.id} className="rounded-xl px-3 py-2.5" style={{ background: "var(--surface-2)" }}>
                  {c.title}
                </li>
              ))}
            </ul>
            <p className="text-[13px]" style={{ color: "var(--ink-3)" }}>
              &bdquo;Nur diesen Block&ldquo; lässt alles andere unverändert. &bdquo;Rest
              anpassen&ldquo; schiebt die folgenden
              flexiblen Blöcke nach hinten. Fixe Blöcke bleiben immer stehen.
            </p>
          </div>
        )}
      </Sheet>
    </div>
  );
}

async function rescheduleNow(
  block: Block,
  refresh: () => void,
  onError: (message: string) => void,
) {
  try {
    const res = await api.post<{ rescheduled: boolean; message?: string }>(
      `/api/plan/blocks/${block.id}/reschedule`,
    );
    if (!res.rescheduled) onError(res.message ?? "Kein freier Zeitraum gefunden");
    refresh();
  } catch (err) {
    onError(err instanceof ApiClientError ? err.message : "Aktion fehlgeschlagen");
  }
}

async function moveToTomorrow(
  block: Block,
  day: string,
  refresh: () => void,
  onError: (message: string) => void,
) {
  try {
    await api.post(`/api/plan/blocks/${block.id}/move-to-day`, { day: addDays(day, 1) });
    refresh();
  } catch (err) {
    onError(err instanceof ApiClientError ? err.message : "Aktion fehlgeschlagen");
  }
}

function FocusCard({
  block,
  tone,
  onClick,
}: {
  block: Block;
  tone: "now" | "next" | "later";
  onClick: () => void;
}) {
  const meta = categoryMeta(block.category);
  const label = tone === "now" ? "JETZT" : tone === "next" ? "ALS NÄCHSTES" : "DANACH";
  const emphasised = tone === "now";

  return (
    <button
      type="button"
      onClick={onClick}
      className="card flex w-full items-center gap-3.5 px-4 py-3.5 text-left"
      style={{
        background: emphasised ? `color-mix(in srgb, ${meta.color} 14%, var(--surface))` : "var(--surface)",
        borderColor: emphasised ? meta.color : "var(--line)",
      }}
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
        style={{ background: `color-mix(in srgb, ${meta.color} 20%, transparent)` }}
      >
        {block.icon || meta.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block text-[11px] font-semibold tracking-wider"
          style={{ color: emphasised ? meta.color : "var(--ink-3)" }}
        >
          {label} · {formatTime(block.startMinute)}–{formatTime(block.endMinute)}
        </span>
        <span className={`block truncate ${emphasised ? "text-[18px]" : "text-[16px]"} font-semibold`}>
          {block.title}
        </span>
      </span>
      <span className="shrink-0 text-[13px]" style={{ color: "var(--ink-3)" }}>
        {formatDuration(block.endMinute - block.startMinute)}
      </span>
    </button>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
        {label}
      </p>
      <p className="mt-1 truncate text-[15px] font-medium">{value}</p>
      {hint && (
        <p className="mt-0.5 truncate text-[12px]" style={{ color: "var(--ink-3)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}
