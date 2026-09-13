import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  activities,
  activityRules,
  equipment,
  exercises,
  foods,
  mealIngredients,
  meals,
  routineSteps,
  routines,
  settings as settingsTable,
  users,
  workoutPlanExercises,
  workoutPlans,
  goals,
  goalMilestones,
  tasks,
} from "@/db/schema";

type ActivitySeed = {
  name: string;
  category: (typeof activities.$inferInsert)["category"];
  icon: string;
  minutes: number;
  fixed: boolean;
  priority: number;
  preferred: number;
  earliest: number;
  latest: number;
  weekdays: number[];
  optional?: boolean;
  mealSlot?: (typeof activities.$inferInsert)["mealSlot"];
  description?: string;
  autoPlan?: boolean;
};

const T = (h: number, m = 0) => h * 60 + m;
const WORKDAYS = [1, 2, 3, 4, 5];
const ALL = [1, 2, 3, 4, 5, 6, 7];

/** §50 — the starting day structure. Every value stays editable afterwards. */
const ACTIVITY_SEED: ActivitySeed[] = [
  {
    name: "Frühstück",
    category: "meal",
    icon: "🥣",
    minutes: 30,
    fixed: false,
    priority: 2,
    preferred: T(7, 30),
    earliest: T(6, 30),
    latest: T(9, 0),
    weekdays: ALL,
    mealSlot: "breakfast",
  },
  {
    name: "Arbeit (Vormittag)",
    category: "work",
    icon: "💼",
    minutes: 180,
    fixed: true,
    priority: 1,
    preferred: T(9, 0),
    earliest: T(9, 0),
    latest: T(9, 0),
    weekdays: WORKDAYS,
    description: "Fixer Arbeitsblock",
  },
  {
    name: "Mittagspause",
    category: "meal",
    icon: "🍽️",
    minutes: 30,
    fixed: true,
    priority: 1,
    preferred: T(12, 0),
    earliest: T(12, 0),
    latest: T(12, 0),
    weekdays: WORKDAYS,
    mealSlot: "lunch",
  },
  {
    name: "Arbeit (Nachmittag)",
    category: "work",
    icon: "💼",
    minutes: 240,
    fixed: true,
    priority: 1,
    preferred: T(12, 30),
    earliest: T(12, 30),
    latest: T(12, 30),
    weekdays: WORKDAYS,
    description: "Fixer Arbeitsblock",
  },
  {
    name: "Training",
    category: "fitness",
    icon: "🏋️",
    minutes: 60,
    fixed: false,
    priority: 2,
    preferred: T(17, 0),
    earliest: T(16, 0),
    latest: T(20, 0),
    weekdays: [1, 2, 4, 5],
    description: "Flexibel ±60 Minuten",
  },
  {
    name: "Duschen / Erholung",
    category: "health",
    icon: "🚿",
    minutes: 30,
    fixed: false,
    priority: 2,
    preferred: T(18, 0),
    earliest: T(16, 30),
    latest: T(21, 0),
    weekdays: ALL,
  },
  {
    name: "Abendessen",
    category: "meal",
    icon: "🍲",
    minutes: 30,
    fixed: false,
    priority: 2,
    preferred: T(18, 30),
    earliest: T(17, 30),
    latest: T(21, 0),
    weekdays: ALL,
    mealSlot: "dinner",
  },
  {
    name: "Weiterentwicklung",
    category: "development",
    icon: "📚",
    minutes: 60,
    fixed: false,
    priority: 3,
    preferred: T(19, 0),
    earliest: T(17, 0),
    latest: T(21, 0),
    weekdays: ALL,
  },
  {
    name: "Private Aufgaben",
    category: "tasks",
    icon: "📝",
    minutes: 30,
    fixed: false,
    priority: 3,
    preferred: T(20, 0),
    earliest: T(17, 0),
    latest: T(21, 30),
    weekdays: ALL,
  },
  {
    name: "Haushalt",
    category: "chores",
    icon: "🧹",
    minutes: 30,
    fixed: false,
    priority: 3,
    preferred: T(17, 30),
    earliest: T(9, 0),
    latest: T(21, 0),
    weekdays: [2, 4, 6],
    optional: true,
  },
  {
    name: "Social Media",
    category: "social",
    icon: "📱",
    minutes: 45,
    fixed: false,
    priority: 4,
    preferred: T(20, 30),
    earliest: T(17, 0),
    latest: T(22, 0),
    weekdays: ALL,
    optional: true,
  },
  {
    name: "Netflix / Freizeit",
    category: "leisure",
    icon: "🍿",
    minutes: 75,
    fixed: false,
    priority: 4,
    preferred: T(21, 15),
    earliest: T(18, 0),
    latest: T(22, 15),
    weekdays: ALL,
    optional: true,
  },
];

const EQUIPMENT_SEED = [
  "Körpergewicht",
  "Kurzhanteln",
  "Klimmzugstange",
  "Widerstandsbänder",
  "Calisthenics",
];

type ExerciseSeed = {
  name: string;
  muscle: string;
  equipment: string;
  sets: number;
  reps: number;
  weight?: string;
  rest?: number;
  difficulty?: number;
};

const EXERCISE_SEED: ExerciseSeed[] = [
  { name: "Liegestütze", muscle: "Brust", equipment: "Körpergewicht", sets: 4, reps: 12 },
  { name: "Kurzhantel-Rudern", muscle: "Rücken", equipment: "Kurzhanteln", sets: 4, reps: 10, weight: "15" },
  { name: "Schulterdrücken", muscle: "Schultern", equipment: "Kurzhanteln", sets: 3, reps: 10, weight: "12" },
  { name: "Seitheben", muscle: "Schultern", equipment: "Kurzhanteln", sets: 3, reps: 14, weight: "7" },
  { name: "Bizepscurls", muscle: "Bizeps", equipment: "Kurzhanteln", sets: 3, reps: 12, weight: "12" },
  { name: "Trizeps-Dips", muscle: "Trizeps", equipment: "Körpergewicht", sets: 3, reps: 12 },
  { name: "Klimmzüge", muscle: "Rücken", equipment: "Klimmzugstange", sets: 4, reps: 8, difficulty: 3 },
  { name: "Kniebeugen", muscle: "Beine", equipment: "Körpergewicht", sets: 4, reps: 15 },
  { name: "Ausfallschritte", muscle: "Beine", equipment: "Kurzhanteln", sets: 3, reps: 12, weight: "12" },
  { name: "Rumänisches Kreuzheben", muscle: "Beine", equipment: "Kurzhanteln", sets: 3, reps: 12, weight: "18" },
  { name: "Wadenheben", muscle: "Waden", equipment: "Körpergewicht", sets: 3, reps: 20 },
  { name: "Bulgarian Split Squat", muscle: "Beine", equipment: "Kurzhanteln", sets: 3, reps: 10, weight: "12", difficulty: 3 },
  { name: "Plank", muscle: "Rumpf", equipment: "Körpergewicht", sets: 3, reps: 1 },
  { name: "Hollow Body Hold", muscle: "Rumpf", equipment: "Calisthenics", sets: 3, reps: 1 },
  { name: "Face Pulls (Band)", muscle: "Schultern", equipment: "Widerstandsbänder", sets: 3, reps: 15 },
  { name: "Pike Push-ups", muscle: "Schultern", equipment: "Körpergewicht", sets: 3, reps: 10, difficulty: 3 },
];

/** §51 — the starting training week. */
const WORKOUT_SEED: { name: string; weekdays: number[]; exercises: string[] }[] = [
  {
    name: "Oberkörper A",
    weekdays: [1],
    exercises: ["Liegestütze", "Kurzhantel-Rudern", "Schulterdrücken", "Seitheben", "Bizepscurls", "Trizeps-Dips"],
  },
  {
    name: "Unterkörper A",
    weekdays: [2],
    exercises: ["Kniebeugen", "Rumänisches Kreuzheben", "Ausfallschritte", "Wadenheben", "Plank"],
  },
  {
    name: "Oberkörper B",
    weekdays: [4],
    exercises: ["Klimmzüge", "Pike Push-ups", "Kurzhantel-Rudern", "Face Pulls (Band)", "Bizepscurls", "Trizeps-Dips"],
  },
  {
    name: "Unterkörper B",
    weekdays: [5],
    exercises: ["Bulgarian Split Squat", "Kniebeugen", "Rumänisches Kreuzheben", "Wadenheben", "Hollow Body Hold"],
  },
];

type FoodSeed = {
  name: string;
  category: string;
  unit: string;
  ref: string;
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
  proteinSource?: boolean;
  vegan?: boolean;
};

/** §27/§28 — vegetarian staples with realistic per-100 g values. */
const FOOD_SEED: FoodSeed[] = [
  { name: "Haferflocken", category: "Getreide", unit: "g", ref: "100", kcal: "372", protein: "13.5", carbs: "58.7", fat: "7", vegan: true },
  { name: "Skyr", category: "Milchprodukte", unit: "g", ref: "100", kcal: "63", protein: "11", carbs: "4", fat: "0.2", proteinSource: true },
  { name: "Magerquark", category: "Milchprodukte", unit: "g", ref: "100", kcal: "67", protein: "12", carbs: "4.1", fat: "0.3", proteinSource: true },
  { name: "Naturjoghurt", category: "Milchprodukte", unit: "g", ref: "100", kcal: "61", protein: "3.5", carbs: "4.7", fat: "3.3", proteinSource: true },
  { name: "Milch 1,5 %", category: "Milchprodukte", unit: "ml", ref: "100", kcal: "47", protein: "3.4", carbs: "4.9", fat: "1.5", proteinSource: true },
  { name: "Mozzarella", category: "Milchprodukte", unit: "g", ref: "100", kcal: "254", protein: "18", carbs: "1.5", fat: "20", proteinSource: true },
  { name: "Gouda", category: "Milchprodukte", unit: "g", ref: "100", kcal: "356", protein: "25", carbs: "0", fat: "28", proteinSource: true },
  { name: "Eier", category: "Eier", unit: "Stk", ref: "1", kcal: "78", protein: "6.5", carbs: "0.6", fat: "5.3", proteinSource: true },
  { name: "Tofu natur", category: "Fleischersatz", unit: "g", ref: "100", kcal: "144", protein: "15.7", carbs: "1.9", fat: "8.7", proteinSource: true, vegan: true },
  { name: "Tempeh", category: "Fleischersatz", unit: "g", ref: "100", kcal: "192", protein: "20.3", carbs: "7.6", fat: "10.8", proteinSource: true, vegan: true },
  { name: "Vegetarisches Hack", category: "Fleischersatz", unit: "g", ref: "100", kcal: "160", protein: "17", carbs: "5", fat: "8", proteinSource: true, vegan: true },
  { name: "Rote Linsen", category: "Hülsenfrüchte", unit: "g", ref: "100", kcal: "347", protein: "24.6", carbs: "52", fat: "1.5", proteinSource: true, vegan: true },
  { name: "Kichererbsen (gekocht)", category: "Hülsenfrüchte", unit: "g", ref: "100", kcal: "139", protein: "7.3", carbs: "17.8", fat: "2.6", proteinSource: true, vegan: true },
  { name: "Kidneybohnen (gekocht)", category: "Hülsenfrüchte", unit: "g", ref: "100", kcal: "118", protein: "8", carbs: "15", fat: "0.5", proteinSource: true, vegan: true },
  { name: "Reis (roh)", category: "Getreide", unit: "g", ref: "100", kcal: "351", protein: "7", carbs: "77", fat: "0.6", vegan: true },
  { name: "Vollkornbrot", category: "Getreide", unit: "g", ref: "100", kcal: "213", protein: "7.5", carbs: "35", fat: "3", vegan: true },
  { name: "Banane", category: "Obst", unit: "Stk", ref: "1", kcal: "105", protein: "1.3", carbs: "27", fat: "0.4", vegan: true },
  { name: "Beeren (TK)", category: "Tiefkühl", unit: "g", ref: "100", kcal: "45", protein: "1", carbs: "8", fat: "0.4", vegan: true },
  { name: "Brokkoli", category: "Gemüse", unit: "g", ref: "100", kcal: "34", protein: "2.8", carbs: "7", fat: "0.4", vegan: true },
  { name: "Paprika", category: "Gemüse", unit: "g", ref: "100", kcal: "31", protein: "1", carbs: "6", fat: "0.3", vegan: true },
  { name: "Tomaten", category: "Gemüse", unit: "g", ref: "100", kcal: "18", protein: "0.9", carbs: "3.9", fat: "0.2", vegan: true },
  { name: "Gemüsemischung", category: "Gemüse", unit: "g", ref: "100", kcal: "40", protein: "2", carbs: "6", fat: "0.5", vegan: true },
  { name: "Olivenöl", category: "Sonstiges", unit: "ml", ref: "10", kcal: "88", protein: "0", carbs: "0", fat: "10", vegan: true },
];

/** §52 — starting meals, all vegetarian. */
const MEAL_SEED: {
  name: string;
  slot: (typeof meals.$inferInsert)["slot"];
  prep: number;
  ingredients: { food: string; amount: string }[];
}[] = [
  {
    name: "Haferflocken mit Skyr & Beeren",
    slot: "breakfast",
    prep: 10,
    ingredients: [
      { food: "Haferflocken", amount: "80" },
      { food: "Skyr", amount: "200" },
      { food: "Banane", amount: "1" },
      { food: "Beeren (TK)", amount: "100" },
    ],
  },
  {
    name: "Reis mit Tofu & Gemüse",
    slot: "lunch",
    prep: 25,
    ingredients: [
      { food: "Reis (roh)", amount: "100" },
      { food: "Tofu natur", amount: "200" },
      { food: "Brokkoli", amount: "150" },
      { food: "Paprika", amount: "100" },
      { food: "Olivenöl", amount: "10" },
    ],
  },
  {
    name: "Mozzarella mit Tomaten",
    slot: "snack",
    prep: 5,
    ingredients: [
      { food: "Mozzarella", amount: "125" },
      { food: "Tomaten", amount: "150" },
    ],
  },
  {
    name: "Omelett mit Vollkornbrot",
    slot: "dinner",
    prep: 15,
    ingredients: [
      { food: "Eier", amount: "3" },
      { food: "Vollkornbrot", amount: "80" },
      { food: "Gemüsemischung", amount: "150" },
      { food: "Gouda", amount: "30" },
    ],
  },
  {
    name: "Linsencurry mit Reis",
    slot: "dinner",
    prep: 30,
    ingredients: [
      { food: "Rote Linsen", amount: "120" },
      { food: "Reis (roh)", amount: "80" },
      { food: "Gemüsemischung", amount: "200" },
      { food: "Olivenöl", amount: "10" },
    ],
  },
  {
    name: "Kichererbsen-Bowl",
    slot: "lunch",
    prep: 20,
    ingredients: [
      { food: "Kichererbsen (gekocht)", amount: "200" },
      { food: "Reis (roh)", amount: "80" },
      { food: "Paprika", amount: "100" },
      { food: "Tomaten", amount: "100" },
    ],
  },
];

const ROUTINE_SEED: {
  name: string;
  icon: string;
  start: number;
  steps: { title: string; minutes: number }[];
}[] = [
  {
    name: "Morgenroutine",
    icon: "🌅",
    start: T(7, 0),
    steps: [
      { title: "Aufstehen", minutes: 5 },
      { title: "Wasser trinken", minutes: 5 },
      { title: "Badezimmer", minutes: 15 },
      { title: "Bett machen", minutes: 5 },
    ],
  },
  {
    name: "Abendroutine",
    icon: "🌙",
    start: T(22, 30),
    steps: [
      { title: "Küche aufräumen", minutes: 10 },
      { title: "Tag reflektieren", minutes: 5 },
      { title: "Badezimmer", minutes: 10 },
      { title: "Lesen", minutes: 5 },
    ],
  },
];

/**
 * Creates the starting data set for a fresh account. Idempotent: it only runs
 * once per user (guarded by users.seededAt).
 */
export async function seedUser(userId: string): Promise<void> {
  const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!existing[0] || existing[0].seededAt) return;

  await db
    .insert(settingsTable)
    .values({ userId })
    .onConflictDoNothing({ target: settingsTable.userId });

  /* activities + rules */
  for (const [index, a] of ACTIVITY_SEED.entries()) {
    const [activity] = await db
      .insert(activities)
      .values({
        userId,
        name: a.name,
        category: a.category,
        icon: a.icon,
        description: a.description ?? "",
        mealSlot: a.mealSlot ?? null,
        defaultMinutes: a.minutes,
        isFixed: a.fixed,
        isOptional: a.optional ?? false,
        priority: a.priority,
        autoPlan: a.autoPlan ?? true,
      })
      .returning();

    await db.insert(activityRules).values({
      userId,
      activityId: activity.id,
      weekdays: a.weekdays,
      recurrence: "weekly",
      preferredStart: a.preferred,
      earliestStart: a.earliest,
      latestStart: a.latest,
      durationMinutes: a.minutes,
      sortOrder: index,
    });
  }

  /* routines */
  for (const r of ROUTINE_SEED) {
    const [routine] = await db
      .insert(routines)
      .values({ userId, name: r.name, icon: r.icon, startMinute: r.start })
      .returning();
    await db.insert(routineSteps).values(
      r.steps.map((s, i) => ({
        userId,
        routineId: routine.id,
        title: s.title,
        durationMinutes: s.minutes,
        sortOrder: i,
      })),
    );
  }

  /* fitness */
  await db.insert(equipment).values(EQUIPMENT_SEED.map((name) => ({ userId, name })));

  const exerciseRows = await db
    .insert(exercises)
    .values(
      EXERCISE_SEED.map((e) => ({
        userId,
        name: e.name,
        muscleGroup: e.muscle,
        equipmentName: e.equipment,
        defaultSets: e.sets,
        defaultReps: e.reps,
        defaultWeight: e.weight ?? "0",
        restSeconds: e.rest ?? 90,
        difficulty: e.difficulty ?? 2,
      })),
    )
    .returning();

  const exerciseByName = new Map(exerciseRows.map((e) => [e.name, e]));

  for (const w of WORKOUT_SEED) {
    const [plan] = await db
      .insert(workoutPlans)
      .values({ userId, name: w.name, weekdays: w.weekdays, estimatedMinutes: 60 })
      .returning();

    const items = w.exercises
      .map((name, i) => {
        const ex = exerciseByName.get(name);
        if (!ex) return null;
        return {
          userId,
          planId: plan.id,
          exerciseId: ex.id,
          sets: ex.defaultSets,
          reps: ex.defaultReps,
          weight: ex.defaultWeight,
          restSeconds: ex.restSeconds,
          sortOrder: i,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (items.length > 0) await db.insert(workoutPlanExercises).values(items);
  }

  /* nutrition */
  const foodRows = await db
    .insert(foods)
    .values(
      FOOD_SEED.map((f) => ({
        userId,
        name: f.name,
        category: f.category,
        unit: f.unit,
        referenceAmount: f.ref,
        kcal: f.kcal,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        isProteinSource: f.proteinSource ?? false,
        vegetarian: true,
        vegan: f.vegan ?? false,
      })),
    )
    .returning();

  const foodByName = new Map(foodRows.map((f) => [f.name, f]));

  for (const m of MEAL_SEED) {
    const [meal] = await db
      .insert(meals)
      .values({ userId, name: m.name, slot: m.slot, prepMinutes: m.prep })
      .returning();

    const ingredients = m.ingredients
      .map((ing, i) => {
        const food = foodByName.get(ing.food);
        if (!food) return null;
        return { userId, mealId: meal.id, foodId: food.id, amount: ing.amount, sortOrder: i };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (ingredients.length > 0) await db.insert(mealIngredients).values(ingredients);
  }

  /* a starter goal and task so the pages are not empty */
  const [goal] = await db
    .insert(goals)
    .values({
      userId,
      title: "Video Editing verbessern",
      description: "Regelmäßig an eigenen Projekten arbeiten und Schnitt-Techniken lernen.",
      category: "development",
      weeklyMinutes: 300,
      priority: 2,
    })
    .returning();

  await db.insert(goalMilestones).values([
    { userId, goalId: goal.id, title: "Grundlagen-Kurs abschließen", sortOrder: 0 },
    { userId, goalId: goal.id, title: "Erstes eigenes Projekt schneiden", sortOrder: 1 },
    { userId, goalId: goal.id, title: "Farbkorrektur verstehen", sortOrder: 2 },
  ]);

  await db.insert(tasks).values([
    {
      userId,
      title: "Wocheneinkauf erledigen",
      category: "chores",
      priority: 2,
      estimateMinutes: 60,
      autoSchedule: false,
    },
    {
      userId,
      title: "Tagesplan an eigene Bedürfnisse anpassen",
      description: "Einstellungen öffnen und Aufsteh-, Arbeits- und Schlafenszeiten prüfen.",
      category: "tasks",
      priority: 1,
      estimateMinutes: 20,
      autoSchedule: false,
    },
  ]);

  await db.update(users).set({ seededAt: new Date() }).where(eq(users.id, userId));
}
