'use client';
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { parseGPX, TrackData } from './utils/gpxParser';
import { 
  calculateNutritionFromStops, stopsToItems,
  minutesToHHMMSS, projectSPTC, NutritionStop 
} from './utils/calculations';
import ElevationChart, { AidStation } from './components/ElevationChart';
import AidStationPlanner from './components/AidStationPlanner';
import NutritionPlanner from './components/NutritionPlanner';
import ResultsPanel from './components/ResultsPanel';
import ExportReport from './components/ExportReport';

export default function SimuladorCarreraPage() {
  const [trackData, setTrackData] = useState<TrackData | null>(null);
  const [aidStations, setAidStations] = useState<AidStation[]>([]);
  const [nutritionStops, setNutritionStops] = useState<NutritionStop[]>([]);
  const [nutritionPlanMode, setNutritionPlanMode] = useState<'km' | 'tiempo'>('km');
  const [mlPerHour, setMlPerHour] = useState<number>(500);
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataMode, setDataMode] = useState<'file' | 'manual'>('manual');

  // Datos manuales (cuando no hay archivo)
  const [manualDist, setManualDist] = useState<number>(0);
  const [manualDPlus, setManualDPlus] = useState<number>(0);
  const [manualDMinus, setManualDMinus] = useState<number>(0);

  // Tiempo estimado manual del usuario
  const [estHours, setEstHours] = useState<number>(0);
  const [estMinutes, setEstMinutes] = useState<number>(0);
  const [estSeconds, setEstSeconds] = useState<number>(0);

  // Condiciones ambientales
  const [terrain, setTerrain] = useState<number>(1);
  const [climate, setClimate] = useState<number>(1);
  const [nightHours, setNightHours] = useState<number>(0);

  // Valores efectivos: del archivo si existe, sino manuales
  const effDist = trackData?.totalDistance || manualDist;
  const effDPlus = trackData?.dPlus || manualDPlus;
  const effDMinus = trackData?.dMinus || manualDMinus;
  const effKme = trackData?.kme || (manualDist + manualDPlus / 100);
  const effAltAvg = trackData?.altitudeAvg || 0;

  // Leer archivo GPX/KML
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        const data = parseGPX(content);
        setTrackData(data);
      } catch (err: any) {
        setError(err.message || 'Error al leer el archivo');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  }, []);

  // Valores seguros del tiempo estimado
  const safeH = isNaN(estHours) ? 0 : estHours;
  const safeM = isNaN(estMinutes) ? 0 : estMinutes;
  const safeS = isNaN(estSeconds) ? 0 : estSeconds;
  const totalEstimatedMinutes = safeH * 60 + safeM + safeS / 60;
  const totalEstimatedHours = totalEstimatedMinutes / 60;
  const hasValidTime = totalEstimatedMinutes > 0;

  // Calcular resultados solo si hay track Y tiempo estimado
  const nutritionItems = stopsToItems(nutritionStops);

  const hasData = effDist > 0;
  const results = (hasData && hasValidTime) ? (() => {
    const nutrition = calculateNutritionFromStops(nutritionStops, totalEstimatedHours);
    const sptcRange = projectSPTC(
      effKme, effAltAvg, totalEstimatedHours, gender,
      effDist, effDPlus, effDMinus,
      terrain, climate, nightHours
    );
    const paceDecimal = effDist > 0 ? totalEstimatedMinutes / effDist : 0;
    const paceMin = Math.floor(paceDecimal);
    const paceSec = Math.round((paceDecimal - paceMin) * 60);
    return {
      projectedTime: minutesToHHMMSS(totalEstimatedMinutes),
      ...nutrition, mlPerHour, sptcRange, paceMin, paceSec,
    };
  })() : null;

  const resetAll = () => {
    setTrackData(null);
    setAidStations([]);
    setNutritionStops([]);
    setManualDist(0); setManualDPlus(0); setManualDMinus(0);
    setEstHours(0); setEstMinutes(0); setEstSeconds(0);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans py-8 px-4 sm:px-6">
      <main className="max-w-xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <Link href="/" className="text-xs font-bold text-[#10A49B] hover:underline uppercase tracking-wider">
            ← Volver a Puntos Andes
          </Link>
          <div className="text-right">
            <h1 className="text-lg font-black text-stone-800 uppercase tracking-tight">Simulador de Carrera</h1>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Planificación y Nutrición</p>
          </div>
        </div>

        {/* Género */}
        <div className="flex gap-2 bg-stone-100 p-1 rounded-lg border border-stone-200">
          {['M', 'F'].map(g => (
            <button key={g} onClick={() => setGender(g as 'M' | 'F')}
              className={`flex-1 py-1.5 rounded text-xs font-bold uppercase transition-all
                ${gender === g ? 'bg-white text-[#10A49B] shadow-xs' : 'text-stone-500 hover:text-stone-800'}`}>
              {g === 'M' ? 'Hombre' : 'Mujer'}
            </button>
          ))}
        </div>

        {/* ══════ DATOS DEL RECORRIDO ══════ */}
        <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-stone-200">
            <button onClick={() => { setDataMode('manual'); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-black uppercase tracking-wider transition-all
                ${dataMode === 'manual' && !trackData ? 'bg-white text-[#10A49B] border-b-2 border-[#10A49B]' : 'bg-stone-50 text-stone-400 hover:text-stone-600'}`}>
              <span className="text-sm">✏️</span> Ingreso Manual
            </button>
            <button onClick={() => setDataMode('file')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-black uppercase tracking-wider transition-all
                ${dataMode === 'file' || trackData ? 'bg-white text-[#10A49B] border-b-2 border-[#10A49B]' : 'bg-stone-50 text-stone-400 hover:text-stone-600'}`}>
              <span className="text-sm">📁</span> Archivo GPX / KML
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* File upload area */}
            {(dataMode === 'file' || trackData) && (
              <div className="space-y-2">
                <label className={`flex items-center gap-3 border-2 border-dashed rounded-lg px-4 py-3 cursor-pointer transition-colors
                  ${loading ? 'opacity-50 bg-stone-50 border-stone-200' : trackData ? 'border-[#10A49B]/30 bg-[#10A49B]/[0.03]' : 'border-stone-300 hover:border-[#10A49B] hover:bg-stone-50/50'}`}>
                  <span className="text-xl">{trackData ? '✅' : '📁'}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs text-stone-700 block">
                      {trackData ? 'Archivo cargado' : 'Selecciona tu archivo GPX o KML'}
                    </span>
                    {trackData && (
                      <span className="text-[10px] text-stone-400">
                        {trackData.totalDistance.toFixed(1)} km · D+ {trackData.dPlus.toLocaleString()}m · D- {trackData.dMinus.toLocaleString()}m
                      </span>
                    )}
                    {!trackData && (
                      <span className="text-[10px] text-stone-400">Extrae automáticamente altimetría y desniveles</span>
                    )}
                  </div>
                  <input type="file" accept=".gpx,.kml,application/gpx+xml,application/vnd.google-earth.kml+xml,application/xml,text/xml,*/*" onChange={handleFileUpload} className="hidden" />
                </label>
                {trackData && (
                  <button onClick={resetAll}
                    className="w-full text-[9px] font-bold text-stone-400 hover:text-red-500 border border-stone-200 rounded py-1 hover:bg-red-50 transition-colors text-center">
                    ✕ Quitar archivo y resetear
                  </button>
                )}
                {loading && <p className="text-xs font-bold text-[#10A49B] animate-pulse text-center">Procesando...</p>}
                {error && <p className="text-xs font-bold text-red-500 bg-red-50 p-2 rounded border border-red-100 text-center">{error}</p>}
              </div>
            )}

            {/* Manual or file-derived fields */}
            {(!trackData && dataMode === 'manual') && (
              <p className="text-[10px] text-stone-500 text-center bg-stone-50 rounded-lg py-2 px-3 border border-stone-100">
                ℹ️ Ingresa los datos de tu carrera manualmente. Si tienes un archivo GPX/KML, usa la pestaña <strong>Archivo</strong>.
              </p>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-stone-500 uppercase mb-1">Distancia (km)</label>
                <input type="number" min={0} step={0.1}
                  value={trackData ? trackData.totalDistance.toFixed(1) : (manualDist || '')}
                  onChange={e => { if (!trackData) setManualDist(parseFloat(e.target.value) || 0); }}
                  readOnly={!!trackData}
                  className={`w-full border rounded-md px-2 py-2 text-sm font-mono font-bold text-center focus:outline-none ${trackData ? 'bg-stone-50 border-stone-200 text-stone-500' : 'bg-white border-stone-300 text-stone-800 focus:border-[#10A49B] focus:ring-1 focus:ring-[#10A49B]'}`}
                  placeholder="42" />
              </div>
              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-stone-500 uppercase mb-1">D+ (m)</label>
                <input type="number" min={0} step={10}
                  value={trackData ? trackData.dPlus : (manualDPlus || '')}
                  onChange={e => { if (!trackData) setManualDPlus(parseInt(e.target.value) || 0); }}
                  readOnly={!!trackData}
                  className={`w-full border rounded-md px-2 py-2 text-sm font-mono font-bold text-center focus:outline-none ${trackData ? 'bg-stone-50 border-stone-200 text-stone-500' : 'bg-white border-stone-300 text-stone-800 focus:border-[#10A49B] focus:ring-1 focus:ring-[#10A49B]'}`}
                  placeholder="2400" />
              </div>
              <div className="flex flex-col">
                <label className="text-[9px] font-bold text-stone-500 uppercase mb-1">D- (m)</label>
                <input type="number" min={0} step={10}
                  value={trackData ? trackData.dMinus : (manualDMinus || '')}
                  onChange={e => { if (!trackData) setManualDMinus(parseInt(e.target.value) || 0); }}
                  readOnly={!!trackData}
                  className={`w-full border rounded-md px-2 py-2 text-sm font-mono font-bold text-center focus:outline-none ${trackData ? 'bg-stone-50 border-stone-200 text-stone-500' : 'bg-white border-stone-300 text-stone-800 focus:border-[#10A49B] focus:ring-1 focus:ring-[#10A49B]'}`}
                  placeholder="2400" />
              </div>
            </div>
            {effDist > 0 && (
              <p className="text-[9px] font-mono text-stone-400 text-center">KmE: {effKme.toFixed(1)}</p>
            )}
          </div>
        </div>

        {/* ══════ TIEMPO ESTIMADO ══════ */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-end border-b border-stone-100 pb-1.5">
            <div>
              <p className="text-xs font-black text-stone-700 uppercase tracking-tight">⏱️ Tiempo Estimado</p>
              <p className="text-[9px] font-medium text-stone-400 mt-0.5">Se sincroniza con el gráfico</p>
            </div>
            {hasValidTime && results && (
              <span className="text-[10px] font-mono font-bold bg-[#10A49B]/10 px-2 py-0.5 rounded text-[#10A49B] border border-[#10A49B]/20">
                {results.paceMin}:{String(results.paceSec).padStart(2, '0')}/km
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[{ l: 'Horas', v: estHours, set: setEstHours, mx: 100 }, { l: 'Minutos', v: estMinutes, set: setEstMinutes, mx: 59 }, { l: 'Segundos', v: estSeconds, set: setEstSeconds, mx: 59 }].map(f => (
              <div key={f.l} className="flex flex-col">
                <label className="text-[9px] font-bold text-stone-500 uppercase mb-1">{f.l}</label>
                <input type="number" min={0} max={f.mx} value={f.v || ''}
                  onChange={e => f.set(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-stone-300 rounded-md px-2 py-2 text-stone-800 text-lg font-mono font-bold focus:outline-none focus:border-[#10A49B] focus:ring-1 focus:ring-[#10A49B] shadow-sm text-center"
                  placeholder="0" />
              </div>
            ))}
          </div>
        </div>

        {/* ══════ PERFIL DE ELEVACIÓN ══════ */}
        <div className="space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-stone-400 px-1">Perfil de Elevación</p>
          <ElevationChart 
            points={trackData?.points || []} 
            aidStations={aidStations}
            nutritionItems={nutritionItems}
            totalDistanceKm={effDist}
            totalEstimatedMinutes={totalEstimatedMinutes}
          />
        </div>

        {/* ══════ PUNTOS DE ABASTECIMIENTO ══════ */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
            <div className="w-5 h-5 bg-[#e67e22] rounded-full flex items-center justify-center">
              <span className="text-white text-[9px] font-black">📦</span>
            </div>
            <div>
              <p className="text-xs font-black text-stone-800 uppercase tracking-tight">Puntos de Abastecimiento</p>
              <p className="text-[9px] font-medium text-stone-400">Define en qué km hay agua, comida o asistencia</p>
            </div>
          </div>
          <AidStationPlanner stations={aidStations} onChange={setAidStations}
            totalDistanceKm={effDist || 100} totalEstimatedMinutes={totalEstimatedMinutes}
            points={trackData?.points} />
        </div>

        {/* ══════ PLAN DE NUTRICIÓN ══════ */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
            <div className="w-5 h-5 bg-[#8b5cf6] rounded-full flex items-center justify-center">
              <span className="text-white text-[9px] font-black">⚡</span>
            </div>
            <div>
              <p className="text-xs font-black text-stone-800 uppercase tracking-tight">Plan de Nutrición</p>
              <p className="text-[9px] font-medium text-stone-400">Indica qué y a qué km/momento te alimentarás</p>
            </div>
          </div>
          <NutritionPlanner stops={nutritionStops} onChange={setNutritionStops}
            totalDistanceKm={effDist || 100} planMode={nutritionPlanMode}
            onPlanModeChange={setNutritionPlanMode} totalEstimatedMinutes={totalEstimatedMinutes} />
        </div>

        {/* ══════ CONDICIONES ══════ */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#10A49B] border-b border-stone-100 pb-1">Condiciones de Carrera</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-stone-500 uppercase block">Terreno (1-5)</label>
              <select value={terrain} onChange={e => setTerrain(parseInt(e.target.value))}
                className="w-full text-xs border border-stone-300 bg-white rounded p-1.5 font-bold focus:outline-none focus:border-[#10A49B]">
                {[1,2,3,4,5].map(v => <option key={v} value={v}>Nivel {v}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-stone-500 uppercase block">Clima (1-5)</label>
              <select value={climate} onChange={e => setClimate(parseInt(e.target.value))}
                className="w-full text-xs border border-stone-300 bg-white rounded p-1.5 font-bold focus:outline-none focus:border-[#10A49B]">
                {[1,2,3,4,5].map(v => <option key={v} value={v}>Nivel {v}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-stone-500 uppercase block">Horas Noche</label>
              <input type="number" min={0} max={48} step={0.5} value={nightHours || ''}
                onChange={e => setNightHours(parseFloat(e.target.value) || 0)}
                className="w-full text-xs border border-stone-300 bg-white rounded p-1.5 text-center font-mono font-bold focus:outline-none focus:border-[#10A49B]" />
            </div>
          </div>
        </div>


        {/* ══════ RESULTADOS ══════ */}
        {results && (
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-widest text-stone-400 px-1">Proyección Final de Carrera</p>
            <ResultsPanel projectedTime={results.projectedTime} carbsPerHour={results.carbsPerHour}
              sodiumPerHour={results.sodiumPerHour} totalCarbs={results.totalCarbs}
              sptcRange={results.sptcRange} kme={effKme} totalDistance={effDist} dPlus={effDPlus}
              nutritionStops={nutritionStops} totalEstimatedMinutes={totalEstimatedMinutes} />
          </div>
        )}

        {/* ══════ EXPORTAR ══════ */}
        {results && (
          <ExportReport
            projectedTime={results.projectedTime} carbsPerHour={results.carbsPerHour}
            sodiumPerHour={results.sodiumPerHour} totalCarbs={results.totalCarbs}
            sptcRange={results.sptcRange} kme={effKme} totalDistance={effDist}
            dPlus={effDPlus} dMinus={effDMinus}
            altitudeAvg={effAltAvg}
            nutritionStops={nutritionStops} aidStations={aidStations}
            totalEstimatedMinutes={totalEstimatedMinutes}
            points={trackData?.points || []}
            nutritionItems={nutritionItems}
          />
        )}

      </main>
    </div>
  );
}
