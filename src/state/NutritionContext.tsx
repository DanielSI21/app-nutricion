import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { repository } from '../data';
import { addMacros, applyProposal, buildRecalculationProposal, classifyDifference, recipeMacros, scaleFood, ZERO_MACROS } from '../domain/calculations';
import type { DemoState, Food, FoodLogEntry, Macros, MealId, MealLog, RecalculationProposal, Unit } from '../domain/types';

interface NutritionContextValue {
  state: DemoState | null;
  loading: boolean;
  error?: string;
  repositoryMode: 'demo' | 'supabase';
  alertMealId?: MealId;
  toast?: string;
  dismissToast(): void;
  setMealTime(mealId: MealId, time: string): void;
  selectMealOption(mealId: MealId, groupId: string, optionId: string): void;
  getPlannedEntries(mealId: MealId): FoodLogEntry[];
  registerPlanned(mealId: MealId): void;
  saveChangedMeal(mealId: MealId, entries: FoodLogEntry[], skipped?: boolean): void;
  keepPlan(mealId: MealId): void;
  createProposal(mealId: MealId): RecalculationProposal | undefined;
  rejectProposal(): void;
  acceptProposal(): void;
  resetDemo(): Promise<void>;
  addManualFood(input: { name: string; quantity: number; unit: Unit; macros: Macros }): Food;
}

const NutritionContext = createContext<NutritionContextValue | null>(null);

function normalizeEntries(entries: FoodLogEntry[], target: Macros): FoodLogEntry[] {
  const total = entries.reduce((sum, entry) => addMacros(sum, entry.macros), { ...ZERO_MACROS });
  return entries.map((entry) => ({
    ...entry,
    macros: {
      protein: total.protein ? entry.macros.protein * target.protein / total.protein : 0,
      fat: total.fat ? entry.macros.fat * target.fat / total.fat : 0,
      carbs: total.carbs ? entry.macros.carbs * target.carbs / total.carbs : 0,
      kcal: total.kcal ? entry.macros.kcal * target.kcal / total.kcal : 0,
    },
  }));
}

export function NutritionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [alertMealId, setAlertMealId] = useState<MealId>();
  const [toast, setToast] = useState<string>();

  useEffect(() => {
    repository.load().then(setState).catch(() => setError('No pudimos cargar tus datos. Puedes reiniciar el modo demo.')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!state || loading) return;
    repository.save(state).catch(() => setError('No fue posible guardar los cambios localmente.'));
  }, [state, loading]);

  const update = useCallback((recipe: (current: DemoState) => DemoState) => setState((current) => current ? recipe(current) : current), []);

  const getPlannedEntries = useCallback((mealId: MealId) => {
    if (!state) return [];
    const meal = state.plan.meals.find((item) => item.id === mealId);
    if (!meal) return [];
    const entries: FoodLogEntry[] = [];
    meal.choiceGroups.filter((choice) => choice.required).forEach((choice) => {
      const selected = choice.options.find((option) => option.id === meal.selectedOptionIds[choice.id]) ?? choice.options[0];
      selected?.items.forEach((item) => {
        const food = state.foods.find((candidate) => candidate.id === item.foodId);
        if (!food) return;
        entries.push({
          id: crypto.randomUUID(), foodId: food.id, name: item.label, quantity: item.quantity, unit: item.unit,
          macros: scaleFood(food, item.quantity, item.unit), equivalents: item.equivalents, groupId: food.groupId, approximate: !food.verified,
        });
      });
    });
    return normalizeEntries(entries, meal.plannedMacros);
  }, [state]);

  const setMealTime = (mealId: MealId, time: string) => update((current) => ({
    ...current, plan: { ...current.plan, meals: current.plan.meals.map((meal) => meal.id === mealId ? { ...meal, time } : meal) },
  }));

  const selectMealOption = (mealId: MealId, groupId: string, optionId: string) => update((current) => ({
    ...current, plan: { ...current.plan, meals: current.plan.meals.map((meal) => meal.id === mealId ? { ...meal, selectedOptionIds: { ...meal.selectedOptionIds, [groupId]: optionId } } : meal) },
  }));

  const registerPlanned = (mealId: MealId) => {
    if (!state) return;
    const meal = state.plan.meals.find((item) => item.id === mealId);
    if (!meal) return;
    const log: MealLog = { id: crypto.randomUUID(), mealId, status: 'completed-planned', entries: getPlannedEntries(mealId), macros: { ...meal.plannedMacros }, classification: 'within-plan', recordedAt: new Date().toISOString() };
    update((current) => ({ ...current, dailyLog: { ...current.dailyLog, mealLogs: { ...current.dailyLog.mealLogs, [mealId]: log } } }));
    setAlertMealId(undefined); setToast(`${meal.name} registrada según el plan.`);
  };

  const saveChangedMeal = (mealId: MealId, entries: FoodLogEntry[], skipped = false) => {
    if (!state) return;
    const meal = state.plan.meals.find((item) => item.id === mealId);
    if (!meal) return;
    const macros = entries.reduce((sum, entry) => addMacros(sum, entry.macros), { ...ZERO_MACROS });
    const groupTotals = (items: FoodLogEntry[]) => items.reduce<Record<string, number>>((totals, entry) => {
      if (entry.groupId) totals[entry.groupId] = (totals[entry.groupId] ?? 0) + entry.equivalents;
      return totals;
    }, {});
    const classification = skipped ? 'under' : classifyDifference(meal.plannedMacros, macros, 0.05, groupTotals(getPlannedEntries(mealId)), groupTotals(entries), 0.25);
    const log: MealLog = { id: crypto.randomUUID(), mealId, status: skipped ? 'skipped' : classification === 'within-plan' ? 'completed-planned' : 'completed-changed', entries, macros, classification, recordedAt: new Date().toISOString() };
    update((current) => ({ ...current, dailyLog: { ...current.dailyLog, mealLogs: { ...current.dailyLog.mealLogs, [mealId]: log } }, recentFoodIds: [...entries.flatMap((entry) => entry.foodId ? [entry.foodId] : []), ...current.recentFoodIds].filter((id, index, all) => all.indexOf(id) === index).slice(0, 6) }));
    setAlertMealId(classification === 'within-plan' ? undefined : mealId);
    setToast(skipped ? `${meal.name} marcada como omitida.` : `${meal.name} guardada con tus cambios.`);
  };

  const keepPlan = (mealId: MealId) => {
    if (!state) return;
    const proposal = buildRecalculationProposal(state.target, state.plan.meals, state.dailyLog.mealLogs, `Diferencia registrada en ${mealId}`);
    const rejected = { ...proposal, status: 'rejected' as const };
    update((current) => ({ ...current, recalculationEvents: [...current.recalculationEvents, { id: crypto.randomUUID(), createdAt: new Date().toISOString(), previousPlan: structuredClone(current.plan.meals), proposal: rejected, decision: 'rejected' }] }));
    setAlertMealId(undefined); setToast('El resto del plan se conserva sin cambios.');
  };

  const createProposal = (mealId: MealId) => {
    if (!state) return undefined;
    const mealName = state.plan.meals.find((meal) => meal.id === mealId)?.name.toLocaleLowerCase('es-MX') ?? 'la comida';
    const proposal = buildRecalculationProposal(state.target, state.plan.meals, state.dailyLog.mealLogs, `Ajuste por diferencia en ${mealName}`);
    update((current) => ({ ...current, pendingProposal: proposal }));
    setAlertMealId(undefined);
    return proposal;
  };

  const rejectProposal = () => update((current) => {
    if (!current.pendingProposal) return current;
    const proposal = { ...current.pendingProposal, status: 'rejected' as const };
    return { ...current, pendingProposal: undefined, recalculationEvents: [...current.recalculationEvents, { id: crypto.randomUUID(), createdAt: new Date().toISOString(), previousPlan: structuredClone(current.plan.meals), proposal, decision: 'rejected' }] };
  });

  const acceptProposal = () => update((current) => {
    if (!current.pendingProposal) return current;
    const proposal = { ...current.pendingProposal, status: 'accepted' as const };
    const adjustedIds = new Set(proposal.adjustments.map((item) => item.mealId));
    const meals = applyProposal(current.plan.meals, proposal).map((meal) => adjustedIds.has(meal.id) ? meal : meal);
    return { ...current, plan: { ...current.plan, meals }, pendingProposal: undefined, recalculationEvents: [...current.recalculationEvents, { id: crypto.randomUUID(), createdAt: new Date().toISOString(), previousPlan: structuredClone(current.plan.meals), proposal, decision: 'accepted' }] };
  });

  const resetDemo = async () => {
    setLoading(true); const fresh = await repository.reset(); setState(fresh); setAlertMealId(undefined); setLoading(false); setToast('Modo demo reiniciado.');
  };

  const addManualFood = (input: { name: string; quantity: number; unit: Unit; macros: Macros }) => {
    const food: Food = { id: crypto.randomUUID(), name: input.name, groupId: 'free-energy', referenceQuantity: input.quantity, referenceUnit: input.unit, macros: input.macros, equivalents: 0, icon: 'utensils', source: 'Capturado manualmente', verified: false };
    update((current) => ({ ...current, foods: [food, ...current.foods] }));
    return food;
  };

  const value = useMemo<NutritionContextValue>(() => ({ state, loading, error, repositoryMode: repository.mode, alertMealId, toast, dismissToast: () => setToast(undefined), setMealTime, selectMealOption, getPlannedEntries, registerPlanned, saveChangedMeal, keepPlan, createProposal, rejectProposal: () => { rejectProposal(); setToast('Se mantiene el plan original.'); }, acceptProposal: () => { acceptProposal(); setToast('Propuesta aplicada a las comidas pendientes.'); }, resetDemo, addManualFood }), [state, loading, error, alertMealId, toast, getPlannedEntries]);
  return <NutritionContext.Provider value={value}>{children}</NutritionContext.Provider>;
}

export function useNutrition() {
  const context = useContext(NutritionContext);
  if (!context) throw new Error('useNutrition debe usarse dentro de NutritionProvider.');
  return context;
}

export function foodEntryFromFood(food: Food, quantity: number, unit: Unit): FoodLogEntry {
  return { id: crypto.randomUUID(), foodId: food.id, name: food.name, quantity, unit, macros: scaleFood(food, quantity, unit), equivalents: food.equivalents * quantity / food.referenceQuantity, groupId: food.groupId, approximate: !food.verified };
}

export function foodEntryFromRecipe(recipeId: string, name: string, portions: number, state: DemoState): FoodLogEntry | undefined {
  const recipe = state.recipes.find((item) => item.id === recipeId);
  if (!recipe) return undefined;
  return { id: crypto.randomUUID(), recipeId, name, quantity: portions, unit: 'porción', macros: recipeMacros(recipe, state.foods, portions), equivalents: 0, approximate: recipe.mode === 'manual' };
}
