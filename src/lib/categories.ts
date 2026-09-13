export const CATEGORY_META: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  sleep: { label: "Schlaf", color: "#6366f1", icon: "🌙" },
  work: { label: "Arbeit", color: "#0ea5e9", icon: "💼" },
  meal: { label: "Mahlzeit", color: "#f59e0b", icon: "🍽️" },
  fitness: { label: "Fitness", color: "#ef4444", icon: "🏋️" },
  routine: { label: "Routine", color: "#14b8a6", icon: "✨" },
  development: { label: "Weiterentwicklung", color: "#8b5cf6", icon: "📚" },
  chores: { label: "Haushalt", color: "#a8a29e", icon: "🧹" },
  tasks: { label: "Aufgaben", color: "#22c55e", icon: "✅" },
  leisure: { label: "Freizeit", color: "#ec4899", icon: "🍿" },
  social: { label: "Social Media", color: "#f472b6", icon: "📱" },
  relationship: { label: "Beziehung", color: "#fb7185", icon: "❤️" },
  health: { label: "Gesundheit", color: "#06b6d4", icon: "🧘" },
  other: { label: "Sonstiges", color: "#94a3b8", icon: "•" },
};

export function categoryMeta(category: string) {
  return CATEGORY_META[category] ?? CATEGORY_META.other;
}

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export const MEAL_SLOT_LABEL: Record<string, string> = {
  breakfast: "Frühstück",
  lunch: "Mittagessen",
  snack: "Snack",
  dinner: "Abendessen",
  late: "Spätes Essen",
};

export const STATUS_LABEL: Record<string, string> = {
  planned: "Geplant",
  active: "Aktuell",
  done: "Erledigt",
  skipped: "Übersprungen",
  moved: "Verschoben",
};

export const TASK_STATUS_LABEL: Record<string, string> = {
  open: "Offen",
  in_progress: "In Arbeit",
  done: "Erledigt",
  postponed: "Verschoben",
};

export const PRIORITY_LABEL: Record<number, string> = {
  1: "Sehr hoch",
  2: "Hoch",
  3: "Normal",
  4: "Niedrig",
};

export const RECURRENCE_LABEL: Record<string, string> = {
  none: "Einmalig",
  daily: "Täglich",
  weekdays: "Mo–Fr",
  weekly: "Wöchentlich",
  biweekly: "Alle 2 Wochen",
  monthly: "Monatlich",
};
