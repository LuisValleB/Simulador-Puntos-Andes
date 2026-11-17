export type RankingDiscipline = "General" | "U20" | "KV" | "Classic Trail" | "Short Trail" | "Long Trail";

/** Recorrido de una carrera (una prueba/distancia). Los puntos se calculan con estos datos. */
export interface CourseConfig {
  id: string; // ej: "40K"
  label: string; // ej: "Short Trail 40K"
  discipline: Exclude<RankingDiscipline, "General">;
  km: number;
  dPlus: number;
  dMinus: number;
  terrain: number; // 1-5
  climate: number; // 1-5
  altitude: number; // altitud media (m)
  nightHours: number;
}

/** Resultado "crudo" tal como viene del Excel (sin puntos: se calculan al cargar). */
export interface RaceResultRaw {
  course: string; // id del recorrido
  name: string;
  country: string;
  sex: "M" | "F"; // M = varón, F = dama
  ageCategory: string;
  time: string; // HH:MM:SS
}

export interface RaceData {
  slug: string;
  name: string;
  date: string; // YYYY-MM-DD
  location?: string;
  website?: string;
  courses: CourseConfig[];
  results: RaceResultRaw[];
}

/** Resultado con puntaje Puntos Andes calculado. gender: H = hombre, M = mujer. */
export interface RunnerRankingEntry {
  id: string;
  runnerKey: string;
  name: string;
  country: string;
  countryCode: string;
  gender: "H" | "M";
  ageCategory: string;
  time: string;
  score: number;
  distance: string;
  courseLabel: string;
  discipline: RankingDiscipline;
  isU20: boolean;
  raceSlug: string;
  race: string;
  date: string;
  season: number;
}

export interface RaceResultRow {
  position: number;
  name: string;
  countryCode: string;
  gender: "H" | "M";
  ageCategory: string;
  time: string;
  score: number;
}
