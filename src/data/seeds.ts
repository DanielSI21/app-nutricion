import type { DemoState, Food, Macros, MealChoiceGroup, MealOption, NutritionTarget, PlanMeal, Recipe, SmaeGroup, Unit } from '../domain/types';
import { calculateNutritionTarget } from '../domain/calculations';

const m = (protein: number, fat: number, carbs: number, kcal = protein * 4 + fat * 9 + carbs * 4): Macros => ({ protein, fat, carbs, kcal });

export const formulaPreset: NutritionTarget = {
  id: 'target-formula-74-2',
  label: 'Ejemplo por fórmula · 74.2 kg',
  source: 'formula',
  ...calculateNutritionTarget(74.2, 2009, 2.2, 0.7),
  parameters: { weightKg: 74.2, proteinFactor: 2.2, fatFactor: 0.7, targetKcal: 2009 },
};

export const smaePreset: NutritionTarget = {
  id: 'target-smae-example', label: 'Ejemplo SMAE', source: 'smae',
  protein: 138, fat: 85, carbs: 239, kcal: 2273,
};

export const smaeGroups: SmaeGroup[] = [
  ['vegetables', 'Verduras', undefined, 2, 0, 4, 4],
  ['fruits', 'Frutas', undefined, 0, 0, 15, 5.5],
  ['cereals-no-fat', 'Cereales y tubérculos', 'Sin grasa', 2, 0, 15, 8],
  ['cereals-with-fat', 'Cereales y tubérculos', 'Con grasa', 2, 5, 15, 0],
  ['legumes', 'Leguminosas', undefined, 8, 1, 20, 0],
  ['animal-very-low-fat', 'Alimentos de origen animal', 'Muy bajo aporte en grasa', 7, 1, 0, 11],
  ['animal-low-fat', 'Alimentos de origen animal', 'Bajo aporte en grasa', 7, 3, 0, 0],
  ['animal-moderate-fat', 'Alimentos de origen animal', 'Moderado aporte en grasa', 7, 5, 0, 3],
  ['animal-high-fat', 'Alimentos de origen animal', 'Alto aporte en grasa', 7, 8, 0, 0],
  ['milk-skim', 'Leche', 'Descremada', 9, 2, 12, 1],
  ['milk-semi', 'Leche', 'Semidescremada', 9, 4, 12, 0],
  ['milk-whole', 'Leche', 'Entera', 9, 8, 12, 0],
  ['milk-sugar', 'Leche', 'Con azúcar', 8, 5, 30, 0],
  ['fats-no-protein', 'Aceites y grasas', 'Sin proteína', 0, 5, 0, 9.5],
  ['fats-with-protein', 'Aceites y grasas', 'Con proteína', 3, 5, 3, 2],
  ['sugars-no-fat', 'Azúcares', 'Sin grasa', 0, 0, 10, 0],
  ['sugars-with-fat', 'Azúcares', 'Con grasa', 0, 5, 10, 0],
  ['free-energy', 'Libres en energía', undefined, 0, 0, 0, 0],
].map(([id, group, subgroup, proteinPerEquivalent, fatPerEquivalent, carbsPerEquivalent, exampleEquivalents]) => ({
  id: String(id), group: String(group), subgroup: subgroup ? String(subgroup) : undefined,
  proteinPerEquivalent: Number(proteinPerEquivalent), fatPerEquivalent: Number(fatPerEquivalent),
  carbsPerEquivalent: Number(carbsPerEquivalent), exampleEquivalents: Number(exampleEquivalents),
}));

type FoodSeed = [string, string, string, number, Unit, Macros, number, string, string?];
const foodSeeds: FoodSeed[] = [
  ['egg', 'Huevo completo', 'animal-moderate-fat', 1, 'pieza', m(6.3, 5, 0.4, 72), 1, 'egg'],
  ['egg-white', 'Clara de huevo', 'animal-very-low-fat', 1, 'pieza', m(3.6, 0.1, 0.2, 17), 0.5, 'egg'],
  ['egg-whites-ml', 'Claras de huevo', 'animal-very-low-fat', 280, 'ml', m(30, 0.8, 2, 135), 4, 'egg'],
  ['turkey', 'Pechuga de pavo', 'animal-very-low-fat', 30, 'g', m(6, 0.5, 1, 33), 0.8, 'drumstick'],
  ['chicken', 'Pechuga de pollo', 'animal-very-low-fat', 100, 'g', m(31, 3.6, 0, 165), 3, 'drumstick'],
  ['tuna', 'Atún', 'animal-very-low-fat', 100, 'g', m(24, 1, 0, 108), 3, 'fish'],
  ['white-fish', 'Pescado blanco', 'animal-very-low-fat', 100, 'g', m(22, 2, 0, 106), 3, 'fish'],
  ['lean-beef', 'Carne 95/5', 'animal-low-fat', 100, 'g', m(26, 5, 0, 149), 3, 'drumstick'],
  ['protein-powder', 'Proteína en polvo', 'animal-very-low-fat', 1, 'scoop', m(24, 2, 3, 126), 3, 'bottle'],
  ['greek-yogurt', 'Yogurt griego sin azúcar', 'milk-skim', 200, 'g', m(20, 0, 8, 112), 1.5, 'cup'],
  ['zero-bread', 'Pan cero', 'cereals-no-fat', 3, 'pieza', m(6, 1.5, 30, 158), 2, 'wheat'],
  ['tortilla', 'Tortilla de maíz', 'cereals-no-fat', 1, 'tortilla', m(1.4, 0.7, 12, 59), 1, 'wheat'],
  ['toast', 'Tostada de maíz', 'cereals-no-fat', 1, 'tostada', m(1.2, 0.6, 11, 54), 1, 'wheat'],
  ['potato', 'Papa cocida', 'cereals-no-fat', 100, 'g', m(2, 0.1, 20, 87), 1, 'leaf'],
  ['sweet-potato', 'Camote cocido', 'cereals-no-fat', 100, 'g', m(1.6, 0.1, 20, 86), 1, 'leaf'],
  ['pita', 'Pan pita', 'cereals-no-fat', 75, 'g', m(7, 1.2, 41, 205), 2.5, 'wheat'],
  ['oats', 'Avena', 'cereals-no-fat', 40, 'g', m(5.2, 2.8, 27, 152), 2, 'wheat'],
  ['beans', 'Frijol cocido', 'legumes', 150, 'g', m(13, 1, 35, 201), 1.8, 'bean'],
  ['rice', 'Arroz cocido', 'cereals-no-fat', 100, 'g', m(2.7, 0.3, 28, 130), 2, 'wheat'],
  ['pasta', 'Pasta cocida', 'cereals-no-fat', 100, 'g', m(5.8, 0.9, 31, 158), 2, 'wheat'],
  ['salmas', 'Salmas', 'cereals-no-fat', 1, 'paquete', m(2, 0.6, 18, 85), 1, 'wheat'],
  ['granola', 'Granola sin azúcar', 'cereals-with-fat', 30, 'g', m(3, 4, 20, 128), 1, 'wheat'],
  ['fruit', 'Porción de fruta', 'fruits', 1, 'porción', m(0, 0, 15, 60), 1, 'apple'],
  ['almonds', 'Almendras', 'fats-with-protein', 12, 'g', m(2.5, 6, 2.5, 74), 1, 'nut'],
  ['peanut-butter', 'Crema de cacahuate', 'fats-with-protein', 15, 'g', m(3.8, 7.5, 3, 95), 1, 'nut'],
  ['avocado', 'Aguacate', 'fats-no-protein', 45, 'g', m(0.9, 6.8, 3.8, 72), 1.5, 'leaf'],
  ['cream-cheese', 'Queso crema light', 'fats-no-protein', 30, 'g', m(2.5, 5, 3, 67), 1, 'cup'],
  ['light-cream', 'Crema light', 'fats-no-protein', 30, 'g', m(1, 6, 2, 66), 1.2, 'cup'],
  ['seeds', 'Semillas', 'fats-with-protein', 12, 'g', m(2.5, 6, 2, 72), 1, 'nut'],
  ['milk-lala', 'Leche Lala 100 light', 'milk-skim', 250, 'ml', m(13.5, 2.5, 12, 125), 1, 'milk'],
  ['vegetables', 'Verduras consumidas', 'vegetables', 100, 'g', m(2, 0.2, 5, 30), 1, 'leaf'],
  ['popcorn', 'Palomitas con mantequilla, cubeta grande de cine', 'cereals-with-fat', 120, 'g', m(12, 48, 72, 768), 6, 'popcorn', 'Aproximadamente una cubeta grande; puede variar por cine y preparación'],
  ['soda', 'Refresco regular', 'sugars-no-fat', 600, 'ml', m(0, 0, 63, 252), 6.3, 'cup', 'Tamaño y preparación editables'],
];

export const foods: Food[] = foodSeeds.map(([id, name, groupId, referenceQuantity, referenceUnit, macros, equivalents, icon, householdNote]) => ({
  id, name, groupId, referenceQuantity, referenceUnit, referenceGrams: referenceUnit === 'g' ? referenceQuantity : undefined,
  macros, equivalents, icon, householdNote, verified: false,
  source: id === 'popcorn' || id === 'soda' ? 'Dato demostrativo aproximado' : 'Estimación demostrativa basada en equivalentes SMAE',
  servings: id === 'popcorn' ? [
    { id: 'popcorn-half', label: '½ cubeta', quantity: 0.5, unit: 'cubeta', gramsEquivalent: 60 },
    { id: 'popcorn-full', label: '1 cubeta', quantity: 1, unit: 'cubeta', gramsEquivalent: 120 },
  ] : undefined,
}));

const option = (id: string, label: string, foodId: string, quantity: number, unit: Unit, equivalents = 1): MealOption => ({
  id, label, items: [{ id: `${id}-item`, foodId, label, quantity, unit, equivalents }],
});
const combined = (id: string, label: string, items: MealOption['items']): MealOption => ({ id, label, items });
const group = (id: string, label: string, options: MealOption[], note?: string): MealChoiceGroup => ({ id, label, required: !note, options, note });

const breakfastGroups: MealChoiceGroup[] = [
  group('breakfast-protein', 'Fuente de proteína', [
    combined('b-protein-1', '3 huevos completos + 2 claras', [
      { id: 'b-egg', foodId: 'egg', label: 'Huevos completos', quantity: 3, unit: 'pieza', equivalents: 3 },
      { id: 'b-white', foodId: 'egg-white', label: 'Claras', quantity: 2, unit: 'pieza', equivalents: 1 },
    ]),
    combined('b-protein-2', '3 huevos + 30 g de pechuga de pavo', [
      { id: 'b-egg-2', foodId: 'egg', label: 'Huevos', quantity: 3, unit: 'pieza', equivalents: 3 },
      { id: 'b-turkey', foodId: 'turkey', label: 'Pechuga de pavo', quantity: 30, unit: 'g', equivalents: 0.8 },
    ]),
  ]),
  group('breakfast-cereal', 'Fuente de cereal', [
    option('b-cereal-1', '3 piezas de pan cero', 'zero-bread', 3, 'pieza', 2),
    option('b-cereal-2', '3 tortillas de maíz', 'tortilla', 3, 'tortilla', 3),
    option('b-cereal-3', '200 g de papa', 'potato', 200, 'g', 2),
    option('b-cereal-4', '75 g de pan pita', 'pita', 75, 'g', 2.5),
    option('b-cereal-5', '60 g de avena', 'oats', 60, 'g', 3),
    option('b-cereal-6', '150 g de frijol', 'beans', 150, 'g', 1.8),
  ]),
  group('breakfast-vegetables', 'Verduras libres', [option('b-veg', 'Registrar verduras opcionalmente', 'vegetables', 100, 'g')], 'Indicación del plan; su aporte depende de lo consumido.'),
];

const snackGroups: MealChoiceGroup[] = [
  group('snack-protein', 'Fuente de proteína', [
    option('s-protein-1', '1 scoop de proteína en polvo', 'protein-powder', 1, 'scoop', 3),
    option('s-protein-2', '200 g de yogurt griego sin azúcar', 'greek-yogurt', 200, 'g', 1.5),
    option('s-protein-3', '120 g de pechuga de pollo', 'chicken', 120, 'g', 3.6),
    option('s-protein-4', '120 g de atún', 'tuna', 120, 'g', 3.6),
    option('s-protein-5', '280 ml de claras', 'egg-whites-ml', 280, 'ml', 4),
  ]),
  group('snack-cereal', 'Fuente de cereal', [
    option('s-cereal-1', '2 paquetes de Salmas', 'salmas', 2, 'paquete', 2),
    option('s-cereal-2', '100 g de arroz cocido', 'rice', 100, 'g', 2),
    option('s-cereal-3', '100 g de pasta cocida', 'pasta', 100, 'g', 2),
    option('s-cereal-4', '140 g de papa', 'potato', 140, 'g', 1.4),
    option('s-cereal-5', '30 g de granola sin azúcar', 'granola', 30, 'g', 1),
  ]),
  group('snack-fruit', 'Fruta', [option('s-fruit-1', '1 porción de fruta', 'fruit', 1, 'porción', 1)]),
  group('snack-fat', 'Fuente de grasas', [
    option('s-fat-1', '12 g de almendras', 'almonds', 12, 'g', 1),
    option('s-fat-2', '15 g de crema de cacahuate', 'peanut-butter', 15, 'g', 1),
    option('s-fat-3', '45 g de aguacate', 'avocado', 45, 'g', 1.5),
    option('s-fat-4', '30 g de queso crema light', 'cream-cheese', 30, 'g', 1),
  ]),
];

const lunchGroups: MealChoiceGroup[] = [
  group('lunch-protein', 'Fuente de proteína', [
    option('l-protein-1', '200 g de pechuga de pollo', 'chicken', 200, 'g', 6),
    option('l-protein-2', '200 g de carne 95/5', 'lean-beef', 200, 'g', 6),
    option('l-protein-3', '200 g de atún', 'tuna', 200, 'g', 6),
    option('l-protein-4', '245 g de pescado blanco', 'white-fish', 245, 'g', 7),
  ]),
  group('lunch-cereal', 'Fuente de cereal', [
    option('l-cereal-1', '3 tortillas de maíz', 'tortilla', 3, 'tortilla', 3),
    option('l-cereal-2', '135 g de arroz cocido', 'rice', 135, 'g', 2.7),
    option('l-cereal-3', '135 g de pasta cocida', 'pasta', 135, 'g', 2.7),
    option('l-cereal-4', '200 g de papa', 'potato', 200, 'g', 2),
    option('l-cereal-5', '180 g de camote', 'sweet-potato', 180, 'g', 1.8),
  ]),
  group('lunch-fat', 'Fuente de grasas', [
    option('l-fat-1', '45 g de aguacate', 'avocado', 45, 'g', 1.5),
    option('l-fat-2', '30 g de queso crema light', 'cream-cheese', 30, 'g', 1),
    option('l-fat-3', '30 g de crema light', 'light-cream', 30, 'g', 1.2),
    option('l-fat-4', '12 g de semillas', 'seeds', 12, 'g', 1),
  ]),
  group('lunch-vegetables', 'Verduras libres', [option('l-veg', 'Registrar verduras opcionalmente', 'vegetables', 100, 'g')], 'Indicación del plan; su aporte depende de lo consumido.'),
];

const dinnerGroups: MealChoiceGroup[] = [
  group('dinner-protein', 'Fuente de proteína', [
    option('d-protein-1', '180 g de pechuga de pollo', 'chicken', 180, 'g', 5.4),
    option('d-protein-2', '180 g de atún', 'tuna', 180, 'g', 5.4),
    option('d-protein-3', '200 g de pescado blanco', 'white-fish', 200, 'g', 6),
  ]),
  group('dinner-cereal', 'Fuente de cereal', [
    option('d-cereal-1', '3 tostadas de maíz', 'toast', 3, 'tostada', 3),
    option('d-cereal-2', '3 tortillas de maíz', 'tortilla', 3, 'tortilla', 3),
    option('d-cereal-3', '135 g de arroz cocido', 'rice', 135, 'g', 2.7),
    option('d-cereal-4', '135 g de pasta cocida', 'pasta', 135, 'g', 2.7),
    option('d-cereal-5', '200 g de papa', 'potato', 200, 'g', 2),
  ]),
  group('dinner-fat', 'Fuente de grasas', [option('d-fat-1', '45 g de aguacate', 'avocado', 45, 'g', 1.5)]),
  group('dinner-vegetables', 'Verduras libres', [option('d-veg', 'Registrar verduras opcionalmente', 'vegetables', 100, 'g')], 'Indicación del plan; su aporte depende de lo consumido.'),
];

export const recipes: Recipe[] = [
  {
    id: 'dinner-shake', name: 'Licuado de cena', mode: 'calculated', servings: 1,
    description: 'Opción 1 de cena prescrita', smaeNote: 'Aproximadamente 1 leche, 3 AOA, 1 fruta y 1 cereal.',
    ingredients: [
      { id: 'ri-milk', foodId: 'milk-lala', quantity: 250, unit: 'ml' },
      { id: 'ri-protein', foodId: 'protein-powder', quantity: 1, unit: 'scoop' },
      { id: 'ri-fruit', foodId: 'fruit', quantity: 1, unit: 'porción' },
      { id: 'ri-oats', foodId: 'oats', quantity: 20, unit: 'g' },
    ],
  },
  {
    id: 'manual-bowl', name: 'Bowl de ejemplo', mode: 'manual', servings: 1,
    description: 'Receta demostrativa con valores capturados manualmente.', ingredients: [],
    manualMacros: m(22, 12, 44, 372), smaeNote: 'Equivalentes no disponibles por falta de desglose de ingredientes.',
  },
];

export const planMeals: PlanMeal[] = [
  { id: 'breakfast', name: 'Desayuno', time: '08:00', choiceGroups: breakfastGroups, selectedOptionIds: { 'breakfast-protein': 'b-protein-1', 'breakfast-cereal': 'b-cereal-2' }, plannedMacros: m(35, 20, 55, 540), allowedSmaeGroupIds: ['animal-moderate-fat', 'cereals-no-fat', 'vegetables'] },
  { id: 'snack', name: 'Snack', time: '11:30', choiceGroups: snackGroups, selectedOptionIds: { 'snack-protein': 's-protein-1', 'snack-cereal': 's-cereal-1', 'snack-fruit': 's-fruit-1', 'snack-fat': 's-fat-1' }, plannedMacros: m(25, 15, 45, 415), allowedSmaeGroupIds: ['animal-very-low-fat', 'cereals-no-fat', 'fruits', 'fats-with-protein'] },
  { id: 'lunch', name: 'Comida', time: '15:00', choiceGroups: lunchGroups, selectedOptionIds: { 'lunch-protein': 'l-protein-1', 'lunch-cereal': 'l-cereal-2', 'lunch-fat': 'l-fat-1' }, plannedMacros: m(45, 30, 75, 750), allowedSmaeGroupIds: ['animal-very-low-fat', 'cereals-no-fat', 'fats-no-protein', 'vegetables'] },
  { id: 'dinner', name: 'Cena', time: '20:30', choiceGroups: dinnerGroups, recipeIds: ['dinner-shake'], selectedOptionIds: { 'dinner-protein': 'd-protein-1', 'dinner-cereal': 'd-cereal-1', 'dinner-fat': 'd-fat-1' }, plannedMacros: m(33, 20, 64, 568), allowedSmaeGroupIds: ['animal-very-low-fat', 'cereals-no-fat', 'fats-no-protein', 'vegetables', 'milk-skim', 'fruits'] },
];

export function createDemoState(): DemoState {
  return {
    profile: { id: 'patient-demo', name: 'Daniel', practitionerName: 'Diana Sandoval', timezone: 'America/Chihuahua' },
    target: { ...smaePreset },
    plan: { id: 'plan-demo', patientId: 'patient-demo', title: 'Plan de alimentación', targetId: smaePreset.id, meals: structuredClone(planMeals), active: true },
    foods: structuredClone(foods), recipes: structuredClone(recipes), smaeGroups: structuredClone(smaeGroups),
    dailyLog: { id: 'daily-demo', date: new Date().toISOString().slice(0, 10), mealLogs: {} },
    recalculationEvents: [], recentFoodIds: ['popcorn', 'soda', 'fruit'],
  };
}
