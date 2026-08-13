import { Apple, ChevronRight, Clock3, Coffee, MoonStar, Salad, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MacroSummary } from '../components/MacroSummary';
import { sumMealLogs } from '../domain/calculations';
import type { MealId, MealStatus, PlanMeal } from '../domain/types';
import { useNutrition } from '../state/NutritionContext';
import { formatDate, formatKcal, formatMacro } from '../ui/format';

const mealIcons = { breakfast: Coffee, snack: Apple, lunch: Salad, dinner: MoonStar };
const statusLabels: Record<MealStatus, string> = {
  pending: 'Pendiente', 'completed-planned': 'Según el plan', 'completed-changed': 'Con cambios', skipped: 'Omitida', recalculated: 'Recalculada',
};

function MealCard({ meal, isNext, recalculated }: { meal: PlanMeal; isNext: boolean; recalculated: boolean }) {
  const { state, setMealTime } = useNutrition();
  if (!state) return null;
  const log = state.dailyLog.mealLogs[meal.id];
  const status: MealStatus = log?.status ?? (recalculated ? 'recalculated' : 'pending');
  const Icon = mealIcons[meal.id];
  const selected = meal.choiceGroups.filter((group) => group.required).map((group) => {
    const optionId = meal.selectedOptionIds[group.id];
    return group.options.find((option) => option.id === optionId)?.label ?? group.options[0]?.label;
  }).filter(Boolean);
  return <article className={`meal-card ${isNext ? 'meal-card--next' : ''}`}>
    {isNext && <div className="next-label"><Sparkles size={14} /> Próxima comida</div>}
    <div className="meal-card__header">
      <span className="meal-icon"><Icon size={22} /></span>
      <div><h3>{meal.name}</h3><label className="time-field"><Clock3 size={14} /><span className="sr-only">Horario de {meal.name}</span><input type="time" value={meal.time} onChange={(event) => setMealTime(meal.id, event.target.value)} /></label></div>
      <span className={`status status--${status}`}>{statusLabels[status]}</span>
    </div>
    <div className="meal-groups">
      {selected.slice(0, 3).map((label) => <span className="food-line" key={label}>• {label}</span>)}
      {selected.length > 3 && <span className="food-line food-line--more">+{selected.length - 3} elemento</span>}
    </div>
    <div className="meal-card__footer">
      <div className="meal-macros" aria-label="Macronutrientes aproximados"><span>{formatMacro((log?.macros ?? meal.plannedMacros).protein)} P</span><span>{formatMacro((log?.macros ?? meal.plannedMacros).carbs)} C</span><strong>{formatKcal((log?.macros ?? meal.plannedMacros).kcal)}</strong></div>
      <Link className={log ? 'button button--secondary button--small' : 'button button--primary button--small'} to={`/comida/${meal.id}`}>{log ? 'Ver o editar' : 'Registrar comida'}<ChevronRight size={17} /></Link>
    </div>
  </article>;
}

function DifferenceDialog({ mealId }: { mealId: MealId }) {
  const { state, keepPlan, createProposal } = useNutrition();
  const navigate = useNavigate();
  if (!state) return null;
  const meal = state.plan.meals.find((item) => item.id === mealId)!;
  const log = state.dailyLog.mealLogs[mealId]!;
  const classification = log.classification;
  const direction = classification === 'under' ? 'menos de lo planeado' : classification === 'over' ? 'más de lo planeado' : 'una distribución diferente';
  const focus = Math.abs(log.macros.fat - meal.plannedMacros.fat) > Math.abs(log.macros.protein - meal.plannedMacros.protein) ? 'grasa' : 'proteína';
  return <div className="dialog-backdrop" role="presentation">
    <section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="difference-title">
      <span className="dialog-icon"><Sparkles /></span>
      <p className="eyebrow">Revisemos el resto del día</p>
      <h2 id="difference-title">Registraste {direction}</h2>
      <p>La mayor diferencia está en {focus} durante {meal.name.toLocaleLowerCase('es-MX')}. Puedes conservar el resto del plan o revisar una propuesta para las comidas pendientes.</p>
      <div className="dialog-note">Los ajustes automáticos no sustituyen las indicaciones de tu nutrióloga.</div>
      <div className="dialog-actions"><button className="button button--secondary" onClick={() => keepPlan(mealId)}>Conservar plan</button><button className="button button--primary" onClick={() => { createProposal(mealId); navigate('/propuesta'); }}>Ver propuesta</button></div>
    </section>
  </div>;
}

export function TodayPage() {
  const { state, alertMealId } = useNutrition();
  if (!state) return null;
  const consumed = sumMealLogs(state.dailyLog.mealLogs);
  const completed = Object.keys(state.dailyLog.mealLogs).length;
  const nextMeal = state.plan.meals.find((meal) => !state.dailyLog.mealLogs[meal.id]);
  const recalculated = new Set(state.recalculationEvents.filter((event) => event.decision === 'accepted').flatMap((event) => event.proposal.adjustments.map((adjustment) => adjustment.mealId)));
  return <main className="page today-page">
    <section className="welcome-row">
      <div><p className="eyebrow">{formatDate()}</p><h1>Hola, {state.profile.name} <span aria-hidden="true">👋</span></h1><p>{completed === 0 ? 'Tu día está listo. Registra a tu ritmo.' : `${completed} de 4 comidas registradas`}</p></div>
      <div className="progress-orbit" aria-label={`${completed} de 4 comidas registradas`}><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="18"/><circle className="progress-orbit__value" cx="22" cy="22" r="18" pathLength="100" strokeDasharray={`${completed * 25} 100`}/></svg><strong>{completed}/4</strong></div>
    </section>
    <div className="today-layout">
      <section className="today-main" aria-labelledby="meals-heading">
        <div className="section-heading"><div><p className="eyebrow">Tu itinerario</p><h2 id="meals-heading">Comidas de hoy</h2></div><Link to="/plan" className="text-link">Ver plan completo</Link></div>
        <div className="meal-list">{state.plan.meals.map((meal) => <MealCard key={meal.id} meal={meal} isNext={meal.id === nextMeal?.id} recalculated={recalculated.has(meal.id) && !state.dailyLog.mealLogs[meal.id]} />)}</div>
      </section>
      <aside className="summary-card">
        <p className="eyebrow">Resumen de hoy</p><h2>Vas construyendo tu día</h2><p className="summary-intro">Tu consumo se actualiza con cada registro. Los valores del prototipo son aproximados.</p>
        <MacroSummary consumed={consumed} target={state.target} />
        <div className="practitioner-note"><span className="brand-mark brand-mark--small" aria-hidden="true"><svg viewBox="0 0 44 44"><path d="M10 29C11 18 19 9 33 8c1 13-6 24-18 25"/><path d="M12 34c4-8 9-13 17-18"/></svg></span><div><strong>Plan indicado por</strong><span>{state.profile.practitionerName}</span></div></div>
      </aside>
    </div>
    {alertMealId && <DifferenceDialog mealId={alertMealId} />}
  </main>;
}
