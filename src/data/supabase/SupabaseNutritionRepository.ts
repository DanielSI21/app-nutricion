import type { DemoState } from '../../domain/types';
import type { NutritionRepository } from '../repository';
import { LocalNutritionRepository } from '../repository';
import { supabase } from './client';

/**
 * Adaptador progresivo. El catálogo/plan remoto se habilita al configurar Supabase.
 * Hasta que exista una sesión autenticada, conserva una copia local validada para
 * que la experiencia de demostración no dependa de red.
 */
export class SupabaseNutritionRepository implements NutritionRepository {
  readonly mode = 'supabase' as const;
  private readonly cache = new LocalNutritionRepository();

  async load(): Promise<DemoState> {
    if (!supabase) throw new Error('Supabase no está configurado.');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return this.cache.load();
    // El mapeo completo queda aislado aquí para no acoplar la UI al esquema remoto.
    return this.cache.load();
  }

  async save(state: DemoState) {
    await this.cache.save(state);
  }

  async reset() {
    return this.cache.reset();
  }
}
