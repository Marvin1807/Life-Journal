"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  ErrorNote,
  Field,
  Input,
  NumberInput,
  Select,
  Spinner,
  TimeInput,
  Toggle,
  WeekdayPicker,
} from "@/components/ui";
import { ActivitiesEditor } from "@/components/settings/ActivitiesEditor";
import { RoutinesEditor } from "@/components/settings/RoutinesEditor";
import { useResource } from "@/hooks/useResource";
import { api, ApiClientError } from "@/lib/client";
import { formatDuration } from "@/lib/time";
import type { Activity, Routine, Settings } from "@/lib/types";

type SettingsPayload = { settings: Settings; user: { id: string; email: string; name: string } };

const TIMEZONES = [
  "Europe/Berlin",
  "Europe/Vienna",
  "Europe/Zurich",
  "Europe/London",
  "Europe/Madrid",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
];

export function SettingsView() {
  const resource = useResource<SettingsPayload>("/api/settings");
  const activities = useResource<Activity[]>("/api/activities");
  const routines = useResource<Routine[]>("/api/routines");

  const [draft, setDraft] = useState<Settings | null>(null);
  const [name, setName] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (resource.data && !dirty) {
      setDraft(resource.data.settings);
      setName(resource.data.user.name);
    }
  }, [resource.data, dirty]);

  function update(patch: Partial<Settings>) {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    setDirty(true);
    setSaved(false);
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      await api.patch("/api/settings", {
        name,
        locale: draft.locale,
        timezone: draft.timezone,
        weekStart: draft.weekStart,
        theme: draft.theme as "system" | "light" | "dark",
        wakeTime: draft.wakeTime,
        sleepTime: draft.sleepTime,
        sleepDurationTarget: draft.sleepDurationTarget,
        wakeTimeFreeDay: draft.wakeTimeFreeDay,
        sleepTimeFreeDay: draft.sleepTimeFreeDay,
        workDays: draft.workDays,
        workStart: draft.workStart,
        workEnd: draft.workEnd,
        workBreakStart: draft.workBreakStart,
        workBreakMinutes: draft.workBreakMinutes,
        bufferMinutes: draft.bufferMinutes,
        minFreeMinutes: draft.minFreeMinutes,
        autoPlanEnabled: draft.autoPlanEnabled,
        autoPlanTasks: draft.autoPlanTasks,
        autoPlanMeals: draft.autoPlanMeals,
        autoPlanGoals: draft.autoPlanGoals,
        planningGranularity: draft.planningGranularity,
        trainingDays: draft.trainingDays,
        trainingMinutes: draft.trainingMinutes,
        preferredTrainingTime: draft.preferredTrainingTime,
        diet: draft.diet as "vegetarian",
        mealsPerDay: draft.mealsPerDay,
        calorieTarget: draft.calorieTarget,
        proteinTarget: draft.proteinTarget,
        socialMediaLimit: draft.socialMediaLimit,
        netflixLimit: draft.netflixLimit,
        gamingLimit: draft.gamingLimit,
        notifyUpcoming: draft.notifyUpcoming,
        notifyMeals: draft.notifyMeals,
        notifyWorkout: draft.notifyWorkout,
        notifyGoals: draft.notifyGoals,
        notifyLeadMinutes: draft.notifyLeadMinutes,
      });
      setDirty(false);
      setSaved(true);
      void resource.reload();

      // Apply the theme immediately.
      try {
        if (draft.theme === "light" || draft.theme === "dark") {
          localStorage.setItem("lj-theme", draft.theme);
          document.documentElement.setAttribute("data-theme", draft.theme);
        } else {
          localStorage.removeItem("lj-theme");
          document.documentElement.removeAttribute("data-theme");
        }
      } catch {
        /* ignore */
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  }

  if (!draft) {
    return (
      <div className="flex justify-center py-20" style={{ color: "var(--ink-3)" }}>
        <Spinner />
      </div>
    );
  }

  const workMinutes = Math.max(0, draft.workEnd - draft.workStart - draft.workBreakMinutes);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[24px] font-semibold tracking-tight">Einstellungen</h1>
        <Button variant="primary" size="sm" busy={saving} disabled={!dirty} onClick={save}>
          {saved && !dirty ? "Gespeichert" : "Speichern"}
        </Button>
      </header>

      {error && <ErrorNote>{error}</ErrorNote>}

      <Group title="Persönlich">
        <Field label="Name">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setDirty(true);
            }}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Zeitzone">
            <Select value={draft.timezone} onChange={(e) => update({ timezone: e.target.value })}>
              {TIMEZONES.includes(draft.timezone) ? null : (
                <option value={draft.timezone}>{draft.timezone}</option>
              )}
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Wochenstart">
            <Select value={String(draft.weekStart)} onChange={(e) => update({ weekStart: Number(e.target.value) })}>
              <option value="1">Montag</option>
              <option value="0">Sonntag</option>
            </Select>
          </Field>
        </div>
        <Field label="Darstellung">
          <Select value={draft.theme} onChange={(e) => update({ theme: e.target.value })}>
            <option value="system">Automatisch (Systemeinstellung)</option>
            <option value="light">Hell</option>
            <option value="dark">Dunkel</option>
          </Select>
        </Field>
      </Group>

      <Group title="Tagesstruktur">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Aufstehen (Arbeitstag)">
            <TimeInput value={draft.wakeTime} onChange={(v) => update({ wakeTime: v })} />
          </Field>
          <Field label="Schlafen (Arbeitstag)">
            <TimeInput value={draft.sleepTime} onChange={(v) => update({ sleepTime: v })} />
          </Field>
          <Field label="Aufstehen (freier Tag)">
            <TimeInput value={draft.wakeTimeFreeDay} onChange={(v) => update({ wakeTimeFreeDay: v })} />
          </Field>
          <Field label="Schlafen (freier Tag)">
            <TimeInput value={draft.sleepTimeFreeDay} onChange={(v) => update({ sleepTimeFreeDay: v })} />
          </Field>
        </div>
        <Field label="Gewünschte Schlafdauer">
          <NumberInput
            value={draft.sleepDurationTarget}
            onChange={(v) => update({ sleepDurationTarget: v })}
            suffix="Min"
            min={120}
            step={15}
          />
        </Field>
        <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
          Schlaf ist geschützt: Der automatische Planer legt nie etwas in dieses Zeitfenster.
        </p>
      </Group>

      <Group title="Arbeit">
        <Field label="Arbeitstage">
          <WeekdayPicker value={draft.workDays} onChange={(v) => update({ workDays: v })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Arbeitsbeginn">
            <TimeInput value={draft.workStart} onChange={(v) => update({ workStart: v })} />
          </Field>
          <Field label="Feierabend">
            <TimeInput value={draft.workEnd} onChange={(v) => update({ workEnd: v })} />
          </Field>
          <Field label="Pause ab">
            <TimeInput value={draft.workBreakStart} onChange={(v) => update({ workBreakStart: v })} />
          </Field>
          <Field label="Pausenlänge">
            <NumberInput
              value={draft.workBreakMinutes}
              onChange={(v) => update({ workBreakMinutes: v })}
              suffix="Min"
              min={0}
              step={5}
            />
          </Field>
        </div>
        <p className="text-[13px]" style={{ color: "var(--ink-2)" }}>
          Tatsächliche Arbeitszeit: <strong>{formatDuration(workMinutes)}</strong> pro Arbeitstag.
        </p>
        <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
          Mehrere Arbeitsblöcke legst du als Aktivitäten weiter unten an.
        </p>
      </Group>

      <Group title="Planung">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Puffer zwischen Aktivitäten">
            <NumberInput
              value={draft.bufferMinutes}
              onChange={(v) => update({ bufferMinutes: v })}
              suffix="Min"
              min={0}
              step={5}
            />
          </Field>
          <Field label="Minimale freie Zeit pro Tag">
            <NumberInput
              value={draft.minFreeMinutes}
              onChange={(v) => update({ minFreeMinutes: v })}
              suffix="Min"
              min={0}
              step={15}
            />
          </Field>
        </div>
        <Field label="Zeitraster" hint="Auf welche Minutenschritte geplant wird.">
          <Select
            value={String(draft.planningGranularity)}
            onChange={(e) => update({ planningGranularity: Number(e.target.value) })}
          >
            <option value="5">5 Minuten</option>
            <option value="10">10 Minuten</option>
            <option value="15">15 Minuten</option>
            <option value="30">30 Minuten</option>
          </Select>
        </Field>
        <div className="rounded-xl px-3" style={{ background: "var(--surface-2)" }}>
          <Toggle
            checked={draft.autoPlanEnabled}
            onChange={(v) => update({ autoPlanEnabled: v })}
            label="Automatische Tagesplanung"
          />
          <Toggle
            checked={draft.autoPlanTasks}
            onChange={(v) => update({ autoPlanTasks: v })}
            label="Aufgaben automatisch einplanen"
          />
          <Toggle
            checked={draft.autoPlanMeals}
            onChange={(v) => update({ autoPlanMeals: v })}
            label="Mahlzeiten automatisch einplanen"
          />
          <Toggle
            checked={draft.autoPlanGoals}
            onChange={(v) => update({ autoPlanGoals: v })}
            label="Zielzeit automatisch verteilen"
          />
        </div>
        <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
          Der Planer verplant bewusst nicht jede Minute. Die minimale freie Zeit bleibt erhalten, außer für
          Schlaf, Arbeit, Mahlzeiten und Training.
        </p>
      </Group>

      <Group title="Fitness">
        <Field label="Trainingstage">
          <WeekdayPicker value={draft.trainingDays} onChange={(v) => update({ trainingDays: v })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Trainingsdauer">
            <NumberInput
              value={draft.trainingMinutes}
              onChange={(v) => update({ trainingMinutes: v })}
              suffix="Min"
              min={10}
              step={5}
            />
          </Field>
          <Field label="Bevorzugte Trainingszeit">
            <TimeInput
              value={draft.preferredTrainingTime}
              onChange={(v) => update({ preferredTrainingTime: v })}
            />
          </Field>
        </div>
        <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
          Equipment und Übungen verwaltest du im Bereich Fitness.
        </p>
      </Group>

      <Group title="Ernährung">
        <Field label="Ernährungsweise">
          <Select value={draft.diet} onChange={(e) => update({ diet: e.target.value })}>
            <option value="vegetarian">Vegetarisch</option>
            <option value="vegan">Vegan</option>
            <option value="pescetarian">Pescetarisch</option>
            <option value="omnivore">Alles</option>
          </Select>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Mahlzeiten">
            <NumberInput value={draft.mealsPerDay} onChange={(v) => update({ mealsPerDay: v })} min={1} max={8} />
          </Field>
          <Field label="Kalorien">
            <NumberInput
              value={draft.calorieTarget}
              onChange={(v) => update({ calorieTarget: v })}
              suffix="kcal"
              min={800}
              step={50}
            />
          </Field>
          <Field label="Protein">
            <NumberInput
              value={draft.proteinTarget}
              onChange={(v) => update({ proteinTarget: v })}
              suffix="g"
              min={20}
              step={5}
            />
          </Field>
        </div>
        {draft.diet === "vegetarian" && (
          <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
            Bei vegetarischer Ernährung schlägt die App nie Fleisch oder Fisch vor.
          </p>
        )}
      </Group>

      <Group title="Freizeit">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Social Media">
            <NumberInput
              value={draft.socialMediaLimit}
              onChange={(v) => update({ socialMediaLimit: v })}
              suffix="Min"
              min={0}
              step={5}
            />
          </Field>
          <Field label="Netflix">
            <NumberInput
              value={draft.netflixLimit}
              onChange={(v) => update({ netflixLimit: v })}
              suffix="Min"
              min={0}
              step={5}
            />
          </Field>
          <Field label="Gaming">
            <NumberInput
              value={draft.gamingLimit}
              onChange={(v) => update({ gamingLimit: v })}
              suffix="Min"
              min={0}
              step={5}
            />
          </Field>
        </div>
        <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
          Tageslimits zum Vergleich in den Statistiken. Die Erfassung erfolgt manuell — der Browser hat
          keinen Zugriff auf die Bildschirmzeit des Geräts.
        </p>
      </Group>

      <Group title="Benachrichtigungen">
        <div className="rounded-xl px-3" style={{ background: "var(--surface-2)" }}>
          <Toggle
            checked={draft.notifyUpcoming}
            onChange={(v) => update({ notifyUpcoming: v })}
            label="Nächster Block"
          />
          <Toggle checked={draft.notifyMeals} onChange={(v) => update({ notifyMeals: v })} label="Mahlzeiten" />
          <Toggle checked={draft.notifyWorkout} onChange={(v) => update({ notifyWorkout: v })} label="Training" />
          <Toggle checked={draft.notifyGoals} onChange={(v) => update({ notifyGoals: v })} label="Ziele" />
        </div>
        <Field label="Vorlaufzeit">
          <NumberInput
            value={draft.notifyLeadMinutes}
            onChange={(v) => update({ notifyLeadMinutes: v })}
            suffix="Min"
            min={0}
            step={5}
          />
        </Field>
        <NotificationPermission enabled={draft.notifyUpcoming || draft.notifyMeals || draft.notifyWorkout || draft.notifyGoals} />
      </Group>

      <Group title="Standardroutine">
        <ActivitiesEditor activities={activities.data ?? []} onChanged={() => void activities.reload()} />
      </Group>

      <Group title="Routinen">
        <RoutinesEditor routines={routines.data ?? []} onChanged={() => void routines.reload()} />
      </Group>

      <Group title="Konto & Daten">
        <PasswordChange />
        <a href="/api/export" download className="btn btn-secondary">
          Meine Daten exportieren (JSON)
        </a>
        <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
          Der Export enthält alle Daten deines Kontos. Deine Daten liegen in einer PostgreSQL-Datenbank und
          sind auf jedem Gerät verfügbar, auf dem du dich anmeldest.
        </p>
      </Group>

      <div className="sticky bottom-24 md:bottom-4">
        <Button variant="primary" className="w-full" busy={saving} disabled={!dirty} onClick={save}>
          {dirty ? "Änderungen speichern" : saved ? "Gespeichert" : "Keine Änderungen"}
        </Button>
      </div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
        {title}
      </h2>
      <Card className="flex flex-col gap-3.5">{children}</Card>
    </section>
  );
}

function NotificationPermission({ enabled }: { enabled: boolean }) {
  const [state, setState] = useState<string>("default");

  useEffect(() => {
    if (typeof Notification !== "undefined") setState(Notification.permission);
  }, []);

  if (!enabled) return null;
  if (typeof Notification === "undefined") {
    return (
      <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
        Dieses Gerät unterstützt keine Web-Benachrichtigungen.
      </p>
    );
  }

  if (state === "granted") {
    return (
      <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
        Benachrichtigungen sind erlaubt. Sie erscheinen, solange die App geöffnet ist.
      </p>
    );
  }

  return (
    <Button
      size="sm"
      onClick={async () => {
        const result = await Notification.requestPermission();
        setState(result);
      }}
    >
      Benachrichtigungen erlauben
    </Button>
  );
}

function PasswordChange() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.post("/api/auth/change-password", { currentPassword: current, newPassword: next });
      setMessage("Passwort geändert.");
      setCurrent("");
      setNext("");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Änderung fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        Passwort ändern
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label="Aktuelles Passwort">
        <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Field label="Neues Passwort" hint="Mindestens 8 Zeichen">
        <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
      </Field>
      {error && <ErrorNote>{error}</ErrorNote>}
      {message && (
        <p className="text-[13px]" style={{ color: "var(--accent)" }}>
          {message}
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => setOpen(false)}>
          Schließen
        </Button>
        <Button size="sm" variant="primary" className="flex-1" busy={busy} onClick={submit}>
          Ändern
        </Button>
      </div>
    </div>
  );
}
