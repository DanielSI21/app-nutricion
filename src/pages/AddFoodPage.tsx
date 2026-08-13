import { BadgeInfo, Check, ChevronDown, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModalLayer } from '../components/ModalLayer';
import { manualFoodSchema } from '../domain/schemas';
import type { Food, MealId, Unit } from '../domain/types';
import { foodEntryFromFood, useNutrition } from '../state/NutritionContext';
import { formatKcal, formatMacro } from '../ui/format';

export function AddFoodPage() {
  const { state, saveChangedMeal, addManualFood } = useNutrition();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [groupId, setGroupId] = useState('all');
  const [selected, setSelected] = useState<Food>();
  const [quantity, setQuantity] = useState(0);
  const [mealId, setMealId] = useState<MealId>('lunch');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualError, setManualError] = useState('');
  const results = useMemo(() => state?.foods.filter((food) => {
    const matchesText = `${food.name} ${food.brand ?? ''}`.toLocaleLowerCase('es-MX').includes(query.toLocaleLowerCase('es-MX'));
    const smae = state.smaeGroups.find((group) => group.id === food.groupId);
    return matchesText && (groupId === 'all' || smae?.group === groupId);
  }) ?? [], [state, query, groupId]);
  if (!state) return null;
  const groups = Array.from(new Map(state.smaeGroups.map((group) => [group.group, group])).values());

  const openFood = (food: Food, amount = food.referenceQuantity) => { setSelected(food); setQuantity(amount); };
  const addToMeal = (food: Food) => {
    const current = state.dailyLog.mealLogs[mealId]?.entries ?? [];
    saveChangedMeal(mealId, [...current, foodEntryFromFood(food, quantity, food.referenceUnit)]);
    setSelected(undefined); navigate('/');
  };
  const submitManual = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = manualFoodSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) { setManualError(parsed.error.issues[0]?.message ?? 'Revisa los datos.'); return; }
    const item = parsed.data;
    const food = addManualFood({ name: item.name, quantity: item.quantity, unit: item.unit, macros: { protein: item.protein, fat: item.fat, carbs: item.carbs, kcal: item.kcal } });
    setManualOpen(false); openFood(food);
  };
  return <main className="page add-page">
    <header className="page-heading"><p className="eyebrow">Catálogo demostrativo</p><h1>Agregar alimento</h1><p>Busca por nombre o marca. Revisa la fuente antes de registrar.</p></header>
    <div className="catalog-toolbar"><label className="search-field search-field--large"><Search /><span className="sr-only">Buscar por nombre o marca</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej. palomitas, pollo, refresco…" /></label><label className="filter-select"><SlidersHorizontal /><span className="sr-only">Filtrar por grupo SMAE</span><select value={groupId} onChange={(event) => setGroupId(event.target.value)}><option value="all">Todos los grupos</option>{groups.map((group) => <option value={group.group} key={group.group}>{group.group}</option>)}</select><ChevronDown /></label></div>
    {!query && <section className="recent-section"><div className="section-heading"><div><p className="eyebrow">Acceso rápido</p><h2>Usados recientemente</h2></div></div><div className="recent-row">{state.recentFoodIds.map((id) => state.foods.find((food) => food.id === id)).filter(Boolean).map((food) => <button key={food!.id} onClick={() => openFood(food!)}><span>{food!.icon === 'popcorn' ? '🍿' : food!.icon === 'cup' ? '🥤' : '🍎'}</span><strong>{food!.name}</strong><small>{food!.referenceQuantity} {food!.referenceUnit}</small></button>)}</div></section>}
    <section className="catalog-results"><div className="section-heading"><div><p className="eyebrow">{results.length} resultados</p><h2>Alimentos</h2></div><button className="text-button" onClick={() => setManualOpen(true)}><Plus /> Agregar manual</button></div>
      {results.length === 0 ? <div className="empty-inline"><Search /><strong>No encontramos coincidencias</strong><span>Prueba otro término o agrega un alimento manual.</span></div> : <div className="food-grid">{results.map((food) => { const group = state.smaeGroups.find((item) => item.id === food.groupId); return <article className="catalog-card" key={food.id} onClick={() => openFood(food)}><div className="catalog-card__icon" aria-hidden="true">{food.icon === 'popcorn' ? '🍿' : food.icon === 'cup' ? '🥤' : food.icon === 'apple' ? '🍎' : '◌'}</div><div className="catalog-card__body"><span className={food.verified ? 'data-badge data-badge--verified' : 'data-badge'}>{food.verified ? 'Verificado' : 'Demostrativo'}</span><h3>{food.name}</h3><p>{group?.group}{group?.subgroup ? ` · ${group.subgroup}` : ''}</p><strong>{food.referenceQuantity} {food.referenceUnit}</strong><div className="catalog-macros"><span>{formatMacro(food.macros.protein)} P</span><span>{formatMacro(food.macros.fat)} G</span><span>{formatMacro(food.macros.carbs)} C</span><b>{formatKcal(food.macros.kcal)}</b></div></div><button className="round-add" aria-label={`Ver ${food.name}`}><Plus /></button></article>; })}</div>}
    </section>
    {selected && <ModalLayer><div className="dialog-backdrop"><section className="food-detail-sheet" role="dialog" aria-modal="true" aria-labelledby="food-detail-title"><div className="sheet-handle"/><div className="picker-head"><div><span className="data-badge">{selected.verified ? 'Verificado' : 'Dato aproximado'}</span><h2 id="food-detail-title">{selected.name}</h2></div><button className="icon-button" aria-label="Cerrar" onClick={() => setSelected(undefined)}><X /></button></div><p className="source-note"><BadgeInfo /> {selected.source}. {selected.householdNote}</p>{selected.id === 'popcorn' && <div className="quick-amounts"><button className={quantity === 60 ? 'selected' : ''} onClick={() => setQuantity(60)}>½ cubeta <small>60 g</small></button><button className={quantity === 120 ? 'selected' : ''} onClick={() => setQuantity(120)}>1 cubeta <small>120 g</small></button></div>}<label className="pill-field"><span>Cantidad personalizada</span><div><input type="number" min="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}/><strong>{selected.referenceUnit}</strong></div></label><div className="live-macros" aria-live="polite">{(() => { const entry = foodEntryFromFood(selected, quantity, selected.referenceUnit); return <><span><strong>{formatMacro(entry.macros.protein)}</strong>P</span><span><strong>{formatMacro(entry.macros.fat)}</strong>G</span><span><strong>{formatMacro(entry.macros.carbs)}</strong>C</span><span><strong>{formatKcal(entry.macros.kcal)}</strong>Energía</span></>; })()}</div><label className="pill-field"><span>Registrar en</span><select value={mealId} onChange={(event) => setMealId(event.target.value as MealId)}>{state.plan.meals.map((meal) => <option value={meal.id} key={meal.id}>{meal.name} · {meal.time}</option>)}</select></label><button className="button button--primary button--full" onClick={() => addToMeal(selected)}><Check/> Añadir al registro</button></section></div></ModalLayer>}
    {manualOpen && <ModalLayer><div className="dialog-backdrop"><form className="manual-dialog" role="dialog" aria-modal="true" aria-labelledby="manual-title" onSubmit={submitManual}><div className="picker-head"><div><p className="eyebrow">Dato no verificado</p><h2 id="manual-title">Agregar alimento manual</h2></div><button type="button" className="icon-button" onClick={() => setManualOpen(false)} aria-label="Cerrar"><X/></button></div><p className="source-note"><BadgeInfo/> Se guardará como información capturada manualmente.</p>{manualError && <p className="form-error" role="alert">{manualError}</p>}<label className="form-field"><span>Nombre</span><input name="name" required /></label><div className="form-grid"><label className="form-field"><span>Cantidad de referencia</span><input name="quantity" type="number" min="0.1" step="0.1" defaultValue="100" required/></label><label className="form-field"><span>Unidad</span><select name="unit"><option value="g">g</option><option value="ml">ml</option><option value="pieza">pieza</option><option value="porción">porción</option></select></label></div><div className="form-grid form-grid--macros"><label className="form-field"><span>kcal</span><input name="kcal" type="number" min="0" step="0.1" defaultValue="0"/></label><label className="form-field"><span>Proteína (g)</span><input name="protein" type="number" min="0" step="0.1" defaultValue="0"/></label><label className="form-field"><span>Grasa (g)</span><input name="fat" type="number" min="0" step="0.1" defaultValue="0"/></label><label className="form-field"><span>Carbohidratos (g)</span><input name="carbs" type="number" min="0" step="0.1" defaultValue="0"/></label></div><button className="button button--primary button--full">Guardar alimento</button></form></div></ModalLayer>}
  </main>;
}
