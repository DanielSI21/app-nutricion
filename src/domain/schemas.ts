import { z } from 'zod';

export const macrosSchema = z.object({
  protein: z.number().finite().nonnegative(),
  fat: z.number().finite().nonnegative(),
  carbs: z.number().finite().nonnegative(),
  kcal: z.number().finite().nonnegative(),
});

export const foodEntrySchema = z.object({
  id: z.string().min(1),
  foodId: z.string().optional(),
  recipeId: z.string().optional(),
  name: z.string().min(1),
  quantity: z.number().finite().positive(),
  unit: z.enum(['g', 'ml', 'pieza', 'porción', 'paquete', 'scoop', 'tortilla', 'tostada', 'cubeta']),
  macros: macrosSchema,
  equivalents: z.number().finite().nonnegative(),
  groupId: z.string().optional(),
  approximate: z.boolean().optional(),
});

export const demoStateSchema = z.object({
  profile: z.object({ id: z.string(), name: z.string(), practitionerName: z.string(), timezone: z.string() }),
  target: macrosSchema.extend({ id: z.string(), label: z.string(), source: z.enum(['formula', 'smae']), parameters: z.object({ weightKg: z.number(), proteinFactor: z.number(), fatFactor: z.number(), targetKcal: z.number() }).optional() }),
  plan: z.record(z.unknown()),
  foods: z.array(z.record(z.unknown())),
  recipes: z.array(z.record(z.unknown())),
  smaeGroups: z.array(z.record(z.unknown())),
  dailyLog: z.record(z.unknown()),
  recalculationEvents: z.array(z.record(z.unknown())),
  pendingProposal: z.record(z.unknown()).optional(),
  recentFoodIds: z.array(z.string()),
});

export const manualFoodSchema = z.object({
  name: z.string().trim().min(2, 'Escribe un nombre.'),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor que cero.'),
  unit: z.enum(['g', 'ml', 'pieza', 'porción']),
  kcal: z.coerce.number().nonnegative(),
  protein: z.coerce.number().nonnegative(),
  fat: z.coerce.number().nonnegative(),
  carbs: z.coerce.number().nonnegative(),
});
