import type { DifferenceClassification, Food, Macros, MealId, MealLog, NutritionTarget, PlanMeal, Recipe, RecalculationProposal, SmaeGroup } from './types';

export const ZERO_MACROS: Macros = { protein: 0, fat: 0, carbs: 0, kcal: 0 };

export function addMacros(...values: Macros[]): Macros {
  return values.reduce((sum, item) => ({
    protein: sum.protein + item.protein,
    fat: sum.fat + item.fat,
    carbs: sum.carbs + item.carbs,
    kcal: sum.kcal + item.kcal,
  }), { ...ZERO_MACROS });
}

export function subtractMacros(a: Macros, b: Macros): Macros {
  return { protein: a.protein - b.protein, fat: a.fat - b.fat, carbs: a.carbs - b.carbs, kcal: a.kcal - b.kcal };
}

export function calculateNutritionTarget(weightKg: number, targetKcal: number, proteinFactor: number, fatFactor: number): Macros {
  const protein = weightKg * proteinFactor;
  const fat = weightKg * fatFactor;
  const remainingKcal = targetKcal - protein * 4 - fat * 9;
  if (remainingKcal < 0) throw new Error('La configuración deja calorías negativas para carbohidratos.');
  return { protein, fat, carbs: remainingKcal / 4, kcal: targetKcal };
}

export function macrosFromEquivalents(group: SmaeGroup, equivalents: number): Macros {
  const protein = group.proteinPerEquivalent * equivalents;
  const fat = group.fatPerEquivalent * equivalents;
  const carbs = group.carbsPerEquivalent * equivalents;
  return { protein, fat, carbs, kcal: protein * 4 + fat * 9 + carbs * 4 };
}

export function scaleFood(food: Food, quantity: number, unit = food.referenceUnit): Macros {
  const householdServing = unit === food.referenceUnit ? undefined :
    food.servings?.find((serving) => serving.unit === unit && serving.quantity === quantity) ??
    food.servings?.find((serving) => serving.unit === unit);
  const effectiveQuantity = householdServing?.gramsEquivalent
    ? householdServing.gramsEquivalent * quantity / householdServing.quantity
    : quantity;
  const reference = householdServing ? food.referenceGrams ?? food.referenceQuantity : food.referenceQuantity;
  const factor = effectiveQuantity / reference;
  return {
    protein: food.macros.protein * factor,
    fat: food.macros.fat * factor,
    carbs: food.macros.carbs * factor,
    kcal: food.macros.kcal * factor,
  };
}

export function recipeMacros(recipe: Recipe, foods: Food[], portions = 1): Macros {
  const total = recipe.mode === 'manual'
    ? recipe.manualMacros ?? ZERO_MACROS
    : recipe.ingredients.reduce((sum, ingredient) => {
        const food = foods.find((item) => item.id === ingredient.foodId);
        return food ? addMacros(sum, scaleFood(food, ingredient.quantity, ingredient.unit)) : sum;
      }, { ...ZERO_MACROS });
  const factor = portions / recipe.servings;
  return { protein: total.protein * factor, fat: total.fat * factor, carbs: total.carbs * factor, kcal: total.kcal * factor };
}

export function classifyDifference(
  planned: Macros,
  actual: Macros,
  macroTolerance = 0.05,
  plannedEquivalents?: Record<string, number>,
  actualEquivalents?: Record<string, number>,
  equivalentTolerance = 0.25,
): DifferenceClassification {
  const keys: (keyof Pick<Macros, 'protein' | 'fat' | 'carbs'>)[] = ['protein', 'fat', 'carbs'];
  const deltas = keys.map((key) => {
    const base = Math.max(planned[key], 1);
    return (actual[key] - planned[key]) / base;
  });
  const groupsWithinTolerance = !plannedEquivalents || !actualEquivalents || Object.keys({ ...plannedEquivalents, ...actualEquivalents })
    .every((groupId) => Math.abs((actualEquivalents[groupId] ?? 0) - (plannedEquivalents[groupId] ?? 0)) <= equivalentTolerance);
  if (deltas.every((delta) => Math.abs(delta) <= macroTolerance)) return groupsWithinTolerance ? 'within-plan' : 'different-distribution';
  if (deltas.every((delta) => delta <= macroTolerance) && deltas.some((delta) => delta < -macroTolerance)) return 'under';
  if (deltas.every((delta) => delta >= -macroTolerance) && deltas.some((delta) => delta > macroTolerance)) return 'over';
  return 'different-distribution';
}

export function sumMealLogs(logs: Partial<Record<MealId, MealLog>>): Macros {
  return Object.values(logs).reduce<Macros>((sum, log) => log ? addMacros(sum, log.macros) : sum, { ...ZERO_MACROS });
}

function roundHalf(value: number) { return Math.max(0, Math.round(value * 2) / 2); }

export function buildRecalculationProposal(
  target: NutritionTarget,
  meals: PlanMeal[],
  logs: Partial<Record<MealId, MealLog>>,
  reason: string,
): RecalculationProposal {
  const consumed = sumMealLogs(logs);
  const remaining: Macros = {
    protein: Math.max(0, target.protein - consumed.protein),
    fat: Math.max(0, target.fat - consumed.fat),
    carbs: Math.max(0, target.carbs - consumed.carbs),
    kcal: Math.max(0, target.kcal - consumed.kcal),
  };
  const pending = meals.filter((meal) => !logs[meal.id]);
  const totals = pending.reduce((sum, meal) => addMacros(sum, meal.plannedMacros), { ...ZERO_MACROS });
  const warnings: string[] = [];
  if (consumed.fat > target.fat) warnings.push('El consumo de grasa ya supera el objetivo diario. La propuesta reduce la grasa pendiente, pero no puede eliminar lo ya consumido.');
  if (consumed.protein > target.protein) warnings.push('La proteína consumida ya supera el objetivo diario; la propuesta no genera cantidades negativas.');
  if (consumed.carbs > target.carbs) warnings.push('Los carbohidratos consumidos ya superan el objetivo diario; la propuesta conserva el consumo registrado.');
  const adjustments = pending.map((meal) => {
    const proposedMacros: Macros = {
      protein: totals.protein ? remaining.protein * meal.plannedMacros.protein / totals.protein : 0,
      fat: totals.fat ? remaining.fat * meal.plannedMacros.fat / totals.fat : 0,
      carbs: totals.carbs ? remaining.carbs * meal.plannedMacros.carbs / totals.carbs : 0,
      kcal: totals.kcal ? remaining.kcal * meal.plannedMacros.kcal / totals.kcal : 0,
    };
    const scale = meal.plannedMacros.kcal ? proposedMacros.kcal / meal.plannedMacros.kcal : 0;
    const equivalents = Object.fromEntries(meal.allowedSmaeGroupIds.map((id) => [id, roundHalf(scale)]));
    const normalizedError = (['protein', 'fat', 'carbs'] as const).reduce((sum, key) => sum + Math.abs(proposedMacros[key] - meal.plannedMacros[key]) / Math.max(meal.plannedMacros[key], 1), 0);
    return { mealId: meal.id, originalMacros: meal.plannedMacros, proposedMacros, equivalents, exact: normalizedError < 0.2 };
  });
  return {
    id: crypto.randomUUID(), createdAt: new Date().toISOString(), remaining, adjustments, warnings, reason,
    status: 'pending',
  };
}

export function applyProposal(meals: PlanMeal[], proposal: RecalculationProposal): PlanMeal[] {
  if (proposal.status === 'rejected') return meals;
  return meals.map((meal) => {
    const adjustment = proposal.adjustments.find((item) => item.mealId === meal.id);
    return adjustment ? { ...meal, plannedMacros: { ...adjustment.proposedMacros } } : meal;
  });
}
