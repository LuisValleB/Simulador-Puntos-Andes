import { calculatePuntosAndesScore } from "@/utils/calculoRendimiento";
import { RACES_RAW } from "@/data/races";
import type {
  CourseConfig,
  RaceData,
  RaceResultRaw,
  RaceResultRow,
  RunnerRankingEntry,
  RunnerProfile,
  RunnerRaceHistoryItem,
} from "./raceTypes";

export function runnerSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getRaceCountryCode(race: RaceData): string {
  const loc = (race.location || "").toLowerCase();
  if (loc.includes("argentina") || loc.includes("arg")) return "ARG";
  if (loc.includes("chile") || loc.includes("chi")) return "CHI";
  if (loc.includes("brasil") || loc.includes("brazil") || loc.includes("bra")) return "BRA";
  if (loc.includes("uruguay") || loc.includes("uru")) return "URU";
  if (loc.includes("colombia") || loc.includes("col")) return "COL";
  if (loc.includes("peru") || loc.includes("perú") || loc.includes("per")) return "PER";
  if (loc.includes("ecuador") || loc.includes("ecu")) return "ECU";
  if (loc.includes("bolivia") || loc.includes("bol")) return "BOL";
  if (loc.includes("paraguay") || loc.includes("par")) return "PAR";
  if (loc.includes("venezuela") || loc.includes("ven")) return "VEN";
  return "CHI";
}

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
  if (course.pointsEnabled === false) return 0;
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
  if (!c || c === "chile" || c === "chi") return "CHI";
  if (c === "argentina" || c === "arg") return "ARG";
  if (c === "uruguay" || c === "uru") return "URU";
  if (c === "francia" || c === "france" || c === "fra") return "FRA";
  if (c === "colombia" || c === "col") return "COL";
  if (c === "españa" || c === "esp") return "ESP";
  if (c === "peru" || c === "perú" || c === "per") return "PER";
  if (c === "suiza" || c === "sui") return "SUI";
  if (c === "brasil" || c === "bra") return "BRA";
  if (c === "venezuela" || c === "ven") return "VEN";
  if (c === "costa rica" || c === "crc") return "CRC";
  if (c === "estados unidos" || c === "usa") return "USA";
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
      pointsEnabled: course.pointsEnabled !== false,
      hasSplits: course.hasSplits,
      splits: r.splits,
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
      // Para etapas combinadas (ej: Grand K), computar los splits de cada día por separado
      if (course.hasSplits && r.splits) {
        const gender = r.sex === "F" ? "M" : "H";
        if (r.splits.k21 && r.splits.k21.score > 0) {
          entries.push({
            id: `${race.slug}-${i}-k21`,
            runnerKey: `${normalize(r.name)}|${gender}`,
            name: r.name.trim(),
            country: r.country,
            countryCode: countryCode(r.country),
            gender,
            ageCategory: r.splits.k21.category || r.ageCategory,
            time: r.splits.k21.time,
            score: r.splits.k21.score,
            distance: "21K",
            courseLabel: `${course.label} (K21 Día 1)`,
            discipline: "Classic Trail",
            isU20: /15\s*-\s*17|16\s*a\s*19|14\s*y\s*15|u20|sub\s*20/i.test(r.splits.k21.category || r.ageCategory),
            raceSlug: race.slug,
            race: race.name,
            date: race.date,
            season,
          });
        }
        if (r.splits.k42 && r.splits.k42.score > 0) {
          entries.push({
            id: `${race.slug}-${i}-k42`,
            runnerKey: `${normalize(r.name)}|${gender}`,
            name: r.name.trim(),
            country: r.country,
            countryCode: countryCode(r.country),
            gender,
            ageCategory: r.splits.k42.category || r.ageCategory,
            time: r.splits.k42.time,
            score: r.splits.k42.score,
            distance: "42K",
            courseLabel: `${course.label} (K42 Día 2)`,
            discipline: "Short Trail",
            isU20: /15\s*-\s*17|16\s*a\s*19|14\s*y\s*15|u20|sub\s*20/i.test(r.splits.k42.category || r.ageCategory),
            raceSlug: race.slug,
            race: race.name,
            date: race.date,
            season,
          });
        }
        return;
      }

      // No computar en ranking carreras por postas no medibles
      if (course.pointsEnabled === false) return;
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
        isU20: /15\s*-\s*17|16\s*a\s*19|14\s*y\s*15|u20|sub\s*20/i.test(r.ageCategory),
        raceSlug: race.slug,
        race: race.name,
        date: race.date,
        season,
      });
    });
  }
  return entries;
}

export function getAllRunnerSlugs(): string[] {
  const set = new Set<string>();
  for (const race of RACES_RAW) {
    for (const r of race.results) {
      if (r.name && r.name.trim()) {
        const slug = runnerSlug(r.name);
        if (slug) set.add(slug);
      }
    }
  }
  return Array.from(set);
}

export function getRunnerProfile(slug: string): RunnerProfile | null {
  const matchedResults: {
    race: RaceData;
    course: CourseConfig;
    raw: RaceResultRaw;
    rowPos?: number;
  }[] = [];

  for (const race of RACES_RAW) {
    for (const course of race.courses) {
      const rows = getCourseRows(race, course.id);
      for (const row of rows) {
        if (runnerSlug(row.name) === slug) {
          const raw = race.results.find((r) => r.course === course.id && runnerSlug(r.name) === slug);
          if (raw) {
            matchedResults.push({ race, course, raw, rowPos: row.position });
          }
        }
      }
    }
  }

  if (matchedResults.length === 0) return null;

  const prime = matchedResults[0];
  const name = prime.raw.name.trim();
  const gender: "H" | "M" = prime.raw.sex === "F" ? "M" : "H";
  const cCode = countryCode(prime.raw.country);

  const history: RunnerRaceHistoryItem[] = [];
  const validScores: number[] = [];
  let totalKm = 0;
  let totalDPlus = 0;

  for (const m of matchedResults) {
    const { race, course, raw, rowPos } = m;
    const isPoints = course.pointsEnabled !== false;
    let score = isPoints ? scoreResult(course, raw.time) : 0;

    if (course.hasSplits && raw.splits) {
      if (raw.splits.k21?.score) validScores.push(raw.splits.k21.score);
      if (raw.splits.k42?.score) validScores.push(raw.splits.k42.score);
      score = Math.max(raw.splits.k21?.score ?? 0, raw.splits.k42?.score ?? 0);
    } else if (score > 0) {
      validScores.push(score);
    }

    totalKm += course.km;
    totalDPlus += course.dPlus;

    history.push({
      id: `${race.slug}-${course.id}`,
      raceSlug: race.slug,
      raceName: race.name,
      raceDate: race.date,
      raceLocation: race.location,
      raceCountryCode: getRaceCountryCode(race),
      courseId: course.id,
      courseLabel: course.label,
      discipline: course.discipline,
      time: raw.time,
      score,
      pointsEnabled: isPoints || !!course.hasSplits,
      hasSplits: course.hasSplits,
      splits: raw.splits,
      km: course.km,
      dPlus: course.dPlus,
      position: rowPos,
    });
  }

  history.sort((a, b) => b.raceDate.localeCompare(a.raceDate));

  const bestScore = validScores.length > 0 ? Math.max(...validScores) : 0;
  const avgScore = validScores.length > 0 ? Math.round(validScores.reduce((acc, v) => acc + v, 0) / validScores.length) : 0;

  return {
    slug,
    name,
    country: prime.raw.country,
    countryCode: cCode,
    gender,
    ageCategory: prime.raw.ageCategory,
    bestScore,
    avgScore,
    totalRaces: history.length,
    totalKm: Math.round(totalKm * 10) / 10,
    totalDPlus: Math.round(totalDPlus),
    history,
  };
}
