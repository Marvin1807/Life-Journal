import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  date,
  numeric,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ------------------------------------------------------------------ *
 * Enums
 * ------------------------------------------------------------------ */

export const categoryEnum = pgEnum("category", [
  "sleep",
  "work",
  "meal",
  "fitness",
  "routine",
  "development",
  "chores",
  "tasks",
  "leisure",
  "social",
  "relationship",
  "health",
  "other",
]);

export const blockStatusEnum = pgEnum("block_status", [
  "planned",
  "active",
  "done",
  "skipped",
  "moved",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "open",
  "in_progress",
  "done",
  "postponed",
]);

export const recurrenceEnum = pgEnum("recurrence", [
  "none",
  "daily",
  "weekdays",
  "weekly",
  "biweekly",
  "monthly",
]);

export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "paused",
  "done",
  "archived",
]);

export const mealSlotEnum = pgEnum("meal_slot", [
  "breakfast",
  "lunch",
  "snack",
  "dinner",
  "late",
]);

export const dietEnum = pgEnum("diet", [
  "vegetarian",
  "vegan",
  "pescetarian",
  "omnivore",
]);

/* ------------------------------------------------------------------ *
 * Auth
 * ------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull().default(""),
    seededAt: timestamp("seeded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent").notNull().default(""),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("sessions_token_unique").on(t.tokenHash),
    index("sessions_user_idx").on(t.userId),
  ],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("prt_token_unique").on(t.tokenHash)],
);

/* ------------------------------------------------------------------ *
 * Settings
 * ------------------------------------------------------------------ */

export const settings = pgTable(
  "settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // personal
    locale: text("locale").notNull().default("de"),
    timezone: text("timezone").notNull().default("Europe/Berlin"),
    weekStart: integer("week_start").notNull().default(1), // 1 = Monday
    theme: text("theme").notNull().default("system"), // system | light | dark

    // day structure (minutes since midnight)
    wakeTime: integer("wake_time").notNull().default(7 * 60),
    sleepTime: integer("sleep_time").notNull().default(23 * 60),
    sleepDurationTarget: integer("sleep_duration_target").notNull().default(8 * 60),
    wakeTimeFreeDay: integer("wake_time_free_day").notNull().default(8 * 60),
    sleepTimeFreeDay: integer("sleep_time_free_day").notNull().default(23 * 60 + 30),

    // work
    workDays: integer("work_days").array().notNull().default([1, 2, 3, 4, 5]),
    workStart: integer("work_start").notNull().default(9 * 60),
    workEnd: integer("work_end").notNull().default(16 * 60 + 30),
    workBreakStart: integer("work_break_start").notNull().default(12 * 60),
    workBreakMinutes: integer("work_break_minutes").notNull().default(30),

    // planning
    bufferMinutes: integer("buffer_minutes").notNull().default(15),
    minFreeMinutes: integer("min_free_minutes").notNull().default(60),
    autoPlanEnabled: boolean("auto_plan_enabled").notNull().default(true),
    autoPlanTasks: boolean("auto_plan_tasks").notNull().default(true),
    autoPlanMeals: boolean("auto_plan_meals").notNull().default(true),
    autoPlanGoals: boolean("auto_plan_goals").notNull().default(true),
    planningGranularity: integer("planning_granularity").notNull().default(5),

    // fitness
    trainingDays: integer("training_days").array().notNull().default([1, 2, 4, 5]),
    trainingMinutes: integer("training_minutes").notNull().default(60),
    preferredTrainingTime: integer("preferred_training_time").notNull().default(17 * 60),

    // nutrition
    diet: dietEnum("diet").notNull().default("vegetarian"),
    mealsPerDay: integer("meals_per_day").notNull().default(4),
    calorieTarget: integer("calorie_target").notNull().default(2400),
    proteinTarget: integer("protein_target").notNull().default(130),
    excludedFoods: text("excluded_foods").array().notNull().default([]),
    preferredProteins: text("preferred_proteins").array().notNull().default([]),

    // leisure limits (minutes per day)
    socialMediaLimit: integer("social_media_limit").notNull().default(45),
    netflixLimit: integer("netflix_limit").notNull().default(75),
    gamingLimit: integer("gaming_limit").notNull().default(60),

    // notifications
    notifyUpcoming: boolean("notify_upcoming").notNull().default(false),
    notifyMeals: boolean("notify_meals").notNull().default(false),
    notifyWorkout: boolean("notify_workout").notNull().default(false),
    notifyGoals: boolean("notify_goals").notNull().default(false),
    notifyLeadMinutes: integer("notify_lead_minutes").notNull().default(15),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("settings_user_unique").on(t.userId)],
);

/* ------------------------------------------------------------------ *
 * Activities + rules (the "Standardroutine")
 * ------------------------------------------------------------------ */

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: categoryEnum("category").notNull().default("other"),
    icon: text("icon").notNull().default(""),
    description: text("description").notNull().default(""),
    /** For meal activities: which slot of the meal plan this block represents. */
    mealSlot: mealSlotEnum("meal_slot"),
    defaultMinutes: integer("default_minutes").notNull().default(30),
    isFixed: boolean("is_fixed").notNull().default(false),
    isOptional: boolean("is_optional").notNull().default(false),
    priority: integer("priority").notNull().default(3), // 1 = highest .. 4 = lowest
    autoPlan: boolean("auto_plan").notNull().default(true),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activities_user_idx").on(t.userId)],
);

/** One activity can have several scheduling rules (e.g. work morning + afternoon). */
export const activityRules = pgTable(
  "activity_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    weekdays: integer("weekdays").array().notNull().default([1, 2, 3, 4, 5, 6, 7]),
    recurrence: recurrenceEnum("recurrence").notNull().default("daily"),
    preferredStart: integer("preferred_start").notNull().default(9 * 60),
    earliestStart: integer("earliest_start").notNull().default(0),
    latestStart: integer("latest_start").notNull().default(23 * 60),
    durationMinutes: integer("duration_minutes"),
    enabled: boolean("enabled").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("activity_rules_user_idx").on(t.userId),
    index("activity_rules_activity_idx").on(t.activityId),
  ],
);

/* ------------------------------------------------------------------ *
 * Daily plans + schedule blocks (the concrete day)
 * ------------------------------------------------------------------ */

export const dailyPlans = pgTable(
  "daily_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: date("day").notNull(), // local date in the user's timezone
    generatedAt: timestamp("generated_at", { withTimezone: true }),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("daily_plans_user_day_unique").on(t.userId, t.day)],
);

export const scheduleBlocks = pgTable(
  "schedule_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => dailyPlans.id, { onDelete: "cascade" }),
    activityId: uuid("activity_id").references(() => activities.id, { onDelete: "set null" }),
    taskId: uuid("task_id"),
    goalId: uuid("goal_id"),
    workoutPlanId: uuid("workout_plan_id"),
    mealId: uuid("meal_id"),
    eventId: uuid("event_id"),
    routineId: uuid("routine_id"),
    title: text("title").notNull(),
    category: categoryEnum("category").notNull().default("other"),
    icon: text("icon").notNull().default(""),
    description: text("description").notNull().default(""),
    notes: text("notes").notNull().default(""),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    status: blockStatusEnum("status").notNull().default("planned"),
    priority: integer("priority").notNull().default(3),
    isFixed: boolean("is_fixed").notNull().default(false),
    isBuffer: boolean("is_buffer").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("schedule_blocks_plan_idx").on(t.planId),
    index("schedule_blocks_user_idx").on(t.userId),
  ],
);

/* ------------------------------------------------------------------ *
 * Tasks
 * ------------------------------------------------------------------ */

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    category: categoryEnum("category").notNull().default("tasks"),
    priority: integer("priority").notNull().default(3),
    status: taskStatusEnum("status").notNull().default("open"),
    dueDate: date("due_date"),
    estimateMinutes: integer("estimate_minutes").notNull().default(30),
    recurrence: recurrenceEnum("recurrence").notNull().default("none"),
    autoSchedule: boolean("auto_schedule").notNull().default(false),
    notes: text("notes").notNull().default(""),
    goalId: uuid("goal_id"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("tasks_user_idx").on(t.userId), index("tasks_status_idx").on(t.userId, t.status)],
);

export const taskSubtasks = pgTable(
  "task_subtasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    done: boolean("done").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("task_subtasks_task_idx").on(t.taskId)],
);

/* ------------------------------------------------------------------ *
 * Calendar
 * ------------------------------------------------------------------ */

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    location: text("location").notNull().default(""),
    category: categoryEnum("category").notNull().default("other"),
    day: date("day").notNull(),
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    allDay: boolean("all_day").notNull().default(false),
    recurrence: recurrenceEnum("recurrence").notNull().default("none"),
    recurrenceUntil: date("recurrence_until"),
    isFixed: boolean("is_fixed").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("calendar_events_user_day_idx").on(t.userId, t.day)],
);

/* ------------------------------------------------------------------ *
 * Routines
 * ------------------------------------------------------------------ */

export const routines = pgTable(
  "routines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon").notNull().default(""),
    startMinute: integer("start_minute").notNull().default(7 * 60),
    weekdays: integer("weekdays").array().notNull().default([1, 2, 3, 4, 5, 6, 7]),
    enabled: boolean("enabled").notNull().default(true),
    autoPlan: boolean("auto_plan").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("routines_user_idx").on(t.userId)],
);

export const routineSteps = pgTable(
  "routine_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    routineId: uuid("routine_id")
      .notNull()
      .references(() => routines.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(5),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("routine_steps_routine_idx").on(t.routineId)],
);

export const routineCompletions = pgTable(
  "routine_completions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    routineId: uuid("routine_id")
      .notNull()
      .references(() => routines.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    completedSteps: text("completed_steps").array().notNull().default([]),
    done: boolean("done").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("routine_completion_unique").on(t.routineId, t.day)],
);

/* ------------------------------------------------------------------ *
 * Fitness
 * ------------------------------------------------------------------ */

export const equipment = pgTable(
  "equipment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    available: boolean("available").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("equipment_user_idx").on(t.userId)],
);

export const exercises = pgTable(
  "exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    muscleGroup: text("muscle_group").notNull().default(""),
    equipmentName: text("equipment_name").notNull().default("Körpergewicht"),
    description: text("description").notNull().default(""),
    defaultSets: integer("default_sets").notNull().default(3),
    defaultReps: integer("default_reps").notNull().default(10),
    defaultWeight: numeric("default_weight", { precision: 6, scale: 2 }).notNull().default("0"),
    defaultDurationSeconds: integer("default_duration_seconds").notNull().default(0),
    restSeconds: integer("rest_seconds").notNull().default(90),
    difficulty: integer("difficulty").notNull().default(2), // 1..3
    notes: text("notes").notNull().default(""),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("exercises_user_idx").on(t.userId)],
);

export const workoutPlans = pgTable(
  "workout_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    weekdays: integer("weekdays").array().notNull().default([]),
    estimatedMinutes: integer("estimated_minutes").notNull().default(60),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("workout_plans_user_idx").on(t.userId)],
);

export const workoutPlanExercises = pgTable(
  "workout_plan_exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id")
      .notNull()
      .references(() => workoutPlans.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    sets: integer("sets").notNull().default(3),
    reps: integer("reps").notNull().default(10),
    weight: numeric("weight", { precision: 6, scale: 2 }).notNull().default("0"),
    restSeconds: integer("rest_seconds").notNull().default(90),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("wpe_plan_idx").on(t.planId)],
);

export const workoutSessions = pgTable(
  "workout_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: uuid("plan_id").references(() => workoutPlans.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    day: date("day").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationMinutes: integer("duration_minutes").notNull().default(0),
    perceivedEffort: integer("perceived_effort").notNull().default(0), // 0..10
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("workout_sessions_user_day_idx").on(t.userId, t.day)],
);

export const workoutSets = pgTable(
  "workout_sets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    setNumber: integer("set_number").notNull().default(1),
    reps: integer("reps").notNull().default(0),
    weight: numeric("weight", { precision: 6, scale: 2 }).notNull().default("0"),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    done: boolean("done").notNull().default(true),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("workout_sets_session_idx").on(t.sessionId),
    index("workout_sets_exercise_idx").on(t.userId, t.exerciseId),
  ],
);

/* ------------------------------------------------------------------ *
 * Nutrition
 * ------------------------------------------------------------------ */

export const foods = pgTable(
  "foods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull().default("Sonstiges"),
    unit: text("unit").notNull().default("g"),
    referenceAmount: numeric("reference_amount", { precision: 8, scale: 2 }).notNull().default("100"),
    kcal: numeric("kcal", { precision: 8, scale: 2 }).notNull().default("0"),
    protein: numeric("protein", { precision: 8, scale: 2 }).notNull().default("0"),
    carbs: numeric("carbs", { precision: 8, scale: 2 }).notNull().default("0"),
    fat: numeric("fat", { precision: 8, scale: 2 }).notNull().default("0"),
    isProteinSource: boolean("is_protein_source").notNull().default(false),
    vegetarian: boolean("vegetarian").notNull().default(true),
    vegan: boolean("vegan").notNull().default(false),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("foods_user_idx").on(t.userId)],
);

export const meals = pgTable(
  "meals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slot: mealSlotEnum("slot").notNull().default("lunch"),
    description: text("description").notNull().default(""),
    prepMinutes: integer("prep_minutes").notNull().default(15),
    trainingDayOnly: boolean("training_day_only").notNull().default(false),
    restDayOnly: boolean("rest_day_only").notNull().default(false),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("meals_user_idx").on(t.userId)],
);

export const mealIngredients = pgTable(
  "meal_ingredients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mealId: uuid("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 8, scale: 2 }).notNull().default("100"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("meal_ingredients_meal_idx").on(t.mealId)],
);

export const mealPlans = pgTable(
  "meal_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    slot: mealSlotEnum("slot").notNull(),
    mealId: uuid("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    startMinute: integer("start_minute").notNull().default(12 * 60),
    eaten: boolean("eaten").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("meal_plans_unique").on(t.userId, t.day, t.slot),
    index("meal_plans_user_day_idx").on(t.userId, t.day),
  ],
);

export const shoppingLists = pgTable(
  "shopping_lists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("Einkaufsliste"),
    fromDay: date("from_day"),
    toDay: date("to_day"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("shopping_lists_user_idx").on(t.userId)],
);

export const shoppingListItems = pgTable(
  "shopping_list_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    listId: uuid("list_id")
      .notNull()
      .references(() => shoppingLists.id, { onDelete: "cascade" }),
    foodId: uuid("food_id").references(() => foods.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    category: text("category").notNull().default("Sonstiges"),
    amount: numeric("amount", { precision: 8, scale: 2 }).notNull().default("1"),
    unit: text("unit").notNull().default("Stk"),
    checked: boolean("checked").notNull().default(false),
    manual: boolean("manual").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("shopping_list_items_list_idx").on(t.listId)],
);

/* ------------------------------------------------------------------ *
 * Goals
 * ------------------------------------------------------------------ */

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    category: categoryEnum("category").notNull().default("development"),
    priority: integer("priority").notNull().default(3),
    status: goalStatusEnum("status").notNull().default("active"),
    deadline: date("deadline"),
    progress: integer("progress").notNull().default(0), // 0..100
    weeklyMinutes: integer("weekly_minutes").notNull().default(300),
    autoPlan: boolean("auto_plan").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("goals_user_idx").on(t.userId)],
);

export const goalMilestones = pgTable(
  "goal_milestones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    done: boolean("done").notNull().default(false),
    dueDate: date("due_date"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("goal_milestones_goal_idx").on(t.goalId)],
);

/* ------------------------------------------------------------------ *
 * Tracking / statistics
 * ------------------------------------------------------------------ */

/** Generic, append-only fact table used for all aggregated statistics. */
export const statistics = pgTable(
  "statistics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    metric: text("metric").notNull(), // e.g. "minutes.fitness", "tasks.done"
    value: numeric("value", { precision: 12, scale: 2 }).notNull().default("0"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("statistics_unique").on(t.userId, t.day, t.metric),
    index("statistics_user_day_idx").on(t.userId, t.day),
  ],
);

export const screenTimeLogs = pgTable(
  "screen_time_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    app: text("app").notNull(), // Instagram, TikTok, YouTube, Reddit, Netflix, Gaming, ...
    minutes: integer("minutes").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("screen_time_unique").on(t.userId, t.day, t.app)],
);

export const sleepLogs = pgTable(
  "sleep_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    minutes: integer("minutes").notNull().default(0),
    quality: integer("quality").notNull().default(0), // 0..5
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sleep_logs_unique").on(t.userId, t.day)],
);

/* ------------------------------------------------------------------ *
 * Relations
 * ------------------------------------------------------------------ */

export const usersRelations = relations(users, ({ many, one }) => ({
  settings: one(settings),
  activities: many(activities),
  tasks: many(tasks),
}));

export const activitiesRelations = relations(activities, ({ many, one }) => ({
  user: one(users, { fields: [activities.userId], references: [users.id] }),
  rules: many(activityRules),
}));

export const activityRulesRelations = relations(activityRules, ({ one }) => ({
  activity: one(activities, { fields: [activityRules.activityId], references: [activities.id] }),
}));

export const dailyPlansRelations = relations(dailyPlans, ({ many }) => ({
  blocks: many(scheduleBlocks),
}));

export const scheduleBlocksRelations = relations(scheduleBlocks, ({ one }) => ({
  plan: one(dailyPlans, { fields: [scheduleBlocks.planId], references: [dailyPlans.id] }),
}));

export const tasksRelations = relations(tasks, ({ many }) => ({
  subtasks: many(taskSubtasks),
}));

export const routinesRelations = relations(routines, ({ many }) => ({
  steps: many(routineSteps),
}));

export const mealsRelations = relations(meals, ({ many }) => ({
  ingredients: many(mealIngredients),
}));

export const workoutPlansRelations = relations(workoutPlans, ({ many }) => ({
  items: many(workoutPlanExercises),
}));

export const goalsRelations = relations(goals, ({ many }) => ({
  milestones: many(goalMilestones),
}));

export type User = typeof users.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type ActivityRule = typeof activityRules.$inferSelect;
export type ScheduleBlock = typeof scheduleBlocks.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type Routine = typeof routines.$inferSelect;
export type RoutineStep = typeof routineSteps.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type WorkoutPlan = typeof workoutPlans.$inferSelect;
export type Food = typeof foods.$inferSelect;
export type Meal = typeof meals.$inferSelect;
export type Goal = typeof goals.$inferSelect;
