'use client';
import React from 'react';
import { NutritionStop, NutritionSubItem, DEFAULT_CARBS, DEFAULT_SODIUM } from '../utils/calculations';

const TIPOS = [
  { value: 'gel',         label: 'Gel',        emoji: '⚡' },
  { value: 'solido',      label: 'Sólido',     emoji: '🍌' },
  { value: 'sal',         label: 'Sal',        emoji: '🧂' },
  { value: 'cafeina',     label: 'Cafeína',    emoji: '☕' },
  { value: 'hidratacion', label: 'Isotónico',  emoji: '💧' },
];

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
    const lastStop = stops.length > 0 ? stops[stops.length - 1] : null;
    const newStop: NutritionStop = {
      id: Date.now().toString(),
      km: lastStop ? lastStop.km : 0,
      minuteMark: lastStop ? lastStop.minuteMark : 0,
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
                    value={isNaN(stop.km) ? '' : stop.km}
                    onChange={e => updateStop(stop.id, 'km', parseFloat(e.target.value) || 0)}
                    className="w-14 text-xs border border-[#8b5cf6]/30 bg-white rounded px-1.5 py-1 text-center font-mono font-bold focus:outline-none focus:border-[#8b5cf6]" />
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-[#8b5cf6]">min</span>
                  <input type="number" min={0} max={totalEstimatedMinutes > 0 ? Math.ceil(totalEstimatedMinutes) : 1440} step={5}
                    value={isNaN(stop.minuteMark) ? '' : stop.minuteMark}
                    onChange={e => updateStop(stop.id, 'minuteMark', parseFloat(e.target.value) || 0)}
                    className="w-16 text-xs border border-[#8b5cf6]/30 bg-white rounded px-1.5 py-1 text-center font-mono font-bold focus:outline-none focus:border-[#8b5cf6]" />
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
                  <select value={sub.type}
                    onChange={e => updateSubItem(stop.id, sub.id, 'type', e.target.value)}
                    className="text-xs border border-stone-200 bg-stone-50 rounded px-1 py-0.5 focus:outline-none focus:border-[#8b5cf6] w-12"
                    title="Tipo">
                    {TIPOS.map(t => <option key={t.value} value={t.value}>{t.emoji}</option>)}
                  </select>

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
        <span className="text-base">⚡</span> Nueva parada de nutrición
      </button>
    </div>
  );
}
