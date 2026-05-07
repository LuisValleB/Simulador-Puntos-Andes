export interface RAPResult {
  gradePct: number;
  factor: number;
  ritmoRealSegPorKm: number;
  ritmoRealStr: string;
  rapSegPorKm: number;
  rapStr: string;
  warnings: string[];
  infos: string[];
}

/**
 * Modelo Minetti 2002 — costo metabólico de carrera según gradiente
 * @param gradeDecimal - Gradiente en decimal (0.05 = 5%, -0.10 = -10%)
 * @returns Costo en J/kg/m
 */
export function minettiCost(gradeDecimal: number): number {
  // Clamp a rango válido del modelo
  const i = Math.max(-0.45, Math.min(0.45, gradeDecimal));
  return 155.4 * i ** 5 - 30.4 * i ** 4 - 43.3 * i ** 3 + 46.3 * i ** 2 + 19.5 * i + 3.6;
}

/**
 * Factor de ajuste de ritmo: cuánto más lento corres por el gradiente
 * @param gradeDecimal - Gradiente en decimal
 * @returns Factor multiplicador (1.0 = plano, >1.0 = subida, <1.0 = bajada moderada)
 */
export function gradeFactor(gradeDecimal: number): number {
  return minettiCost(gradeDecimal) / minettiCost(0);
}

/**
 * Formatea segundos por km como "MM:SS"
 */
export function formatPace(secPerKm: number): string {
  if (secPerKm <= 0 || isNaN(secPerKm) || !isFinite(secPerKm)) return "0:00";
  let m = Math.floor(secPerKm / 60);
  let s = Math.round(secPerKm - m * 60);
  if (s === 60) {
    m += 1;
    s = 0;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Calcula el RAP (Ritmo Ajustado a Pendiente) — equivalente al RAP de Strava
 * @param distanciaKm - Distancia de la carrera en km
 * @param dPosM - Desnivel positivo total en metros
 * @param tiempoSegundos - Tiempo total en segundos
 * @returns Objeto con ritmoReal, rap, y datos auxiliares
 */
export function calcularRAP(
  distanciaKm: number,
  dPosM: number,
  tiempoSegundos: number
): RAPResult {
  if (distanciaKm <= 0 || tiempoSegundos <= 0) {
    return {
      gradePct: 0,
      factor: 1,
      ritmoRealSegPorKm: 0,
      ritmoRealStr: "0:00",
      rapSegPorKm: 0,
      rapStr: "0:00",
      warnings: [],
      infos: [],
    };
  }

  // Gradiente promedio de la subida
  const gradePct = (dPosM / (distanciaKm * 1000)) * 100;
  const gradeDecimal = gradePct / 100;

  // Factor de ajuste Minetti
  const factor = gradeFactor(gradeDecimal);

  // Ritmos
  const ritmoRealSegPorKm = tiempoSegundos / distanciaKm;
  const rapSegPorKm = ritmoRealSegPorKm / factor;

  const result: RAPResult = {
    gradePct,
    factor,
    ritmoRealSegPorKm,
    ritmoRealStr: formatPace(ritmoRealSegPorKm),
    rapSegPorKm,
    rapStr: formatPace(rapSegPorKm),
    warnings: [],
    infos: [],
  };

  validarRAP(result);

  return result;
}

/**
 * Valida el RAP calculado y muta el objeto result para añadir warnings/infos.
 */
export function validarRAP(result: RAPResult): void {
  // Validación 1: RAP irreal (más rápido que récord del mundo de 5K, aprox 2:30/km)
  if (result.rapSegPorKm < 150 && result.rapSegPorKm > 0) {
    const min = Math.floor(result.rapSegPorKm / 60);
    result.warnings.push(
      `⚠ El RAP calculado es ${min}:XX/km, más rápido que el récord mundial. Verifica que distancia, desnivel y tiempo sean correctos.`
    );
  }

  // Validación 2: Kilómetro Vertical / Límite de Minetti
  if (result.gradePct > 30) {
    result.infos.push(
      "ℹ Este gradiente promedio (>30%) sugiere un Kilómetro Vertical extremo. El modelo Minetti opera en su límite — el RAP es referencial."
    );
  }

  // Validación 3: Bajada extrema (Aunque Minetti cubre negativo, si usamos solo D+ como dice el prompt, esto tal vez no se dispare a menos que calculemos el neto o si dPosM es negativo, lo cual es raro, pero lo añadimos según los requerimientos)
  if (result.gradePct < -15) {
    result.infos.push(
      "ℹ Carrera con bajada muy pronunciada. El RAP refleja costo metabólico, no daño excéntrico — tu cuádriceps trabajó más de lo que indica el RAP."
    );
  }
}
