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
  nutritionStops: NutritionStop[];
  aidStations: AidStation[];
  totalEstimatedMinutes: number;
  points?: any[];
  nutritionItems?: any[];
}

export default function ExportReport(props: Props) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      // Temporarily show the hidden report
      reportRef.current.style.display = 'block';
      reportRef.current.style.position = 'absolute';
      reportRef.current.style.left = '-9999px';
      reportRef.current.style.top = '0';

      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#FDFBF7',
        scale: 2,
        useCORS: true,
        logging: false,
        width: 420,
      });

      reportRef.current.style.display = 'none';
      reportRef.current.style.position = '';
      reportRef.current.style.left = '';
      reportRef.current.style.top = '';

      const link = document.createElement('a');
      link.download = `plan-carrera-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

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

  // Mini Chart data
  const hasPoints = props.points && props.points.length > 0;
  const chartPoints = hasPoints ? props.points!.filter((_, i) => i % Math.max(1, Math.floor(props.points!.length / 120)) === 0) : [];
  const maxDist = hasPoints ? props.points![props.points!.length - 1].distance : props.totalDistance;
  const elevations = chartPoints.map(p => p.elevation);
  const minEle = hasPoints ? Math.min(...elevations) : 0;
  const maxEle = hasPoints ? Math.max(...elevations) : 100;
  const eleRange = maxEle - minEle || 100;

  const svgWidth = 372;
  const svgHeight = 135;
  const getX = (d: number) => maxDist > 0 ? (d / maxDist) * svgWidth : 0;
  const getY = (e: number) => 120 - ((e - minEle) / eleRange) * 75;

  let pathD = '';
  if (hasPoints && chartPoints.length > 0) {
    pathD = `M ${getX(chartPoints[0].distance)} 120 `;
    for (const p of chartPoints) {
      pathD += `L ${getX(p.distance)} ${getY(p.elevation)} `;
    }
    pathD += `L ${getX(chartPoints[chartPoints.length - 1].distance)} 120 Z`;
  } else {
    pathD = `M 0 120 L ${svgWidth * 0.3} 60 L ${svgWidth * 0.7} 40 L ${svgWidth} 120 Z`;
  }


  return (
    <>
      {/* Download button */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className="w-full bg-gradient-to-r from-[#10A49B] to-teal-600 text-white font-black py-3 rounded-xl shadow-md hover:shadow-lg transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 border border-teal-500/30 disabled:opacity-50"
      >
        {exporting ? (
          <span className="animate-pulse">Generando imagen...</span>
        ) : (
          <><span className="text-lg">📸</span> Descargar Plan de Carrera</>
        )}
      </button>

      {/* Hidden report card for html2canvas */}
      <div ref={reportRef} style={{ display: 'none', width: '420px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ background: '#FDFBF7', padding: '24px', borderRadius: '16px' }}>

          {/* Header with logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #e7e5e4', paddingBottom: '14px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#1c1917', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                Plan de Carrera
              </div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '2px' }}>
                Simulador Puntos Andes
              </div>
            </div>
            <img src="/logo.png" alt="Puntos Andes" style={{ height: '40px', objectFit: 'contain' }} crossOrigin="anonymous" />
          </div>

          {/* Race metrics */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {[
              { v: `${props.totalDistance.toFixed(1)} km`, l: 'Distancia' },
              { v: `${props.dPlus.toLocaleString()} m`, l: 'D+' },
              { v: `${props.dMinus.toLocaleString()} m`, l: 'D-' },
              { v: props.kme.toFixed(1), l: 'KmE' },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: 'white', border: '1px solid #e7e5e4', borderRadius: '10px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: i === 3 ? '#10A49B' : '#1c1917' }}>{s.v}</div>
                <div style={{ fontSize: '8px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Time */}
          <div style={{ background: '#1c1917', color: 'white', borderRadius: '12px', padding: '14px', textAlign: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '8px', fontWeight: 700, color: '#10A49B', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>
              Tiempo Estimado
            </div>
            <div style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '-1px' }}>
              {props.projectedTime}
            </div>
          </div>

          {/* PAS list */}
          {props.aidStations.length > 0 && (
            <div style={{ background: 'white', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '9px', fontWeight: 900, color: '#e67e22', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
                📦 Puntos de Abastecimiento
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '4px' }}>
                {props.aidStations.map((s, i) => (
                  <div key={i} style={{ background: '#fef2e8', border: '1px solid #fed7aa', borderRadius: '6px', padding: '4px 8px', fontSize: '10px', fontWeight: 700, color: '#9a3412' }}>
                    {s.label} — km {s.km}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nutrition metrics */}
          <div style={{ background: 'white', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '9px', fontWeight: 900, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
              ⚡ Estrategia Nutricional
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <div style={{ flex: 1, background: props.carbsPerHour < 45 ? '#fef2f2' : props.carbsPerHour <= 90 ? '#f0fdf4' : '#eff6ff', border: '1px solid #e7e5e4', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: props.carbsPerHour < 45 ? '#ef4444' : props.carbsPerHour <= 90 ? '#16a34a' : '#3b82f6' }}>{props.carbsPerHour}</div>
                <div style={{ fontSize: '7px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase' }}>g CH/h</div>
              </div>
              <div style={{ flex: 1, background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#44403c' }}>{props.sodiumPerHour}</div>
                <div style={{ fontSize: '7px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase' }}>mg Na/h</div>
              </div>
              <div style={{ flex: 1, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#2563eb' }}>{mlPerHour}</div>
                <div style={{ fontSize: '7px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase' }}>mL/h</div>
              </div>
            </div>

            {/* Item breakdown */}
            {sortedItems.length > 0 && (
              <div style={{ borderTop: '1px solid #f5f5f4', paddingTop: '8px' }}>
                <div style={{ fontSize: '8px', fontWeight: 900, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Detalle por producto</div>
                {sortedItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fafaf9', borderRadius: '6px', padding: '5px 8px', marginBottom: '3px', border: '1px solid #f5f5f4' }}>
                    <span style={{ fontSize: '12px' }}>{EMOJIS[item.type] || '📦'}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#1c1917', flex: 1 }}>{item.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 900, color: '#8b5cf6', fontFamily: 'monospace' }}>×{item.qty}</span>
                    <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#78716c' }}>{item.carbs}g · {item.sodium}mg{item.ml > 0 ? ` · ${item.ml}mL` : ''}</span>
                  </div>
                ))}
                <div style={{ fontSize: '8px', fontFamily: 'monospace', color: '#a8a29e', textAlign: 'center', marginTop: '6px' }}>
                  {props.nutritionStops.length} parada{props.nutritionStops.length !== 1 ? 's' : ''} · {sortedItems.reduce((s, i) => s + i.qty, 0)} items · Totales: {totalCarbsAll}g CH · {totalSodiumAll}mg Na · {totalMl}mL · ~{(totalCarbsAll * 4).toLocaleString()} kcal
                </div>
              </div>
            )}
          </div>

          {/* Altimetría y Puntos Estratégicos */}
          <div style={{ background: 'white', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '9px', fontWeight: 900, color: '#10A49B', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', borderBottom: '1px solid #f5f5f4', paddingBottom: '6px' }}>
              📈 Altimetría y Puntos Estratégicos
            </div>
            <div style={{ position: 'relative', width: '100%', height: `${svgHeight}px`, overflow: 'hidden' }}>
              <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ display: 'block' }}>
                <defs>
                  <linearGradient id="miniElevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10A49B" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10A49B" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                {/* Baseline */}
                <line x1={0} y1={120} x2={svgWidth} y2={120} stroke="#e7e5e4" strokeWidth={1} />
                
                {/* Profile Area */}
                <path d={pathD} fill="url(#miniElevGrad)" stroke="#10A49B" strokeWidth={1.5} />

                {/* Aid stations */}
                {props.aidStations.filter(s => s.km > 0).map((s, i) => {
                  const x = getX(s.km);
                  return (
                    <g key={`aid-${i}`}>
                      <line x1={x} y1={30} x2={x} y2={120} stroke="#e67e22" strokeWidth={1} strokeDasharray="2 2" opacity={0.6} />
                      <circle cx={x} cy={120} r={2.5} fill="#e67e22" />
                      <text x={x} y={22} fill="#c2410c" fontSize={7} fontWeight={900} textAnchor="middle">{s.label}</text>
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
                      <line x1={x} y1={30} x2={x} y2={120} stroke="#8b5cf6" strokeWidth={0.7} strokeDasharray="1 2" opacity={0.5} />
                      {nItems.map((it, idx) => (
                        <text key={idx} x={x} y={32 + idx * 10} fontSize={9} textAnchor="middle" dominantBaseline="hanging">
                          {EMOJIS[it.type] || '⚡'}
                        </text>
                      ))}
                    </g>
                  );
                })}
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', fontWeight: 700, color: '#a8a29e', marginTop: '2px' }}>
              <span>0 km</span>
              <span>{props.totalDistance.toFixed(1)} km</span>
            </div>
          </div>

          {/* SPTC */}
          <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #f0fdfa)', border: '1px solid rgba(16,164,155,0.3)', borderRadius: '12px', padding: '14px', marginBottom: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', fontWeight: 900, color: '#10A49B', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>
              Proyección Puntos Andes
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase' }}>Pesimista</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#57534e' }}>{props.sptcRange.low}</div>
              </div>
              <div style={{ width: '1px', height: '30px', background: '#d6d3d1' }}></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: 900, color: '#10A49B', textTransform: 'uppercase', background: 'white', padding: '2px 10px', borderRadius: '20px', border: '1px solid rgba(16,164,155,0.2)', display: 'inline-block' }}>Plan Realista</div>
                <div style={{ fontSize: '40px', fontWeight: 900, color: '#10A49B', lineHeight: 1, margin: '4px 0' }}>{props.sptcRange.mid}</div>
              </div>
              <div style={{ width: '1px', height: '30px', background: '#d6d3d1' }}></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase' }}>Optimista</div>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#57534e' }}>{props.sptcRange.high}</div>
              </div>
            </div>
          </div>

          {/* Footer branding */}
          <div style={{ borderTop: '2px solid #e7e5e4', paddingTop: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Generado con el Simulador de Carrera
            </div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#10A49B', marginTop: '2px' }}>
              puntosandes.cl
            </div>
            <div style={{ fontSize: '7px', color: '#d6d3d1', marginTop: '4px' }}>
              © {new Date().getFullYear()} Puntos Andes · Planificación y Nutrición para Trail Running
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
