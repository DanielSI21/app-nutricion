import type { DemoState } from '../domain/types';
import { demoStateSchema } from '../domain/schemas';
import { createDemoState } from './seeds';

export interface NutritionRepository {
  readonly mode: 'demo' | 'supabase';
  load(): Promise<DemoState>;
  save(state: DemoState): Promise<void>;
  reset(): Promise<DemoState>;
}

export class LocalNutritionRepository implements NutritionRepository {
  readonly mode = 'demo' as const;
  private readonly key = 'mi-plan-nutricional:v1';

  async load(): Promise<DemoState> {
    const raw = localStorage.getItem(this.key);
    if (!raw) return this.reset();
    try {
      const parsed = JSON.parse(raw) as unknown;
      const validated = demoStateSchema.parse(parsed);
      return validated as unknown as DemoState;
    } catch {
      return this.reset();
    }
  }

  async save(state: DemoState) {
    localStorage.setItem(this.key, JSON.stringify(state));
  }

  async reset() {
    const state = createDemoState();
    await this.save(state);
    return state;
  }
}
