import { describe, expect, it } from 'vitest';
import { applyProposal, buildRecalculationProposal, calculateNutritionTarget, classifyDifference, macrosFromEquivalents, recipeMacros, scaleFood } from './calculations';
import type { MealLog, NutritionTarget } from './types';
import { foods, planMeals, recipes, smaeGroups, smaePreset } from '../data/seeds';

describe('fórmula de objetivos', () => {
  it('calcula el preset de 74.2 kg sin mezclarlo con SMAE', () => {
    const result = calculateNutritionTarget(74.2, 2009, 2.2, 0.7);
    expect(result.protein).toBeCloseTo(163.24, 10);
    expect(result.fat).toBeCloseTo(51.94, 10);
    expect(result.carbs).toBeCloseTo(222.145, 10);
    expect(result.kcal).toBe(2009);
  });

  it('conserva decimales durante las operaciones', () => {
    const result = calculateNutritionTarget(71.35, 1987.5, 1.87, 0.83);
    expect(result.protein).toBe(71.35 * 1.87);
    expect(result.fat).toBe(71.35 * 0.83);
    expect(Number.isInteger(result.carbs)).toBe(false);
  });

  it('rechaza una configuración con carbohidratos negativos', () => {
    expect(() => calculateNutritionTarget(100, 1000, 4, 2)).toThrow(/calorías negativas/i);
  });
});

describe('SMAE, alimentos y recetas', () => {
  it('multiplica los aportes por equivalentes y deriva kcal', () => {
    const group = smaeGroups.find((item) => item.id === 'animal-very-low-fat')!;
    expect(macrosFromEquivalents(group, 11)).toEqual({ protein: 77, fat: 11, carbs: 0, kcal: 407 });
  });

  it('escala palomitas de 120 g a 60 g', () => {
    const popcorn = foods.find((item) => item.id === 'popcorn')!;
    const half = scaleFood(popcorn, 60, 'g');
    expect(half.kcal).toBe(popcorn.macros.kcal / 2);
    expect(half.fat).toBe(popcorn.macros.fat / 2);
  });

  it('usa gramos equivalentes al registrar una medida casera', () => {
    const popcorn = foods.find((item) => item.id === 'popcorn')!;
    expect(scaleFood(popcorn, 0.5, 'cubeta').kcal).toBe(popcorn.macros.kcal / 2);
    expect(scaleFood(popcorn, 1, 'cubeta').kcal).toBe(popcorn.macros.kcal);
  });

  it('suma ingredientes y divide por porciones', () => {
    const recipe = recipes.find((item) => item.id === 'dinner-shake')!;
    const expectedKcal = recipe.ingredients.reduce((sum, ingredient) => sum + scaleFood(foods.find((food) => food.id === ingredient.foodId)!, ingredient.quantity, ingredient.unit).kcal, 0);
    expect(recipeMacros(recipe, foods, 1).kcal).toBeCloseTo(expectedKcal);
    expect(recipeMacros({ ...recipe, servings: 2 }, foods, 1).kcal).toBeCloseTo(expectedKcal / 2);
  });
});

describe('diferencias y recálculo', () => {
  it('detecta consumo menor y exceso', () => {
    const planned = { protein: 30, fat: 10, carbs: 40, kcal: 370 };
    expect(classifyDifference(planned, { protein: 15, fat: 7, carbs: 20, kcal: 203 })).toBe('under');
    expect(classifyDifference(planned, { protein: 40, fat: 15, carbs: 55, kcal: 515 })).toBe('over');
  });

  it('distribuye únicamente entre comidas pendientes', () => {
    const breakfastLog: MealLog = { id: 'log', mealId: 'breakfast', status: 'completed-changed', entries: [], macros: { protein: 10, fat: 5, carbs: 5, kcal: 105 }, classification: 'under', recordedAt: new Date().toISOString() };
    const proposal = buildRecalculationProposal(smaePreset, planMeals, { breakfast: breakfastLog }, 'Desayuno incompleto');
    expect(proposal.adjustments.map((item) => item.mealId)).toEqual(['snack', 'lunch', 'dinner']);
  });

  it('protege los remanentes y equivalentes contra valores negativos', () => {
    const target: NutritionTarget = { ...smaePreset, protein: 10, fat: 10, carbs: 10, kcal: 170 };
    const excessive: MealLog = { id: 'log', mealId: 'breakfast', status: 'completed-changed', entries: [], macros: { protein: 30, fat: 30, carbs: 30, kcal: 510 }, classification: 'over', recordedAt: new Date().toISOString() };
    const proposal = buildRecalculationProposal(target, planMeals, { breakfast: excessive }, 'Exceso');
    expect(proposal.remaining).toEqual({ protein: 0, fat: 0, carbs: 0, kcal: 0 });
    proposal.adjustments.forEach((adjustment) => expect(Object.values(adjustment.equivalents).every((value) => value >= 0)).toBe(true));
    expect(proposal.warnings.some((warning) => warning.includes('grasa ya supera'))).toBe(true);
  });

  it('rechaza sin mutar y aplica solamente una propuesta aceptable', () => {
    const original = structuredClone(planMeals);
    const proposal = buildRecalculationProposal(smaePreset, original, {}, 'Prueba');
    expect(applyProposal(original, { ...proposal, status: 'rejected' })).toEqual(original);
    const applied = applyProposal(original, { ...proposal, status: 'accepted' });
    expect(applied[0].plannedMacros).toEqual(proposal.adjustments[0].proposedMacros);
    expect(original).toEqual(planMeals);
  });
});
