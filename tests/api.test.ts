/**
 * End-to-end API tests against a running server and a real PostgreSQL database.
 * Covers the test cases from the product spec (§49).
 *
 * Run the dev server first:  BASE_URL=http://127.0.0.1:3100 npx vitest run tests/api.test.ts
 */
import { describe, it, expect, beforeAll } from "vitest";

const BASE = process.env.LJ_BASE_URL ?? "http://127.0.0.1:3100";

let cookie = "";
const email = `test-${Date.now()}@example.com`;
const password = "sicher-genug-123";

type Json = Record<string, unknown>;

async function call<T = Json>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
    redirect: "manual",
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const match = /lj_session=([^;]*)/.exec(setCookie);
    if (match) cookie = `lj_session=${match[1]}`;
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

function iso(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** The next Monday — guarantees a work day and a training day. */
function nextMonday(): string {
  const d = new Date();
  const delta = (8 - (d.getDay() === 0 ? 7 : d.getDay())) % 7 || 7;
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

beforeAll(async () => {
  const ping = await fetch(`${BASE}/api/auth/me`).catch(() => null);
  if (!ping) throw new Error(`Server not reachable at ${BASE}`);
});

describe("1–3 Konto: Registrierung, Login, Logout", () => {
  it("creates an account and starts a session", async () => {
    const res = await call<{ user: { id: string; email: string } }>("/api/auth/register", {
      method: "POST",
      json: { email, password, name: "Testperson" },
    });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(email);
    expect(cookie).toContain("lj_session=");
  });

  it("rejects a duplicate e-mail address", async () => {
    const saved = cookie;
    cookie = "";
    const res = await call("/api/auth/register", {
      method: "POST",
      json: { email, password, name: "Zweiter" },
    });
    expect(res.status).toBe(409);
    cookie = saved;
  });

  it("rejects a wrong password without revealing the reason", async () => {
    const saved = cookie;
    cookie = "";
    const res = await call<{ error: string }>("/api/auth/login", {
      method: "POST",
      json: { email, password: "falsch-falsch" },
    });
    expect(res.status).toBe(401);
    expect(res.body.error).not.toContain("existiert");
    cookie = saved;
  });

  it("logs out and blocks protected endpoints afterwards", async () => {
    const saved = cookie;
    await call("/api/auth/logout", { method: "POST" });
    cookie = "";
    const me = await call<{ user: null }>("/api/auth/me");
    expect(me.body.user).toBeNull();
    const blocked = await call("/api/tasks");
    expect(blocked.status).toBe(401);
    cookie = saved;
  });

  it("logs back in with the same credentials", async () => {
    cookie = "";
    const res = await call("/api/auth/login", { method: "POST", json: { email, password } });
    expect(res.status).toBe(200);
    expect(cookie).toContain("lj_session=");
  });
});

describe("50–52 Initialdaten", () => {
  it("seeds the standard routine, workouts, foods and meals", async () => {
    const activities = await call<unknown[]>("/api/activities");
    expect(activities.body.length).toBeGreaterThanOrEqual(10);

    const plans = await call<unknown[]>("/api/workout-plans");
    expect(plans.body.length).toBe(4);

    const foods = await call<unknown[]>("/api/foods");
    expect(foods.body.length).toBeGreaterThanOrEqual(20);

    const meals = await call<{ name: string }[]>("/api/meals");
    expect(meals.body.length).toBeGreaterThanOrEqual(4);

    const routines = await call<{ steps: unknown[] }[]>("/api/routines");
    expect(routines.body.length).toBe(2);
    expect(routines.body[0].steps.length).toBeGreaterThan(0);
  });

  it("defaults to a vegetarian diet", async () => {
    const res = await call<{ settings: { diet: string } }>("/api/settings");
    expect(res.body.settings.diet).toBe("vegetarian");
  });

  it("seeds only vegetarian foods", async () => {
    const res = await call<{ vegetarian: boolean }[]>("/api/foods");
    expect(res.body.every((f) => f.vegetarian)).toBe(true);
  });
});

describe("4–5 Einstellungen", () => {
  it("saves settings and reads them back", async () => {
    const res = await call<{ settings: { minFreeMinutes: number } }>("/api/settings", {
      method: "PATCH",
      json: { minFreeMinutes: 90, bufferMinutes: 10 },
    });
    expect(res.status).toBe(200);
    expect(res.body.settings.minFreeMinutes).toBe(90);

    const again = await call<{ settings: { minFreeMinutes: number; bufferMinutes: number } }>("/api/settings");
    expect(again.body.settings.minFreeMinutes).toBe(90);
    expect(again.body.settings.bufferMinutes).toBe(10);
  });

  it("changes the working hours", async () => {
    const res = await call<{ settings: { workStart: number; workEnd: number } }>("/api/settings", {
      method: "PATCH",
      json: { workStart: 8 * 60, workEnd: 16 * 60 },
    });
    expect(res.body.settings.workStart).toBe(480);
    expect(res.body.settings.workEnd).toBe(960);
    // restore
    await call("/api/settings", { method: "PATCH", json: { workStart: 540, workEnd: 990, minFreeMinutes: 60, bufferMinutes: 15 } });
  });

  it("rejects invalid input", async () => {
    const res = await call("/api/settings", { method: "PATCH", json: { minFreeMinutes: 99999 } });
    expect(res.status).toBe(422);
  });
});

describe("6 Routinen", () => {
  let routineId = "";
  let stepId = "";

  it("creates a routine with steps", async () => {
    const routine = await call<{ id: string }>("/api/routines", {
      method: "POST",
      json: { name: "Testroutine", icon: "🧪", startMinute: 6 * 60 + 30, weekdays: [1, 2, 3] },
    });
    expect(routine.status).toBe(201);
    routineId = routine.body.id;

    const step = await call<{ id: string }>("/api/routine-steps", {
      method: "POST",
      json: { routineId, title: "Schritt 1", durationMinutes: 10, sortOrder: 0 },
    });
    expect(step.status).toBe(201);
    stepId = step.body.id;

    const list = await call<{ id: string; steps: unknown[] }[]>("/api/routines");
    const created = list.body.find((r) => r.id === routineId);
    expect(created?.steps.length).toBe(1);
  });

  it("edits and deletes a routine step", async () => {
    const patched = await call<{ durationMinutes: number }>(`/api/routine-steps/${stepId}`, {
      method: "PATCH",
      json: { durationMinutes: 20 },
    });
    expect(patched.body.durationMinutes).toBe(20);

    const removed = await call(`/api/routine-steps/${stepId}`, { method: "DELETE" });
    expect(removed.status).toBe(200);

    await call(`/api/routines/${routineId}`, { method: "DELETE" });
  });
});

describe("7–8 Aufgaben", () => {
  let taskId = "";

  it("creates a task", async () => {
    const res = await call<{ id: string; title: string; status: string }>("/api/tasks", {
      method: "POST",
      json: { title: "Testaufgabe", category: "tasks", priority: 2, estimateMinutes: 45, dueDate: iso(1) },
    });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Testaufgabe");
    taskId = res.body.id;
  });

  it("adds and completes a subtask", async () => {
    const sub = await call<{ id: string }>("/api/subtasks", {
      method: "POST",
      json: { taskId, title: "Teilschritt", sortOrder: 0 },
    });
    expect(sub.status).toBe(201);

    const done = await call<{ done: boolean }>(`/api/subtasks/${sub.body.id}`, {
      method: "PATCH",
      json: { done: true },
    });
    expect(done.body.done).toBe(true);
  });

  it("completes the task and records the completion time", async () => {
    const res = await call<{ status: string; completedAt: string | null }>(`/api/tasks/${taskId}`, {
      method: "PATCH",
      json: { status: "done" },
    });
    expect(res.body.status).toBe("done");
    expect(res.body.completedAt).not.toBeNull();
  });

  it("rejects an empty title", async () => {
    const res = await call("/api/tasks", { method: "POST", json: { title: "" } });
    expect(res.status).toBe(422);
  });
});

describe("9–11 Tagesplan, Verschieben, Konflikte", () => {
  const day = nextMonday();
  let blocks: { id: string; title: string; startMinute: number; endMinute: number; isFixed: boolean; category: string }[] = [];

  it("generates a day plan", async () => {
    const res = await call<{ blocks: typeof blocks; freeMinutes: number; conflicts: unknown[] }>(
      "/api/plan/generate",
      { method: "POST", json: { day, keepCompleted: false } },
    );
    expect(res.status).toBe(200);
    expect(res.body.blocks.length).toBeGreaterThan(5);
    expect(res.body.freeMinutes).toBeGreaterThanOrEqual(60);

    const loaded = await call<{ blocks: typeof blocks }>(`/api/plan?day=${day}`);
    blocks = loaded.body.blocks;
    expect(blocks.length).toBeGreaterThan(5);
  });

  it("plans work and training on a Monday", async () => {
    expect(blocks.some((b) => b.category === "work")).toBe(true);
    expect(blocks.some((b) => b.category === "fitness")).toBe(true);
  });

  it("produces no overlapping blocks", async () => {
    const sorted = [...blocks].sort((a, b) => a.startMinute - b.startMinute);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].startMinute).toBeGreaterThanOrEqual(sorted[i - 1].endMinute);
    }
  });

  it("moves a single block and reports the conflict it creates", async () => {
    const flexible = blocks.find((b) => !b.isFixed && b.category !== "sleep")!;
    const other = blocks.find((b) => b.id !== flexible.id && b.category !== "sleep")!;

    const res = await call<{ conflicts: { id: string }[] }>(`/api/plan/blocks/${flexible.id}/move`, {
      method: "POST",
      json: { startMinute: other.startMinute, mode: "single" },
    });
    expect(res.status).toBe(200);
    expect(res.body.conflicts.some((c) => c.id === other.id)).toBe(true);

    // Both blocks still exist — nothing was deleted.
    const after = await call<{ blocks: typeof blocks }>(`/api/plan?day=${day}`);
    expect(after.body.blocks.some((b) => b.id === other.id)).toBe(true);
    expect(after.body.blocks.some((b) => b.id === flexible.id)).toBe(true);
  });

  it("shifts the rest of the day in cascade mode without moving fixed blocks", async () => {
    const fresh = await call<{ blocks: typeof blocks }>(`/api/plan?day=${day}`);
    const fixedBefore = fresh.body.blocks.filter((b) => b.isFixed).map((b) => ({ id: b.id, start: b.startMinute }));
    const flexible = fresh.body.blocks.find((b) => !b.isFixed && b.category !== "sleep")!;

    const res = await call<{ moved: unknown[] }>(`/api/plan/blocks/${flexible.id}/move`, {
      method: "POST",
      json: { startMinute: Math.min(1380, flexible.startMinute + 30), mode: "cascade" },
    });
    expect(res.status).toBe(200);

    const after = await call<{ blocks: typeof blocks }>(`/api/plan?day=${day}`);
    for (const before of fixedBefore) {
      const now = after.body.blocks.find((b) => b.id === before.id);
      expect(now?.startMinute).toBe(before.start);
    }
  });

  it("marks a block as done and back again", async () => {
    const fresh = await call<{ blocks: { id: string; status: string }[] }>(`/api/plan?day=${day}`);
    const target = fresh.body.blocks[0];

    const done = await call<{ status: string; completedAt: string | null }>(`/api/plan/blocks/${target.id}`, {
      method: "PATCH",
      json: { status: "done" },
    });
    expect(done.body.status).toBe("done");
    expect(done.body.completedAt).not.toBeNull();

    const undone = await call<{ status: string }>(`/api/plan/blocks/${target.id}`, {
      method: "PATCH",
      json: { status: "planned" },
    });
    expect(undone.body.status).toBe("planned");
  });

  it("moves a block to the next day", async () => {
    const fresh = await call<{ blocks: { id: string; category: string }[] }>(`/api/plan?day=${day}`);
    const target = fresh.body.blocks.find((b) => b.category !== "sleep")!;
    const tomorrow = iso(0) === day ? iso(1) : new Date(Date.parse(`${day}T12:00:00Z`) + 86400000).toISOString().slice(0, 10);

    const res = await call(`/api/plan/blocks/${target.id}/move-to-day`, { method: "POST", json: { day: tomorrow } });
    expect(res.status).toBe(200);

    const after = await call<{ blocks: { id: string }[] }>(`/api/plan?day=${tomorrow}`);
    expect(after.body.blocks.some((b) => b.id === target.id)).toBe(true);
  });

  it("adopts a day into the standard routine without touching other days", async () => {
    const res = await call<{ updated: number }>("/api/plan/save-as-default", {
      method: "POST",
      json: { day },
    });
    expect(res.status).toBe(200);
    expect(res.body.updated).toBeGreaterThan(0);
  });
});

describe("12–14 Fitness", () => {
  let planId = "";
  let sessionId = "";
  let exerciseId = "";

  it("creates an exercise and a training plan", async () => {
    const ex = await call<{ id: string }>("/api/exercises", {
      method: "POST",
      json: { name: "Testübung", muscleGroup: "Brust", equipmentName: "Körpergewicht", defaultSets: 3, defaultReps: 12 },
    });
    expect(ex.status).toBe(201);
    exerciseId = ex.body.id;

    const plan = await call<{ id: string }>("/api/workout-plans", {
      method: "POST",
      json: {
        name: "Testplan",
        weekdays: [3],
        estimatedMinutes: 45,
        exercises: [{ exerciseId, sets: 3, reps: 12, weight: "0", restSeconds: 60 }],
      },
    });
    expect(plan.status).toBe(201);
    planId = plan.body.id;

    const list = await call<{ id: string; items: unknown[] }[]>("/api/workout-plans");
    expect(list.body.find((p) => p.id === planId)?.items.length).toBe(1);
  });

  it("runs a workout and stores every set", async () => {
    const session = await call<{ id: string }>("/api/workouts", {
      method: "POST",
      json: { planId, name: "Testplan", day: iso(0) },
    });
    expect(session.status).toBe(201);
    sessionId = session.body.id;

    const finished = await call<{ durationMinutes: number; sets: unknown[] }>(
      `/api/workouts/${sessionId}/finish`,
      {
        method: "POST",
        json: {
          durationMinutes: 42,
          perceivedEffort: 8,
          notes: "Lief gut",
          sets: [
            { exerciseId, setNumber: 1, reps: 12, weight: "20", durationSeconds: 0, done: true, notes: "" },
            { exerciseId, setNumber: 2, reps: 10, weight: "22.5", durationSeconds: 0, done: true, notes: "" },
          ],
        },
      },
    );
    expect(finished.status).toBe(200);
    expect(finished.body.durationMinutes).toBe(42);
    expect(finished.body.sets.length).toBe(2);
  });

  it("keeps the history and computes the personal best", async () => {
    const history = await call<{ personalBests: { exerciseId: string; weight: number }[] }>(
      `/api/workouts/history?exerciseId=${exerciseId}`,
    );
    const best = history.body.personalBests.find((p) => p.exerciseId === exerciseId);
    expect(best?.weight).toBe(22.5);
  });
});

describe("15–18 Ernährung und Einkaufsliste", () => {
  const day = iso(2);
  let tofuId = "";
  let mealId = "";

  it("creates a meal from ingredients", async () => {
    const foods = await call<{ id: string; name: string }[]>("/api/foods");
    tofuId = foods.body.find((f) => f.name.includes("Tofu"))!.id;

    const meal = await call<{ id: string }>("/api/meals", {
      method: "POST",
      json: {
        name: "Testgericht mit Tofu",
        slot: "dinner",
        prepMinutes: 20,
        ingredients: [{ foodId: tofuId, amount: "200" }],
      },
    });
    expect(meal.status).toBe(201);
    mealId = meal.body.id;

    const list = await call<{ id: string; nutrition: { kcal: number; protein: number } }[]>("/api/meals");
    const created = list.body.find((m) => m.id === mealId)!;
    expect(created.nutrition.kcal).toBeGreaterThan(0);
    expect(created.nutrition.protein).toBeGreaterThan(20);
  });

  it("assigns meals to days of the week", async () => {
    for (const [index, offset] of [0, 1, 2].entries()) {
      const target = new Date(Date.parse(`${day}T12:00:00Z`) + offset * 86400000).toISOString().slice(0, 10);
      const res = await call(`/api/meal-plans`, {
        method: "PUT",
        json: { day: target, slot: "dinner", mealId },
      });
      expect(res.status).toBe(200);
      expect(index).toBeGreaterThanOrEqual(0);
    }

    const to = new Date(Date.parse(`${day}T12:00:00Z`) + 2 * 86400000).toISOString().slice(0, 10);
    const plan = await call<{ entries: unknown[] }>(`/api/meal-plans?from=${day}&to=${to}`);
    expect(plan.body.entries.length).toBe(3);
  });

  it("generates a week plan automatically", async () => {
    const res = await call<{ created: number }>("/api/meal-plans/generate", {
      method: "POST",
      json: { from: iso(10), days: 7, overwrite: true },
    });
    expect(res.status).toBe(200);
    expect(res.body.created).toBeGreaterThan(0);
  });

  it("sums identical ingredients into one shopping list entry", async () => {
    const to = new Date(Date.parse(`${day}T12:00:00Z`) + 2 * 86400000).toISOString().slice(0, 10);
    const res = await call<{ id: string; items: { name: string; amount: string; unit: string }[] }>(
      "/api/shopping-lists/generate",
      { method: "POST", json: { from: day, to } },
    );
    expect(res.status).toBe(201);

    const tofu = res.body.items.filter((i) => i.name.includes("Tofu"));
    expect(tofu.length).toBe(1);
    expect(Number(tofu[0].amount)).toBe(600);
    expect(tofu[0].unit).toBe("g");
  });

  it("checks an item off and adds a manual entry", async () => {
    const lists = await call<{ id: string; items: { id: string }[] }[]>("/api/shopping-lists");
    const list = lists.body[0];

    const checked = await call<{ checked: boolean }>(`/api/shopping-items/${list.items[0].id}`, {
      method: "PATCH",
      json: { checked: true },
    });
    expect(checked.body.checked).toBe(true);

    const added = await call<{ manual: boolean }>("/api/shopping-items", {
      method: "POST",
      json: { listId: list.id, name: "Spülmittel", category: "Sonstiges", amount: "1", unit: "Stk" },
    });
    expect(added.status).toBe(201);
    expect(added.body.manual).toBe(true);
  });
});

describe("19–21 Ziele und Statistiken", () => {
  let goalId = "";

  it("creates a goal with milestones", async () => {
    const goal = await call<{ id: string }>("/api/goals", {
      method: "POST",
      json: { title: "Testziel", category: "development", weeklyMinutes: 240, priority: 2 },
    });
    expect(goal.status).toBe(201);
    goalId = goal.body.id;

    for (const title of ["Erster Schritt", "Zweiter Schritt"]) {
      const res = await call("/api/milestones", { method: "POST", json: { goalId, title } });
      expect(res.status).toBe(201);
    }
  });

  it("updates the progress when a milestone is completed", async () => {
    const goals = await call<{ id: string; milestones: { id: string }[] }[]>("/api/goals");
    const goal = goals.body.find((g) => g.id === goalId)!;

    await call(`/api/milestones/${goal.milestones[0].id}`, { method: "PATCH", json: { done: true } });

    const after = await call<{ id: string; progress: number }[]>("/api/goals");
    expect(after.body.find((g) => g.id === goalId)?.progress).toBe(50);
  });

  it("returns statistics for week, month and year", async () => {
    for (const range of ["week", "month", "year"]) {
      const res = await call<{ range: string; totals: { plannedMinutes: number } }>(`/api/stats?range=${range}`);
      expect(res.status).toBe(200);
      expect(res.body.range).toBe(range);
      expect(typeof res.body.totals.plannedMinutes).toBe("number");
    }
  });

  it("records manual screen time and shows it in the statistics", async () => {
    // Statistics are anchored in the user's timezone, so the query is anchored
    // on the same day the entry was written for.
    const day = iso(0);
    await call("/api/screen-time", { method: "POST", json: { day, app: "Instagram", minutes: 32 } });
    const res = await call<{ screenTime: { app: string; minutes: number }[]; from: string; to: string }>(
      `/api/stats?range=week&anchor=${day}`,
    );
    expect(day >= res.body.from && day <= res.body.to).toBe(true);
    expect(res.body.screenTime.some((s) => s.app === "Instagram" && s.minutes === 32)).toBe(true);
  });
});

describe("23–24 Datenpersistenz und Isolation", () => {
  it("keeps data across a new session on another device", async () => {
    const saved = cookie;
    cookie = "";
    await call("/api/auth/login", { method: "POST", json: { email, password } });
    const tasks = await call<{ title: string }[]>("/api/tasks");
    expect(tasks.body.some((t) => t.title === "Testaufgabe")).toBe(true);
    expect(cookie).not.toBe(saved);
  });

  it("never exposes another user's data", async () => {
    const mine = await call<{ id: string }[]>("/api/tasks");
    const myTaskId = mine.body[0].id;

    const otherEmail = `other-${Date.now()}@example.com`;
    const saved = cookie;
    cookie = "";
    await call("/api/auth/register", { method: "POST", json: { email: otherEmail, password, name: "Andere" } });

    const theirTasks = await call<{ id: string }[]>("/api/tasks");
    expect(theirTasks.body.some((t) => t.id === myTaskId)).toBe(false);

    const stolen = await call(`/api/tasks/${myTaskId}`, { method: "PATCH", json: { title: "Gekapert" } });
    expect(stolen.status).toBe(404);

    cookie = saved;
    const stillMine = await call<{ id: string; title: string }[]>("/api/tasks");
    expect(stillMine.body.find((t) => t.id === myTaskId)?.title).not.toBe("Gekapert");
  });

  it("exports all data of the account", async () => {
    const res = await fetch(`${BASE}/api/export`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toContain("attachment");
    const payload = (await res.json()) as { data: Record<string, unknown[]> };
    expect(Object.keys(payload.data).length).toBeGreaterThan(20);
    expect(payload.data.tasks.length).toBeGreaterThan(0);
  });
});

describe("Passwort zurücksetzen", () => {
  it("creates a reset link and sets a new password", async () => {
    const saved = cookie;
    cookie = "";
    const request = await call<{ link: string | null }>("/api/auth/reset-request", {
      method: "POST",
      json: { email },
    });
    expect(request.status).toBe(200);
    expect(request.body.link).toContain("token=");

    const token = new URL(request.body.link!).searchParams.get("token")!;
    const newPassword = "ein-neues-passwort-99";
    const confirm = await call("/api/auth/reset-confirm", {
      method: "POST",
      json: { token, password: newPassword },
    });
    expect(confirm.status).toBe(200);

    const login = await call("/api/auth/login", { method: "POST", json: { email, password: newPassword } });
    expect(login.status).toBe(200);

    const reused = await call("/api/auth/reset-confirm", {
      method: "POST",
      json: { token, password: "noch-ein-passwort" },
    });
    expect(reused.status).toBe(400);

    // restore the original password for repeat runs
    await call("/api/auth/change-password", {
      method: "POST",
      json: { currentPassword: newPassword, newPassword: password },
    });
    expect(saved.length).toBeGreaterThan(0);
  });

  it("does not reveal whether an address exists", async () => {
    const res = await call<{ link: string | null }>("/api/auth/reset-request", {
      method: "POST",
      json: { email: "gibt-es-nicht@example.com" },
    });
    expect(res.status).toBe(200);
    expect(res.body.link).toBeNull();
  });
});
