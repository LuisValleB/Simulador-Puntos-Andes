import { calculatePuntosAndesScore } from "@/utils/calculoRendimiento";
import { RACES_RAW } from "@/data/races";
import type {
  CourseConfig,
  RaceData,
  RaceResultRaw,
  RaceResultRow,
  RunnerRankingEntry,
} from "./raceTypes";

export function parseTime(time: string): { h: number; m: number; s: number; total: number } | null {
  const parts = time.trim().split(":").map((p) => parseInt(p, 10));
  if (parts.some((p) => Number.isNaN(p))) return null;
  let h = 0, m = 0, s = 0;
  if (parts.length === 3) [h, m, s] = parts;
  else if (parts.length === 2) [m, s] = parts;
  else return null;
  const total = h * 3600 + m * 60 + s;
  return total > 0 ? { h, m, s, total } : null;
}

export function scoreResult(course: CourseConfig, time: string): number {
  const t = parseTime(time);
  if (!t) return 0;
  const result = calculatePuntosAndesScore(
    course.km, course.dPlus, course.dMinus, t.h, t.m, t.s,
    course.terrain, course.climate, course.altitude, course.nightHours
  );
  return result?.score ?? 0;
}

function countryCode(country: string): string {
  const c = country.trim().toLowerCase();
  if (!c || c === "chile") return "CHI";
  if (c === "argentina") return "ARG";
  return country.trim().slice(0, 3).toUpperCase();
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function getRaces(): RaceData[] {
  return [...RACES_RAW].sort((a, b) => b.date.localeCompare(a.date));
}

export function getRace(slug: string): RaceData | undefined {
  return RACES_RAW.find((r) => r.slug === slug);
}

/** Resultados de una prueba, ordenados por tiempo, con posición (empates comparten puesto) y puntos. */
export function getCourseRows(race: RaceData, courseId: string): RaceResultRow[] {
  const course = race.courses.find((c) => c.id === courseId);
  if (!course) return [];
  const rows = race.results
    .filter((r: RaceResultRaw) => r.course === courseId)
    .map((r) => ({ r, t: parseTime(r.time)?.total ?? Infinity }))
    .filter((x) => x.t !== Infinity)
    .sort((a, b) => a.t - b.t);

  let lastTotal = -1;
  let lastPos = 0;
  return rows.map(({ r, t }, i) => {
    const position = t === lastTotal ? lastPos : i + 1;
    lastTotal = t;
    lastPos = position;
    return {
      position,
      name: r.name,
      countryCode: countryCode(r.country),
      gender: r.sex === "F" ? "M" : "H",
      ageCategory: r.ageCategory,
      time: r.time,
      score: scoreResult(course, r.time),
    };
  });
}

/** Todos los resultados de todas las carreras cargadas, ya puntuados. */
export function getAllEntries(): RunnerRankingEntry[] {
  const entries: RunnerRankingEntry[] = [];
  for (const race of RACES_RAW) {
    const season = parseInt(race.date.slice(0, 4), 10);
    race.results.forEach((r, i) => {
      const course = race.courses.find((c) => c.id === r.course);
      if (!course) return;
      const score = scoreResult(course, r.time);
      if (score <= 0) return;
      const gender = r.sex === "F" ? "M" : "H";
      entries.push({
        id: `${race.slug}-${i}`,
        runnerKey: `${normalize(r.name)}|${gender}`,
        name: r.name.trim(),
        country: r.country,
        countryCode: countryCode(r.country),
        gender,
        ageCategory: r.ageCategory,
        time: r.time,
        score,
        distance: course.id,
        courseLabel: course.label,
        discipline: course.discipline,
        isU20: /15\s*-\s*17/.test(r.ageCategory),
        raceSlug: race.slug,
        race: race.name,
        date: race.date,
        season,
      });
    });
  }
  return entries;
}
