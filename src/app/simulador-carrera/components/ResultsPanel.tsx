import React from 'react';

interface Props {
  projectedTime: string;        // HH:MM:SS
  carbsPerHour: number;
  sodiumPerHour: number;
  totalCarbs: number;
  mlPerHour: number;
  sptcRange: { low: number; mid: number; high: number };
  kme: number;
  totalDistance: number;
  dPlus: number;
}

// Semáforo de carbohidratos por hora
function carbsStatus(g: number) {
  if (g < 45) return { color: 'text-red-500', label: 'Déficit energético ⚠️' };
  if (g <= 60) return { color: 'text-amber-500', label: 'Conservador' };
  if (g <= 90) return { color: 'text-emerald-600', label: 'Óptimo ✓' };
  return { color: 'text-blue-500', label: 'Alto — requiere gut training' };
}

export default function ResultsPanel({
  projectedTime, carbsPerHour, sodiumPerHour, totalCarbs,
  mlPerHour, sptcRange, kme, totalDistance, dPlus
}: Props) {
  const status = carbsStatus(carbsPerHour);

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
          Tiempo Proyectado (Pacing Naismith)
        </p>
        <p className="text-4xl font-black font-mono tracking-tight">{projectedTime}</p>
      </div>

      {/* Nutrición */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-2.5">
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 border-b border-stone-100 pb-1.5">
          Estrategia Nutricional
        </p>
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-stone-600">Carbohidratos/hora</span>
          <span className={`font-bold text-xs ${status.color}`}>
            {carbsPerHour} g/h — <span className="font-normal">{status.label}</span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-stone-600">Sodio/hora</span>
          <span className="font-bold text-xs text-stone-800">{sodiumPerHour} mg/h</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-stone-600">Hidratación</span>
          <span className="font-bold text-xs text-stone-800">{mlPerHour} mL/h</span>
        </div>
        <div className="flex justify-between items-center pt-1.5 border-t border-stone-100">
          <span className="text-xs font-medium text-stone-400">Total Carbohidratos</span>
          <span className="text-xs font-bold text-stone-500">{totalCarbs} g totales</span>
        </div>
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
