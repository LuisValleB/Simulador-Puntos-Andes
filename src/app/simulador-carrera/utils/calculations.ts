import { calculatePuntosAndesScore } from '@/utils/calculoRendimiento';

export interface NutritionItem {
  id: string;
  km: number;
  minuteMark: number;
  mode: 'km' | 'tiempo';
  type: 'gel' | 'solido' | 'sal' | 'cafeina' | 'isotonico' | 'agua';
  quantity: number;
  nota: string;
  customLabel: string;
  customCarbs: number | null;
  customSodium: number | null;
}

// Modelo agrupado: una "parada" de nutrición con múltiples sub-items
export interface NutritionSubItem {
  id: string;
  type: 'gel' | 'solido' | 'sal' | 'cafeina' | 'isotonico' | 'agua';
  customLabel: string;
  quantity: number;
  customCarbs: number | null;
  customSodium: number | null;
  customMl: number | null;  // mL por unidad
  nota: string;
}

export interface NutritionStop {
  id: string;
  km: number;
  minuteMark: number;
  mode: 'km' | 'tiempo';
  items: NutritionSubItem[];
}

export const DEFAULT_CARBS: Record<string, number> = {
  gel: 25, solido: 40, sal: 0, cafeina: 0, isotonico: 15, agua: 0,
};

export const DEFAULT_SODIUM: Record<string, number> = {
  gel: 50, solido: 80, sal: 300, cafeina: 0, isotonico: 200, agua: 0,
};

// Flatten stops into flat NutritionItem[] for chart compatibility
export function stopsToItems(stops: NutritionStop[]): NutritionItem[] {
  const items: NutritionItem[] = [];
  for (const stop of stops) {
    for (const sub of stop.items) {
      items.push({
        id: sub.id,
        km: stop.km,
        minuteMark: stop.minuteMark,
        mode: stop.mode,
        type: sub.type,
        quantity: sub.quantity,
        nota: sub.nota,
        customLabel: sub.customLabel,
        customCarbs: sub.customCarbs,
        customSodium: sub.customSodium,
      });
    }
  }
  return items;
}

export function calculateNutritionFromStops(stops: NutritionStop[], totalTimeHours: number) {
  const items = stopsToItems(stops);
  return calculateNutrition(items, totalTimeHours);
}

export function calculateNutrition(items: NutritionItem[], totalTimeHours: number) {
  const totalCarbs = items.reduce((sum, item) => {
    const c = item.customCarbs !== null && item.customCarbs !== undefined 
      ? item.customCarbs : (DEFAULT_CARBS[item.type] || 0);
    return sum + c * item.quantity;
  }, 0);
  
  const totalSodium = items.reduce((sum, item) => {
    const s = item.customSodium !== null && item.customSodium !== undefined
      ? item.customSodium : (DEFAULT_SODIUM[item.type] || 0);
    return sum + s * item.quantity;
  }, 0);

  const totalKcal = totalCarbs * 4;

  return {
    carbsPerHour: totalTimeHours > 0 ? Math.round(totalCarbs / totalTimeHours) : 0,
    sodiumPerHour: totalTimeHours > 0 ? Math.round(totalSodium / totalTimeHours) : 0,
    totalCarbs: Math.round(totalCarbs),
    totalSodium: Math.round(totalSodium),
    totalKcal: Math.round(totalKcal),
  };
}

// Ajuste de pace por gradiente — Naismith simplificado para trail
// basePace en min/km, gradient en %
export function adjustedPace(basePaceMinPerKm: number, gradientPercent: number): number {
  if (gradientPercent > 0) {
    // Subida: +0.6 min/km por cada 10% de gradiente
    return basePaceMinPerKm + gradientPercent * 0.06;
  } else if (gradientPercent < -20) {
    // Bajada muy pronunciada (>20%): también frena
    return basePaceMinPerKm + (Math.abs(gradientPercent) - 20) * 0.02;
  }
  return basePaceMinPerKm;
}

// Tiempo proyectado total basado en segmentos del track
export function calculateProjectedTime(
  points: { distance: number; gradient?: number }[],
  basePaceMinPerKm: number
): number { // retorna minutos totales
  let totalMinutes = 0;
  for (let i = 1; i < points.length; i++) {
    const segDistance = points[i].distance - points[i-1].distance;
    const gradient = points[i].gradient || 0;
    const pace = adjustedPace(basePaceMinPerKm, gradient);
    totalMinutes += segDistance * pace;
  }
  return totalMinutes;
}

export function minutesToHHMMSS(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const s = Math.floor((minutes * 60) % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Proyección SPTC — utiliza nativamente la lógica absoluta de Puntos Andes
export function projectSPTC(
  kme: number,
  altitudeAvg: number,
  projectedTimeHours: number,
  gender: 'M' | 'F' = 'M',
  totalDistance: number = 0,
  dPlus: number = 0,
  dMinus: number = 0,
  terrain: number = 1,
  climate: number = 1,
  nightHours: number = 0
): { low: number; mid: number; high: number } {
  
  // Evitar proyecciones si no hay tiempo o distancia válida
  if (projectedTimeHours <= 0 || totalDistance <= 0) {
    return { low: 0, mid: 0, high: 0 };
  }

  // 1. Escenario Central (Realista): Tiempo exacto del plan
  const totalSecondsMid = Math.round(projectedTimeHours * 3600);
  const hMid = Math.floor(totalSecondsMid / 3600);
  const mMid = Math.floor((totalSecondsMid % 3600) / 60);
  const sMid = totalSecondsMid % 60;

  const resMid = calculatePuntosAndesScore(
    totalDistance,
    dPlus,
    dMinus,
    hMid,
    mMid,
    sMid,
    terrain,
    climate,
    altitudeAvg,
    nightHours
  );
  const mid = resMid ? resMid.score : 0;

  // 2. Escenario Pesimista (Bajo): Tiempo 5% más lento
  const totalSecondsLow = Math.round(projectedTimeHours * 1.05 * 3600);
  const resLow = calculatePuntosAndesScore(
    totalDistance,
    dPlus,
    dMinus,
    Math.floor(totalSecondsLow / 3600),
    Math.floor((totalSecondsLow % 3600) / 60),
    totalSecondsLow % 60,
    terrain,
    climate,
    altitudeAvg,
    nightHours
  );
  const lowRaw = resLow ? resLow.score : Math.max(0, mid - 40);

  // 3. Escenario Optimista (Alto): Tiempo 4% más rápido
  const totalSecondsHigh = Math.round(projectedTimeHours * 0.96 * 3600);
  const resHigh = calculatePuntosAndesScore(
    totalDistance,
    dPlus,
    dMinus,
    Math.floor(totalSecondsHigh / 3600),
    Math.floor((totalSecondsHigh % 3600) / 60),
    totalSecondsHigh % 60,
    terrain,
    climate,
    altitudeAvg,
    nightHours
  );
  const highRaw = resHigh ? resHigh.score : Math.min(1000, mid + 25);

  return {
    low: Math.min(lowRaw, mid),
    mid,
    high: Math.max(highRaw, mid)
  };
}
