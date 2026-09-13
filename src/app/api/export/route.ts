import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  activities,
  activityRules,
  calendarEvents,
  dailyPlans,
  equipment,
  exercises,
  foods,
  goalMilestones,
  goals,
  mealIngredients,
  mealPlans,
  meals,
  routineCompletions,
  routineSteps,
  routines,
  scheduleBlocks,
  screenTimeLogs,
  settings,
  shoppingListItems,
  shoppingLists,
  sleepLogs,
  taskSubtasks,
  tasks,
  workoutPlanExercises,
  workoutPlans,
  workoutSessions,
  workoutSets,
} from "@/db/schema";
import { withUser } from "@/lib/api";

/** "Meine Daten exportieren" (spec §47) — a complete JSON dump of the account. */
export const GET = withUser(async ({ user }) => {
  const tables = {
    settings,
    activities,
    activityRules,
    dailyPlans,
    scheduleBlocks,
    tasks,
    taskSubtasks,
    calendarEvents,
    routines,
    routineSteps,
    routineCompletions,
    equipment,
    exercises,
    workoutPlans,
    workoutPlanExercises,
    workoutSessions,
    workoutSets,
    foods,
    meals,
    mealIngredients,
    mealPlans,
    shoppingLists,
    shoppingListItems,
    goals,
    goalMilestones,
    screenTimeLogs,
    sleepLogs,
  };

  const data: Record<string, unknown[]> = {};
  for (const [name, table] of Object.entries(tables)) {
    data[name] = await db
      .select()
      .from(table as never)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .where(eq((table as any).userId, user.id));
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    user: { id: user.id, email: user.email, name: user.name },
    data,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="life-journal-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
    },
  });
});
