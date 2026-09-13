/** Shared client-side shapes for API payloads. */

export type Settings = {
  id: string;
  locale: string;
  timezone: string;
  weekStart: number;
  theme: string;
  wakeTime: number;
  sleepTime: number;
  sleepDurationTarget: number;
  wakeTimeFreeDay: number;
  sleepTimeFreeDay: number;
  workDays: number[];
  workStart: number;
  workEnd: number;
  workBreakStart: number;
  workBreakMinutes: number;
  bufferMinutes: number;
  minFreeMinutes: number;
  autoPlanEnabled: boolean;
  autoPlanTasks: boolean;
  autoPlanMeals: boolean;
  autoPlanGoals: boolean;
  planningGranularity: number;
  trainingDays: number[];
  trainingMinutes: number;
  preferredTrainingTime: number;
  diet: string;
  mealsPerDay: number;
  calorieTarget: number;
  proteinTarget: number;
  excludedFoods: string[];
  preferredProteins: string[];
  socialMediaLimit: number;
  netflixLimit: number;
  gamingLimit: number;
  notifyUpcoming: boolean;
  notifyMeals: boolean;
  notifyWorkout: boolean;
  notifyGoals: boolean;
  notifyLeadMinutes: number;
};

export type Block = {
  id: string;
  planId: string;
  activityId: string | null;
  taskId: string | null;
  goalId: string | null;
  workoutPlanId: string | null;
  mealId: string | null;
  eventId: string | null;
  routineId: string | null;
  title: string;
  category: string;
  icon: string;
  description: string;
  notes: string;
  startMinute: number;
  endMinute: number;
  status: "planned" | "active" | "done" | "skipped" | "moved";
  priority: number;
  isFixed: boolean;
};

export type DayPayload = {
  day: string;
  weekday: number;
  settings: Settings;
  plan: { id: string; day: string; generatedAt: string | null; note: string };
  blocks: Block[];
  events: CalendarEvent[];
  meals: PlannedMeal[];
  workout: WorkoutPlan | null;
  workoutSessions: WorkoutSession[];
  routines: Routine[];
};

export type PlannedMeal = {
  id: string;
  slot: string;
  mealId: string;
  startMinute: number;
  eaten: boolean;
  name: string;
  prepMinutes: number;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  day: string;
  startMinute: number;
  endMinute: number;
  allDay: boolean;
  recurrence: string;
  recurrenceUntil: string | null;
  isFixed: boolean;
};

export type Subtask = { id: string; taskId: string; title: string; done: boolean; sortOrder: number };

export type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: number;
  status: "open" | "in_progress" | "done" | "postponed";
  dueDate: string | null;
  estimateMinutes: number;
  recurrence: string;
  autoSchedule: boolean;
  notes: string;
  goalId: string | null;
  completedAt: string | null;
  subtasks: Subtask[];
};

export type RoutineStep = {
  id: string;
  routineId: string;
  title: string;
  durationMinutes: number;
  sortOrder: number;
};

export type Routine = {
  id: string;
  name: string;
  icon: string;
  startMinute: number;
  weekdays: number[];
  enabled: boolean;
  autoPlan: boolean;
  steps?: RoutineStep[];
};

export type ActivityRule = {
  id: string;
  activityId: string;
  weekdays: number[];
  recurrence: string;
  preferredStart: number;
  earliestStart: number;
  latestStart: number;
  durationMinutes: number | null;
  enabled: boolean;
  sortOrder: number;
};

export type Activity = {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  mealSlot: string | null;
  defaultMinutes: number;
  isFixed: boolean;
  isOptional: boolean;
  priority: number;
  autoPlan: boolean;
  archived: boolean;
  rules: ActivityRule[];
};

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  equipmentName: string;
  description: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: string;
  defaultDurationSeconds: number;
  restSeconds: number;
  difficulty: number;
  notes: string;
  archived: boolean;
};

export type WorkoutPlanItem = {
  id: string;
  planId: string;
  exerciseId: string;
  sets: number;
  reps: number;
  weight: string;
  restSeconds: number;
  sortOrder: number;
  name: string;
  muscleGroup: string;
  equipmentName: string;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  description: string;
  weekdays: number[];
  estimatedMinutes: number;
  archived: boolean;
  items?: WorkoutPlanItem[];
};

export type WorkoutSet = {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: string;
  durationSeconds: number;
  done: boolean;
  notes: string;
};

export type WorkoutSession = {
  id: string;
  planId: string | null;
  name: string;
  day: string;
  startedAt: string;
  finishedAt: string | null;
  durationMinutes: number;
  perceivedEffort: number;
  notes: string;
  sets?: WorkoutSet[];
};

export type Food = {
  id: string;
  name: string;
  category: string;
  unit: string;
  referenceAmount: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  isProteinSource: boolean;
  vegetarian: boolean;
  vegan: boolean;
  archived: boolean;
};

export type MealIngredient = {
  id: string;
  mealId: string;
  foodId: string;
  amount: string;
  sortOrder: number;
  name: string;
  unit: string;
  category: string;
  referenceAmount: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
};

export type Meal = {
  id: string;
  name: string;
  slot: string;
  description: string;
  prepMinutes: number;
  trainingDayOnly: boolean;
  restDayOnly: boolean;
  archived: boolean;
  ingredients: MealIngredient[];
  nutrition: { kcal: number; protein: number; carbs: number; fat: number };
};

export type ShoppingItem = {
  id: string;
  listId: string;
  foodId: string | null;
  name: string;
  category: string;
  amount: string;
  unit: string;
  checked: boolean;
  manual: boolean;
};

export type ShoppingList = {
  id: string;
  name: string;
  fromDay: string | null;
  toDay: string | null;
  createdAt: string;
  items: ShoppingItem[];
};

export type Milestone = {
  id: string;
  goalId: string;
  title: string;
  done: boolean;
  dueDate: string | null;
  sortOrder: number;
};

export type Goal = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: number;
  status: "active" | "paused" | "done" | "archived";
  deadline: string | null;
  progress: number;
  weeklyMinutes: number;
  autoPlan: boolean;
  milestones: Milestone[];
};

export type GenerateResponse = {
  day: string;
  blocks: unknown[];
  conflicts: { kind: string; message: string; items: { key: string; title: string }[] }[];
  unplaced: { key: string; title: string; reason: string }[];
  freeMinutes: number;
  plannedMinutes: number;
  byCategory: Record<string, number>;
};
