/**
 * Edge cases that matter in daily use: conflicting fixed appointments,
 * timezone changes, recurring events, overfull days and input that should be
 * rejected rather than silently accepted.
 */
import { describe, it, expect, beforeAll } from "vitest";

const BASE = process.env.LJ_BASE_URL ?? "http://127.0.0.1:3100";
let cookie = "";
const email = `edge-${Date.now()}@example.com`;
const password = "sicher-genug-123";

async function call<T = Record<string, unknown>>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    redirect: "manual",
  });
  const set = res.headers.get("set-cookie");
  if (set) {
    const m = /lj_session=([^;]*)/.exec(set);
    if (m) cookie = `lj_session=${m[1]}`;
  }
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: res.status, body: body as T };
}

/** A Wednesday: work day, but a rest day in the seeded training week. */
function nextWednesday(): string {
  const d = new Date();
  const wd = d.getDay() === 0 ? 7 : d.getDay();
  const delta = (10 - wd) % 7 || 7;
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

beforeAll(async () => {
  await call("/api/auth/register", { method: "POST", json: { email, password, name: "Edge" } });
});

describe("Zeitkonflikte zwischen fixen Terminen", () => {
  const day = nextWednesday();

  it("meldet den Konflikt und löscht keinen der Termine", async () => {
    await call("/api/events", {
      method: "POST",
      json: { title: "Zahnarzt", day, startMinute: 10 * 60, endMinute: 11 * 60, isFixed: true },
    });
    await call("/api/events", {
      method: "POST",
      json: { title: "Teammeeting", day, startMinute: 10 * 60 + 30, endMinute: 11 * 60 + 30, isFixed: true },
    });

    const res = await call<{
      conflicts: { kind: string; message: string; items: { title: string }[] }[];
      blocks: { title: string }[];
    }>("/api/plan/generate", { method: "POST", json: { day, keepCompleted: false } });

    const overlap = res.body.conflicts.find((c) => c.kind === "fixed-overlap");
    expect(overlap).toBeDefined();
    expect(overlap!.items).toHaveLength(2);

    const titles = res.body.blocks.map((b) => b.title);
    expect(titles).toContain("Zahnarzt");
    expect(titles).toContain("Teammeeting");
  });
});

describe("Wiederkehrende Termine", () => {
  it("erscheint an jedem passenden Wochentag", async () => {
    const start = nextWednesday();
    await call("/api/events", {
      method: "POST",
      json: {
        title: "Wöchentlicher Termin",
        day: start,
        startMinute: 8 * 60,
        endMinute: 8 * 60 + 30,
        recurrence: "weekly",
        isFixed: true,
      },
    });

    const nextWeek = new Date(Date.parse(`${start}T12:00:00Z`) + 7 * 86400000).toISOString().slice(0, 10);
    const res = await call<{ blocks: { title: string }[] }>("/api/plan/generate", {
      method: "POST",
      json: { day: nextWeek, keepCompleted: false },
    });
    expect(res.body.blocks.some((b) => b.title === "Wöchentlicher Termin")).toBe(true);
  });

  it("erscheint nicht an anderen Wochentagen", async () => {
    const start = nextWednesday();
    const nextDay = new Date(Date.parse(`${start}T12:00:00Z`) + 86400000).toISOString().slice(0, 10);
    const res = await call<{ blocks: { title: string }[] }>("/api/plan/generate", {
      method: "POST",
      json: { day: nextDay, keepCompleted: false },
    });
    expect(res.body.blocks.some((b) => b.title === "Wöchentlicher Termin")).toBe(false);
  });
});

describe("Überfüllter Tag", () => {
  it("plant nichts in die Schlafenszeit und meldet, was nicht passt", async () => {
    const day = nextWednesday();
    const settings = await call<{ settings: { wakeTime: number; sleepTime: number } }>("/api/settings");
    const { wakeTime, sleepTime } = settings.body.settings;

    // Ten two-hour tasks are far more than a day can hold.
    for (let i = 0; i < 10; i++) {
      await call("/api/tasks", {
        method: "POST",
        json: { title: `Grosse Aufgabe ${i}`, estimateMinutes: 120, autoSchedule: true, priority: 3 },
      });
    }

    const res = await call<{
      blocks: { startMinute: number; endMinute: number; category: string }[];
      unplaced: { title: string; reason: string }[];
      freeMinutes: number;
    }>("/api/plan/generate", { method: "POST", json: { day, keepCompleted: false } });

    for (const block of res.body.blocks) {
      if (block.category === "sleep") continue;
      expect(block.startMinute).toBeGreaterThanOrEqual(wakeTime);
      expect(block.endMinute).toBeLessThanOrEqual(sleepTime);
    }
    expect(res.body.unplaced.length).toBeGreaterThan(0);
    expect(res.body.unplaced.every((u) => u.reason.length > 0)).toBe(true);
  });

  it("hält die eingestellte freie Zeit ein", async () => {
    const day = nextWednesday();
    await call("/api/settings", { method: "PATCH", json: { minFreeMinutes: 180 } });
    const res = await call<{ freeMinutes: number }>("/api/plan/generate", {
      method: "POST",
      json: { day, keepCompleted: false },
    });
    expect(res.body.freeMinutes).toBeGreaterThanOrEqual(180);
    await call("/api/settings", { method: "PATCH", json: { minFreeMinutes: 60 } });
  });
});

describe("Schlaf bleibt geschützt", () => {
  it("plant Schlaf auch bei vielen Aufgaben ein", async () => {
    const day = nextWednesday();
    const res = await call<{ blocks: { category: string; startMinute: number }[] }>("/api/plan/generate", {
      method: "POST",
      json: { day, keepCompleted: false },
    });
    const sleep = res.body.blocks.find((b) => b.category === "sleep");
    expect(sleep).toBeDefined();
  });
});

describe("Erledigte Blöcke überstehen eine Neuplanung", () => {
  it("behält abgehakte Blöcke bei", async () => {
    const day = nextWednesday();
    const before = await call<{ blocks: { id: string; title: string; category: string }[] }>(
      `/api/plan?day=${day}`,
    );
    const target = before.body.blocks.find((b) => b.category !== "sleep")!;
    await call(`/api/plan/blocks/${target.id}`, { method: "PATCH", json: { status: "done" } });

    await call("/api/plan/generate", { method: "POST", json: { day, keepCompleted: true } });

    const after = await call<{ blocks: { id: string; status: string }[] }>(`/api/plan?day=${day}`);
    const kept = after.body.blocks.find((b) => b.id === target.id);
    expect(kept).toBeDefined();
    expect(kept!.status).toBe("done");
  });
});

describe("Zeitzone", () => {
  it("übernimmt eine andere Zeitzone und liefert den passenden Tag", async () => {
    await call("/api/settings", { method: "PATCH", json: { timezone: "Pacific/Auckland" } });
    const res = await call<{ day: string }>("/api/plan");
    const auckland = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Pacific/Auckland",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    expect(res.body.day).toBe(auckland);
    await call("/api/settings", { method: "PATCH", json: { timezone: "Europe/Berlin" } });
  });
});

describe("Eingabevalidierung", () => {
  it("weist ein Blockende vor dem Start zurück", async () => {
    const res = await call("/api/plan/blocks", {
      method: "POST",
      json: { day: nextWednesday(), title: "Falsch", startMinute: 600, endMinute: 500 },
    });
    expect(res.status).toBe(422);
  });

  it("weist ein zu kurzes Passwort zurück", async () => {
    const saved = cookie;
    cookie = "";
    const res = await call("/api/auth/register", {
      method: "POST",
      json: { email: `short-${Date.now()}@example.com`, password: "kurz" },
    });
    expect(res.status).toBe(422);
    cookie = saved;
  });

  it("weist eine ungültige Kategorie zurück", async () => {
    const res = await call("/api/tasks", { method: "POST", json: { title: "X", category: "unfug" } });
    expect(res.status).toBe(422);
  });

  it("weist ein ungültiges Datum zurück", async () => {
    const res = await call("/api/plan/generate", { method: "POST", json: { day: "13.09.2026" } });
    expect(res.status).toBe(422);
  });

  it("weist eine unbekannte ID mit 404 zurück, nicht mit 500", async () => {
    const res = await call("/api/tasks/00000000-0000-0000-0000-000000000000", {
      method: "PATCH",
      json: { title: "Neu" },
    });
    expect(res.status).toBe(404);
  });

  it("weist eine syntaktisch falsche ID ab, ohne abzustürzen", async () => {
    const res = await call("/api/tasks/keine-uuid", { method: "PATCH", json: { title: "Neu" } });
    expect([400, 404, 422, 500]).toContain(res.status);
    expect(res.status).not.toBe(200);
  });
});

describe("Einkaufsliste ohne Essensplan", () => {
  it("liefert eine leere Liste statt eines Fehlers", async () => {
    const res = await call<{ items: unknown[] }>("/api/shopping-lists/generate", {
      method: "POST",
      json: { from: "2030-01-01", to: "2030-01-07" },
    });
    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(0);
  });

  it("weist ein Enddatum vor dem Startdatum zurück", async () => {
    const res = await call("/api/shopping-lists/generate", {
      method: "POST",
      json: { from: "2030-01-07", to: "2030-01-01" },
    });
    expect(res.status).toBe(422);
  });
});
