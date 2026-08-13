import { Apple, ChevronDown, Coffee, MoonStar, Salad, Utensils } from 'lucide-react';
import { useState } from 'react';
import { recipeMacros } from '../domain/calculations';
import type { MealId } from '../domain/types';
import { useNutrition } from '../state/NutritionContext';
import { formatKcal, formatMacro } from '../ui/format';

const icons = { breakfast: Coffee, snack: Apple, lunch: Salad, dinner: MoonStar };

export function PlanPage() {
  const { state, selectMealOption } = useNutrition();
  const [expanded, setExpanded] = useState<MealId | null>('breakfast');
  if (!state) return null;
  return <main className="page">
    <header className="page-heading"><p className="eyebrow">Prescripción vigente</p><h1>Mi plan</h1><p>Elige una opción dentro de cada grupo. Las cantidades se conservan tal como fueron indicadas.</p></header>
    <div className="plan-layout"><section className="plan-list">
      {state.plan.meals.map((meal) => { const Icon = icons[meal.id]; const open = expanded === meal.id; return <article className={`plan-meal ${open ? 'plan-meal--open' : ''}`} key={meal.id}>
        <button className="plan-meal__toggle" aria-expanded={open} onClick={() => setExpanded(open ? null : meal.id)}><span className="meal-icon"><Icon /></span><span><strong>{meal.name}</strong><small>{meal.time} · {meal.choiceGroups.filter((group) => group.required).length} grupos</small></span><span className="plan-meal__kcal">{formatKcal(meal.plannedMacros.kcal)}</span><ChevronDown className="chevron" /></button>
        {open && <div className="plan-meal__content">
          {meal.recipeIds?.map((recipeId) => { const recipe = state.recipes.find((item) => item.id === recipeId); if (!recipe) return null; const macros = recipeMacros(recipe, state.foods); return <div className="prescribed-recipe" key={recipe.id}><span className="meal-icon meal-icon--soft"><Utensils /></span><div><span className="tag">Alternativa en receta</span><strong>{recipe.name}</strong><small>{recipe.ingredients.map((ingredient) => `${ingredient.quantity} ${ingredient.unit} ${state.foods.find((food) => food.id === ingredient.foodId)?.name ?? ''}`).join(' + ')}</small><span>{formatMacro(macros.protein)} P · {formatMacro(macros.carbs)} C · {formatKcal(macros.kcal)}</span></div></div>; })}
          {meal.choiceGroups.map((choice) => <fieldset className="choice-group" key={choice.id}><legend>{choice.label}{!choice.required && <span>Opcional</span>}</legend>{choice.note && <p className="choice-note">{choice.note}</p>}<div className="option-grid">{choice.options.map((option) => { const selected = meal.selectedOptionIds[choice.id] === option.id; return <label className={`plan-option ${selected ? 'selected' : ''}`} key={option.id}><input type="radio" name={`${meal.id}-${choice.id}`} checked={selected} onChange={() => selectMealOption(meal.id, choice.id, option.id)} /><span className="radio-dot" /><span>{option.label}</span></label>; })}</div></fieldset>)}
          <div className="plan-macro-line"><span>Objetivo aproximado de esta comida</span><strong>{formatMacro(meal.plannedMacros.protein)} P · {formatMacro(meal.plannedMacros.fat)} G · {formatMacro(meal.plannedMacros.carbs)} C</strong></div>
        </div>}
      </article>; })}
    </section><aside className="plan-note-card"><span className="brand-mark"><svg viewBox="0 0 44 44"><path d="M10 29C11 18 19 9 33 8c1 13-6 24-18 25"/><path d="M12 34c4-8 9-13 17-18"/></svg></span><p className="eyebrow">Una nota sobre el plan</p><h2>Flexible dentro de lo prescrito</h2><p>Puedes intercambiar opciones del mismo grupo. “Verduras libres” es una indicación del plan, no significa aporte energético cero; puedes registrar lo que consumas.</p><small>Consulta cambios clínicos con {state.profile.practitionerName}.</small></aside></div>
  </main>;
}
