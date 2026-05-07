"use client";

import React, { useState, useEffect } from 'react';
import { calculatePuntosAndesScore } from '../utils/calculoRendimiento';
import { calcularRAP } from '../utils/calculoRAP';

const RunnerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
    <path d="m13 14-3.51-2.5a.5.5 0 0 0-.82.35l-.17 3.65L7 17.5" />
    <path d="M12.5 10.5 11 12l.5 2.5 3 2.5" />
    <circle cx="13.5" cy="5.5" r="1.5" fill="currentColor" />
    <path d="M17 17v4l-3-1" />
    <path d="M3 15.5 6 17l1.5-1.5" />
    <path d="M17 8.5 14 10l-1 .5" />
    <path d="M9 10.5 7.5 9 6 9.5" />
  </svg>
);

const SliderInput = ({ label, value, max, onChange, step = 1, min = 0 }: any) => {
  const displayValue = isNaN(value) ? '' : value;
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="w-36 text-sm font-semibold text-stone-700">{label}</div>
      <div className="flex-1 flex items-center pr-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={displayValue}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-emerald-500 outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
      </div>
      <div className="w-20">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={displayValue}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1.5 text-stone-800 text-sm font-mono focus:outline-none focus:border-emerald-500/50 text-center shadow-inner"
        />
      </div>
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
      safeDistance,
      safeDPlus,
      safeDMinus,
      safeHours,
      safeMinutes,
      safeSeconds,
      safeTerrain,
      safeClimate,
      safeAltitude,
      safeNight
    );
    setScoreData(result);
  }, [safeDistance, safeDPlus, safeDMinus, safeHours, safeMinutes, safeSeconds, safeTerrain, safeClimate, safeAltitude, safeNight]);

  const score = scoreData?.score || 0;
  const gradientVal = scoreData ? parseFloat(scoreData.gradient) : 0;

  const totalSegundos = (safeHours * 3600) + (safeMinutes * 60) + safeSeconds;
  const rapResult = calcularRAP(safeDistance, safeDPlus, totalSegundos);

  // Dynamic Category and Color
  const { name: categoryName, color: dynamicColor } = getCategoryAndColor(score, gender);

  // Pace Calculations
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

    if (C <= 0) return; // Impossible score (negative vBase)

    let N = 1.0;
    let totalTime = (kmE * N) / C; // in hours

    // Quick iteration to resolve the circular dependency of Night Hours Penalty
    for (let i = 0; i < 3; i++) {
      N = 1 + 0.02 * Math.min(1, safeNight / totalTime);
      N = Math.min(N, 1.02);
      totalTime = (kmE * N) / C;
    }

    const h = Math.floor(totalTime);
    let m = Math.floor((totalTime - h) * 60);
    let s = Math.round((totalTime - h - (m / 60)) * 3600);

    if (s >= 60) {
      s = 0;
      m += 1;
    }
    if (m >= 60) {
      m = 0;
    }

    // To be perfectly safe, recalculate from absolute total seconds
    const totalSeconds = Math.round(totalTime * 3600);
    const finalH = Math.floor(totalSeconds / 3600);
    const finalM = Math.floor((totalSeconds % 3600) / 60);
    const finalS = totalSeconds % 60;

    setHours(finalH);
    setMinutes(finalM);
    setSeconds(finalS);
  };

  // Progress calculations
  const radius = 140;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius; // 879.64
  const arcLength = circumference * 0.75; // 659.73 (270 degrees)
  const clampedScore = Math.min(Math.max(score, 0), 1000);
  const dashOffset = circumference - (clampedScore / 1000) * arcLength;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl overflow-hidden shadow-2xl border border-stone-200 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-stone-200 bg-stone-50">
        <h2 className="text-xl font-bold tracking-tight text-stone-800 mb-4 sm:mb-0">Rendimiento Puntos Andes</h2>

        <div className="flex items-center gap-4">
          <div className="flex bg-stone-200 rounded-lg p-1 border border-stone-300">
            <button
              onClick={() => setGender('H')}
              className={`px-4 py-1 text-xs font-bold uppercase rounded-md transition-colors ${gender === 'H' ? 'bg-white text-[#10A49B] shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Hombres
            </button>
            <button
              onClick={() => setGender('M')}
              className={`px-4 py-1 text-xs font-bold uppercase rounded-md transition-colors ${gender === 'M' ? 'bg-white text-[#10A49B] shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
            >
              Mujeres
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-stone-200 bg-white">
        <div className="flex gap-6 sm:gap-8 w-full justify-between sm:justify-start">
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-widest text-stone-500 uppercase mb-1">KME</span>
            <span className="font-mono text-sm font-bold text-stone-900">{scoreData?.kmE || "0.0"} <span className="text-[10px] text-stone-500">km</span></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-widest text-stone-500 uppercase mb-1">GRADIENTE</span>
            <span className="font-mono text-sm font-bold text-stone-900">{gradientVal.toFixed(2)} <span className="text-[10px] text-stone-500">%</span></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-widest text-stone-500 uppercase mb-1">V REAL</span>
            <span className="font-mono text-sm font-bold text-stone-900">{scoreData?.vReal || "0.0"} <span className="text-[10px] text-stone-500">km/h</span></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-widest text-stone-500 uppercase mb-1">V OBJETIVO</span>
            <span className="font-mono text-sm font-bold text-stone-900">{scoreData?.vBaseFinal || "0.0"} <span className="text-[10px] text-stone-500">km/h</span></span>
          </div>
        </div>
      </div>

      {/* Main Gauge Area */}
      <div className="bg-stone-50 m-6 rounded-2xl relative flex flex-col items-center justify-center py-12 md:py-20 shadow-inner overflow-hidden border border-stone-200">

        {/* Background Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

        <div className="relative w-[340px] h-[340px] flex items-center justify-center">
          {/* SVG Ring rotated to start bottom-left */}
          <svg width="340" height="340" viewBox="0 0 340 340" className="absolute inset-0 rotate-[135deg]">
            {/* Background Arc */}
            <circle
              cx="170"
              cy="170"
              r={radius}
              fill="transparent"
              stroke="#e7e5e4"
              strokeWidth={strokeWidth}
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeLinecap="round"
            />
            {/* Progress Arc */}
            <circle
              cx="170"
              cy="170"
              r={radius}
              fill="transparent"
              stroke={dynamicColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Inner Content */}
          <div className="absolute flex flex-col items-center justify-center text-center w-full mt-4">
            <span className="text-sm font-black text-stone-500 uppercase tracking-widest mb-2 transition-colors duration-500">{categoryName}</span>
            <div className="text-7xl font-bold mb-6 tabular-nums transition-colors duration-500" style={{ color: dynamicColor, textShadow: `0 0 40px ${dynamicColor}40` }}>{score}</div>

            <div className="flex flex-col items-center mt-2 opacity-80 transition-colors duration-500" style={{ color: dynamicColor }}>
              <RunnerIcon />
              <span className="text-stone-500 text-xs font-medium uppercase tracking-wider">Puntos Andes</span>
            </div>
          </div>
        </div>

        {/* Gradient Graph */}
        <div className="w-full max-w-md mt-4 px-6 z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black tracking-widest text-stone-500 uppercase">Inclinación (Gradiente)</span>
            <span className="text-xs font-bold text-stone-800">{gradientVal.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden flex relative border border-stone-300">
            <div className="h-full bg-[#10A49B] transition-all duration-500" style={{ width: `${Math.min((gradientVal / 40) * 100, 37.5)}%` }}></div>
            {gradientVal > 15 && (
              <div className="h-full bg-[#463024] transition-all duration-500" style={{ width: `${Math.min(((gradientVal - 15) / 40) * 100, 37.5)}%` }}></div>
            )}
            {gradientVal > 30 && (
              <div className="h-full bg-red-600 transition-all duration-500" style={{ width: `${Math.min(((gradientVal - 30) / 40) * 100, 25)}%` }}></div>
            )}
          </div>
          <div className="flex justify-between mt-1 px-1">
            <span className="text-[8px] text-stone-500 font-bold">0%</span>
            <span className="text-[8px] text-stone-500 font-bold">15% Muro</span>
            <span className="text-[8px] text-stone-500 font-bold">40% Extremo</span>
          </div>
        </div>

      </div>

      {/* RAP Card */}
      <div className="mx-6 mb-6 rounded-lg bg-emerald-50 border-l-[3px] border-[#10A49B] p-5 shadow-md">
        <h3 className="text-[#10A49B] font-bold text-xs tracking-wider uppercase mb-3">Tu rendimiento en idioma corredor</h3>
        <div className="flex flex-col sm:flex-row justify-between sm:justify-start gap-8 sm:gap-16">
          <div className="flex flex-col">
            <span className="text-stone-600 text-xs font-semibold mb-1">Ritmo Real (GPS)</span>
            <span className="text-[#10A49B] text-3xl font-bold tabular-nums tracking-tight">{rapResult.ritmoRealStr} <span className="text-sm font-medium">/km</span></span>
            <span className="text-stone-500 text-[10px] mt-1 max-w-[120px] leading-tight">Lo que viste en tu reloj</span>
          </div>

          <div className="hidden sm:block w-px bg-[#10A49B] opacity-20"></div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-stone-600 text-xs font-semibold">RAP equivalente</span>
              <div className="group relative cursor-help">
                <div className="bg-[#10A49B] text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">?</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-white text-stone-700 text-[10px] leading-tight rounded border border-stone-200 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  El RAP convierte tu ritmo real en un ritmo equivalente sobre terreno plano. Te permite comparar el rendimiento entre carreras de montaña y carreras de calle en una unidad común.
                  {rapResult.infos.length > 0 && (
                    <div className="mt-2 text-amber-700 font-semibold">
                      {rapResult.infos.map((info: string, idx: number) => <p key={idx}>{info}</p>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <span className="text-[#10A49B] text-3xl font-bold tabular-nums tracking-tight">{rapResult.rapStr} <span className="text-sm font-medium">/km</span></span>
            <span className="text-stone-500 text-[10px] mt-1 max-w-[150px] leading-tight">Ritmo plano equivalente</span>
          </div>
        </div>

        {rapResult.warnings.length > 0 && (
          <div className="mt-4 p-2 bg-amber-100 border border-amber-300 text-amber-800 text-[10px] rounded leading-tight font-medium">
            {rapResult.warnings.map((warn: string, idx: number) => <p key={idx}>{warn}</p>)}
          </div>
        )}
      </div>

      {/* Target Score Calculator */}
      <div className="p-6 border-y border-stone-200 bg-stone-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-[#10A49B] font-bold text-sm tracking-wide uppercase mb-1">Simulador Inverso</span>
          <span className="text-stone-600 text-sm">¿Qué tiempo necesitas para lograr un puntaje específico?</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="Ej: 800"
            value={targetScoreInput}
            onChange={(e) => setTargetScoreInput(e.target.value)}
            className="w-24 bg-white border-2 border-[#10A49B]/50 rounded-lg px-3 py-2 text-[#10A49B] font-bold text-center focus:outline-none focus:border-[#10A49B] shadow-inner"
          />
          <button
            onClick={() => handleTargetScore(parseFloat(targetScoreInput))}
            className="bg-[#10A49B] hover:bg-[#0c8a82] text-white font-black py-2.5 px-6 rounded-lg shadow-[0_4px_15px_rgba(16,164,155,0.4)] transition-all transform hover:scale-105 active:scale-95"
          >
            Calcular
          </button>
        </div>
      </div>

      {/* Controls Area */}
      <div className="p-6 md:p-8 bg-stone-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">

          {/* Col 1 */}
          <div className="space-y-6">
            <SliderInput label="Distancia (km)" value={distance} max={300} step={0.1} onChange={setDistance} />
            <SliderInput label="D+ (m)" value={dPlus} max={20000} step={100} onChange={setDPlus} />
            <SliderInput label="D- (m)" value={dMinus} max={20000} step={100} onChange={setDMinus} />
            <SliderInput label="Horas" value={hours} max={100} onChange={setHours} />
            <SliderInput label="Minutos" value={minutes} max={59} onChange={setMinutes} />
            <SliderInput label="Segundos" value={seconds} max={59} onChange={setSeconds} />
          </div>

          {/* Col 2 */}
          <div className="space-y-6">
            <SliderInput label="Ritmo (min/km)" value={displayPaceMin} max={60} onChange={(val: number) => handlePaceChange(val, displayPaceSec)} />
            <SliderInput label="Ritmo (seg/km)" value={displayPaceSec} max={59} onChange={(val: number) => handlePaceChange(displayPaceMin, val)} />
            <SliderInput label="Nivel Terreno" value={terrain} max={5} min={1} onChange={setTerrain} />
            <SliderInput label="Nivel Clima" value={climate} max={5} min={1} onChange={setClimate} />
            <SliderInput label="Altitud (m)" value={meanAltitude} max={6000} step={50} onChange={setMeanAltitude} />
            <SliderInput label="Horas Noche" value={nightHours} max={100} step={0.5} onChange={setNightHours} />
          </div>

        </div>
      </div>

    </div>
  );
}
