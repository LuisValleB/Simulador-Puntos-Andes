'use client';
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
         ReferenceLine, ResponsiveContainer, Label } from 'recharts';
import { ProfilePoint } from '../utils/gpxParser';
import { NutritionItem } from '../utils/calculations';

export interface AidStation {
  id: string;
  km: number;
  label: string;
  segmentMinutes: number;
}

const NUTRITION_COLORS: Record<string, string> = {
  gel: '#8b5cf6', solido: '#16a34a', sal: '#0ea5e9',
  cafeina: '#a16207', hidratacion: '#06b6d4',
};

interface Props {
  points: ProfilePoint[];
  aidStations: AidStation[];
  nutritionItems: NutritionItem[];
  totalDistanceKm: number;
  totalEstimatedMinutes: number;
}

function fmtTime(minutes: number): string {
  if (minutes <= 0) return '0:00';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

function fmtTimeShort(minutes: number): string {
  if (minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  return `${m}'`;
}

// Tiny label on top of reference line
function TopLabel({ viewBox, value, fill, offset = 0 }: any) {
  return (
    <text x={viewBox.x} y={4 + offset} fill={fill} fontSize={7} fontWeight="700"
      textAnchor="middle" dominantBaseline="hanging">{value}</text>
  );
}

export default function ElevationChart({ points, aidStations, nutritionItems, totalDistanceKm, totalEstimatedMinutes }: Props) {
  const step = Math.max(1, Math.floor(points.length / 500));
  const chartData = useMemo(() => points.filter((_, i) => i % step === 0), [points, step]);

  const elevations = chartData.map(p => p.elevation);
  const minEle = Math.min(...elevations);
  const maxEle = Math.max(...elevations);
  const hasElevationData = maxEle > 0 || minEle < 0;
  const eleRange = hasElevationData ? maxEle - minEle : 100;
  const yDomain: [number, number] = hasElevationData 
    ? [Math.max(0, minEle - eleRange * 0.05), maxEle + eleRange * 0.15] 
    : [0, 100];

  const validAid = aidStations.filter(s => s.km > 0);
  const validNut = nutritionItems.filter(n => n.km > 0);
  const hasTime = totalEstimatedMinutes > 0;

  const sortedPas = useMemo(() => [...validAid].sort((a, b) => a.km - b.km), [validAid]);
  const hasSegTimes = sortedPas.some(s => s.segmentMinutes > 0);

  const pasCumTime = useMemo(() => {
    const map = new Map<string, number>();
    let cum = 0;
    for (const s of sortedPas) { cum += s.segmentMinutes || 0; map.set(s.id, cum); }
    return map;
  }, [sortedPas]);

  const timeAtKm = (km: number): number => {
    if (!hasTime || totalDistanceKm <= 0) return 0;
    if (hasSegTimes && sortedPas.length > 0) {
      let prevKm = 0, prevTime = 0;
      for (const s of sortedPas) {
        const ct = pasCumTime.get(s.id) || 0;
        if (km <= s.km) {
          const sk = s.km - prevKm;
          return sk > 0 ? prevTime + ((km - prevKm) / sk) * (ct - prevTime) : ct;
        }
        prevKm = s.km; prevTime = ct;
      }
      const lastT = pasCumTime.get(sortedPas[sortedPas.length - 1].id) || 0;
      const lastK = sortedPas[sortedPas.length - 1].km;
      const rk = totalDistanceKm - lastK;
      const rt = totalEstimatedMinutes - lastT;
      return rk > 0 ? lastT + ((km - lastK) / rk) * rt : totalEstimatedMinutes;
    }
    return (km / totalDistanceKm) * totalEstimatedMinutes;
  };

  const nutritionByKm = useMemo(() => validNut.reduce((acc, item) => {
    const key = item.km.toFixed(1);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, NutritionItem[]>), [validNut]);

  // Stagger labels
  const allKms = [
    ...validAid.map(s => ({ km: s.km, t: 'a' })),
    ...Object.keys(nutritionByKm).map(k => ({ km: parseFloat(k), t: 'n' })),
  ].sort((a, b) => a.km - b.km);
  const getOff = (km: number, t: string): number => {
    const thr = totalDistanceKm * 0.04;
    for (const m of allKms) {
      if (m.km === km && m.t === t) continue;
      if (Math.abs(m.km - km) < thr) return t === 'n' ? 11 : 0;
    }
    return 0;
  };

  // Build bar items
  type Seg = { fromKm: number; toKm: number; dist: number; segMin: number };
  type Pas = { km: number; label: string; cumMin: number };
  type BarItem = { type: 'seg'; d: Seg } | { type: 'pas'; d: Pas };

  const barItems = useMemo(() => {
    if (sortedPas.length === 0) return [];
    const items: BarItem[] = [];
    let cum = 0;
    // Start → first
    cum += sortedPas[0].segmentMinutes || 0;
    items.push({ type: 'seg', d: { fromKm: 0, toKm: sortedPas[0].km, dist: sortedPas[0].km, segMin: sortedPas[0].segmentMinutes || 0 } });
    items.push({ type: 'pas', d: { km: sortedPas[0].km, label: sortedPas[0].label, cumMin: cum } });
    for (let i = 1; i < sortedPas.length; i++) {
      cum += sortedPas[i].segmentMinutes || 0;
      items.push({ type: 'seg', d: { fromKm: sortedPas[i-1].km, toKm: sortedPas[i].km, dist: sortedPas[i].km - sortedPas[i-1].km, segMin: sortedPas[i].segmentMinutes || 0 } });
      items.push({ type: 'pas', d: { km: sortedPas[i].km, label: sortedPas[i].label, cumMin: cum } });
    }
    const lastK = sortedPas[sortedPas.length - 1].km;
    const rem = totalDistanceKm - lastK;
    if (rem > 0.3) items.push({ type: 'seg', d: { fromKm: lastK, toKm: totalDistanceKm, dist: rem, segMin: Math.max(0, totalEstimatedMinutes - cum) } });
    return items;
  }, [sortedPas, totalDistanceKm, totalEstimatedMinutes]);

  return (
    <div className="w-full bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
      
      {/* ══════ CHART ══════ */}
      <div className="px-3 pt-3 sm:px-4 sm:pt-4">
        {!hasElevationData && (
          <div className="mb-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded text-center">
            <p className="text-[10px] font-bold text-amber-600">⚠️ Sin datos de altitud</p>
          </div>
        )}

        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 18, right: 8, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10A49B" stopOpacity={0.35}/>
                <stop offset="100%" stopColor="#10A49B" stopOpacity={0.04}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
            <XAxis dataKey="distance" type="number"
              domain={[0, totalDistanceKm > 0 ? totalDistanceKm : 'auto']}
              tick={{ fontSize: 9, fill: '#a8a29e' }}
              tickFormatter={(v) => `${Math.round(v)}`}
              axisLine={{ stroke: '#e7e5e4' }} tickLine={false} />
            <YAxis domain={yDomain} tick={{ fontSize: 9, fill: '#a8a29e' }}
              axisLine={false} tickLine={false} width={38}
              tickFormatter={(v) => `${Math.round(v)}`} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fff', borderColor: '#e7e5e4', borderRadius: '8px', fontSize: '11px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', padding: '8px 12px' }}
              formatter={(val: any) => [`${val || 0} m`, 'Elevación']}
              labelFormatter={(km) => {
                const t = hasTime ? `  ·  ${fmtTimeShort(timeAtKm(Number(km)))}` : '';
                return `km ${Number(km).toFixed(1)}${t}`;
              }} />
            
            <Area type="monotone" dataKey="elevation" stroke="#10A49B" fill="url(#elevGrad)"
              strokeWidth={2} dot={false}
              activeDot={{ r: 4, fill: '#10A49B', stroke: '#fff', strokeWidth: 2 }} />

            {/* PAS lines */}
            {validAid.map(s => (
              <ReferenceLine key={`a-${s.id}`} x={s.km} stroke="#e67e22" strokeWidth={1.5} strokeOpacity={0.6}>
                <Label content={<TopLabel value={s.label} fill="#c2410c" offset={getOff(s.km, 'a')} />} />
              </ReferenceLine>
            ))}

            {/* Nutrition lines */}
            {Object.entries(nutritionByKm).map(([km, items]) => {
              const lbl = items.map(it => it.customLabel || it.type).join(', ');
              const c = NUTRITION_COLORS[items[0]?.type || 'gel'] || '#8b5cf6';
              return (
                <ReferenceLine key={`n-${km}`} x={parseFloat(km)} stroke={c} strokeWidth={1} strokeDasharray="4 3" strokeOpacity={0.5}>
                  <Label content={<TopLabel value={lbl} fill={c} offset={getOff(parseFloat(km), 'n')} />} />
                </ReferenceLine>
              );
            })}

            {/* Finish */}
            {totalDistanceKm > 0 && (
              <ReferenceLine x={totalDistanceKm} stroke="#a8a29e" strokeWidth={1} strokeDasharray="3 3">
                <Label content={<TopLabel value="🏁" fill="#78716c" />} />
              </ReferenceLine>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ══════ SEGMENT BAR ══════ */}
      {barItems.length > 0 && (
        <div className="border-t border-stone-100 bg-stone-50/50">
          {/* Row 1: timeline bar with segments + PAS km badges */}
          <div className="relative px-3 sm:px-4 pt-2">
            {/* Horizontal line */}
            <div className="absolute left-3 right-3 sm:left-4 sm:right-4 top-[18px] h-px bg-stone-300"></div>
            
            <div className="flex items-start w-full relative">
              {/* Start marker */}
              <div className="flex flex-col items-center z-10" style={{ width: '0px', flexShrink: 0 }}>
                <div className="w-2.5 h-2.5 rounded-full bg-stone-400 border-2 border-white shadow-sm"></div>
              </div>

              {barItems.map((item, i) => {
                if (item.type === 'seg') {
                  const s = item.d as Seg;
                  const w = totalDistanceKm > 0 ? (s.dist / totalDistanceKm) * 100 : 0;
                  return (
                    <div key={`s${i}`} className="flex flex-col items-center justify-start pt-5" style={{ width: `${w}%`, minWidth: 0 }}>
                      <span className="text-[9px] font-bold text-stone-400 truncate w-full text-center px-0.5">
                        {s.dist < 1 ? `${(s.dist * 1000).toFixed(0)}m` : `${s.dist.toFixed(1)} km`}
                      </span>
                      {hasTime && hasSegTimes && s.segMin > 0 && (
                        <span className="text-[8px] font-mono font-bold text-[#10A49B]">{fmtTimeShort(s.segMin)}</span>
                      )}
                    </div>
                  );
                } else {
                  const p = item.d as Pas;
                  return (
                    <div key={`p${i}`} className="flex flex-col items-center z-10" style={{ width: '0px', flexShrink: 0 }}>
                      {/* Dot on the line */}
                      <div className="w-2.5 h-2.5 rounded-full bg-[#e67e22] border-2 border-white shadow-sm"></div>
                      {/* Km badge */}
                      <div className="mt-1 bg-[#e67e22] text-white text-[7px] font-black px-1.5 py-[2px] rounded whitespace-nowrap shadow-sm">
                        {p.km.toFixed(0)} KM
                      </div>
                    </div>
                  );
                }
              })}

              {/* End marker */}
              <div className="flex flex-col items-center z-10" style={{ width: '0px', flexShrink: 0 }}>
                <div className="w-2.5 h-2.5 rounded-full bg-stone-600 border-2 border-white shadow-sm"></div>
                <div className="mt-1 bg-stone-600 text-white text-[7px] font-black px-1.5 py-[2px] rounded whitespace-nowrap shadow-sm">
                  {totalDistanceKm.toFixed(0)} KM
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: PAS names + times */}
          <div className="flex items-start w-full px-3 sm:px-4 pb-3">
            {/* Start name */}
            <div className="flex flex-col items-center" style={{ width: '0px', flexShrink: 0 }}>
              <span className="text-[8px] font-bold text-stone-500 whitespace-nowrap">Start</span>
            </div>

            {barItems.map((item, i) => {
              if (item.type === 'seg') {
                const s = item.d as Seg;
                const w = totalDistanceKm > 0 ? (s.dist / totalDistanceKm) * 100 : 0;
                return <div key={`n${i}`} style={{ width: `${w}%`, minWidth: 0 }}></div>;
              } else {
                const p = item.d as Pas;
                return (
                  <div key={`n${i}`} className="flex flex-col items-center" style={{ width: '0px', flexShrink: 0 }}>
                    <span className="text-[8px] font-bold text-stone-600 whitespace-nowrap">{p.label}</span>
                    {hasTime && hasSegTimes && p.cumMin > 0 && (
                      <span className="text-[7px] font-mono font-bold text-[#10A49B] whitespace-nowrap">{fmtTime(p.cumMin)}</span>
                    )}
                  </div>
                );
              }
            })}

            {/* End name */}
            <div className="flex flex-col items-center" style={{ width: '0px', flexShrink: 0 }}>
              <span className="text-[8px] font-bold text-stone-600 whitespace-nowrap">Meta</span>
              {hasTime && (
                <span className="text-[7px] font-mono font-bold text-[#10A49B] whitespace-nowrap">{fmtTime(totalEstimatedMinutes)}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend - subtle at bottom */}
      <div className="flex items-center justify-center gap-4 py-2 border-t border-stone-100 bg-stone-50/30">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-1 bg-[#10A49B] rounded-full opacity-60"></div>
          <span className="text-[7px] font-bold text-stone-400 uppercase tracking-wider">Elevación</span>
        </div>
        {validAid.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#e67e22]"></div>
            <span className="text-[7px] font-bold text-stone-400 uppercase tracking-wider">PAS</span>
          </div>
        )}
        {validNut.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0 border-b border-dashed border-[#8b5cf6]"></div>
            <span className="text-[7px] font-bold text-stone-400 uppercase tracking-wider">Nutrición</span>
          </div>
        )}
      </div>
    </div>
  );
}
