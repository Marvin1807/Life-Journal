import { z } from "zod";

export const CATEGORIES = [
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
] as const;

export const categorySchema = z.enum(CATEGORIES);
export const blockStatusSchema = z.enum(["planned", "active", "done", "skipped", "moved"]);
export const taskStatusSchema = z.enum(["open", "in_progress", "done", "postponed"]);
export const recurrenceSchema = z.enum(["none", "daily", "weekdays", "weekly", "biweekly", "monthly"]);
export const goalStatusSchema = z.enum(["active", "paused", "done", "archived"]);
export const mealSlotSchema = z.enum(["breakfast", "lunch", "snack", "dinner", "late"]);
export const dietSchema = z.enum(["vegetarian", "vegan", "pescetarian", "omnivore"]);

const minute = z.number().int().min(0).max(1440);
const weekdays = z.array(z.number().int().min(1).max(7)).max(7);
const dayString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Datum muss YYYY-MM-DD sein");
const decimal = z.union([z.number(), z.string()]).transform((v) => String(v));
const uuid = z.string().uuid();

/* -------------------------------- auth ---------------------------------- */

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Bitte eine gültige E-Mail-Adresse angeben"),
  password: z.string().min(8, "Das Passwort muss mindestens 8 Zeichen haben").max(200),
  name: z.string().trim().max(120).default(""),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export const resetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const resetConfirmSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Das Passwort muss mindestens 8 Zeichen haben").max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200),
});

/* ------------------------------ settings -------------------------------- */

export const settingsUpdateSchema = z
  .object({
    name: z.string().trim().max(120),
    locale: z.string().max(10),
    timezone: z.string().max(60),
    weekStart: z.number().int().min(0).max(1),
    theme: z.enum(["system", "light", "dark"]),

    wakeTime: minute,
    sleepTime: minute,
    sleepDurationTarget: z.number().int().min(120).max(900),
    wakeTimeFreeDay: minute,
    sleepTimeFreeDay: minute,

    workDays: weekdays,
    workStart: minute,
    workEnd: minute,
    workBreakStart: minute,
    workBreakMinutes: z.number().int().min(0).max(240),

    bufferMinutes: z.number().int().min(0).max(120),
    minFreeMinutes: z.number().int().min(0).max(720),
    autoPlanEnabled: z.boolean(),
    autoPlanTasks: z.boolean(),
    autoPlanMeals: z.boolean(),
    autoPlanGoals: z.boolean(),
    planningGranularity: z.number().int().min(1).max(60),

    trainingDays: weekdays,
    trainingMinutes: z.number().int().min(10).max(300),
    preferredTrainingTime: minute,

    diet: dietSchema,
    mealsPerDay: z.number().int().min(1).max(8),
    calorieTarget: z.number().int().min(800).max(6000),
    proteinTarget: z.number().int().min(20).max(400),
    excludedFoods: z.array(z.string().max(80)).max(100),
    preferredProteins: z.array(z.string().max(80)).max(100),

    socialMediaLimit: z.number().int().min(0).max(600),
    netflixLimit: z.number().int().min(0).max(600),
    gamingLimit: z.number().int().min(0).max(600),

    notifyUpcoming: z.boolean(),
    notifyMeals: z.boolean(),
    notifyWorkout: z.boolean(),
    notifyGoals: z.boolean(),
    notifyLeadMinutes: z.number().int().min(0).max(120),
  })
  .partial();

/* ------------------------------ activities ------------------------------ */

export const activityCreateSchema = z.object({
  name: z.string().trim().min(1, "Name fehlt").max(120),
  category: categorySchema.default("other"),
  icon: z.string().max(8).default(""),
  description: z.string().max(500).default(""),
  mealSlot: mealSlotSchema.nullable().optional(),
  defaultMinutes: z.number().int().min(5).max(720).default(30),
  isFixed: z.boolean().default(false),
  isOptional: z.boolean().default(false),
  priority: z.number().int().min(1).max(4).default(3),
  autoPlan: z.boolean().default(true),
  archived: z.boolean().default(false),
  rule: z
    .object({
      weekdays: weekdays.default([1, 2, 3, 4, 5, 6, 7]),
      recurrence: recurrenceSchema.default("weekly"),
      preferredStart: minute.default(540),
      earliestStart: minute.default(0),
      latestStart: minute.default(1380),
      durationMinutes: z.number().int().min(5).max(720).nullable().default(null),
      enabled: z.boolean().default(true),
    })
    .optional(),
});

export const activityUpdateSchema = activityCreateSchema.partial();

/* -------------------------------- blocks -------------------------------- */

export const blockCreateSchema = z
  .object({
    day: dayString,
    title: z.string().trim().min(1).max(160),
    category: categorySchema.default("other"),
    icon: z.string().max(8).default(""),
    description: z.string().max(1000).default(""),
    notes: z.string().max(2000).default(""),
    startMinute: minute,
    endMinute: minute,
    priority: z.number().int().min(1).max(4).default(3),
    isFixed: z.boolean().default(false),
    activityId: uuid.nullable().optional(),
    taskId: uuid.nullable().optional(),
    goalId: uuid.nullable().optional(),
    mealId: uuid.nullable().optional(),
    workoutPlanId: uuid.nullable().optional(),
    routineId: uuid.nullable().optional(),
  })
  .refine((v) => v.endMinute > v.startMinute, {
    message: "Das Ende muss nach dem Start liegen",
    path: ["endMinute"],
  });

export const blockUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  category: categorySchema.optional(),
  icon: z.string().max(8).optional(),
  description: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
  startMinute: minute.optional(),
  endMinute: minute.optional(),
  status: blockStatusSchema.optional(),
  priority: z.number().int().min(1).max(4).optional(),
  isFixed: z.boolean().optional(),
});

export const blockMoveSchema = z.object({
  startMinute: minute,
  /** "single" moves only this block, "cascade" shifts the rest of the day. */
  mode: z.enum(["single", "cascade"]).default("single"),
});

export const planGenerateSchema = z.object({
  day: dayString,
  keepCompleted: z.boolean().default(true),
});

export const saveAsDefaultSchema = z.object({
  day: dayString,
  blockId: uuid.optional(),
});

/* --------------------------------- tasks -------------------------------- */

export const taskCreateSchema = z.object({
  title: z.string().trim().min(1, "Titel fehlt").max(200),
  description: z.string().max(2000).default(""),
  category: categorySchema.default("tasks"),
  priority: z.number().int().min(1).max(4).default(3),
  status: taskStatusSchema.default("open"),
  dueDate: dayString.nullable().optional(),
  estimateMinutes: z.number().int().min(5).max(600).default(30),
  recurrence: recurrenceSchema.default("none"),
  autoSchedule: z.boolean().default(false),
  notes: z.string().max(2000).default(""),
  goalId: uuid.nullable().optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial();

export const subtaskCreateSchema = z.object({
  taskId: uuid,
  title: z.string().trim().min(1).max(200),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export const subtaskUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  done: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

/* -------------------------------- calendar ------------------------------ */

export const eventCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(2000).default(""),
    location: z.string().max(200).default(""),
    category: categorySchema.default("other"),
    day: dayString,
    startMinute: minute.default(540),
    endMinute: minute.default(600),
    allDay: z.boolean().default(false),
    recurrence: recurrenceSchema.default("none"),
    recurrenceUntil: dayString.nullable().optional(),
    isFixed: z.boolean().default(true),
  })
  .refine((v) => v.allDay || v.endMinute > v.startMinute, {
    message: "Das Ende muss nach dem Start liegen",
    path: ["endMinute"],
  });

export const eventUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  category: categorySchema.optional(),
  day: dayString.optional(),
  startMinute: minute.optional(),
  endMinute: minute.optional(),
  allDay: z.boolean().optional(),
  recurrence: recurrenceSchema.optional(),
  recurrenceUntil: dayString.nullable().optional(),
  isFixed: z.boolean().optional(),
});

/* -------------------------------- routines ------------------------------ */

export const routineCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  icon: z.string().max(8).default(""),
  startMinute: minute.default(420),
  weekdays: weekdays.default([1, 2, 3, 4, 5, 6, 7]),
  enabled: z.boolean().default(true),
  autoPlan: z.boolean().default(true),
});

export const routineUpdateSchema = routineCreateSchema.partial();

export const routineStepCreateSchema = z.object({
  routineId: uuid,
  title: z.string().trim().min(1).max(160),
  durationMinutes: z.number().int().min(1).max(180).default(5),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export const routineStepUpdateSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  durationMinutes: z.number().int().min(1).max(180).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const routineCompleteSchema = z.object({
  routineId: uuid,
  day: dayString,
  completedSteps: z.array(uuid).max(100).default([]),
  done: z.boolean().default(false),
});

/* -------------------------------- fitness ------------------------------- */

export const exerciseCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  muscleGroup: z.string().max(80).default(""),
  equipmentName: z.string().max(80).default("Körpergewicht"),
  description: z.string().max(1000).default(""),
  defaultSets: z.number().int().min(1).max(20).default(3),
  defaultReps: z.number().int().min(1).max(200).default(10),
  defaultWeight: decimal.default("0"),
  defaultDurationSeconds: z.number().int().min(0).max(3600).default(0),
  restSeconds: z.number().int().min(0).max(600).default(90),
  difficulty: z.number().int().min(1).max(3).default(2),
  notes: z.string().max(1000).default(""),
  archived: z.boolean().default(false),
});

export const exerciseUpdateSchema = exerciseCreateSchema.partial();

export const equipmentCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  available: z.boolean().default(true),
});

export const equipmentUpdateSchema = equipmentCreateSchema.partial();

export const workoutPlanCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000).default(""),
  weekdays: weekdays.default([]),
  estimatedMinutes: z.number().int().min(10).max(300).default(60),
  archived: z.boolean().default(false),
  exercises: z
    .array(
      z.object({
        exerciseId: uuid,
        sets: z.number().int().min(1).max(20).default(3),
        reps: z.number().int().min(1).max(200).default(10),
        weight: decimal.default("0"),
        restSeconds: z.number().int().min(0).max(600).default(90),
      }),
    )
    .max(40)
    .optional(),
});

export const workoutPlanUpdateSchema = workoutPlanCreateSchema.partial();

export const workoutStartSchema = z.object({
  planId: uuid.nullable().optional(),
  name: z.string().trim().min(1).max(120),
  day: dayString,
});

export const workoutFinishSchema = z.object({
  durationMinutes: z.number().int().min(0).max(600).optional(),
  perceivedEffort: z.number().int().min(0).max(10).optional(),
  notes: z.string().max(2000).optional(),
  sets: z
    .array(
      z.object({
        exerciseId: uuid,
        setNumber: z.number().int().min(1).max(50),
        reps: z.number().int().min(0).max(500).default(0),
        weight: decimal.default("0"),
        durationSeconds: z.number().int().min(0).max(7200).default(0),
        done: z.boolean().default(true),
        notes: z.string().max(500).default(""),
      }),
    )
    .max(200)
    .default([]),
});

/* ------------------------------- nutrition ------------------------------ */

export const foodCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().max(60).default("Sonstiges"),
  unit: z.string().max(20).default("g"),
  referenceAmount: decimal.default("100"),
  kcal: decimal.default("0"),
  protein: decimal.default("0"),
  carbs: decimal.default("0"),
  fat: decimal.default("0"),
  isProteinSource: z.boolean().default(false),
  vegetarian: z.boolean().default(true),
  vegan: z.boolean().default(false),
  archived: z.boolean().default(false),
});

export const foodUpdateSchema = foodCreateSchema.partial();

export const mealCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slot: mealSlotSchema.default("lunch"),
  description: z.string().max(1000).default(""),
  prepMinutes: z.number().int().min(0).max(300).default(15),
  trainingDayOnly: z.boolean().default(false),
  restDayOnly: z.boolean().default(false),
  archived: z.boolean().default(false),
  ingredients: z
    .array(z.object({ foodId: uuid, amount: decimal }))
    .max(40)
    .optional(),
});

export const mealUpdateSchema = mealCreateSchema.partial();

export const mealPlanSetSchema = z.object({
  day: dayString,
  slot: mealSlotSchema,
  mealId: uuid.nullable(),
  startMinute: minute.optional(),
});

export const mealPlanGenerateSchema = z.object({
  from: dayString,
  days: z.number().int().min(1).max(31).default(7),
  overwrite: z.boolean().default(false),
});

export const shoppingGenerateSchema = z.object({
  from: dayString,
  to: dayString,
  name: z.string().max(120).optional(),
});

export const shoppingItemCreateSchema = z.object({
  listId: uuid,
  name: z.string().trim().min(1).max(120),
  category: z.string().max(60).default("Sonstiges"),
  amount: decimal.default("1"),
  unit: z.string().max(20).default("Stk"),
});

export const shoppingItemUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  category: z.string().max(60).optional(),
  amount: decimal.optional(),
  unit: z.string().max(20).optional(),
  checked: z.boolean().optional(),
});

/* --------------------------------- goals -------------------------------- */

export const goalCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).default(""),
  category: categorySchema.default("development"),
  priority: z.number().int().min(1).max(4).default(3),
  status: goalStatusSchema.default("active"),
  deadline: dayString.nullable().optional(),
  progress: z.number().int().min(0).max(100).default(0),
  weeklyMinutes: z.number().int().min(0).max(3000).default(300),
  autoPlan: z.boolean().default(true),
});

export const goalUpdateSchema = goalCreateSchema.partial();

export const milestoneCreateSchema = z.object({
  goalId: uuid,
  title: z.string().trim().min(1).max(200),
  dueDate: dayString.nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export const milestoneUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  done: z.boolean().optional(),
  dueDate: dayString.nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

/* -------------------------------- tracking ------------------------------ */

export const screenTimeSchema = z.object({
  day: dayString,
  app: z.string().trim().min(1).max(60),
  minutes: z.number().int().min(0).max(1440),
});

export const sleepLogSchema = z.object({
  day: dayString,
  minutes: z.number().int().min(0).max(1440),
  quality: z.number().int().min(0).max(5).default(0),
});

export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;
