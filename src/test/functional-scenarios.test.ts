import { describe, expect, it } from 'vitest';
import { buildRecalculationProposal, classifyDifference, scaleFood } from '../domain/calculations';
import type { MealLog } from '../domain/types';
import { foods, planMeals, smaePreset } from '../data/seeds';

const log = (mealId: MealLog['mealId'], macros: MealLog['macros'], status: MealLog['status'] = 'completed-changed'): MealLog => ({
  id: `log-${mealId}`, mealId, status, entries: [], macros,
  classification: status === 'skipped' ? 'under' : classifyDifference(planMeals.find((meal) => meal.id === mealId)!.plannedMacros, macros),
  recordedAt: new Date().toISOString(),
});

describe('casos funcionales de registro y recálculo', () => {
  it('caso 1: un huevo se detecta como desayuno incompleto y no cambia el desayuno', () => {
    const egg = foods.find((food) => food.id === 'egg')!;
    const breakfast = log('breakfast', scaleFood(egg, 1, 'pieza'));
    expect(breakfast.classification).toBe('under');
    const proposal = buildRecalculationProposal(smaePreset, planMeals, { breakfast }, 'Desayuno incompleto');
    expect(proposal.adjustments.map((item) => item.mealId)).toEqual(['snack', 'lunch', 'dinner']);
    expect(proposal.adjustments.some((item) => item.mealId === 'breakfast')).toBe(false);
  });

  it('caso 2: snack omitido queda cerrado y rechazar conserva las comidas', () => {
    const skipped = log('snack', { protein: 0, fat: 0, carbs: 0, kcal: 0 }, 'skipped');
    const proposal = buildRecalculationProposal(smaePreset, planMeals, { snack: skipped }, 'Snack omitido');
    expect(proposal.adjustments.map((item) => item.mealId)).toEqual(['breakfast', 'lunch', 'dinner']);
    const before = structuredClone(planMeals);
    const rejected = { ...proposal, status: 'rejected' as const };
    expect(rejected.status).toBe('rejected');
    expect(planMeals).toEqual(before);
  });

  it('caso 3: 60 g de palomitas escala macros y, tras comida, solo propone cena', () => {
    const popcorn = foods.find((food) => food.id === 'popcorn')!;
    const soda = foods.find((food) => food.id === 'soda')!;
    const half = scaleFood(popcorn, 60, 'g');
    expect(half.kcal).toBe(popcorn.macros.kcal * 0.5);
    const breakfast = log('breakfast', { protein: 35, fat: 20, carbs: 55, kcal: 540 }, 'completed-planned');
    const snack = log('snack', { protein: 0, fat: 0, carbs: 0, kcal: 0 }, 'skipped');
    const lunch = log('lunch', {
      protein: half.protein + soda.macros.protein,
      fat: half.fat + soda.macros.fat,
      carbs: half.carbs + soda.macros.carbs,
      kcal: half.kcal + soda.macros.kcal,
    });
    expect(lunch.classification).not.toBe('within-plan');
    const proposal = buildRecalculationProposal(smaePreset, planMeals, { breakfast, snack, lunch }, 'Palomitas y refresco');
    expect(proposal.adjustments.map((item) => item.mealId)).toEqual(['dinner']);
    expect(proposal.adjustments[0].proposedMacros.fat).toBeGreaterThanOrEqual(0);
  });
});
