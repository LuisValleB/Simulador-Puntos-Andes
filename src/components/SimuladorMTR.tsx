"use client";

import React, { useState, useEffect } from 'react';
import { calculatePuntosAndesScore } from '../utils/calculoRendimiento';
import { calcularRAP } from '../utils/calculoRAP';

const NumberInput = ({ label, value, max, onChange, step = 1, min = 0 }: any) => {
  const displayValue = isNaN(value) ? '' : value;
  return (
    <div className="flex flex-col">
      <label className="text-[9px] font-bold text-stone-500 uppercase mb-1 leading-tight min-h-[24px] flex items-end" title={label}>{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={displayValue}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full bg-white border border-stone-300 rounded-md px-2 py-1.5 text-stone-800 text-sm font-mono focus:outline-none focus:border-[#10A49B] focus:ring-1 focus:ring-[#10A49B] shadow-sm transition-colors text-center"
      />
    </div>
  );
};

function getCategoryAndColor(score: number, gender: 'H' | 'M') {
  if (gender === 'H') {
    if (score >= 900) return { name: 'Élite Mundial', color: '#1abc9c' };
    if (score >= 800) return { name: 'Selección Nacional', color: '#3498db' };
    if (score >= 700) return { name: 'Nivel Avanzado', color: '#f1c40f' };
    if (score >= 500) return { name: 'Amateur Competitivo', color: '#e67e22' };
    if (score >= 300) return { name: 'En Desarrollo', color: '#bdc3c7' };
    return { name: 'Inicio del Camino', color: '#d6eaf8' };
  } else {
    if (score >= 800) return { name: 'Élite Mundial', color: '#1abc9c' };
    if (score >= 720) return { name: 'Selección Nacional', color: '#3498db' };
    if (score >= 620) return { name: 'Nivel Avanzado', color: '#f1c40f' };
    if (score >= 450) return { name: 'Amateur Competitivo', color: '#e67e22' };
    if (score >= 250) return { name: 'En Desarrollo', color: '#bdc3c7' };
    return { name: 'Inicio del Camino', color: '#d6eaf8' };
  }
}

const CategoriasLegend = () => {
  const cats = [
    { name: 'Élite Mundial', color: '#1abc9c', h: '900+', m: '800+' },
    { name: 'Selección Nacional', color: '#3498db', h: '800 - 899', m: '720 - 799' },
    { name: 'Nivel Avanzado', color: '#f1c40f', h: '700 - 799', m: '620 - 719' },
    { name: 'Amateur Competitivo', color: '#e67e22', h: '500 - 699', m: '450 - 619' },
    { name: 'En Desarrollo', color: '#bdc3c7', h: '300 - 499', m: '250 - 449' },
    { name: 'Inicio del Camino', color: '#d6eaf8', h: '< 300', m: '< 250' },
  ];

  return (
    <div className="mt-4 w-full text-[10px] sm:text-xs">
      <details className="group">
        <summary className="cursor-pointer font-bold text-stone-500 uppercase tracking-wider flex items-center justify-center gap-1 p-2 bg-white rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors shadow-sm">
          Ver Tabla de Categorías y Colores
          <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="mt-2 bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-500 border-b border-stone-200">
                <th className="p-2 font-semibold">Categoría</th>
                <th className="p-2 font-semibold text-center border-l border-stone-200">Hombres</th>
                <th className="p-2 font-semibold text-center border-l border-stone-200">Mujeres</th>
              </tr>
            </thead>
            <tbody>
              {cats.map(c => (
                <tr key={c.name} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="p-2 font-medium flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }}></span>
                    <span className="truncate">{c.name}</span>
                  </td>
                  <td className="p-2 text-center text-stone-600 font-mono border-l border-stone-100">{c.h}</td>
                  <td className="p-2 text-center text-stone-600 font-mono border-l border-stone-100">{c.m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};

export default function SimuladorMTR() {
  const [distance, setDistance] = useState<number>(174);
  const [dPlus, setDPlus] = useState<number>(10200);
  const [dMinus, setDMinus] = useState<number>(10200);
  const [hours, setHours] = useState<number>(19);
  const [minutes, setMinutes] = useState<number>(18);
  const [seconds, setSeconds] = useState<number>(58);
  const [terrain, setTerrain] = useState<number>(1);
  const [climate, setClimate] = useState<number>(1);
  const [meanAltitude, setMeanAltitude] = useState<number>(0);
  const [nightHours, setNightHours] = useState<number>(0);
  const [gender, setGender] = useState<'H' | 'M'>('H');
  const [targetScoreInput, setTargetScoreInput] = useState<string>('');

  const [scoreData, setScoreData] = useState<any>(null);

  const safeDistance = isNaN(distance) || distance <= 0 ? 0.01 : distance;
  const safeDPlus = isNaN(dPlus) ? 0 : dPlus;
  const safeDMinus = isNaN(dMinus) ? 0 : dMinus;
  const safeHours = isNaN(hours) ? 0 : hours;
  const safeMinutes = isNaN(minutes) ? 0 : minutes;
  const safeSeconds = isNaN(seconds) ? 0 : seconds;
  const safeTerrain = isNaN(terrain) ? 1 : terrain;
  const safeClimate = isNaN(climate) ? 1 : climate;
  const safeAltitude = isNaN(meanAltitude) ? 0 : meanAltitude;
  const safeNight = isNaN(nightHours) ? 0 : nightHours;

  useEffect(() => {
    const result = calculatePuntosAndesScore(
      safeDistance, safeDPlus, safeDMinus, safeHours, safeMinutes, safeSeconds, safeTerrain, safeClimate, safeAltitude, safeNight
    );
    setScoreData(result);
  }, [safeDistance, safeDPlus, safeDMinus, safeHours, safeMinutes, safeSeconds, safeTerrain, safeClimate, safeAltitude, safeNight]);

  const score = scoreData?.score || 0;
  
  const totalSegundos = (safeHours * 3600) + (safeMinutes * 60) + safeSeconds;
  const rapResult = calcularRAP(safeDistance, safeDPlus, totalSegundos);

  const { name: categoryName, color: dynamicColor } = getCategoryAndColor(score, gender);

  const totalTimeMinutes = (safeHours * 60) + safeMinutes + (safeSeconds / 60);
  const paceDecimal = safeDistance > 0 ? totalTimeMinutes / safeDistance : 0;
  let displayPaceMin = Math.floor(paceDecimal);
  let displayPaceSec = Math.round((paceDecimal - displayPaceMin) * 60);

  if (displayPaceSec >= 60) {
    displayPaceMin += 1;
    displayPaceSec = 0;
  }

  const handlePaceChange = (newPaceMin: number, newPaceSec: number) => {
    const sPaceMin = isNaN(newPaceMin) ? 0 : newPaceMin;
    const sPaceSec = isNaN(newPaceSec) ? 0 : newPaceSec;
    const totalPaceMin = sPaceMin + (sPaceSec / 60);
    const newTotalMin = totalPaceMin * safeDistance;

    const h = Math.floor(newTotalMin / 60);
    const m = Math.floor(newTotalMin % 60);
    const s = Math.round((newTotalMin - Math.floor(newTotalMin)) * 60);

    setHours(h);
    setMinutes(m);
    setSeconds(s);
  };

  const handleTargetScore = (targetScore: number) => {
    if (isNaN(targetScore) || targetScore <= 0 || targetScore > 1000) return;
    const kmE = safeDistance + (safeDPlus / 100) + (safeDMinus / 200);
    const gradient = (safeDPlus / (safeDistance * 10));

    let penalizacionG = 0;
    if (gradient <= 15) {
      penalizacionG = gradient * 0.4;
    } else {
      penalizacionG = 8 - 2 * Math.exp((15 - gradient) / 5);
    }
    const vBaseIdeal = 46.7 - 4.6 * Math.log(kmE) - penalizacionG;

    const penalizaciones = [0, 0.010, 0.020, 0.035, 0.050];
    const terrainPenalty = penalizaciones[Math.min(Math.max(safeTerrain - 1, 0), 4)];
    const climatePenalty = penalizaciones[Math.min(Math.max(safeClimate - 1, 0), 4)];
    const M = Math.min(1.00 + terrainPenalty + climatePenalty, 1.10);

    let A = 1.00;
    if (safeAltitude > 1500) {
      A = 1 + 0.045 * Math.pow((safeAltitude - 1500) / 1000, 1.4);
    }
    A = Math.min(A, 1.30);

    const C = (targetScore / 1000) * vBaseIdeal / (M * A);
    if (C <= 0) return; 

    let N = 1.0;
    let totalTime = (kmE * N) / C; 

    for (let i = 0; i < 3; i++) {
      N = 1 + 0.02 * Math.min(1, safeNight / totalTime);
      N = Math.min(N, 1.02);
      totalTime = (kmE * N) / C;
    }

    const totalSeconds = Math.round(totalTime * 3600);
    const finalH = Math.floor(totalSeconds / 3600);
    const finalM = Math.floor((totalSeconds % 3600) / 60);
    const finalS = totalSeconds % 60;

    setHours(finalH);
    setMinutes(finalM);
    setSeconds(finalS);
  };

  const radius = 80;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; 
  const clampedScore = Math.min(Math.max(score, 0), 1000);
  const dashOffset = circumference - (clampedScore / 1000) * circumference;

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-xl overflow-hidden shadow-xl border border-stone-200 font-sans">
      
      {/* Header Compact */}
      <div className="flex justify-between items-center p-4 border-b border-stone-200 bg-stone-50">
        <h2 className="text-sm font-black tracking-tight text-stone-800 uppercase">Simulador Puntos Andes</h2>
        <div className="flex bg-stone-200 rounded p-0.5 border border-stone-300">
          <button
            onClick={() => setGender('H')}
            className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors ${gender === 'H' ? 'bg-white text-[#10A49B] shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Hombres
          </button>
          <button
            onClick={() => setGender('M')}
            className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors ${gender === 'M' ? 'bg-white text-[#10A49B] shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Mujeres
          </button>
        </div>
      </div>

      {/* Sticky Score Area for Mobile/Desktop Compact */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200 p-4 shadow-sm flex flex-col items-center">
        
        {/* Semi-circle Gauge */}
        <div className="relative w-[200px] h-[110px] flex flex-col items-center justify-end">
          <svg width="200" height="110" viewBox="0 0 200 110" className="absolute top-0 left-0 overflow-visible">
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e7e5e4" strokeWidth={strokeWidth} strokeLinecap="round" />
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={dynamicColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center text-center pb-1">
            <div className="text-5xl font-black tabular-nums leading-none tracking-tighter" style={{ color: dynamicColor, textShadow: `0 2px 10px ${dynamicColor}30` }}>
              {score}
            </div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mt-1">{categoryName}</span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-stone-50">
        
        {/* Inputs Grid */}
        <div className="flex flex-col gap-4">
          
          {/* Recorrido */}
          <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm">
            <h3 className="text-[10px] font-black text-stone-400 mb-2 uppercase tracking-widest border-b border-stone-100 pb-1">Recorrido</h3>
            <div className="grid grid-cols-3 gap-3">
              <NumberInput label="Dist (km)" value={distance} max={300} step={0.1} onChange={setDistance} />
              <NumberInput label="D+ (m)" value={dPlus} max={20000} step={100} onChange={setDPlus} />
              <NumberInput label="D- (m)" value={dMinus} max={20000} step={100} onChange={setDMinus} />
            </div>
          </div>

          {/* Tiempo & Ritmo */}
          <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm">
            <div className="flex justify-between items-end border-b border-stone-100 pb-1 mb-2">
              <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Tiempo Total</h3>
              <span className="text-[10px] font-bold text-stone-400 uppercase">Ritmo: <span className="text-stone-700">{displayPaceMin}:{displayPaceSec.toString().padStart(2, '0')}/km</span></span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <NumberInput label="Horas" value={hours} max={100} onChange={setHours} />
              <NumberInput label="Minutos" value={minutes} max={59} onChange={setMinutes} />
              <NumberInput label="Segundos" value={seconds} max={59} onChange={setSeconds} />
            </div>
            {/* Ritmo adjustment */}
            <div className="bg-stone-50 p-2 rounded border border-stone-100">
              <span className="block text-[9px] font-bold text-stone-500 uppercase mb-2">Ajustar por Ritmo</span>
              <div className="grid grid-cols-2 gap-3">
                <NumberInput label="Min / km" value={displayPaceMin} max={60} onChange={(val: number) => handlePaceChange(val, displayPaceSec)} />
                <NumberInput label="Seg / km" value={displayPaceSec} max={59} onChange={(val: number) => handlePaceChange(displayPaceMin, val)} />
              </div>
            </div>
          </div>

          {/* Condiciones Especiales */}
          <div className="bg-white p-3 rounded-lg border border-stone-200 shadow-sm">
            <h3 className="text-[10px] font-black text-stone-400 mb-2 uppercase tracking-widest border-b border-stone-100 pb-1">Condiciones (Penalizaciones)</h3>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput label="Terreno (1-5)" value={terrain} max={5} min={1} onChange={setTerrain} />
              <NumberInput label="Clima (1-5)" value={climate} max={5} min={1} onChange={setClimate} />
              <NumberInput label="Altitud Media (m)" value={meanAltitude} max={6000} step={50} onChange={setMeanAltitude} />
              <NumberInput label="Horas Noche" value={nightHours} max={100} step={0.5} onChange={setNightHours} />
            </div>
            
            <details className="mt-3 group text-[10px]">
              <summary className="cursor-pointer font-bold text-[#10A49B] uppercase tracking-wider flex items-center gap-1 hover:text-[#0c8a82] transition-colors">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ¿Qué significan los niveles 1 al 5?
              </summary>
              <div className="mt-2 p-2 bg-stone-50 border border-stone-200 rounded text-stone-600 leading-tight">
                <p className="mb-1"><strong className="text-stone-800">Terreno:</strong> Nivel 1 es ideal (calle, pista) hasta Nivel 5 que es extremo (campo traviesa difícil, roca suelta, nieve profunda).</p>
                <p><strong className="text-stone-800">Clima:</strong> Nivel 1 es ideal (templado, sin viento) hasta Nivel 5 que es extremo (calor/frío extremo, tormenta, vientos fuertes).</p>
              </div>
            </details>
          </div>

        </div>

        {/* RAP Compact Card */}
        <div className="mt-4 p-3 bg-stone-100 border-l-[3px] border-[#10A49B] rounded-r-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-stone-500 text-[9px] font-bold uppercase tracking-wider mb-0.5">Ritmo Real (GPS)</span>
              <span className="text-stone-800 text-lg font-bold tabular-nums leading-none">{rapResult.ritmoRealStr} <span className="text-[10px] font-medium text-stone-500">/km</span></span>
            </div>
            
            <div className="h-8 w-px bg-stone-300 mx-2"></div>
            
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[#10A49B] text-[9px] font-bold uppercase tracking-wider">RAP Equivalente</span>
              </div>
              <span className="text-[#10A49B] text-xl font-black tabular-nums leading-none">{rapResult.rapStr} <span className="text-[10px] font-medium opacity-70">/km</span></span>
            </div>
          </div>
        </div>

        {/* Inverse Simulator */}
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex flex-col w-full">
              <span className="text-[#10A49B] font-black text-[10px] tracking-widest uppercase mb-0.5">Simulador Inverso</span>
              <span className="text-stone-600 text-[10px] leading-tight">Calcula el tiempo necesario para lograr un puntaje.</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="number"
                placeholder="Ej: 800"
                value={targetScoreInput}
                onChange={(e) => setTargetScoreInput(e.target.value)}
                className="w-20 bg-white border border-[#10A49B]/50 rounded px-2 py-1.5 text-[#10A49B] font-bold text-center text-sm focus:outline-none focus:border-[#10A49B] shadow-inner"
              />
              <button
                onClick={() => handleTargetScore(parseFloat(targetScoreInput))}
                className="bg-[#10A49B] hover:bg-[#0c8a82] text-white font-bold py-1.5 px-3 rounded text-xs transition-colors whitespace-nowrap"
              >
                Calcular
              </button>
            </div>
          </div>
        </div>

        {/* Categories Legend */}
        <CategoriasLegend />

      </div>

    </div>
  );
}
