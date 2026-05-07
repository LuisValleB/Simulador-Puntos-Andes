export interface RendimientoTrail {
  id: string;
  tipo: 'competencia' | 'puntos-andes';
  distanciaKm: number;
  desnivelPositivoM: number;
  tiempoCorredorMinutos: number;
  nivelTerreno: number; // Nivel 1 a 5
  nivelClima: number; // Nivel 1 a 5
  altitudMedia?: number;
  horasNoche?: number;
  fechaRealizacion: string; // Formato YYYY-MM-DD
}

// 1. Función para calcular puntos de un evento individual
export function calcularPuntosEvento(rendimiento: RendimientoTrail): number {
  const { distanciaKm, desnivelPositivoM, tiempoCorredorMinutos, nivelTerreno = 1, nivelClima = 1, altitudMedia = 0, horasNoche = 0 } = rendimiento;
  
  if (!tiempoCorredorMinutos || tiempoCorredorMinutos <= 0 || distanciaKm <= 0) return 0;
  
  // 1. Tiempo Total en formato decimal (horas)
  const totalTime = tiempoCorredorMinutos / 60;
  
  // 2. Costo Excéntrico y Esfuerzo Equivalente (KmE)
  // Al no haber dMinus explícito en RendimientoTrail, asumimos circuito con desnivel simétrico: dMinus = dPlus
  const dMinus = desnivelPositivoM;
  const kmE = distanciaKm + (desnivelPositivoM / 100) + (dMinus / 200);

  // 3. Velocidad Real (Esfuerzo Equivalente)
  const vReal = kmE / totalTime;

  // 4. Índice de Gradiente (G) - Porcentaje de inclinación promedio
  const gradient = (desnivelPositivoM / (distanciaKm * 10));

  // 5. La Ecuación Maestra Unificada (MTR 2026)
  let penalizacionG = 0;
  if (gradient <= 15) {
      penalizacionG = gradient * 0.4;
  } else {
      penalizacionG = 8 - 2 * Math.exp((15 - gradient) / 5);
  }
  const vBaseIdeal = 46.7 - 4.6 * Math.log(kmE) - penalizacionG;

  // 6. Multiplicador de Penalización M (Clima y Terreno)
  const penalizaciones = [0, 0.010, 0.020, 0.035, 0.050];
  const terrainPenalty = penalizaciones[Math.min(Math.max(nivelTerreno - 1, 0), 4)];
  const climatePenalty = penalizaciones[Math.min(Math.max(nivelClima - 1, 0), 4)];
  const M = Math.min(1.00 + terrainPenalty + climatePenalty, 1.10);

  // 7. Factor de Altitud (A)
  let A = 1.00;
  if (altitudMedia > 1500) {
      A = 1 + 0.045 * Math.pow((altitudMedia - 1500) / 1000, 1.4);
  }
  A = Math.min(A, 1.30);

  // 8. Factor de Nocturnidad (N)
  let N = 1 + 0.02 * Math.min(1, horasNoche / totalTime);
  N = Math.min(N, 1.02);

  // 9. Velocidad Base Final Ajustada
  const vBaseFinal = vBaseIdeal / (M * A * N);

  // 10. Cálculo del Score Estándar
  let finalScore = (vReal / vBaseFinal) * 1000;

  // 11. Límite Humano
  return Math.max(0, Math.min(Math.round(finalScore), 1000));
}

// 2. Función para IC (Índice de Competencias)
export function calcularIndiceCompetencias(resultados: RendimientoTrail[]): number {
  const competencias = resultados.filter(r => r.tipo === 'competencia');
  
  if (competencias.length === 0) return 0;

  const hoy = new Date();
  
  const puntosDegradados: number[] = [];

  for (const act of competencias) {
    const fecha = new Date(act.fechaRealizacion);
    // Calcular diferencia exacta de meses
    // Un método simple y aproximado a meses comerciales:
    const months = (hoy.getFullYear() - fecha.getFullYear()) * 12 + (hoy.getMonth() - fecha.getMonth());
    
    // Ignorar resultados más antiguos de 36 meses
    if (months > 36) continue;

    let degradacion = 1.0;
    // Aplicar degradación temporal: 100% meses 0-11. Pierde 0.5% cada mes a partir del 12
    if (months >= 12) {
      const mesesConPenalizacion = months - 11;
      degradacion = Math.pow(0.995, mesesConPenalizacion);
    }
    
    const puntosBase = calcularPuntosEvento(act);
    puntosDegradados.push(puntosBase * degradacion);
  }

  if (puntosDegradados.length === 0) return 0;

  // Ordenar de mayor a menor
  puntosDegradados.sort((a, b) => b - a);
  // Tomar los 5 mejores
  const top5 = puntosDegradados.slice(0, 5);

  const suma = top5.reduce((acc, val) => acc + val, 0);
  const promedioBase = suma / top5.length; // Promediar los existentes

  // Factor de experiencia
  let factorExperiencia = 1.0;
  if (top5.length === 1) factorExperiencia = 0.97;
  else if (top5.length === 2) factorExperiencia = 0.98;
  else if (top5.length === 3) factorExperiencia = 0.99;
  else if (top5.length === 4) factorExperiencia = 0.995;
  // si es 5, se mantiene en 1.0

  return Math.round(promedioBase * factorExperiencia);
}

// 3. Función para IM (Índice MTR)
// 3. Función para Puntos Andes
export function calcularPuntosAndes(resultados: RendimientoTrail[]): number {
  const mtrs = resultados.filter(r => r.tipo === 'puntos-andes');
  
  if (mtrs.length === 0) return 0;

  const puntosAndesArray = mtrs.map(act => calcularPuntosEvento(act));
  
  // Ordenar de mayor a menor
  puntosAndesArray.sort((a, b) => b - a);
  
  // Tomar los 3 mejores
  const top3 = puntosAndesArray.slice(0, 3);
  
  const suma = top3.reduce((acc, val) => acc + val, 0);
  // Promediar los existentes (si hay menos de 3)
  return Math.round(suma / top3.length);
}

export interface MTRScoreResult {
    kmE: string;
    gradient: string;
    vReal: string;
    vBaseFinal: string;
    score: number;
}

// Motor Analítico Puntos Andes 10.0 (El Algoritmo Absoluto) - Trail Chile
export function calculatePuntosAndesScore(distance: number, dPlus: number, dMinus: number, hours: number, minutes: number, seconds: number, terrainLevel: number, climateLevel: number, meanAltitude: number = 0, nightHours: number = 0): MTRScoreResult | null {
    
    // 1. Tiempo Total en formato decimal
    const totalTime = hours + (minutes / 60) + (seconds / 3600);
    
    if (totalTime <= 0 || distance <= 0) return null; // Prevenir división por cero

    // 2. Costo Excéntrico y Esfuerzo Equivalente (KmE)
    const kmE = distance + (dPlus / 100) + (dMinus / 200);

    // 3. Velocidad Real (Esfuerzo Equivalente)
    const vReal = kmE / totalTime;

    // 4. Índice de Gradiente (G) - Porcentaje de inclinación promedio
    const gradient = (dPlus / (distance * 10));

    // 5. La Ecuación Maestra Unificada
    let penalizacionG = 0;
    if (gradient <= 15) {
        penalizacionG = gradient * 0.4;
    } else {
        penalizacionG = 8 - 2 * Math.exp((15 - gradient) / 5);
    }
    const vBaseIdeal = 46.7 - 4.6 * Math.log(kmE) - penalizacionG;

    // 6. Multiplicador de Penalización M (Clima y Terreno)
    const penalizaciones = [0, 0.010, 0.020, 0.035, 0.050];
    const terrainPenalty = penalizaciones[Math.min(Math.max(terrainLevel - 1, 0), 4)];
    const climatePenalty = penalizaciones[Math.min(Math.max(climateLevel - 1, 0), 4)];
    const M = Math.min(1.00 + terrainPenalty + climatePenalty, 1.10);

    // 7. Factor de Altitud (A)
    let A = 1.00;
    if (meanAltitude > 1500) {
        A = 1 + 0.045 * Math.pow((meanAltitude - 1500) / 1000, 1.4);
    }
    A = Math.min(A, 1.30);

    // 8. Factor de Nocturnidad (N)
    let N = 1 + 0.02 * Math.min(1, nightHours / totalTime);
    N = Math.min(N, 1.02);

    // 9. Velocidad Base Final Ajustada
    const vBaseFinal = vBaseIdeal / (M * A * N);

    // 10. Cálculo del Score Estándar
    let finalScore = (vReal / vBaseFinal) * 1000;

    // 11. Límite Humano
    if (finalScore > 1000) {
        finalScore = 1000;
    }

    // Retorno del paquete de datos para la UI
    return {
        kmE: kmE.toFixed(2),
        gradient: gradient.toFixed(2),
        vReal: vReal.toFixed(2),
        vBaseFinal: vBaseFinal.toFixed(2),
        score: Math.round(finalScore)
    };
}
