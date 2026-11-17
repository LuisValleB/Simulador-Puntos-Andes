'use client';
import React from 'react';
import { NutritionStop, NutritionSubItem, DEFAULT_CARBS, DEFAULT_SODIUM } from '../utils/calculations';

const TIPOS = [
  { value: 'gel',         label: 'Gel',        emoji: '⚡' },
  { value: 'solido',      label: 'Sólido',     emoji: '🍌' },
  { value: 'sal',         label: 'Sal',        emoji: '🧂' },
  { value: 'cafeina',     label: 'Cafeína',    emoji: '☕' },
  { value: 'isotonico',   label: 'Isotónico',  emoji: '💧' },
  { value: 'agua',        label: 'Agua',       emoji: '🚰' },
];

const NutritionIcon = ({ type, className = "w-4 h-4", color }: { type: string, className?: string, color?: string }) => {
  const finalColor = color || (type === 'solido' ? '#16a34a' : type === 'sal' ? '#0ea5e9' : type === 'cafeina' ? '#a16207' : type === 'hidratacion' || type === 'isotonico' ? '#06b6d4' : type === 'agua' ? '#2563eb' : '#8b5cf6');

  switch (type) {
    case 'gel':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12l-2 3v15H8V6z" />
          <path d="M6 3v3h12V3" />
          <path d="M12 9l-2 3h4l-2 3" />
        </svg>
      );
    case 'solido':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21c4-1 13-5 16-14 .5-1.5 1-2.5 2-3.5m-3 3.5C13 11 7 13 4.5 12" />
          <path d="M19 7c1 1.5.5 3.5-1 5-2 2-6.5 4.5-11.5 5" />
        </svg>
      );
    case 'sal':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="9" width="14" height="6" rx="3" transform="rotate(-45 12 12)" />
          <path d="M12 7l5 5" />
        </svg>
      );
    case 'cafeina':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="12" rx="5" ry="8" transform="rotate(-45 12 12)" />
          <path d="M8 16c2-2 4-6 8-8" />
        </svg>
      );
    case 'hidratacion':
    case 'isotonico':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 2h7l-1 4h-5l-1-4z" />
          <path d="M7.5 6h9v15H7.5z" />
          <path d="M10 12h4M12 10v4" />
        </svg>
      );
    case 'agua':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke={finalColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      );
  }
};

interface Props {
  stops: NutritionStop[];
  onChange: (stops: NutritionStop[]) => void;
  totalDistanceKm: number;
  planMode: 'km' | 'tiempo';
  onPlanModeChange: (mode: 'km' | 'tiempo') => void;
  totalEstimatedMinutes: number;
}

function makeSubItem(type: string = 'gel'): NutritionSubItem {
  const t = TIPOS.find(tp => tp.value === type);
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
    type: type as any,
    customLabel: t?.label || type,
    quantity: 1,
    customCarbs: null,
    customSodium: null,
    customMl: null,
    nota: '',
  };
}

export default function NutritionPlanner({ stops, onChange, totalDistanceKm, planMode, onPlanModeChange, totalEstimatedMinutes }: Props) {

  const addStop = () => {
    const newStop: NutritionStop = {
      id: Date.now().toString(),
      km: 0,
      minuteMark: 0,
      mode: planMode,
      items: [makeSubItem()],
    };
    onChange([...stops, newStop]);
  };

  const removeStop = (stopId: string) => {
    onChange(stops.filter(s => s.id !== stopId));
  };

  const updateStop = (stopId: string, field: 'km' | 'minuteMark', value: number) => {
    onChange(stops.map(stop => {
      if (stop.id !== stopId) return stop;
      const updated = { ...stop, [field]: value };
      // Sync km ↔ minuteMark
      if (field === 'minuteMark' && totalEstimatedMinutes > 0 && totalDistanceKm > 0) {
        updated.km = parseFloat(((value / totalEstimatedMinutes) * totalDistanceKm).toFixed(1));
      }
      if (field === 'km' && totalEstimatedMinutes > 0 && totalDistanceKm > 0) {
        updated.minuteMark = Math.round((value / totalDistanceKm) * totalEstimatedMinutes);
      }
      return updated;
    }));
  };

  const addSubItem = (stopId: string) => {
    onChange(stops.map(stop => {
      if (stop.id !== stopId) return stop;
      return { ...stop, items: [...stop.items, makeSubItem()] };
    }));
  };

  const removeSubItem = (stopId: string, subId: string) => {
    onChange(stops.map(stop => {
      if (stop.id !== stopId) return stop;
      const filtered = stop.items.filter(i => i.id !== subId);
      // If no items left, remove the whole stop
      if (filtered.length === 0) return null as any;
      return { ...stop, items: filtered };
    }).filter(Boolean));
  };

  const updateSubItem = (stopId: string, subId: string, field: keyof NutritionSubItem, value: any) => {
    onChange(stops.map(stop => {
      if (stop.id !== stopId) return stop;
      return {
        ...stop,
        items: stop.items.map(sub => {
          if (sub.id !== subId) return sub;
          const updated = { ...sub, [field]: value };
          // If type changes, update label if it was the default
          if (field === 'type') {
            const oldDef = TIPOS.find(t => t.value === sub.type)?.label || '';
            if (sub.customLabel === oldDef || !sub.customLabel) {
              updated.customLabel = TIPOS.find(t => t.value === value)?.label || value;
            }
            updated.customCarbs = null;
            updated.customSodium = null;
          }
          return updated;
        })
      };
    }));
  };

  const fmtMin = (min: number) => {
    const h = Math.floor(min / 60), m = Math.round(min % 60);
    return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m}'`;
  };

  const getCarbs = (sub: NutritionSubItem) => sub.customCarbs ?? DEFAULT_CARBS[sub.type] ?? 0;
  const getSodium = (sub: NutritionSubItem) => sub.customSodium ?? DEFAULT_SODIUM[sub.type] ?? 0;

  return (
    <div className="space-y-3">
      {/* Toggle km / tiempo */}
      <div className="flex gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200 w-fit">
        <button onClick={() => onPlanModeChange('km')}
          className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all
            ${planMode === 'km' ? 'bg-white text-[#8b5cf6] shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}>
          Por Kilómetro
        </button>
        <button onClick={() => onPlanModeChange('tiempo')}
          className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all
            ${planMode === 'tiempo' ? 'bg-white text-[#8b5cf6] shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}>
          Por Tiempo
        </button>
      </div>

      {/* Stops */}
      {stops.map((stop, stopIdx) => {
        const totalStopCarbs = stop.items.reduce((s, i) => s + getCarbs(i) * i.quantity, 0);
        const totalStopSodium = stop.items.reduce((s, i) => s + getSodium(i) * i.quantity, 0);

        return (
          <div key={stop.id} className="rounded-xl border border-[#8b5cf6]/20 bg-[#8b5cf6]/[0.02] overflow-hidden">
            {/* Stop header: km/time + summary + delete */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[#8b5cf6]/[0.06] border-b border-[#8b5cf6]/10">
              <div className="w-6 h-6 bg-[#8b5cf6] text-white rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0">
                {stopIdx + 1}
              </div>

              {planMode === 'km' ? (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-[#8b5cf6]">km</span>
                  <input type="number" min={0} max={totalDistanceKm} step={0.5}
                    value={stop.km || ''}
                    onChange={e => updateStop(stop.id, 'km', parseFloat(e.target.value) || 0)}
                    className="w-14 text-xs border border-[#8b5cf6]/30 bg-white rounded px-1.5 py-1 text-center font-mono font-bold focus:outline-none focus:border-[#8b5cf6]" />
                </div>
              ) : (
                <div className="flex items-center gap-0.5">
                  <input type="number" min={0} max={99} step={1}
                    value={Math.floor((stop.minuteMark || 0) / 60) || ''}
                    onChange={e => {
                      const h = parseInt(e.target.value) || 0;
                      const m = (stop.minuteMark || 0) % 60;
                      updateStop(stop.id, 'minuteMark', h * 60 + m);
                    }}
                    className="w-10 text-xs border border-[#8b5cf6]/30 bg-white rounded px-1 py-1 text-center font-mono font-bold focus:outline-none focus:border-[#8b5cf6]"
                    placeholder="h" />
                  <span className="text-[9px] font-bold text-[#8b5cf6]">h</span>
                  <input type="number" min={0} max={59} step={5}
                    value={(stop.minuteMark || 0) % 60 || ''}
                    onChange={e => {
                      const h = Math.floor((stop.minuteMark || 0) / 60);
                      const m = parseInt(e.target.value) || 0;
                      updateStop(stop.id, 'minuteMark', h * 60 + m);
                    }}
                    className="w-10 text-xs border border-[#8b5cf6]/30 bg-white rounded px-1 py-1 text-center font-mono font-bold focus:outline-none focus:border-[#8b5cf6]"
                    placeholder="m" />
                  <span className="text-[9px] font-bold text-[#8b5cf6]">m</span>
                </div>
              )}

              {/* Equivalente */}
              <span className="text-[9px] font-mono text-stone-400 flex-shrink-0">
                {planMode === 'km' && stop.minuteMark > 0 && `≈ ${fmtMin(stop.minuteMark)}`}
                {planMode === 'tiempo' && stop.km > 0 && `≈ km ${stop.km}`}
              </span>

              <div className="flex-1"></div>

              {/* Totales de la parada */}
              <span className="text-[8px] font-mono font-bold text-stone-400 hidden sm:inline">
                {totalStopCarbs}g CH · {totalStopSodium}mg Na
              </span>

              <button onClick={() => removeStop(stop.id)}
                className="text-stone-400 hover:text-red-500 text-xs font-bold flex-shrink-0" title="Eliminar parada">✕</button>
            </div>

            {/* Sub-items */}
            <div className="px-3 py-2 space-y-1.5">
              {stop.items.map(sub => (
                <div key={sub.id} className="flex flex-wrap gap-x-2 gap-y-1 items-center bg-white p-2 rounded-lg border border-stone-150">
                  {/* Type selector */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <NutritionIcon type={sub.type} className="w-4 h-4" />
                    <select value={sub.type}
                      onChange={e => updateSubItem(stop.id, sub.id, 'type', e.target.value)}
                      className="text-xs border border-stone-200 bg-stone-50 rounded px-1.5 py-0.5 focus:outline-none focus:border-[#8b5cf6] w-20 font-bold text-stone-700"
                      title="Tipo">
                      {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>

                  {/* Editable name */}
                  <input type="text" value={sub.customLabel}
                    onChange={e => updateSubItem(stop.id, sub.id, 'customLabel', e.target.value)}
                    placeholder="Nombre del producto"
                    className="flex-1 min-w-[100px] text-xs border border-stone-200 bg-white rounded px-2 py-0.5 font-bold text-stone-800 focus:outline-none focus:border-[#8b5cf6]" />

                  {/* Quantity */}
                  <div className="flex items-center gap-0.5 bg-stone-50 border border-stone-200 rounded px-1 py-0.5">
                    <button onClick={() => updateSubItem(stop.id, sub.id, 'quantity', Math.max(1, sub.quantity - 1))}
                      className="w-4 h-4 text-xs text-stone-500 hover:text-stone-800 font-bold">−</button>
                    <span className="w-4 text-center text-[10px] font-mono font-bold">{sub.quantity}</span>
                    <button onClick={() => updateSubItem(stop.id, sub.id, 'quantity', sub.quantity + 1)}
                      className="w-4 h-4 text-xs text-stone-500 hover:text-stone-800 font-bold">+</button>
                  </div>

                  {/* CH per unit */}
                  <div className="flex items-center gap-0.5">
                    <span className="text-[8px] font-bold text-stone-400">CH</span>
                    <input type="number" min={0} step={1}
                      value={sub.customCarbs !== null && sub.customCarbs !== undefined ? sub.customCarbs : ''}
                      onChange={e => updateSubItem(stop.id, sub.id, 'customCarbs', e.target.value === '' ? null : parseFloat(e.target.value) || 0)}
                      placeholder={`${DEFAULT_CARBS[sub.type] || 0}`}
                      className="w-10 text-[10px] border border-stone-200 rounded px-1 py-0.5 text-center font-mono focus:outline-none focus:border-[#8b5cf6]" />
                    <span className="text-[7px] text-stone-400">g</span>
                  </div>

                  {/* Na per unit */}
                  <div className="flex items-center gap-0.5">
                    <span className="text-[8px] font-bold text-stone-400">Na</span>
                    <input type="number" min={0} step={10}
                      value={sub.customSodium !== null && sub.customSodium !== undefined ? sub.customSodium : ''}
                      onChange={e => updateSubItem(stop.id, sub.id, 'customSodium', e.target.value === '' ? null : parseFloat(e.target.value) || 0)}
                      placeholder={`${DEFAULT_SODIUM[sub.type] || 0}`}
                      className="w-12 text-[10px] border border-stone-200 rounded px-1 py-0.5 text-center font-mono focus:outline-none focus:border-[#8b5cf6]" />
                    <span className="text-[7px] text-stone-400">mg</span>
                  </div>

                  {/* mL per unit */}
                  <div className="flex items-center gap-0.5">
                    <span className="text-[8px] font-bold text-blue-400">mL</span>
                    <input type="number" min={0} step={50}
                      value={sub.customMl !== null && sub.customMl !== undefined ? sub.customMl : ''}
                      onChange={e => updateSubItem(stop.id, sub.id, 'customMl', e.target.value === '' ? null : parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-12 text-[10px] border border-stone-200 rounded px-1 py-0.5 text-center font-mono focus:outline-none focus:border-blue-400" />
                  </div>

                  {/* Delete sub-item */}
                  <button onClick={() => removeSubItem(stop.id, sub.id)}
                    className="text-stone-300 hover:text-red-500 text-[10px] font-bold px-0.5" title="Eliminar">✕</button>
                </div>
              ))}

              {/* Add sub-item to this stop */}
              <button onClick={() => addSubItem(stop.id)}
                className="w-full bg-[#8b5cf6]/5 border border-[#8b5cf6]/20 hover:bg-[#8b5cf6]/10 hover:border-[#8b5cf6]/40 rounded py-1.5 text-[10px] font-bold text-[#8b5cf6] transition-colors">
                + Agregar otro item en esta parada
              </button>
            </div>
          </div>
        );
      })}

      <button onClick={addStop}
        className="w-full bg-[#8b5cf6]/10 border-2 border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/20 hover:border-[#8b5cf6]/50 rounded-xl py-3 text-sm font-black text-[#8b5cf6] transition-colors flex items-center justify-center gap-2">
        <svg className="w-4 h-4 text-[#8b5cf6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg> Nueva parada de nutrición
      </button>
    </div>
  );
}
