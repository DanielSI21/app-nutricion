export type MealId = 'breakfast' | 'snack' | 'lunch' | 'dinner';
export type Unit = 'g' | 'ml' | 'pieza' | 'porción' | 'paquete' | 'scoop' | 'tortilla' | 'tostada' | 'cubeta';

export interface Macros {
  protein: number;
  fat: number;
  carbs: number;
  kcal: number;
}

export interface PatientProfile {
  id: string;
  name: string;
  practitionerName: string;
  timezone: string;
}

export interface NutritionTarget extends Macros {
  id: string;
  label: string;
  source: 'formula' | 'smae';
  parameters?: { weightKg: number; proteinFactor: number; fatFactor: number; targetKcal: number };
}

export interface SmaeGroup {
  id: string;
  group: string;
  subgroup?: string;
  proteinPerEquivalent: number;
  fatPerEquivalent: number;
  carbsPerEquivalent: number;
  exampleEquivalents: number;
}

export interface FoodServing {
  id: string;
  label: string;
  quantity: number;
  unit: Unit;
  gramsEquivalent?: number;
}

export interface Food {
  id: string;
  name: string;
  brand?: string;
  groupId: string;
  subgroup?: string;
  referenceQuantity: number;
  referenceUnit: Unit;
  referenceGrams?: number;
  macros: Macros;
  equivalents: number;
  householdNote?: string;
  icon: string;
  source: string;
  verified: boolean;
  servings?: FoodServing[];
}

export interface MealOptionItem {
  id: string;
  foodId: string;
  label: string;
  quantity: number;
  unit: Unit;
  equivalents: number;
}

export interface MealOption {
  id: string;
  label: string;
  items: MealOptionItem[];
}

export interface MealChoiceGroup {
  id: string;
  label: string;
  required: boolean;
  note?: string;
  options: MealOption[];
}

export interface PlanMeal {
  id: MealId;
  name: string;
  time: string;
  choiceGroups: MealChoiceGroup[];
  recipeIds?: string[];
  selectedOptionIds: Record<string, string>;
  plannedMacros: Macros;
  allowedSmaeGroupIds: string[];
}

export interface NutritionPlan {
  id: string;
  patientId: string;
  title: string;
  targetId: string;
  meals: PlanMeal[];
  active: boolean;
}

export interface RecipeIngredient {
  id: string;
  foodId: string;
  quantity: number;
  unit: Unit;
}

export interface Recipe {
  id: string;
  name: string;
  mode: 'calculated' | 'manual';
  servings: number;
  ingredients: RecipeIngredient[];
  manualMacros?: Macros;
  description: string;
  smaeNote?: string;
}

export interface FoodLogEntry {
  id: string;
  foodId?: string;
  recipeId?: string;
  name: string;
  quantity: number;
  unit: Unit;
  macros: Macros;
  equivalents: number;
  groupId?: string;
  approximate?: boolean;
}

export type MealStatus = 'pending' | 'completed-planned' | 'completed-changed' | 'skipped' | 'recalculated';
export type DifferenceClassification = 'within-plan' | 'under' | 'over' | 'different-distribution';

export interface MealLog {
  id: string;
  mealId: MealId;
  status: MealStatus;
  entries: FoodLogEntry[];
  macros: Macros;
  classification: DifferenceClassification;
  recordedAt: string;
}

export interface DailyLog {
  id: string;
  date: string;
  mealLogs: Partial<Record<MealId, MealLog>>;
}

export interface ProposedMealAdjustment {
  mealId: MealId;
  originalMacros: Macros;
  proposedMacros: Macros;
  equivalents: Record<string, number>;
  exact: boolean;
}

export interface RecalculationProposal {
  id: string;
  createdAt: string;
  remaining: Macros;
  adjustments: ProposedMealAdjustment[];
  warnings: string[];
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface RecalculationEvent {
  id: string;
  createdAt: string;
  previousPlan: PlanMeal[];
  proposal: RecalculationProposal;
  decision: 'accepted' | 'rejected';
}

export interface DemoState {
  profile: PatientProfile;
  target: NutritionTarget;
  plan: NutritionPlan;
  foods: Food[];
  recipes: Recipe[];
  smaeGroups: SmaeGroup[];
  dailyLog: DailyLog;
  recalculationEvents: RecalculationEvent[];
  pendingProposal?: RecalculationProposal;
  recentFoodIds: string[];
}
