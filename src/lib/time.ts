/**
 * All planning happens in "wall clock minutes" (0..1439) relative to the user's
 * local day. Dates are stored as ISO date strings (YYYY-MM-DD) representing the
 * local date in the user's timezone, which keeps daily/weekly recurrence correct
 * regardless of where the server runs.
 */

export const MINUTES_PER_DAY = 1440;

export function clampMinute(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MINUTES_PER_DAY, Math.round(value)));
}

/** "07:30" -> 450 */
export function parseTime(input: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(input.trim());
  if (!m) return 0;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return clampMinute(h * 60 + min);
}

/** 450 -> "07:30" */
export function formatTime(minutes: number): string {
  const v = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(v / 60);
  const m = v % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 90 -> "1 Std 30 Min" */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} Min`;
  if (m === 0) return `${h} Std`;
  return `${h} Std ${m} Min`;
}

/** Current local date (YYYY-MM-DD) in the given IANA timezone. */
export function todayInTimezone(timezone: string, now: Date = new Date()): string {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return fmt.format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  }
}

/** Minutes since local midnight in the given timezone. */
export function minutesNowInTimezone(timezone: string, now: Date = new Date()): number {
  try {
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = fmt.format(now).split(":");
    return clampMinute(Number(parts[0]) * 60 + Number(parts[1]));
  } catch {
    return now.getHours() * 60 + now.getMinutes();
  }
}

export function isValidDay(day: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(`${day}T00:00:00Z`));
}

/** ISO weekday: 1 = Monday .. 7 = Sunday */
export function weekdayOf(day: string): number {
  const d = new Date(`${day}T12:00:00Z`);
  const js = d.getUTCDay(); // 0 = Sunday
  return js === 0 ? 7 : js;
}

export function addDays(day: string, delta: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function diffDays(from: string, to: string): number {
  const a = Date.parse(`${from}T12:00:00Z`);
  const b = Date.parse(`${to}T12:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** First day of the week containing `day`, honouring the user's week start. */
export function startOfWeek(day: string, weekStart = 1): string {
  const wd = weekdayOf(day);
  const normalizedStart = weekStart === 0 ? 7 : weekStart;
  let delta = wd - normalizedStart;
  if (delta < 0) delta += 7;
  return addDays(day, -delta);
}

export function startOfMonth(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

export function endOfMonth(day: string): string {
  const [y, m] = day.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${day.slice(0, 7)}-${String(last).padStart(2, "0")}`;
}

export function startOfYear(day: string): string {
  return `${day.slice(0, 4)}-01-01`;
}

export function rangeDays(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = from;
  let guard = 0;
  while (cur <= to && guard++ < 800) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export const WEEKDAY_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
export const WEEKDAY_LONG = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
];
export const MONTH_LONG = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export function weekdayLabel(iso: number, long = false): string {
  const idx = Math.min(6, Math.max(0, iso - 1));
  return long ? WEEKDAY_LONG[idx] : WEEKDAY_SHORT[idx];
}

/** "Samstag, 13. September 2026" */
export function formatDateLong(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return `${weekdayLabel(weekdayOf(day), true)}, ${d}. ${MONTH_LONG[m - 1]} ${y}`;
}

/** "13.09." */
export function formatDateShort(day: string): string {
  const [, m, d] = day.split("-").map(Number);
  return `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}.`;
}

/** Does a recurrence rule that started on `anchor` apply on `day`? */
export function recurrenceMatches(
  recurrence: string,
  anchor: string,
  day: string,
): boolean {
  if (day < anchor) return false;
  switch (recurrence) {
    case "none":
      return day === anchor;
    case "daily":
      return true;
    case "weekdays":
      return weekdayOf(day) <= 5;
    case "weekly":
      return weekdayOf(day) === weekdayOf(anchor);
    case "biweekly":
      return weekdayOf(day) === weekdayOf(anchor) && diffDays(anchor, day) % 14 === 0;
    case "monthly":
      return day.slice(8) === anchor.slice(8);
    default:
      return day === anchor;
  }
}
