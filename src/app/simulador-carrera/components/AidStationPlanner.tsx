'use client';
import React from 'react';
import { AidStation } from './ElevationChart';

interface Props {
  stations: AidStation[];
  onChange: (stations: AidStation[]) => void;
  totalDistanceKm: number;
  totalEstimatedMinutes: number;
}

function formatTime(minutes: number): string {
  if (minutes <= 0) return '0:00';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  return `${m}'`;
}

export default function AidStationPlanner({ stations, onChange, totalDistanceKm, totalEstimatedMinutes }: Props) {
  const addStation = () => {
    const newStation: AidStation = {
      id: Date.now().toString(),
      km: 0,
      label: `PAS ${stations.length + 1}`,
      segmentMinutes: 0,
    };
    onChange([...stations, newStation]);
  };

  const updateStation = (id: string, field: keyof AidStation, value: any) => {
    onChange(stations.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeStation = (id: string) => {
    onChange(stations.filter(s => s.id !== id));
  };

  const totalSegmentTime = stations.reduce((sum, s) => sum + (s.segmentMinutes || 0), 0);
  const hasTime = totalEstimatedMinutes > 0;
  const lastPasKm = stations.length > 0 ? Math.max(...stations.map(s => s.km)) : 0;
  const lastSegmentKm = totalDistanceKm - lastPasKm;
  const remainingMinutes = hasTime ? totalEstimatedMinutes - totalSegmentTime : 0;

  return (
    <div className="space-y-1">
      {stations.map((station, idx) => {
        const prevKm = idx > 0 ? stations[idx - 1].km : 0;
        const segKm = station.km > prevKm ? station.km - prevKm : 0;
        const prevLabel = idx === 0 ? 'Partida' : stations[idx - 1].label;

        return (
          <React.Fragment key={station.id}>
            {/* ───── Tramo: tiempo estimado entre puntos ───── */}
            {hasTime && (
              <div className="flex items-center gap-2 py-1.5 px-2 bg-stone-50/80 rounded border border-dashed border-stone-200">
                <div className="flex items-center gap-1 text-[9px] font-bold text-stone-500 flex-1 min-w-0">
                  <span className="truncate">{prevLabel}</span>
                  <span className="text-stone-300">→</span>
                  <span className="truncate">{station.label}</span>
                  {segKm > 0 && <span className="text-stone-300 flex-shrink-0">({segKm.toFixed(1)}km)</span>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-[10px] text-[#10A49B]">⏱</span>
                  <input
                    type="number" min={0} max={totalEstimatedMinutes} step={1}
                    value={isNaN(station.segmentMinutes) ? '' : station.segmentMinutes}
                    onChange={e => updateStation(station.id, 'segmentMinutes', parseInt(e.target.value) || 0)}
                    className="w-14 text-xs border border-[#10A49B]/30 bg-white rounded px-1 py-0.5 text-center font-mono font-bold focus:outline-none focus:border-[#10A49B] focus:ring-1 focus:ring-[#10A49B]/20"
                    placeholder="min"
                  />
                  <span className="text-[9px] text-stone-400 font-bold">min</span>
                </div>
              </div>
            )}

            {/* ───── PAS (punto de abastecimiento) ───── */}
            <div className="flex gap-2 items-center bg-[#e67e22]/5 p-2 rounded-lg border border-[#e67e22]/20">
              <div className="w-7 h-7 bg-[#e67e22] text-white rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0">
                {idx + 1}
              </div>
              <div className="flex items-center gap-1 min-w-[65px]">
                <span className="text-[10px] font-bold text-[#e67e22] uppercase">km</span>
                <input type="number" min={0} max={totalDistanceKm} step={0.1}
                  value={isNaN(station.km) ? '' : station.km}
                  onChange={e => updateStation(station.id, 'km', parseFloat(e.target.value) || 0)}
                  className="w-14 text-xs border border-[#e67e22]/30 bg-white rounded px-1.5 py-1 text-center font-mono font-bold focus:outline-none focus:border-[#e67e22] focus:ring-1 focus:ring-[#e67e22]/30" />
              </div>
              <input type="text" value={station.label}
                onChange={e => updateStation(station.id, 'label', e.target.value)}
                placeholder="Nombre del punto"
                className="flex-1 text-xs border border-stone-300 bg-white rounded px-2 py-1 focus:outline-none focus:border-[#e67e22] font-medium" />
              <button onClick={() => removeStation(station.id)}
                className="text-stone-400 hover:text-red-500 text-xs px-1 font-bold flex-shrink-0">✕</button>
            </div>
          </React.Fragment>
        );
      })}

      {/* ───── Tramo final: último PAS → Meta ───── */}
      {hasTime && stations.length > 0 && (
        <div className="flex items-center gap-2 py-1.5 px-2 bg-stone-50/80 rounded border border-dashed border-stone-200">
          <div className="flex items-center gap-1 text-[9px] font-bold text-stone-500 flex-1 min-w-0">
            <span className="truncate">{stations[stations.length - 1].label}</span>
            <span className="text-stone-300">→</span>
            <span>Meta 🏁</span>
            {lastSegmentKm > 0 && <span className="text-stone-300 flex-shrink-0">({lastSegmentKm.toFixed(1)}km)</span>}
          </div>
          <span className={`text-[10px] font-mono font-bold flex-shrink-0 ${remainingMinutes >= 0 ? 'text-[#10A49B]' : 'text-red-500'}`}>
            ≈ {formatTime(Math.abs(remainingMinutes))} {remainingMinutes < 0 ? '⚠️' : ''}
          </span>
        </div>
      )}

      {/* Resumen de tiempos */}
      {hasTime && stations.length > 0 && totalSegmentTime > 0 && (
        <div className={`text-[9px] font-bold px-2 py-1.5 rounded text-center border mt-1
          ${Math.abs(totalSegmentTime - totalEstimatedMinutes) < 2 
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
            : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
          Tramos: {formatTime(totalSegmentTime)} 
          {remainingMinutes > 0 && ` + ${formatTime(remainingMinutes)} restante`}
          {' '}/ Total: {formatTime(totalEstimatedMinutes)}
        </div>
      )}

      <button onClick={addStation}
        className="w-full bg-[#e67e22]/10 border-2 border-[#e67e22]/30 hover:bg-[#e67e22]/20 hover:border-[#e67e22]/50 rounded-xl py-3 text-sm font-black text-[#e67e22] transition-colors flex items-center justify-center gap-2 mt-1">
        <span className="text-base">📦</span> Agregar punto de abastecimiento
      </button>
    </div>
  );
}
