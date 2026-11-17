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
  hasSplits?: boolean;
  pointsEnabled?: boolean;
}

/** Resultado "crudo" tal como viene del Excel (sin puntos: se calculan al cargar). */
export interface RaceResultRaw {
  course: string; // id del recorrido
  name: string;
  country: string;
  sex: "M" | "F"; // M = varón, F = dama
  ageCategory: string;
  time: string; // HH:MM:SS
  splits?: {
    k21?: { time: string; category?: string; score: number } | null;
    k42?: { time: string; category?: string; score: number } | null;
  };
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
  pointsEnabled?: boolean;
  hasSplits?: boolean;
  splits?: {
    k21?: { time: string; category?: string; score: number } | null;
    k42?: { time: string; category?: string; score: number } | null;
  };
}

export interface RunnerRaceHistoryItem {
  id: string;
  raceSlug: string;
  raceName: string;
  raceDate: string;
  raceLocation?: string;
  raceCountryCode: string;
  courseId: string;
  courseLabel: string;
  discipline: RankingDiscipline;
  time: string;
  score: number;
  pointsEnabled: boolean;
  hasSplits?: boolean;
  splits?: {
    k21?: { time: string; category?: string; score: number } | null;
    k42?: { time: string; category?: string; score: number } | null;
  };
  km: number;
  dPlus: number;
  position?: number;
}

export interface RunnerProfile {
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  gender: "H" | "M";
  ageCategory: string;
  bestScore: number;
  avgScore: number;
  totalRaces: number;
  totalKm: number;
  totalDPlus: number;
  history: RunnerRaceHistoryItem[];
}
