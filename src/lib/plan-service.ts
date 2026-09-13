import "server-only";
import { and, eq, gte, inArray, isNull, lte, notInArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  activities,
  activityRules,
  calendarEvents,
  dailyPlans,
  goals,
  mealPlans,
  meals,
  routines,
  scheduleBlocks,
  settings as settingsTable,
  tasks,
  workoutPlans,
} from "@/db/schema";
import { planDay, type PlanItem, type PlanResult, type Category } from "@/lib/planner";
import {
  addDays,
  formatTime,
  recurrenceMatches,
  startOfWeek,
  weekdayOf,
} from "@/lib/time";

export type Settings = typeof settingsTable.$inferSelect;

/** Loads the user's settings, creating defaults on first use. */
export async function loadSettings(userId: string): Promise<Settings> {
  const rows = await db.select().from(settingsTable).where(eq(settingsTable.userId, userId)).limit(1);
  if (rows[0]) return rows[0];
  const created = await db.insert(settingsTable).values({ userId }).returning();
  return created[0];
}

export async function getOrCreatePlan(userId: string, day: string) {
  const rows = await db
    .select()
    .from(dailyPlans)
    .where(and(eq(dailyPlans.userId, userId), eq(dailyPlans.day, day)))
    .limit(1);
  if (rows[0]) return rows[0];
  const created = await db.insert(dailyPlans).values({ userId, day }).returning();
  return created[0];
}

export async function loadBlocks(userId: string, day: string) {
  const plan = await getOrCreatePlan(userId, day);
  const blocks = await db
    .select()
    .from(scheduleBlocks)
    .where(eq(scheduleBlocks.planId, plan.id))
    .orderBy(scheduleBlocks.startMinute);
  return { plan, blocks };
}

/* ------------------------------------------------------------------ *
 * Candidate collection
 * ------------------------------------------------------------------ */

function isWorkDay(s: Settings, weekday: number): boolean {
  return s.workDays.includes(weekday);
}

/**
 * Collects every candidate for a day from the user's standard routine
 * (activities + rules), calendar, meal plan, workouts, routines, tasks and
 * goals — and turns them into planner items.
 */
export async function collectPlanItems(
  userId: string,
  day: string,
  s: Settings,
): Promise<PlanItem[]> {
  const weekday = weekdayOf(day);
  const items: PlanItem[] = [];

  /* --- sleep: protected window at the end of the day ------------------- */
  const sleepStart = isWorkDay(s, weekday) ? s.sleepTime : s.sleepTimeFreeDay;
  const nextWeekday = weekdayOf(addDays(day, 1));
  const nextWake = isWorkDay(s, nextWeekday) ? s.wakeTime : s.wakeTimeFreeDay;
  const sleepMinutes = 1440 - sleepStart + nextWake;
  items.push({
    key: "sleep",
    title: "Schlafen",
    category: "sleep",
    icon: "🌙",
    description: `bis ${formatTime(nextWake)} · ${Math.floor(sleepMinutes / 60)} Std ${sleepMinutes % 60} Min`,
    durationMinutes: Math.max(0, 1440 - sleepStart),
    priority: 1,
    isFixed: true,
    fixedStart: sleepStart,
    preferredStart: sleepStart,
    earliestStart: sleepStart,
    latestStart: sleepStart,
    optional: false,
    essential: true,
  });

  /* --- calendar events (fixed appointments) ---------------------------- */
  const events = await db
    .select()
    .from(calendarEvents)
    .where(and(eq(calendarEvents.userId, userId), lte(calendarEvents.day, day)));

  for (const ev of events) {
    const applies =
      ev.day === day ||
      (ev.recurrence !== "none" &&
        (!ev.recurrenceUntil || day <= ev.recurrenceUntil) &&
        recurrenceMatches(ev.recurrence, ev.day, day));
    if (!applies) continue;
    if (ev.allDay) continue;

    items.push({
      key: `event:${ev.id}`,
      title: ev.title,
      category: ev.category as Category,
      icon: "📅",
      description: ev.location ? `${ev.location}` : ev.description,
      durationMinutes: Math.max(5, ev.endMinute - ev.startMinute),
      priority: 1,
      isFixed: ev.isFixed,
      fixedStart: ev.startMinute,
      preferredStart: ev.startMinute,
      earliestStart: ev.startMinute,
      latestStart: ev.startMinute,
      optional: false,
      essential: true,
      eventId: ev.id,
    });
  }

  /* --- workout plan of the day ----------------------------------------- */
  const plans = await db
    .select()
    .from(workoutPlans)
    .where(and(eq(workoutPlans.userId, userId), eq(workoutPlans.archived, false)));
  const todaysWorkout = plans.find((p) => p.weekdays.includes(weekday)) ?? null;

  /* --- meal plan of the day -------------------------------------------- */
  const plannedMeals = await db
    .select({
      id: mealPlans.id,
      slot: mealPlans.slot,
      mealId: mealPlans.mealId,
      startMinute: mealPlans.startMinute,
      name: meals.name,
      prepMinutes: meals.prepMinutes,
    })
    .from(mealPlans)
    .innerJoin(meals, eq(meals.id, mealPlans.mealId))
    .where(and(eq(mealPlans.userId, userId), eq(mealPlans.day, day)));

  const mealBySlot = new Map(plannedMeals.map((m) => [m.slot, m]));

  /* --- standard routine: activities + rules ---------------------------- */
  const rules = await db
    .select({
      rule: activityRules,
      activity: activities,
    })
    .from(activityRules)
    .innerJoin(activities, eq(activities.id, activityRules.activityId))
    .where(
      and(
        eq(activityRules.userId, userId),
        eq(activityRules.enabled, true),
        eq(activities.archived, false),
        eq(activities.autoPlan, true),
      ),
    )
    .orderBy(activityRules.sortOrder);

  let hasDevelopmentBlock = false;

  for (const { rule, activity } of rules) {
    if (!rule.weekdays.includes(weekday)) continue;
    if (rule.recurrence === "weekdays" && weekday > 5) continue;

    // Work activities follow the work-day setting.
    if (activity.category === "work" && !isWorkDay(s, weekday)) continue;
    // Training only on training days unless a workout plan says otherwise.
    if (activity.category === "fitness") {
      const trains = s.trainingDays.includes(weekday) || todaysWorkout !== null;
      if (!trains) continue;
    }

    const duration = rule.durationMinutes ?? activity.defaultMinutes;
    let title = activity.name;
    let mealId: string | null = null;
    let workoutPlanId: string | null = null;

    if (activity.category === "meal" && activity.mealSlot) {
      const planned = mealBySlot.get(activity.mealSlot);
      if (planned) {
        title = planned.name;
        mealId = planned.mealId;
      }
    }
    if (activity.category === "fitness" && todaysWorkout) {
      title = todaysWorkout.name;
      workoutPlanId = todaysWorkout.id;
    }
    if (activity.category === "development") hasDevelopmentBlock = true;

    items.push({
      key: `rule:${rule.id}`,
      title,
      category: activity.category as Category,
      icon: activity.icon,
      description: activity.description,
      durationMinutes: duration,
      priority: activity.priority,
      isFixed: activity.isFixed,
      fixedStart: rule.preferredStart,
      preferredStart: rule.preferredStart,
      earliestStart: rule.earliestStart,
      latestStart: rule.latestStart,
      optional: activity.isOptional,
      essential: activity.category === "meal" || activity.category === "fitness",
      activityId: activity.id,
      mealId,
      workoutPlanId,
    });
  }

  /* --- routines (morning/evening) -------------------------------------- */
  const dayRoutines = await db
    .select()
    .from(routines)
    .where(
      and(eq(routines.userId, userId), eq(routines.enabled, true), eq(routines.autoPlan, true)),
    );

  for (const routine of dayRoutines) {
    if (!routine.weekdays.includes(weekday)) continue;
    items.push({
      key: `routine:${routine.id}`,
      title: routine.name,
      category: "routine",
      icon: routine.icon || "✨",
      description: "Routine",
      durationMinutes: await routineDuration(userId, routine.id),
      priority: 2,
      isFixed: false,
      preferredStart: routine.startMinute,
      earliestStart: Math.max(0, routine.startMinute - 60),
      latestStart: Math.min(1439, routine.startMinute + 60),
      optional: false,
      essential: true,
      routineId: routine.id,
    });
  }

  /* --- goals: attach to development time ------------------------------- */
  if (s.autoPlanGoals) {
    const activeGoals = await db
      .select()
      .from(goals)
      .where(
        and(eq(goals.userId, userId), eq(goals.status, "active"), eq(goals.autoPlan, true)),
      )
      .orderBy(goals.priority);

    if (activeGoals.length > 0) {
      const weekStart = startOfWeek(day, s.weekStart);
      const weekEnd = addDays(weekStart, 6);
      const plannedPerGoal = await db
        .select({
          goalId: scheduleBlocks.goalId,
          minutes: sql<number>`sum(${scheduleBlocks.endMinute} - ${scheduleBlocks.startMinute})`,
        })
        .from(scheduleBlocks)
        .innerJoin(dailyPlans, eq(dailyPlans.id, scheduleBlocks.planId))
        .where(
          and(
            eq(scheduleBlocks.userId, userId),
            gte(dailyPlans.day, weekStart),
            lte(dailyPlans.day, weekEnd),
          ),
        )
        .groupBy(scheduleBlocks.goalId);

      const done = new Map(
        plannedPerGoal.filter((r) => r.goalId).map((r) => [r.goalId as string, Number(r.minutes)]),
      );

      const withDeficit = activeGoals
        .map((g) => ({ goal: g, deficit: g.weeklyMinutes - (done.get(g.id) ?? 0) }))
        .filter((g) => g.deficit > 0)
        .sort((a, b) => a.goal.priority - b.goal.priority || b.deficit - a.deficit);

      const target = withDeficit[0];
      if (target) {
        if (hasDevelopmentBlock) {
          // Attach the goal to the existing development slot rather than
          // adding extra time on top of the standard routine.
          const devItem = items.find((i) => i.category === "development");
          if (devItem) {
            devItem.goalId = target.goal.id;
            devItem.title = `${devItem.title}: ${target.goal.title}`;
          }
        } else {
          const minutes = Math.min(90, Math.max(30, Math.round(target.deficit / 3 / 5) * 5));
          items.push({
            key: `goal:${target.goal.id}`,
            title: `Ziel: ${target.goal.title}`,
            category: "development",
            icon: "🎯",
            description: target.goal.description,
            durationMinutes: minutes,
            priority: 3,
            isFixed: false,
            preferredStart: 19 * 60,
            earliestStart: 8 * 60,
            latestStart: 21 * 60,
            optional: true,
            goalId: target.goal.id,
          });
        }
      }
    }
  }

  /* --- tasks that want to be scheduled --------------------------------- */
  if (s.autoPlanTasks) {
    const openTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.autoSchedule, true),
          inArray(tasks.status, ["open", "in_progress"]),
          or(isNull(tasks.dueDate), lte(tasks.dueDate, addDays(day, 3))),
        ),
      )
      .orderBy(tasks.priority, tasks.dueDate)
      .limit(3);

    for (const task of openTasks) {
      items.push({
        key: `task:${task.id}`,
        title: task.title,
        category: "tasks",
        icon: "✅",
        description: task.description,
        durationMinutes: Math.max(10, task.estimateMinutes),
        priority: task.priority <= 1 ? 2 : 3,
        isFixed: false,
        preferredStart: 20 * 60,
        earliestStart: isWorkDay(s, weekday) ? s.workEnd : 9 * 60,
        latestStart: 21 * 60,
        optional: true,
        taskId: task.id,
      });
    }
  }

  return items;
}

async function routineDuration(userId: string, routineId: string): Promise<number> {
  const rows = await db.execute<{ total: number }>(
    sql`select coalesce(sum(duration_minutes), 0)::int as total from routine_steps where routine_id = ${routineId} and user_id = ${userId}`,
  );
  const total = Number((rows as unknown as { total: number }[])[0]?.total ?? 0);
  return Math.max(5, total);
}

/* ------------------------------------------------------------------ *
 * Generation
 * ------------------------------------------------------------------ */

export type GenerateResult = PlanResult & { planId: string };

/**
 * Regenerates the plan for a day. Blocks the user already completed are kept,
 * everything else is rebuilt from the standard routine.
 */
export async function generateDayPlan(
  userId: string,
  day: string,
  opts: { keepCompleted?: boolean } = {},
): Promise<GenerateResult> {
  const s = await loadSettings(userId);
  const plan = await getOrCreatePlan(userId, day);
  const keepCompleted = opts.keepCompleted ?? true;

  const existing = await db
    .select()
    .from(scheduleBlocks)
    .where(eq(scheduleBlocks.planId, plan.id));

  const keep = keepCompleted
    ? existing.filter((b) => b.status === "done" || b.status === "skipped")
    : [];

  const items = await collectPlanItems(userId, day, s);

  // Items whose completed counterpart is already on the timeline are skipped.
  const keptKeys = new Set(
    keep.map((b) =>
      b.activityId
        ? `activity:${b.activityId}`
        : b.taskId
          ? `task:${b.taskId}`
          : `title:${b.title}`,
    ),
  );
  const filtered = items.filter((i) => {
    const id = i.activityId
      ? `activity:${i.activityId}`
      : i.taskId
        ? `task:${i.taskId}`
        : `title:${i.title}`;
    return !keptKeys.has(id);
  });

  const weekday = weekdayOf(day);
  const dayStart = s.workDays.includes(weekday) ? s.wakeTime : s.wakeTimeFreeDay;
  const dayEnd = s.workDays.includes(weekday) ? s.sleepTime : s.sleepTimeFreeDay;

  const result = planDay(filtered, {
    dayStart,
    dayEnd,
    bufferMinutes: s.bufferMinutes,
    minFreeMinutes: s.minFreeMinutes,
    granularity: s.planningGranularity,
  });

  // Keep completed blocks out of the way of newly planned ones.
  const keptIntervals = keep.map((b) => ({ start: b.startMinute, end: b.endMinute }));
  const clean = result.blocks.filter(
    (b) => !keptIntervals.some((k) => b.startMinute < k.end && k.start < b.endMinute),
  );

  await db.transaction(async (tx) => {
    if (keep.length > 0) {
      await tx
        .delete(scheduleBlocks)
        .where(
          and(
            eq(scheduleBlocks.planId, plan.id),
            notInArray(
              scheduleBlocks.id,
              keep.map((k) => k.id),
            ),
          ),
        );
    } else {
      await tx.delete(scheduleBlocks).where(eq(scheduleBlocks.planId, plan.id));
    }

    if (clean.length > 0) {
      await tx.insert(scheduleBlocks).values(
        clean.map((b) => ({
          userId,
          planId: plan.id,
          title: b.title,
          category: b.category,
          icon: b.icon,
          description: b.description,
          startMinute: b.startMinute,
          endMinute: b.endMinute,
          priority: b.priority,
          isFixed: b.isFixed,
          status: "planned" as const,
          activityId: b.activityId ?? null,
          taskId: b.taskId ?? null,
          goalId: b.goalId ?? null,
          workoutPlanId: b.workoutPlanId ?? null,
          mealId: b.mealId ?? null,
          eventId: b.eventId ?? null,
          routineId: b.routineId ?? null,
        })),
      );
    }

    await tx
      .update(dailyPlans)
      .set({ generatedAt: new Date(), updatedAt: new Date() })
      .where(eq(dailyPlans.id, plan.id));
  });

  return { ...result, blocks: clean, planId: plan.id };
}
