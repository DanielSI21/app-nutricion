import type { Macros } from '../domain/types';
import { formatKcal, formatMacro } from '../ui/format';

export function MacroSummary({ consumed, target, compact = false }: { consumed: Macros; target?: Macros; compact?: boolean }) {
  const metrics = [
    { key: 'protein', label: 'Proteína', short: 'P', color: '#67703A', value: consumed.protein, target: target?.protein, format: formatMacro },
    { key: 'fat', label: 'Grasa', short: 'G', color: '#C4905C', value: consumed.fat, target: target?.fat, format: formatMacro },
    { key: 'carbs', label: 'Carbohidratos', short: 'C', color: '#8E9B67', value: consumed.carbs, target: target?.carbs, format: formatMacro },
    { key: 'kcal', label: 'Energía', short: 'E', color: '#4F514B', value: consumed.kcal, target: target?.kcal, format: formatKcal },
  ];
  return <div className={`macro-grid ${compact ? 'macro-grid--compact' : ''}`} aria-label="Resumen de nutrimentos">
    {metrics.map((metric) => {
      const percentage = metric.target ? Math.min(100, Math.max(0, metric.value / metric.target * 100)) : 0;
      return <div className="macro-item" key={metric.key}>
        <div className="macro-item__top"><span className="macro-dot" style={{ background: metric.color }}>{metric.short}</span><span>{metric.label}</span></div>
        <strong>{metric.format(metric.value)}</strong>
        {metric.target !== undefined && <>
          <span className="macro-target">de {metric.format(metric.target)}</span>
          <div className="macro-bar" aria-hidden="true"><span style={{ width: `${percentage}%`, background: metric.color }} /></div>
        </>}
      </div>;
    })}
  </div>;
}
