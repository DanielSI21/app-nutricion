import type { NutritionRepository } from './repository';
import { LocalNutritionRepository } from './repository';
import { isSupabaseConfigured } from './supabase/client';
import { SupabaseNutritionRepository } from './supabase/SupabaseNutritionRepository';

export const repository: NutritionRepository = isSupabaseConfigured
  ? new SupabaseNutritionRepository()
  : new LocalNutritionRepository();
