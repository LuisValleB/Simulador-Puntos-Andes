'use client';
import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { NutritionStop, DEFAULT_CARBS, DEFAULT_SODIUM } from '../utils/calculations';
import { AidStation } from './ElevationChart';

const EMOJIS: Record<string, string> = {
  gel: '⚡', solido: '🍌', sal: '🧂', cafeina: '☕', hidratacion: '💧',
};

interface Props {
  projectedTime: string;
  carbsPerHour: number;
  sodiumPerHour: number;
  totalCarbs: number;
  sptcRange: { low: number; mid: number; high: number };
  kme: number;
  totalDistance: number;
  dPlus: number;
  dMinus: number;
  altitudeAvg?: number;
  nutritionStops: NutritionStop[];
  aidStations: AidStation[];
  totalEstimatedMinutes: number;
  points?: any[];
  nutritionItems?: any[];
}

export default function ExportReport(props: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'standard' | 'story' | 'horizontal'>('standard');
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const source = reportRef.current;
      // Clone and append to body so html2canvas doesn't clip via overflow containers
      const clone = source.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.top = '0';
      clone.style.left = '-9999px';
      clone.style.zIndex = '-1';
      clone.style.borderRadius = '0';
      document.body.appendChild(clone);
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: layoutMode === 'story' ? '#111827' : '#FDFBF7',
        scrollX: 0,
        scrollY: 0,
      });
      document.body.removeChild(clone);
      const link = document.createElement('a');
      link.download = `plan-carrera-puntosandes-${layoutMode}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  // Segment details: D+, D-, km and estimated time between each aid station
  const segmentDetails = (() => {
    const sorted = [...props.aidStations].sort((a, b) => a.km - b.km);
    const allStops = [{ km: 0, label: 'Salida', id: 'start', segmentMinutes: 0 }, ...sorted, { km: props.totalDistance, label: 'Meta', id: 'end', segmentMinutes: 0 }];
    const pts = props.points || [];
    return allStops.slice(0, -1).map((from, i) => {
      const to = allStops[i + 1];
      const segKm = +(to.km - from.km).toFixed(1);
      // Calc D+/D- from GPX points in this segment
      let segDPlus = 0, segDMinus = 0;
      if (pts.length > 0) {
        const inSeg = pts.filter(p => p.distance >= from.km && p.distance <= to.km);
        for (let j = 1; j < inSeg.length; j++) {
          const diff = inSeg[j].elevation - inSeg[j - 1].elevation;
          if (diff > 0) segDPlus += diff;
          else segDMinus += Math.abs(diff);
        }
      } else {
        const ratio = segKm / (props.totalDistance || 1);
        segDPlus = Math.round(props.dPlus * ratio);
        segDMinus = Math.round(props.dMinus * ratio);
      }
      const segMin = props.totalEstimatedMinutes > 0
        ? Math.round((segKm / (props.totalDistance || 1)) * props.totalEstimatedMinutes)
        : 0;
      const segH = Math.floor(segMin / 60);
      const segM = segMin % 60;
      const timeStr = segH > 0 ? `${segH}h ${segM}m` : `${segM}m`;
      return { from: from.label, to: to.label, km: segKm, dPlus: Math.round(segDPlus), dMinus: Math.round(segDMinus), timeStr };
    });
  })();

  // Aggregate items
  const items: { label: string; type: string; qty: number; carbs: number; sodium: number; ml: number }[] = [];
  const itemMap = new Map<string, typeof items[0]>();
  let totalMl = 0, totalCarbsAll = 0, totalSodiumAll = 0;

  for (const stop of props.nutritionStops) {
    for (const sub of stop.items) {
      const c = sub.customCarbs ?? DEFAULT_CARBS[sub.type] ?? 0;
      const s = sub.customSodium ?? DEFAULT_SODIUM[sub.type] ?? 0;
      const ml = sub.customMl ?? 0;
      const key = sub.customLabel || sub.type;
      const existing = itemMap.get(key);
      if (existing) {
        existing.qty += sub.quantity;
        existing.carbs += c * sub.quantity;
        existing.sodium += s * sub.quantity;
        existing.ml += ml * sub.quantity;
      } else {
        const entry = { label: key, type: sub.type, qty: sub.quantity, carbs: c * sub.quantity, sodium: s * sub.quantity, ml: ml * sub.quantity };
        itemMap.set(key, entry);
        items.push(entry);
      }
      totalMl += ml * sub.quantity;
      totalCarbsAll += c * sub.quantity;
      totalSodiumAll += s * sub.quantity;
    }
  }

  const totalHours = props.totalEstimatedMinutes / 60;
  const mlPerHour = totalHours > 0 ? Math.round(totalMl / totalHours) : 0;
  const sortedItems = items.sort((a, b) => b.qty - a.qty);

  // Reusable inline SVG Profile chart
  const renderSvgProfile = (w: number, h: number, isDark = false) => {
    const hasPoints = props.points && props.points.length > 0;
    const chartPoints = hasPoints ? props.points!.filter((_, i) => i % Math.max(1, Math.floor(props.points!.length / 100)) === 0) : [];
    const maxDist = hasPoints ? props.points![props.points!.length - 1].distance : props.totalDistance;
    const elevations = chartPoints.map(p => p.elevation);
    const minEle = hasPoints ? Math.min(...elevations) : 0;
    const maxEle = hasPoints ? Math.max(...elevations) : 100;
    const eleRange = maxEle - minEle || 100;

    const basePad = 25; // padding top for nutrition icons
    const graphH = h - 20; // baseline y
    const getX = (d: number) => maxDist > 0 ? (d / maxDist) * w : 0;
    const getY = (e: number) => graphH - ((e - minEle) / eleRange) * (graphH - basePad);

    let pathD = '';
    if (hasPoints && chartPoints.length > 0) {
      pathD = `M ${getX(chartPoints[0].distance)} ${graphH} `;
      for (const p of chartPoints) {
        pathD += `L ${getX(p.distance)} ${getY(p.elevation)} `;
      }
      pathD += `L ${getX(chartPoints[chartPoints.length - 1].distance)} ${graphH} Z`;
    } else {
      pathD = `M 0 ${graphH} L ${w * 0.3} ${basePad + 15} L ${w * 0.7} ${basePad + 5} L ${w} ${graphH} Z`;
    }

    const strokeColor = isDark ? '#2dd4bf' : '#10A49B';
    const baseColor = isDark ? '#374151' : '#e7e5e4';
    const textColor = isDark ? '#9ca3af' : '#a8a29e';

    return (
      <div style={{ position: 'relative', width: '100%', height: `${h}px`, boxSizing: 'border-box' }}>
        <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
          <defs>
            <linearGradient id={`grad-${w}-${isDark}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={isDark ? 0.4 : 0.35} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {/* Baseline */}
          <line x1={0} y1={graphH} x2={w} y2={graphH} stroke={baseColor} strokeWidth={1} />
          
          {/* Profile Area */}
          <path d={pathD} fill={`url(#grad-${w}-${isDark})`} stroke={strokeColor} strokeWidth={1.5} />

          {/* Aid stations */}
          {props.aidStations.filter(s => s.km > 0).map((s, i) => {
            const x = getX(s.km);
            return (
              <g key={`aid-${i}`}>
                <line x1={x} y1={basePad} x2={x} y2={graphH} stroke="#e67e22" strokeWidth={1} strokeDasharray="2 2" opacity={0.7} />
                <circle cx={x} cy={graphH} r={2.5} fill="#e67e22" />
                <text x={x} y={basePad - 4} fill={isDark ? '#fdba74' : '#c2410c'} fontSize={8} fontWeight={900} textAnchor="middle">{s.label}</text>
              </g>
            );
          })}

          {/* Nutrition Items stacked vertically */}
          {Object.entries(
            (props.nutritionItems || []).filter(n => n.km > 0).reduce((acc, item) => {
              const key = item.km.toFixed(1);
              if (!acc[key]) acc[key] = [];
              acc[key].push(item);
              return acc;
            }, {} as Record<string, any[]>)
          ).map(([kmStr, nItemsVal], i) => {
            const nItems = nItemsVal as any[];
            const km = parseFloat(kmStr);
            const x = getX(km);
            return (
              <g key={`nut-${i}`}>
                <line x1={x} y1={basePad} x2={x} y2={graphH} stroke="#8b5cf6" strokeWidth={0.7} strokeDasharray="1 2" opacity={0.6} />
                {nItems.map((it, idx) => (
                  <text key={idx} x={x} y={basePad + 2 + idx * 10} fontSize={10} textAnchor="middle" dominantBaseline="hanging">
                    {EMOJIS[it.type] || '⚡'}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7px', fontWeight: 700, color: textColor, marginTop: '2px' }}>
          <span>0 km</span>
          <span style={{ color: isDark ? '#6ee7b7' : '#10A49B' }}>D+ {props.dPlus.toLocaleString()}m · D- {props.dMinus.toLocaleString()}m</span>
          <span>{props.totalDistance.toFixed(1)} km</span>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-gradient-to-r from-[#10A49B] to-teal-600 text-white font-black py-3 rounded-xl shadow-md hover:shadow-lg transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 border border-teal-500/30"
      >
        <span className="text-lg">📸</span> Compartir / Descargar Plan
      </button>

      {/* Export modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-stone-200 my-auto">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-stone-100 mb-4">
              <div>
                <h3 className="text-base font-black text-stone-800 uppercase tracking-tight">Exportar Plan de Carrera</h3>
                <p className="text-xs text-stone-500">Selecciona el formato deseado para visualizar y guardar la imagen</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 font-bold">
                ✕
              </button>
            </div>

            {/* Layout mode buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { id: 'standard', label: 'Estándar', desc: 'Ficha vertical' },
                { id: 'story', label: 'Historia Instagram', desc: 'Vertical 9:16' },
                { id: 'horizontal', label: 'Horizontal', desc: 'Apaisado 16:9' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setLayoutMode(opt.id as any)}
                  className={`p-2 rounded-xl border text-center transition-all ${layoutMode === opt.id ? 'border-[#10A49B] bg-[#10A49B]/5 text-[#10A49B]' : 'border-stone-200 hover:bg-stone-50 text-stone-600'}`}
                >
                  <p className="text-xs font-black block leading-tight">{opt.label}</p>
                  <span className="text-[9px] text-stone-400 block mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Live capture container wrapper */}
            <div className="flex justify-center bg-stone-100 p-4 rounded-xl mb-4 overflow-auto max-h-[55vh]" style={{ alignItems: 'flex-start' }}>
              
              {/* === LAYOUT 1: STANDARD === */}
              {layoutMode === 'standard' && (
                <div ref={reportRef} style={{ width: '400px', background: '#FDFBF7', padding: '20px', borderRadius: '16px', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #e7e5e4', paddingBottom: '12px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#1c1917', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>Plan de Carrera</div>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '2px' }}>Simulador Puntos Andes</div>
                    </div>
                    <img src="/logo.png" alt="Logo" style={{ height: '36px', objectFit: 'contain' }} crossOrigin="anonymous" />
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    {[
                      { v: `${props.totalDistance.toFixed(1)} km`, l: 'Distancia' },
                      { v: `${props.dPlus.toLocaleString()} m`, l: 'D+' },
                      { v: `${props.dMinus.toLocaleString()} m`, l: 'D-' },
                      { v: props.kme.toFixed(1), l: 'KmE' },
                    ].map((s, i) => (
                      <div key={i} style={{ flex: 1, background: 'white', border: '1px solid #e7e5e4', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: 900, color: i === 3 ? '#10A49B' : '#1c1917' }}>{s.v}</div>
                        <div style={{ fontSize: '7px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase' }}>{s.l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Time box */}
                  <div style={{ background: '#1c1917', color: 'white', borderRadius: '10px', padding: '12px', textAlign: 'center', marginBottom: '12px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 700, color: '#10A49B', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '2px' }}>Tiempo Estimado</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-1px' }}>{props.projectedTime}</div>
                  </div>

                  {/* Graph */}
                  <div style={{ background: 'white', border: '1px solid #e7e5e4', borderRadius: '10px', padding: '10px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                      <span style={{ fontSize: '8px', fontWeight: 900, color: '#10A49B', textTransform: 'uppercase', letterSpacing: '1px' }}>📈 Altimetría</span>
                      {props.altitudeAvg && props.altitudeAvg > 0 ? <span style={{ fontSize: '7px', fontWeight: 700, color: '#a8a29e' }}>Alt. media: {Math.round(props.altitudeAvg)}m</span> : null}
                    </div>
                    {renderSvgProfile(338, 130)}
                  </div>

                  {/* Segment detail table */}
                  {segmentDetails.length > 1 && (
                    <div style={{ background: 'white', border: '1px solid #e7e5e4', borderRadius: '10px', padding: '10px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '8px', fontWeight: 900, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>🗺️ Segmentos</div>
                      {segmentDetails.map((seg, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 0', borderBottom: i < segmentDetails.length - 1 ? '1px solid #f5f5f4' : 'none', fontSize: '8px' }}>
                          <span style={{ fontWeight: 700, color: '#1c1917', flex: 1 }}>{seg.from} - {seg.to}</span>
                          <span style={{ fontFamily: 'monospace', color: '#78716c', whiteSpace: 'nowrap' }}>{seg.km}km</span>
                          <span style={{ color: '#16a34a', fontWeight: 700, whiteSpace: 'nowrap' }}>+{seg.dPlus}m</span>
                          <span style={{ color: '#dc2626', fontWeight: 700, whiteSpace: 'nowrap' }}>-{seg.dMinus}m</span>
                          <span style={{ color: '#6366f1', fontWeight: 700, whiteSpace: 'nowrap' }}>{seg.timeStr}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Nutrition */}
                  <div style={{ background: 'white', border: '1px solid #e7e5e4', borderRadius: '10px', padding: '10px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 900, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>⚡ Estrategia Nutricional</div>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      <div style={{ flex: 1, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: '#3b82f6' }}>{props.carbsPerHour}</div>
                        <div style={{ fontSize: '7px', fontWeight: 700, color: '#78716c' }}>g CH/h</div>
                      </div>
                      <div style={{ flex: 1, background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '6px', padding: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: '#44403c' }}>{props.sodiumPerHour}</div>
                        <div style={{ fontSize: '7px', fontWeight: 700, color: '#78716c' }}>mg Na/h</div>
                      </div>
                      <div style={{ flex: 1, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '15px', fontWeight: 900, color: '#2563eb' }}>{mlPerHour}</div>
                        <div style={{ fontSize: '7px', fontWeight: 700, color: '#78716c' }}>mL/h</div>
                      </div>
                    </div>

                    {sortedItems.length > 0 && (
                      <div style={{ borderTop: '1px solid #f5f5f4', paddingTop: '6px' }}>
                        {sortedItems.map((item, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fafaf9', borderRadius: '4px', padding: '3px 6px', marginBottom: '2px', fontSize: '9px' }}>
                            <span>{EMOJIS[item.type] || '📦'}</span>
                            <span style={{ fontWeight: 700, color: '#1c1917', flex: 1 }}>{item.label}</span>
                            <span style={{ fontWeight: 900, color: '#8b5cf6', fontFamily: 'monospace' }}>×{item.qty}</span>
                            <span style={{ fontFamily: 'monospace', color: '#78716c', fontSize: '8px' }}>{item.carbs}g</span>
                          </div>
                        ))}
                        <div style={{ fontSize: '7px', color: '#a8a29e', textAlign: 'center', marginTop: '4px' }}>
                          Totales: {totalCarbsAll}g CH · {totalSodiumAll}mg Na · {totalMl}mL
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SPTC */}
                  <div style={{ background: '#ecfdf5', border: '1px solid rgba(16,164,155,0.3)', borderRadius: '10px', padding: '10px', textAlign: 'center', marginBottom: '12px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ fontSize: '8px', fontWeight: 900, color: '#10A49B', textTransform: 'uppercase', marginBottom: '4px' }}>Proyección Puntos Andes</div>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#10A49B', lineHeight: 1 }}>{props.sptcRange.mid}</div>
                    <div style={{ fontSize: '7px', color: '#78716c', marginTop: '2px' }}>Rango: {props.sptcRange.low} - {props.sptcRange.high}</div>
                  </div>

                  {/* Footer */}
                  <div style={{ borderTop: '1px solid #e7e5e4', paddingTop: '8px', textAlign: 'center', fontSize: '8px', color: '#a8a29e' }}>
                    <span style={{ fontWeight: 900, color: '#10A49B' }}>www.puntosandes.com</span>
                  </div>
                </div>
              )}

              {/* === LAYOUT 2: INSTAGRAM STORY === */}
              {layoutMode === 'story' && (
                <div ref={reportRef} style={{ width: '360px', height: '640px', background: 'linear-gradient(145deg, #111827, #1f2937)', padding: '24px 20px', borderRadius: '24px', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: 'white', flexShrink: 0 }}>
                  {/* Top */}
                  <div style={{ textAlign: 'center' }}>
                    <img src="/logo.png" alt="Logo" style={{ height: '38px', objectFit: 'contain', margin: '0 auto 6px', filter: 'brightness(0) invert(1)' }} crossOrigin="anonymous" />
                    <div style={{ fontSize: '9px', fontWeight: 900, color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '3px' }}>Plan de Carrera</div>
                  </div>

                  {/* Time & Score promo block */}
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>Tiempo Objetivo</div>
                    <div style={{ fontSize: '38px', fontWeight: 900, fontFamily: 'monospace', color: '#2dd4bf', lineHeight: 1, marginBottom: '6px' }}>{props.projectedTime}</div>
                    <div style={{ display: 'inline-block', background: 'rgba(45,212,191,0.15)', border: '1px solid rgba(45,212,191,0.4)', borderRadius: '20px', padding: '3px 12px', fontSize: '9px', fontWeight: 900, color: '#2dd4bf' }}>
                      Puntos Andes: {props.sptcRange.mid}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[
                      { v: `${props.totalDistance.toFixed(1)}km`, l: 'Dist' },
                      { v: `${props.dPlus.toLocaleString()}m`, l: 'D+' },
                      { v: `${props.dMinus.toLocaleString()}m`, l: 'D-' },
                      { v: props.kme.toFixed(1), l: 'KmE' },
                    ].map((s, i) => (
                      <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 4px', textAlign: 'center' }}>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: i === 3 ? '#2dd4bf' : 'white' }}>{s.v}</div>
                        <div style={{ fontSize: '7px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>{s.l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Graph */}
                  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '10px', margin: '10px 0' }}>
                    <div style={{ fontSize: '8px', fontWeight: 900, color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Altimetría y Puntos</div>
                    {renderSvgProfile(300, 110, true)}
                  </div>

                  {/* Strategy Row */}
                  <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px' }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase' }}>Carbohidratos</div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#60a5fa' }}>{props.carbsPerHour}<span style={{ fontSize: '9px', fontWeight: 400 }}>g/h</span></div>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase' }}>Sodio</div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#f3f4f6' }}>{props.sodiumPerHour}<span style={{ fontSize: '9px', fontWeight: 400 }}>mg/h</span></div>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase' }}>Líquido</div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#38bdf8' }}>{mlPerHour}<span style={{ fontSize: '9px', fontWeight: 400 }}>mL/h</span></div>
                    </div>
                  </div>

                  {/* Bottom Tag */}
                  <div style={{ textAlign: 'center', marginTop: '12px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 900, color: '#2dd4bf', marginBottom: '4px' }}>www.puntosandes.com</div>
                    <span style={{ background: '#2dd4bf', color: '#111827', fontSize: '10px', fontWeight: 900, padding: '3px 12px', borderRadius: '20px', display: 'inline-block' }}>
                      @puntosandes
                    </span>
                  </div>
                </div>
              )}

              {/* === LAYOUT 3: HORIZONTAL (Completo) === */}
              {layoutMode === 'horizontal' && (
                <div ref={reportRef} style={{ width: '800px', background: '#FDFBF7', padding: '24px', borderRadius: '16px', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box', flexShrink: 0 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e7e5e4', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#1c1917', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>Plan de Carrera</div>
                      <div style={{ fontSize: '10px', color: '#a8a29e', fontWeight: 700 }}>Simulador Puntos Andes · www.puntosandes.com</div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {[
                        { v: `${props.totalDistance.toFixed(1)} km`, l: 'Distancia', c: '#1c1917' },
                        { v: `${props.dPlus.toLocaleString()} m`, l: 'D+', c: '#16a34a' },
                        { v: `${props.dMinus.toLocaleString()} m`, l: 'D-', c: '#dc2626' },
                        { v: props.kme.toFixed(1), l: 'KmE', c: '#10A49B' },
                        ...(props.altitudeAvg && props.altitudeAvg > 0 ? [{ v: `${Math.round(props.altitudeAvg)} m`, l: 'Alt. Media', c: '#7c3aed' }] : []),
                      ].map((m, i) => (
                        <div key={i} style={{ background: 'white', border: '1px solid #e7e5e4', borderRadius: '8px', padding: '6px 10px', textAlign: 'center', minWidth: '60px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 900, color: m.c }}>{m.v}</div>
                          <div style={{ fontSize: '7px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase' }}>{m.l}</div>
                        </div>
                      ))}
                      <img src="/logo.png" alt="Logo" style={{ height: '36px', objectFit: 'contain' }} crossOrigin="anonymous" />
                    </div>
                  </div>

                  {/* Main row */}
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {/* Left: Time + Nutrition */}
                    <div style={{ width: '180px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ background: '#1c1917', color: 'white', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                        <div style={{ fontSize: '8px', color: '#10A49B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Tiempo Estimado</div>
                        <div style={{ fontSize: '26px', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1 }}>{props.projectedTime}</div>
                      </div>
                      <div style={{ background: '#ecfdf5', border: '1px solid rgba(16,164,155,0.3)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '8px', fontWeight: 900, color: '#10A49B', textTransform: 'uppercase', marginBottom: '4px' }}>Proyección Puntos Andes</div>
                        <div style={{ fontSize: '24px', fontWeight: 900, color: '#10A49B', lineHeight: 1 }}>{props.sptcRange.mid}</div>
                        <div style={{ fontSize: '7px', color: '#78716c', marginTop: '2px' }}>Rango: {props.sptcRange.low} – {props.sptcRange.high}</div>
                      </div>
                      <div style={{ background: 'white', border: '1px solid #e7e5e4', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ fontSize: '8px', fontWeight: 900, color: '#a8a29e', textTransform: 'uppercase', marginBottom: '8px' }}>⚡ Nutrición / Hora</div>
                        {[
                          { v: props.carbsPerHour, u: 'g CH/h', c: '#3b82f6', bg: '#eff6ff' },
                          { v: props.sodiumPerHour, u: 'mg Na/h', c: '#44403c', bg: '#fafaf9' },
                          { v: mlPerHour, u: 'mL/h', c: '#2563eb', bg: '#eff6ff' },
                        ].map((n, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: n.bg, borderRadius: '4px', padding: '4px 6px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '7px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase' }}>{n.u}</span>
                            <span style={{ fontSize: '14px', fontWeight: 900, color: n.c, fontFamily: 'monospace' }}>{n.v}</span>
                          </div>
                        ))}
                        {sortedItems.length > 0 && (
                          <div style={{ borderTop: '1px solid #f5f5f4', paddingTop: '6px', marginTop: '4px' }}>
                            {sortedItems.slice(0, 6).map((item, i) => (
                              <div key={i} style={{ display: 'flex', gap: '3px', alignItems: 'center', fontSize: '8px', marginBottom: '2px' }}>
                                <span>{EMOJIS[item.type] || '📦'}</span>
                                <span style={{ flex: 1, color: '#1c1917', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                                <span style={{ color: '#8b5cf6', fontWeight: 900, fontFamily: 'monospace' }}>×{item.qty}</span>
                              </div>
                            ))}
                            <div style={{ fontSize: '7px', color: '#a8a29e', marginTop: '3px' }}>Total: {totalCarbsAll}g CH · {totalSodiumAll}mg Na · {totalMl}mL</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Chart + Segments */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ background: 'white', border: '1px solid #e7e5e4', borderRadius: '10px', padding: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                          <span style={{ fontSize: '8px', fontWeight: 900, color: '#10A49B', textTransform: 'uppercase' }}>📈 Perfil de Elevación y Nutrición</span>
                          {props.altitudeAvg && props.altitudeAvg > 0 && <span style={{ fontSize: '7px', color: '#a8a29e' }}>Altitud media: {Math.round(props.altitudeAvg)} m</span>}
                        </div>
                        {renderSvgProfile(560, 140)}
                      </div>

                      {segmentDetails.length > 1 && (
                        <div style={{ background: 'white', border: '1px solid #e7e5e4', borderRadius: '10px', padding: '10px' }}>
                          <div style={{ fontSize: '8px', fontWeight: 900, color: '#a8a29e', textTransform: 'uppercase', marginBottom: '6px' }}>🗺️ Detalle por Segmento</div>
                          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(segmentDetails.length, 5)}, 1fr)`, gap: '6px' }}>
                            {segmentDetails.map((seg, i) => (
                              <div key={i} style={{ background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '6px', padding: '6px', textAlign: 'center' }}>
                                <div style={{ fontSize: '7px', fontWeight: 900, color: '#1c1917', marginBottom: '3px', lineHeight: '1.3' }}>{seg.from} - {seg.to}</div>
                                <div style={{ fontSize: '10px', fontWeight: 900, color: '#78716c', fontFamily: 'monospace' }}>{seg.km} km</div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                                  <span style={{ fontSize: '8px', fontWeight: 700, color: '#16a34a' }}>+{seg.dPlus}m</span>
                                  <span style={{ fontSize: '8px', fontWeight: 700, color: '#dc2626' }}>-{seg.dMinus}m</span>
                                </div>
                                <div style={{ fontSize: '8px', color: '#6366f1', fontWeight: 700, marginTop: '2px' }}>{seg.timeStr}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50 text-xs uppercase tracking-wider transition-all"
              >
                Volver
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex-[2] bg-[#10A49B] hover:bg-teal-600 text-white font-black py-3 rounded-xl shadow transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {exporting ? 'Generando archivo PNG...' : '📥 Guardar Imagen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
