import { ArrowLeft, Check, ChevronRight, Minus, Plus, Search, Trash2, UtensilsCrossed, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ModalLayer } from '../components/ModalLayer';
import { addMacros, scaleFood, ZERO_MACROS } from '../domain/calculations';
import type { FoodLogEntry, MealId, Unit } from '../domain/types';
import { foodEntryFromFood, foodEntryFromRecipe, useNutrition } from '../state/NutritionContext';
import { formatKcal, formatMacro, macroDifference, signed } from '../ui/format';

function Comparison({ planned, actual }: { planned: FoodLogEntry['macros']; actual: FoodLogEntry['macros'] }) {
  const difference = macroDifference(actual, planned);
  const rows = [
    ['Proteína', planned.protein, actual.protein, difference.protein, 'g'],
    ['Grasa', planned.fat, actual.fat, difference.fat, 'g'],
    ['Carbohidratos', planned.carbs, actual.carbs, difference.carbs, 'g'],
    ['Energía', planned.kcal, actual.kcal, difference.kcal, 'kcal'],
  ] as const;
  return <section className="comparison-card" aria-live="polite"><div className="comparison-head"><span>Nutrimento</span><span>Planeado</span><span>Registrado</span><span>Diferencia</span></div>{rows.map(([label, plan, current, diff, unit]) => <div className="comparison-row" key={label}><strong>{label}</strong><span>{unit === 'g' ? formatMacro(plan) : formatKcal(plan)}</span><span>{unit === 'g' ? formatMacro(current) : formatKcal(current)}</span><span className={Math.abs(diff) < 1 ? 'difference-ok' : diff > 0 ? 'difference-over' : 'difference-under'}>{signed(diff, unit)}</span></div>)}</section>;
}

export function MealEditorPage() {
  const { mealId: param } = useParams();
  const mealId = param as MealId;
  const navigate = useNavigate();
  const { state, getPlannedEntries, registerPlanned, saveChangedMeal } = useNutrition();
  const [mode, setMode] = useState<'choose' | 'edit'>('choose');
  const [entries, setEntries] = useState<FoodLogEntry[]>([]);
  const [dirty, setDirty] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');

  const meal = state?.plan.meals.find((item) => item.id === mealId);
  const existing = state?.dailyLog.mealLogs[mealId];
  useEffect(() => {
    if (!state || !meal) return;
    if (existing) { setEntries(structuredClone(existing.entries)); setMode('edit'); }
    else setEntries(getPlannedEntries(mealId));
  }, [state?.dailyLog.id, mealId]);

  const actual = useMemo(() => entries.reduce((sum, entry) => addMacros(sum, entry.macros), { ...ZERO_MACROS }), [entries]);
  const foods = useMemo(() => state?.foods.filter((food) => `${food.name} ${food.brand ?? ''}`.toLocaleLowerCase('es-MX').includes(search.toLocaleLowerCase('es-MX'))).slice(0, 8) ?? [], [state, search]);
  if (!state || !meal) return <main className="page"><div className="empty-state"><h1>Comida no encontrada</h1><button className="button" onClick={() => navigate('/')}>Volver a hoy</button></div></main>;

  const goBack = () => {
    if (!dirty || window.confirm('¿Descartar los cambios de este registro?')) navigate('/');
  };
  const updateQuantity = (entryId: string, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity < 0) return;
    setEntries((current) => current.map((entry) => {
      if (entry.id !== entryId) return entry;
      const food = entry.foodId ? state.foods.find((item) => item.id === entry.foodId) : undefined;
      if (food) return { ...entry, quantity, macros: scaleFood(food, quantity, entry.unit), equivalents: food.equivalents * quantity / food.referenceQuantity };
      const factor = entry.quantity ? quantity / entry.quantity : 0;
      return { ...entry, quantity, macros: { protein: entry.macros.protein * factor, fat: entry.macros.fat * factor, carbs: entry.macros.carbs * factor, kcal: entry.macros.kcal * factor } };
    }));
    setDirty(true);
  };
  const removeEntry = (id: string) => { setEntries((current) => current.filter((entry) => entry.id !== id)); setDirty(true); };
  const addFood = (foodId: string, quantity?: number, unit?: Unit) => {
    const food = state.foods.find((item) => item.id === foodId)!;
    setEntries((current) => [...current, foodEntryFromFood(food, quantity ?? food.referenceQuantity, unit ?? food.referenceUnit)]);
    setPickerOpen(false); setDirty(true);
  };
  const addRecipe = (recipeId: string) => {
    const recipe = state.recipes.find((item) => item.id === recipeId)!;
    const entry = foodEntryFromRecipe(recipe.id, recipe.name, 1, state);
    if (entry) setEntries((current) => [...current, entry]);
    setPickerOpen(false); setDirty(true);
  };

  if (mode === 'choose' && !existing) return <main className="page editor-page">
    <button className="back-link" onClick={() => navigate('/')}><ArrowLeft size={19} /> Volver</button>
    <section className="editor-intro"><p className="eyebrow">Registrar comida</p><h1>{meal.name}</h1><p>{meal.time} · Elige la opción que describa mejor lo que pasó.</p></section>
    <div className="registration-choices">
      <button className="choice-card choice-card--primary" onClick={() => { registerPlanned(mealId); navigate('/'); }}><span className="choice-icon"><Check /></span><span><strong>Comí lo planeado</strong><small>Usaremos las opciones y cantidades prescritas.</small></span><ChevronRight /></button>
      <button className="choice-card" onClick={() => setMode('edit')}><span className="choice-icon"><UtensilsCrossed /></span><span><strong>Editar lo que comí</strong><small>Ajusta cantidades, elimina o agrega alimentos.</small></span><ChevronRight /></button>
    </div>
    <section className="planned-preview"><p className="eyebrow">Lo planeado</p>{entries.map((entry) => <div className="preview-row" key={entry.id}><span>{entry.name}</span><strong>{entry.quantity} {entry.unit}</strong></div>)}</section>
  </main>;

  return <main className="page editor-page">
    <button className="back-link" onClick={goBack}><ArrowLeft size={19} /> Volver</button>
    <div className="editor-heading"><div><p className="eyebrow">{existing ? 'Editar registro' : 'Lo que comiste'}</p><h1>{meal.name}</h1></div><span className="time-pill">{meal.time}</span></div>
    <div className="editor-layout">
      <section className="editor-card">
        <div className="section-heading"><div><h2>Alimentos</h2><p>Ajusta la cantidad real de cada alimento.</p></div></div>
        {entries.length === 0 ? <div className="empty-inline"><UtensilsCrossed /><strong>Aún no hay alimentos</strong><span>Agrega uno del catálogo o registra la comida como omitida.</span></div> : <div className="entry-list">{entries.map((entry) => <div className="entry-row" key={entry.id}>
          <div className="entry-row__name"><strong>{entry.name}</strong><span>{entry.approximate ? 'Dato aproximado' : 'Dato verificado'} · {formatKcal(entry.macros.kcal)}</span></div>
          <div className="quantity-control"><button aria-label={`Disminuir ${entry.name}`} onClick={() => updateQuantity(entry.id, Math.max(0, entry.quantity - (entry.unit === 'g' || entry.unit === 'ml' ? 10 : 0.5)))}><Minus size={16} /></button><label><span className="sr-only">Cantidad de {entry.name}</span><input type="number" min="0" step={entry.unit === 'g' || entry.unit === 'ml' ? 10 : 0.5} value={entry.quantity} onChange={(event) => updateQuantity(entry.id, Number(event.target.value))} /><small>{entry.unit}</small></label><button aria-label={`Aumentar ${entry.name}`} onClick={() => updateQuantity(entry.id, entry.quantity + (entry.unit === 'g' || entry.unit === 'ml' ? 10 : 0.5))}><Plus size={16} /></button></div>
          <button className="icon-button icon-button--danger" onClick={() => removeEntry(entry.id)} aria-label={`Eliminar ${entry.name}`}><Trash2 size={18} /></button>
        </div>)}</div>}
        <button className="button button--secondary button--full" onClick={() => setPickerOpen(true)}><Plus size={18} /> Añadir alimento o receta</button>
      </section>
      <aside className="editor-summary"><p className="eyebrow">Antes de guardar</p><h2>Comparación</h2><Comparison planned={meal.plannedMacros} actual={actual} /><div className="editor-actions"><button className="button button--ghost button--full" onClick={() => { if (window.confirm('¿Registrar que no comiste esta comida?')) { saveChangedMeal(mealId, [], true); navigate('/'); } }}>No comí esta comida</button><button className="button button--primary button--full" onClick={() => { saveChangedMeal(mealId, entries); navigate('/'); }} disabled={!entries.length}>Guardar registro</button></div></aside>
    </div>
    {pickerOpen && <ModalLayer><div className="dialog-backdrop"><section className="picker-sheet" role="dialog" aria-modal="true" aria-labelledby="picker-title"><div className="sheet-handle" /><div className="picker-head"><div><p className="eyebrow">Catálogo</p><h2 id="picker-title">Añadir a {meal.name.toLocaleLowerCase('es-MX')}</h2></div><button className="icon-button" onClick={() => setPickerOpen(false)} aria-label="Cerrar"><X /></button></div><label className="search-field"><Search size={19} /><span className="sr-only">Buscar alimento o marca</span><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar alimento o marca" /></label><div className="picker-results">
      {foods.map((food) => <article className="food-result" key={food.id}><div><strong>{food.name}</strong><span>{food.referenceQuantity} {food.referenceUnit} · {formatKcal(food.macros.kcal)}</span><small>{food.source}</small></div>{food.id === 'popcorn' ? <div className="quick-actions"><button onClick={() => addFood(food.id, 60, 'g')}>½ cubeta</button><button onClick={() => addFood(food.id, 120, 'g')}>1 cubeta</button></div> : <button className="round-add" onClick={() => addFood(food.id)} aria-label={`Agregar ${food.name}`}><Plus /></button>}</article>)}
      <p className="picker-section-label">Recetas</p>{state.recipes.map((recipe) => <button className="recipe-result" key={recipe.id} onClick={() => addRecipe(recipe.id)}><span><strong>{recipe.name}</strong><small>{recipe.mode === 'manual' ? 'Información manual' : `${recipe.ingredients.length} ingredientes`}</small></span><Plus /></button>)}
    </div></section></div></ModalLayer>}
  </main>;
}
