import type { Macros } from '../domain/types';

export const numberFormat = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });
export const integerFormat = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });

export function formatMacro(value: number) { return `${numberFormat.format(value)} g`; }
export function formatKcal(value: number) { return `${integerFormat.format(value)} kcal`; }

export function formatDate(date = new Date()) {
  const text = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function macroDifference(actual: Macros, planned: Macros): Macros {
  return { protein: actual.protein - planned.protein, fat: actual.fat - planned.fat, carbs: actual.carbs - planned.carbs, kcal: actual.kcal - planned.kcal };
}

export function signed(value: number, unit: 'g' | 'kcal' = 'g') {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${numberFormat.format(value)} ${unit}`;
}
