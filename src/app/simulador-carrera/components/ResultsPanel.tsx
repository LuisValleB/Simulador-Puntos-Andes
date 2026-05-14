import React from 'react';
import { NutritionStop, DEFAULT_CARBS, DEFAULT_SODIUM } from '../utils/calculations';

interface Props {
  projectedTime: string;
  carbsPerHour: number;
  sodiumPerHour: number;
  totalCarbs: number;
  sptcRange: { low: number; mid: number; high: number };
  kme: number;
  totalDistance: number;
  dPlus: number;
  nutritionStops: NutritionStop[];
  totalEstimatedMinutes: number;
}

function carbsStatus(g: number) {
  if (g < 45) return { color: 'text-red-500', bg: 'bg-red-50 border-red-200', label: 'Déficit energético ⚠️' };
  if (g <= 60) return { color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200', label: 'Conservador' };
  if (g <= 90) return { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Óptimo ✓' };
  return { color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200', label: 'Alto — requiere gut training' };
}

const EMOJIS: Record<string, string> = {
  gel: '⚡', solido: '🍌', sal: '🧂', cafeina: '☕', hidratacion: '💧',
};

export default function ResultsPanel({
  projectedTime, carbsPerHour, sodiumPerHour, totalCarbs,
  sptcRange, kme, totalDistance, dPlus,
  nutritionStops, totalEstimatedMinutes,
}: Props) {
  const status = carbsStatus(carbsPerHour);

  // Aggregate all sub-items across all stops
  const itemSummary = new Map<string, { label: string; type: string; qty: number; carbs: number; sodium: number; ml: number }>();
  let totalMl = 0;
  let totalSodiumAll = 0;
  let totalCarbsAll = 0;

  for (const stop of nutritionStops) {
    for (const sub of stop.items) {
      const c = sub.customCarbs ?? DEFAULT_CARBS[sub.type] ?? 0;
      const s = sub.customSodium ?? DEFAULT_SODIUM[sub.type] ?? 0;
      const ml = sub.customMl ?? 0;
      const key = sub.customLabel || sub.type;
      const existing = itemSummary.get(key);
      if (existing) {
        existing.qty += sub.quantity;
        existing.carbs += c * sub.quantity;
        existing.sodium += s * sub.quantity;
        existing.ml += ml * sub.quantity;
      } else {
        itemSummary.set(key, {
          label: key,
          type: sub.type,
          qty: sub.quantity,
          carbs: c * sub.quantity,
          sodium: s * sub.quantity,
          ml: ml * sub.quantity,
        });
      }
      totalMl += ml * sub.quantity;
      totalSodiumAll += s * sub.quantity;
      totalCarbsAll += c * sub.quantity;
    }
  }

  const sortedItems = Array.from(itemSummary.values()).sort((a, b) => b.qty - a.qty);
  const totalStops = nutritionStops.length;
  const totalHours = totalEstimatedMinutes / 60;

  return (
    <div className="space-y-4 font-sans">

      {/* Métricas de ruta */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-sm">
          <p className="text-xl font-black text-stone-800">{totalDistance.toFixed(1)}</p>
          <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider">km</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-sm">
          <p className="text-xl font-black text-stone-800">{dPlus.toLocaleString()}</p>
          <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider">m D+</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-sm">
          <p className="text-xl font-black text-[#10A49B]">{kme.toFixed(1)}</p>
          <p className="text-[10px] font-bold opacity-50 uppercase tracking-wider">KmE</p>
        </div>
      </div>

      {/* Tiempo proyectado */}
      <div className="text-center bg-stone-800 text-white rounded-xl p-4 shadow-md border border-stone-900">
        <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1 text-[#10A49B]">
          Tiempo Proyectado
        </p>
        <p className="text-4xl font-black font-mono tracking-tight">{projectedTime}</p>
      </div>

      {/* Nutrición resumen */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-stone-100 pb-1.5">
          Estrategia Nutricional
        </p>

        {/* Métricas por hora */}
        <div className="grid grid-cols-3 gap-2">
          <div className={`rounded-lg p-2 text-center border ${status.bg}`}>
            <p className={`text-lg font-black ${status.color}`}>{carbsPerHour}</p>
            <p className="text-[8px] font-bold text-stone-500 uppercase">g CH/h</p>
          </div>
          <div className="rounded-lg p-2 text-center border bg-stone-50 border-stone-200">
            <p className="text-lg font-black text-stone-700">{sodiumPerHour}</p>
            <p className="text-[8px] font-bold text-stone-500 uppercase">mg Na/h</p>
          </div>
          <div className="rounded-lg p-2 text-center border bg-blue-50 border-blue-200">
            <p className="text-lg font-black text-blue-600">{totalHours > 0 ? Math.round(totalMl / totalHours) : 0}</p>
            <p className="text-[8px] font-bold text-stone-500 uppercase">mL/h</p>
          </div>
        </div>

        <p className={`text-[9px] font-bold text-center px-2 py-1 rounded ${status.bg} border`}>
          {status.label}
        </p>

        {/* Totales */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-stone-100">
          <div>
            <p className="text-sm font-black text-stone-700">{totalCarbsAll}g</p>
            <p className="text-[8px] font-bold text-stone-400 uppercase">CH Total</p>
          </div>
          <div>
            <p className="text-sm font-black text-stone-700">{totalSodiumAll}mg</p>
            <p className="text-[8px] font-bold text-stone-400 uppercase">Na Total</p>
          </div>
          <div>
            <p className="text-sm font-black text-blue-600">{totalMl}mL</p>
            <p className="text-[8px] font-bold text-stone-400 uppercase">Líquido</p>
          </div>
        </div>

        {/* Detalle por producto */}
        {sortedItems.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-stone-100">
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-wider mb-1">Detalle por producto</p>
            {sortedItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-stone-50 rounded-lg px-2.5 py-1.5 border border-stone-100">
                <span className="text-sm">{EMOJIS[item.type] || '📦'}</span>
                <span className="text-[11px] font-bold text-stone-800 flex-1 min-w-0 truncate">{item.label}</span>
                <span className="text-[11px] font-mono font-black text-[#8b5cf6] flex-shrink-0">×{item.qty}</span>
                <div className="flex gap-2 text-[9px] font-mono text-stone-500 flex-shrink-0">
                  <span>{item.carbs}g</span>
                  <span>{item.sodium}mg</span>
                  {item.ml > 0 && <span className="text-blue-500">{item.ml}mL</span>}
                </div>
              </div>
            ))}
            <p className="text-[8px] font-mono text-stone-400 text-center pt-1">
              {totalStops} parada{totalStops !== 1 ? 's' : ''} · {sortedItems.reduce((s, i) => s + i.qty, 0)} items totales
              {totalHours > 0 && ` · ~${(totalCarbsAll * 4).toLocaleString()} kcal`}
            </p>
          </div>
        )}
      </div>

      {/* Proyección SPTC */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-[#10A49B]/30 rounded-xl p-4 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#10A49B] mb-3 text-center">
          Proyección Absoluta Puntos Andes
        </p>
        <div className="flex justify-between items-end px-2">
          <div className="text-center flex flex-col items-center">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-tighter mb-0.5">Pesimista</span>
            <p className="text-xl font-black text-stone-600 tabular-nums">{sptcRange.low}</p>
          </div>
          <div className="h-8 w-px bg-stone-300/60 mb-1"></div>
          <div className="text-center flex flex-col items-center">
            <span className="text-[10px] font-black text-[#10A49B] uppercase tracking-wider mb-0.5 bg-white px-2 py-0.5 rounded-full border border-[#10A49B]/20 shadow-2xs">
              Plan Realista
            </span>
            <p className="text-5xl font-black text-[#10A49B] tabular-nums tracking-tighter leading-none my-1">
              {sptcRange.mid}
            </p>
          </div>
          <div className="h-8 w-px bg-stone-300/60 mb-1"></div>
          <div className="text-center flex flex-col items-center">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-tighter mb-0.5">Optimista</span>
            <p className="text-xl font-black text-stone-600 tabular-nums">{sptcRange.high}</p>
          </div>
        </div>
        <p className="text-[9px] font-medium text-stone-500 text-center mt-3 pt-2 border-t border-stone-200/50 leading-tight">
          Puntaje calculado por el motor analítico oficial usando el Esfuerzo Equivalente (KmE) y las condiciones ambientales configuradas.
        </p>
      </div>

    </div>
  );
}
