"use client";

import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
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
                <th className="p-2 font-semibold text-center border-l border-stone-200">Hombre</th>
                <th className="p-2 font-semibold text-center border-l border-stone-200">Mujer</th>
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
  const [distance, setDistance] = useState<number>(37.91);
  const [dPlus, setDPlus] = useState<number>(2065);
  const [dMinus, setDMinus] = useState<number>(2065);
  const [hours, setHours] = useState<number>(3);
  const [minutes, setMinutes] = useState<number>(31);
  const [seconds, setSeconds] = useState<number>(16);
  const [terrain, setTerrain] = useState<number>(2);
  const [climate, setClimate] = useState<number>(3);
  const [meanAltitude, setMeanAltitude] = useState<number>(0);
  const [nightHours, setNightHours] = useState<number>(0);
  const [gender, setGender] = useState<'H' | 'M'>('H');
  const [targetScoreInput, setTargetScoreInput] = useState<string>('');

  const [scoreData, setScoreData] = useState<any>(null);

  // Export states
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportLayout, setExportLayout] = useState<'standard' | 'story' | 'horizontal'>('standard');
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

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
  
  const gradientVal = safeDistance > 0 ? (safeDPlus / (safeDistance * 10)) : 0;

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
            Hombre
          </button>
          <button
            onClick={() => setGender('M')}
            className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors ${gender === 'M' ? 'bg-white text-[#10A49B] shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Mujer
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

            {/* Gradient Graph */}
            <div className="w-full mt-3 pt-2 border-t border-stone-100">
              <div className="flex justify-between items-end mb-1.5">
                <span className="text-[9px] font-black tracking-widest text-stone-400 uppercase">Gradiente</span>
                <span className="text-[11px] font-bold text-stone-700 leading-none">{gradientVal.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden flex relative border border-stone-300">
                <div className="h-full bg-[#10A49B] transition-all duration-500" style={{ width: `${Math.min((gradientVal / 40) * 100, 37.5)}%` }}></div>
                {gradientVal > 15 && (
                  <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${Math.min(((gradientVal - 15) / 40) * 100, 37.5)}%` }}></div>
                )}
                {gradientVal > 30 && (
                  <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${Math.min(((gradientVal - 30) / 40) * 100, 25)}%` }}></div>
                )}
              </div>
              <div className="flex justify-between mt-1 px-0.5">
                <span className="text-[8px] text-stone-400 font-bold">0%</span>
                <span className="text-[8px] text-stone-400 font-bold">15% Muro</span>
                <span className="text-[8px] text-stone-400 font-bold">40% Extremo</span>
              </div>
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
            <h3 className="text-[10px] font-black text-stone-400 mb-2 uppercase tracking-widest border-b border-stone-100 pb-1">CONDICIONES (FACTORES DE DIFICULTAD)</h3>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput label="Terreno (1-5)" value={terrain} max={5} min={1} onChange={setTerrain} />
              <NumberInput label="Clima (1-5)" value={climate} max={5} min={1} onChange={setClimate} />
              <NumberInput label="Altitud Media (m)" value={meanAltitude} max={6000} step={50} onChange={setMeanAltitude} />
              <NumberInput label="Horas Noche" value={nightHours} max={100} step={0.5} onChange={setNightHours} />
            </div>

            <details className="mt-3 group text-[10px]">
              <summary className="cursor-pointer font-bold text-[#10A49B] uppercase tracking-wider flex items-center gap-1 hover:text-[#0c8a82] transition-colors">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Guía de Condiciones y Factores Especiales
              </summary>
              <div className="mt-2 p-3 bg-stone-50 border border-stone-200 rounded text-stone-600 leading-relaxed max-h-[400px] overflow-y-auto">
                <h4 className="font-bold text-stone-800 mb-1">TERRENO</h4>
                <ul className="mb-3 space-y-1">
                  <li><strong className="text-stone-700">1. Rápido</strong> — Camino liso de tierra compactada, ripio parejo o pavimento. Puedes correr sin mirar el suelo.</li>
                  <li><strong className="text-stone-700">2. Fluido</strong> — Sendero con algunas raíces y piedras sueltas. Tienes que esquivar cosas pero sin frenar mucho.</li>
                  <li><strong className="text-stone-700">3. Técnico</strong> — Rocas grandes, escalones de tierra, raíces que cruzan el camino, partes donde hay que mirar bien dónde pisas.</li>
                  <li><strong className="text-stone-700">4. Pesado</strong> — Barro que te hunde, nieve blanda, arena volcánica suelta, o pasto alto que frena tus pasos.</li>
                  <li><strong className="text-stone-700">5. Extremo</strong> — Piedras sueltas que ruedan, rocas mojadas resbalosas, hielo, o tienes que usar las manos para avanzar.</li>
                </ul>

                <h4 className="font-bold text-stone-800 mb-1">CLIMA</h4>
                <ul className="mb-3 space-y-1">
                  <li><strong className="text-stone-700">1. Ideal</strong> — Fresco pero no frío (8–15 °C), sin lluvia, viento suave. Perfecto para correr.</li>
                  <li><strong className="text-stone-700">2. Leve</strong> — Un poco caluroso (16–23 °C) o un poco frío (4–7 °C); viento que se siente; lluvia de vez en cuando.</li>
                  <li><strong className="text-stone-700">3. Moderado</strong> — Caluroso (24–28 °C) o helado (0–3 °C); lluvia que no para; aire húmedo que pesa; viento fuerte que te empuja.</li>
                  <li><strong className="text-stone-700">4. Severo</strong> — Muy caluroso (más de 29 °C) o bajo cero; aire muy pesado; viento que casi no te deja avanzar; nieve cayendo.</li>
                  <li><strong className="text-stone-700">5. Extremo</strong> — Calor que te quema (sensación de más de 34 °C) o frío que congela (sensación de -5 °C o menos); tormenta con rayos, ventisca de nieve, o viento huracanado.</li>
                </ul>

                <h4 className="font-bold text-stone-800 mt-5 mb-1">ALTITUD MEDIA (m)</h4>
                <div className="space-y-2 mb-3 text-stone-700">
                  <p><strong className="text-stone-800">Qué es:</strong> La elevación promedio (en metros sobre el nivel del mar) a la que se desarrolla toda la carrera.</p>
                  <p><strong className="text-stone-800">Cómo calcularla:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-stone-800">Forma precisa (Recomendada):</strong> Si cuentas con el track GPS, busca el dato "Elevación media" o "Altitud promedio" en tu reloj o plataformas como Strava, Gear Tracker, Garmin o Suunto.</li>
                    <li><strong className="text-stone-800">Forma rápida (Aproximación):</strong> Suma la cota más baja y la cota más alta del recorrido, y divide el resultado entre dos.</li>
                  </ul>
                  <p><strong className="text-stone-800">Ejemplo:</strong> Si partes a 800m y la cumbre está a 2.400m ➝ (800 + 2.400) ÷ 2 = 1.600m de altitud media.</p>
                  <p><strong className="text-stone-800">Por qué importa:</strong> A mayor altitud, menor es la presión de oxígeno. Esto obliga a tu sistema cardiovascular a trabajar mucho más duro para mantener el esfuerzo, aumentando la dificultad de la ruta.</p>
                  <p className="bg-white p-2 rounded border border-stone-200 shadow-sm mt-2">🏔️ <strong className="text-stone-800">Regla Puntos Andes:</strong> La altitud comienza a ser un factor de bonificación de manera progresiva. Ten en cuenta que los valores de altitud media inferiores a 1.500 metros no suman puntos extra en este indicador.</p>
                </div>

                <h4 className="font-bold text-stone-800 mt-5 mb-1">HORAS DE NOCHE</h4>
                <div className="space-y-2 text-stone-700">
                  <p><strong className="text-stone-800">Qué es:</strong> El tiempo total (en horas) de tu carrera que transcurre sin luz natural, ya sea corriendo de madrugada o después del anochecer.</p>
                  <p><strong className="text-stone-800">Cómo calcularlo:</strong> Cruza tu hora de largada con tu tiempo estimado de llegada en meta, y cuenta exclusivamente las horas en las que estarás corriendo a oscuras.</p>
                  <p><strong className="text-stone-800">Ejemplos prácticos</strong> (asumiendo que amanece a las 6:00 AM y oscurece a las 8:00 PM):</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong className="text-stone-800">Todo de día:</strong> Largada 6:00 AM ➝ Meta 12:00 PM = 0 horas (corres solo de día).</li>
                    <li><strong className="text-stone-800">Madrugada:</strong> Largada 5:00 AM ➝ Meta 2:00 PM = 1 hora (corres a oscuras de 5:00 AM a 6:00 AM).</li>
                    <li><strong className="text-stone-800">Ultra:</strong> Largada 00:00 (medianoche) ➝ Meta 12:00 PM = 6 horas (corres a oscuras desde las 00:00 hasta las 6:00 AM).</li>
                  </ul>
                  <p><strong className="text-stone-800">Por qué importa:</strong> Correr de noche exige mayor concentración, disminuye la visibilidad en terrenos técnicos, suele traer bajas temperaturas y acelera la fatiga mental. Todo este esfuerzo extra hace que tu carrera tenga una mayor valoración en el algoritmo de puntos.</p>
                  <p className="bg-white p-2 rounded border border-stone-200 shadow-sm mt-2">💡 <strong className="text-stone-800">Tip:</strong> Si tienes dudas o el tramo oscuro es insignificante, ingresa 0. Para carreras largas, simplemente calcula todo el tiempo en el que dependerás de tu linterna frontal.</p>
                </div>
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
