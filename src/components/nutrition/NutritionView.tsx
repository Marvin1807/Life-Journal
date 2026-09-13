"use client";

import { useMemo, useState } from "react";
import {
  Button,
  DangerButton,
  Card,
  Empty,
  ErrorNote,
  Field,
  Input,
  NumberInput,
  Select,
  Sheet,
  Spinner,
  Textarea,
  Toggle,
} from "@/components/ui";
import { useResource } from "@/hooks/useResource";
import { api, ApiClientError } from "@/lib/client";
import { MEAL_SLOT_LABEL } from "@/lib/categories";
import {
  addDays,
  formatDateShort,
  rangeDays,
  startOfWeek,
  todayInTimezone,
  weekdayLabel,
  weekdayOf,
} from "@/lib/time";
import type { Food, Meal, ShoppingList } from "@/lib/types";

type Tab = "plan" | "meals" | "foods" | "shopping";

type MealPlanPayload = {
  from: string;
  to: string;
  entries: {
    id: string;
    day: string;
    slot: string;
    mealId: string;
    startMinute: number;
    eaten: boolean;
    name: string;
  }[];
};

const SLOTS = ["breakfast", "lunch", "snack", "dinner"] as const;

export function NutritionView() {
  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);
  const today = todayInTimezone(tz);
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(today, 1));
  const [tab, setTab] = useState<Tab>("plan");

  const weekEnd = addDays(weekAnchor, 6);
  const mealPlan = useResource<MealPlanPayload>(`/api/meal-plans?from=${weekAnchor}&to=${weekEnd}`);
  const meals = useResource<Meal[]>("/api/meals");
  const foods = useResource<Food[]>("/api/foods");
  const lists = useResource<ShoppingList[]>("/api/shopping-lists");

  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [creatingMeal, setCreatingMeal] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [creatingFood, setCreatingFood] = useState(false);
  const [picking, setPicking] = useState<{ day: string; slot: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generatePlan() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/meal-plans/generate", { from: weekAnchor, days: 7, overwrite: false });
      void mealPlan.reload();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Planung fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function generateShopping() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/shopping-lists/generate", { from: weekAnchor, to: weekEnd });
      void lists.reload();
      setTab("shopping");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Einkaufsliste fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function assign(day: string, slot: string, mealId: string | null) {
    try {
      await api.put("/api/meal-plans", { day, slot, mealId });
      void mealPlan.reload();
      setPicking(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    }
  }

  if (meals.loading && !meals.data) {
    return (
      <div className="flex justify-center py-20" style={{ color: "var(--ink-3)" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[24px] font-semibold tracking-tight">Ernährung</h1>
      </header>

      {error && <ErrorNote>{error}</ErrorNote>}

      {/* Four tabs have to be reachable without horizontal scrolling on a phone. */}
      <div className="grid grid-cols-4 gap-1.5 sm:flex">
        {(["plan", "meals", "foods", "shopping"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="truncate rounded-full px-2 py-1.5 text-[12px] font-medium sm:px-3.5 sm:text-[13px]"
            style={{
              background: tab === t ? "var(--accent)" : "var(--surface-2)",
              color: tab === t ? "var(--accent-ink)" : "var(--ink-2)",
            }}
          >
            {t === "plan"
              ? "Woche"
              : t === "meals"
                ? "Gerichte"
                : t === "foods"
                  ? "Zutaten"
                  : "Einkauf"}
          </button>
        ))}
      </div>

      {tab === "plan" && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Vorherige Woche"
                onClick={() => setWeekAnchor((w) => addDays(w, -7))}
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}
              >
                ‹
              </button>
              <span className="text-[13px]" style={{ color: "var(--ink-2)" }}>
                {formatDateShort(weekAnchor)} – {formatDateShort(weekEnd)}
              </span>
              <button
                type="button"
                aria-label="Nächste Woche"
                onClick={() => setWeekAnchor((w) => addDays(w, 7))}
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}
              >
                ›
              </button>
            </div>
            <Button size="sm" busy={busy} onClick={generatePlan}>
              Woche planen
            </Button>
          </div>

          {rangeDays(weekAnchor, weekEnd).map((day) => {
            const entries = (mealPlan.data?.entries ?? []).filter((e) => e.day === day);
            return (
              <Card key={day} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-[14px] font-semibold">
                    {weekdayLabel(weekdayOf(day), true)}
                    {day === today && (
                      <span className="ml-2 text-[12px]" style={{ color: "var(--accent)" }}>
                        Heute
                      </span>
                    )}
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
                    {formatDateShort(day)}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {SLOTS.map((slot) => {
                    const entry = entries.find((e) => e.slot === slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setPicking({ day, slot })}
                        className="flex items-center gap-3 rounded-lg px-2 py-2 text-left"
                        style={{ background: "var(--surface-2)" }}
                      >
                        <span className="w-[86px] shrink-0 text-[12px]" style={{ color: "var(--ink-3)" }}>
                          {MEAL_SLOT_LABEL[slot]}
                        </span>
                        <span
                          className="min-w-0 flex-1 truncate text-[14px]"
                          style={{ color: entry ? "var(--ink)" : "var(--ink-3)" }}
                        >
                          {entry ? entry.name : "Nicht geplant"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            );
          })}

          <Button busy={busy} onClick={generateShopping}>
            Einkaufsliste für diese Woche erstellen
          </Button>
        </section>
      )}

      {tab === "meals" && (
        <section className="flex flex-col gap-2">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCreatingMeal(true)}>
              Neue Mahlzeit
            </Button>
          </div>
          {(meals.data ?? []).length === 0 ? (
            <Empty title="Noch keine Mahlzeiten" hint="Lege Mahlzeiten aus deinen Lebensmitteln zusammen." />
          ) : (
            (meals.data ?? []).map((meal) => (
              <button
                key={meal.id}
                type="button"
                onClick={() => setEditingMeal(meal)}
                className="card flex items-center gap-3 px-3.5 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{meal.name}</span>
                  <span className="block truncate text-[12px]" style={{ color: "var(--ink-3)" }}>
                    {MEAL_SLOT_LABEL[meal.slot]} · {meal.nutrition.kcal} kcal · {meal.nutrition.protein} g
                    Protein · {meal.ingredients.length} Zutaten
                  </span>
                </span>
              </button>
            ))
          )}
        </section>
      )}

      {tab === "foods" && (
        <section className="flex flex-col gap-2">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCreatingFood(true)}>
              Neues Lebensmittel
            </Button>
          </div>
          {(foods.data ?? []).map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => setEditingFood(food)}
              className="card flex items-center gap-3 px-3.5 py-3 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium">
                  {food.name}
                  {food.isProteinSource && (
                    <span className="ml-2 text-[11px]" style={{ color: "var(--accent)" }}>
                      Proteinquelle
                    </span>
                  )}
                </span>
                <span className="block truncate text-[12px]" style={{ color: "var(--ink-3)" }}>
                  {food.category} · {food.kcal} kcal / {food.referenceAmount} {food.unit} · {food.protein} g
                  Protein
                </span>
              </span>
            </button>
          ))}
        </section>
      )}

      {tab === "shopping" && (
        <ShoppingView
          lists={lists.data ?? []}
          onChanged={() => void lists.reload()}
          onGenerate={generateShopping}
          busy={busy}
        />
      )}

      {/* Meal picker for one day + slot */}
      <Sheet
        open={picking !== null}
        onClose={() => setPicking(null)}
        title={picking ? `${MEAL_SLOT_LABEL[picking.slot]} planen` : ""}
      >
        {picking && (
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => assign(picking.day, picking.slot, null)}
              className="rounded-xl px-3.5 py-3 text-left text-[14px]"
              style={{ background: "var(--surface-2)", color: "var(--ink-2)" }}
            >
              Nichts planen
            </button>
            {(meals.data ?? [])
              .filter((m) => !m.archived)
              .map((meal) => (
                <button
                  key={meal.id}
                  type="button"
                  onClick={() => assign(picking.day, picking.slot, meal.id)}
                  className="rounded-xl px-3.5 py-3 text-left"
                  style={{
                    background: meal.slot === picking.slot ? "var(--accent-soft)" : "var(--surface-2)",
                  }}
                >
                  <span className="block text-[14px] font-medium">{meal.name}</span>
                  <span className="block text-[12px]" style={{ color: "var(--ink-3)" }}>
                    {MEAL_SLOT_LABEL[meal.slot]} · {meal.nutrition.kcal} kcal · {meal.nutrition.protein} g
                    Protein
                  </span>
                </button>
              ))}
          </div>
        )}
      </Sheet>

      <MealSheet
        open={creatingMeal || editingMeal !== null}
        meal={editingMeal}
        foods={foods.data ?? []}
        onClose={() => {
          setCreatingMeal(false);
          setEditingMeal(null);
        }}
        onSaved={() => {
          setCreatingMeal(false);
          setEditingMeal(null);
          void meals.reload();
        }}
      />

      <FoodSheet
        open={creatingFood || editingFood !== null}
        food={editingFood}
        onClose={() => {
          setCreatingFood(false);
          setEditingFood(null);
        }}
        onSaved={() => {
          setCreatingFood(false);
          setEditingFood(null);
          void foods.reload();
          void meals.reload();
        }}
      />
    </div>
  );
}

function ShoppingView({
  lists,
  onChanged,
  onGenerate,
  busy,
}: {
  lists: ShoppingList[];
  onChanged: () => void;
  onGenerate: () => void;
  busy: boolean;
}) {
  const [newItem, setNewItem] = useState("");
  const list = lists[0];

  async function toggle(itemId: string, checked: boolean) {
    await api.patch(`/api/shopping-items/${itemId}`, { checked });
    onChanged();
  }

  async function addItem() {
    if (!list || !newItem.trim()) return;
    await api.post("/api/shopping-items", { listId: list.id, name: newItem });
    setNewItem("");
    onChanged();
  }

  async function removeItem(itemId: string) {
    await api.del(`/api/shopping-items/${itemId}`);
    onChanged();
  }

  async function removeList() {
    if (!list) return;
    await api.del(`/api/shopping-lists/${list.id}`);
    onChanged();
  }

  if (!list) {
    return (
      <Empty
        title="Noch keine Einkaufsliste"
        hint="Die Liste wird automatisch aus deinem Wochen-Ernährungsplan erstellt. Gleiche Zutaten werden zusammengefasst."
        action={
          <Button size="sm" busy={busy} onClick={onGenerate}>
            Liste erstellen
          </Button>
        }
      />
    );
  }

  const byCategory = list.items.reduce<Record<string, typeof list.items>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const openCount = list.items.filter((i) => !i.checked).length;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium">{list.name}</p>
          <p className="text-[12px]" style={{ color: "var(--ink-3)" }}>
            {openCount} von {list.items.length} offen
          </p>
        </div>
        <Button size="sm" busy={busy} onClick={onGenerate}>
          Neu erstellen
        </Button>
      </div>

      {Object.entries(byCategory)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([category, items]) => (
          <Card key={category} className="flex flex-col gap-1.5">
            <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-3)" }}>
              {category}
            </p>
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => toggle(item.id, !item.checked)}
                  aria-label={item.checked ? "Wieder öffnen" : "Abhaken"}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[12px]"
                  style={{
                    borderColor: item.checked ? "var(--accent)" : "var(--line)",
                    background: item.checked ? "var(--accent)" : "transparent",
                    color: item.checked ? "var(--accent-ink)" : "transparent",
                  }}
                >
                  ✓
                </button>
                <span
                  className="min-w-0 flex-1 truncate text-[14px]"
                  style={{
                    color: item.checked ? "var(--ink-3)" : "var(--ink)",
                    textDecoration: item.checked ? "line-through" : "none",
                  }}
                >
                  {item.name}
                </span>
                <span className="shrink-0 text-[13px] tabular-nums" style={{ color: "var(--ink-2)" }}>
                  {Number(item.amount) % 1 === 0 ? Number(item.amount) : item.amount} {item.unit}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  aria-label="Entfernen"
                  style={{ color: "var(--ink-3)" }}
                >
                  ✕
                </button>
              </div>
            ))}
          </Card>
        ))}

      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Eigenen Eintrag hinzufügen"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void addItem();
            }
          }}
        />
        <Button size="sm" onClick={addItem}>
          +
        </Button>
      </div>

      <button type="button" onClick={removeList} className="text-[13px]" style={{ color: "var(--ink-3)" }}>
        Diese Liste löschen
      </button>
    </section>
  );
}

function MealSheet({
  open,
  meal,
  foods,
  onClose,
  onSaved,
}: {
  open: boolean;
  meal: Meal | null;
  foods: Food[];
  onClose: () => void;
  onSaved: () => void;
}) {
  type Ing = { foodId: string; amount: string };
  const [name, setName] = useState("");
  const [slot, setSlot] = useState("lunch");
  const [prep, setPrep] = useState(15);
  const [description, setDescription] = useState("");
  const [trainingDayOnly, setTrainingDayOnly] = useState(false);
  const [restDayOnly, setRestDayOnly] = useState(false);
  const [ingredients, setIngredients] = useState<Ing[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = meal ? meal.id : "new";
  if (open && loadedKey !== key) {
    setLoadedKey(key);
    setName(meal?.name ?? "");
    setSlot(meal?.slot ?? "lunch");
    setPrep(meal?.prepMinutes ?? 15);
    setDescription(meal?.description ?? "");
    setTrainingDayOnly(meal?.trainingDayOnly ?? false);
    setRestDayOnly(meal?.restDayOnly ?? false);
    setIngredients((meal?.ingredients ?? []).map((i) => ({ foodId: i.foodId, amount: i.amount })));
    setError(null);
  }
  if (!open && loadedKey !== null) setLoadedKey(null);

  const nutrition = ingredients.reduce(
    (acc, ing) => {
      const food = foods.find((f) => f.id === ing.foodId);
      if (!food) return acc;
      const factor = Number(ing.amount) / Math.max(0.0001, Number(food.referenceAmount));
      acc.kcal += Number(food.kcal) * factor;
      acc.protein += Number(food.protein) * factor;
      acc.carbs += Number(food.carbs) * factor;
      acc.fat += Number(food.fat) * factor;
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  async function save() {
    if (!name.trim()) {
      setError("Bitte einen Namen eingeben");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name,
        slot,
        prepMinutes: prep,
        description,
        trainingDayOnly,
        restDayOnly,
        ingredients,
      };
      if (meal) await api.patch(`/api/meals/${meal.id}`, payload);
      else await api.post("/api/meals", payload);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!meal) return;
    setBusy(true);
    try {
      await api.del(`/api/meals/${meal.id}`);
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <Sheet
      open
      onClose={onClose}
      title={meal ? "Mahlzeit bearbeiten" : "Neue Mahlzeit"}
      footer={
        <>
          <Button className="flex-1" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" className="flex-1" busy={busy} onClick={save}>
            Speichern
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Mahlzeit">
            <Select value={slot} onChange={(e) => setSlot(e.target.value)}>
              {Object.entries(MEAL_SLOT_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Zubereitung">
            <NumberInput value={prep} onChange={setPrep} suffix="Min" min={0} step={5} />
          </Field>
        </div>

        <div>
          <p className="mb-1.5 text-[13px] font-medium" style={{ color: "var(--ink-2)" }}>
            Zutaten
          </p>
          <div className="flex flex-col gap-2">
            {ingredients.map((ing, index) => {
              const food = foods.find((f) => f.id === ing.foodId);
              return (
                <div key={index} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[14px]">{food?.name ?? "Zutat"}</span>
                  <div className="w-[110px] shrink-0">
                    <NumberInput
                      value={Number(ing.amount)}
                      onChange={(v) =>
                        setIngredients(ingredients.map((x, i) => (i === index ? { ...x, amount: String(v) } : x)))
                      }
                      suffix={food?.unit ?? "g"}
                      min={0}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIngredients(ingredients.filter((_, i) => i !== index))}
                    aria-label="Zutat entfernen"
                    style={{ color: "var(--ink-3)" }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <Select
            className="mt-2"
            value=""
            onChange={(e) => {
              const food = foods.find((f) => f.id === e.target.value);
              if (!food) return;
              setIngredients([...ingredients, { foodId: food.id, amount: food.referenceAmount }]);
            }}
          >
            <option value="">Zutat hinzufügen …</option>
            {foods
              .filter((f) => !f.archived)
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </Select>
        </div>

        <div className="rounded-xl px-3.5 py-3" style={{ background: "var(--surface-2)" }}>
          <p className="text-[13px]" style={{ color: "var(--ink-2)" }}>
            {Math.round(nutrition.kcal)} kcal · {Math.round(nutrition.protein * 10) / 10} g Protein ·{" "}
            {Math.round(nutrition.carbs * 10) / 10} g Kohlenhydrate · {Math.round(nutrition.fat * 10) / 10} g
            Fett
          </p>
        </div>

        <div className="rounded-xl px-3" style={{ background: "var(--surface-2)" }}>
          <Toggle
            checked={trainingDayOnly}
            onChange={(v) => {
              setTrainingDayOnly(v);
              if (v) setRestDayOnly(false);
            }}
            label="Nur an Trainingstagen"
            hint="Wird bei der automatischen Wochenplanung nur an Trainingstagen vorgeschlagen."
          />
          <Toggle
            checked={restDayOnly}
            onChange={(v) => {
              setRestDayOnly(v);
              if (v) setTrainingDayOnly(false);
            }}
            label="Nur an Ruhetagen"
          />
        </div>

        <Field label="Beschreibung">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        {error && <ErrorNote>{error}</ErrorNote>}

        {meal && (
          <DangerButton label="Mahlzeit löschen" busy={busy} onConfirm={remove} />
        )}
      </div>
    </Sheet>
  );
}

const FOOD_CATEGORIES = [
  "Obst",
  "Gemüse",
  "Milchprodukte",
  "Eier",
  "Fleischersatz",
  "Hülsenfrüchte",
  "Getreide",
  "Tiefkühl",
  "Getränke",
  "Sonstiges",
];

function FoodSheet({
  open,
  food,
  onClose,
  onSaved,
}: {
  open: boolean;
  food: Food | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const blank = {
    name: "",
    category: "Sonstiges",
    unit: "g",
    referenceAmount: "100",
    kcal: "0",
    protein: "0",
    carbs: "0",
    fat: "0",
    isProteinSource: false,
    vegetarian: true,
    vegan: false,
  };
  const [draft, setDraft] = useState(blank);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = food ? food.id : "new";
  if (open && loadedKey !== key) {
    setLoadedKey(key);
    setDraft(
      food
        ? {
            name: food.name,
            category: food.category,
            unit: food.unit,
            referenceAmount: food.referenceAmount,
            kcal: food.kcal,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            isProteinSource: food.isProteinSource,
            vegetarian: food.vegetarian,
            vegan: food.vegan,
          }
        : blank,
    );
    setError(null);
  }
  if (!open && loadedKey !== null) setLoadedKey(null);

  async function save() {
    if (!draft.name.trim()) {
      setError("Bitte einen Namen eingeben");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (food) await api.patch(`/api/foods/${food.id}`, draft);
      else await api.post("/api/foods", draft);
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!food) return;
    setBusy(true);
    try {
      await api.del(`/api/foods/${food.id}`);
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <Sheet
      open
      onClose={onClose}
      title={food ? "Lebensmittel bearbeiten" : "Neues Lebensmittel"}
      footer={
        <>
          <Button className="flex-1" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="primary" className="flex-1" busy={busy} onClick={save}>
            Speichern
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Name">
          <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Kategorie">
            <Select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {FOOD_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Einheit">
            <Select value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })}>
              <option value="g">Gramm</option>
              <option value="ml">Milliliter</option>
              <option value="Stk">Stück</option>
            </Select>
          </Field>
        </div>

        <Field label="Nährwerte beziehen sich auf" hint={`z. B. 100 ${draft.unit}`}>
          <NumberInput
            value={Number(draft.referenceAmount)}
            onChange={(v) => setDraft({ ...draft, referenceAmount: String(v) })}
            suffix={draft.unit}
            min={1}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Kalorien">
            <NumberInput
              value={Number(draft.kcal)}
              onChange={(v) => setDraft({ ...draft, kcal: String(v) })}
              suffix="kcal"
              min={0}
            />
          </Field>
          <Field label="Protein">
            <NumberInput
              value={Number(draft.protein)}
              onChange={(v) => setDraft({ ...draft, protein: String(v) })}
              suffix="g"
              min={0}
              step={0.1}
            />
          </Field>
          <Field label="Kohlenhydrate">
            <NumberInput
              value={Number(draft.carbs)}
              onChange={(v) => setDraft({ ...draft, carbs: String(v) })}
              suffix="g"
              min={0}
              step={0.1}
            />
          </Field>
          <Field label="Fett">
            <NumberInput
              value={Number(draft.fat)}
              onChange={(v) => setDraft({ ...draft, fat: String(v) })}
              suffix="g"
              min={0}
              step={0.1}
            />
          </Field>
        </div>

        <div className="rounded-xl px-3" style={{ background: "var(--surface-2)" }}>
          <Toggle
            checked={draft.isProteinSource}
            onChange={(v) => setDraft({ ...draft, isProteinSource: v })}
            label="Proteinquelle"
            hint="Wird bei der Mahlzeitenplanung bevorzugt."
          />
          <Toggle checked={draft.vegan} onChange={(v) => setDraft({ ...draft, vegan: v })} label="Vegan" />
        </div>

        {error && <ErrorNote>{error}</ErrorNote>}

        {food && (
          <DangerButton label="Lebensmittel löschen" busy={busy} onConfirm={remove} />
        )}
      </div>
    </Sheet>
  );
}
