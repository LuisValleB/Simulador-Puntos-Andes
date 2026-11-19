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
  if (c === "bolivia" || c === "bol") return "BOL";
  if (c === "brasil" || c === "bra") return "BRA";
  if (c === "colombia" || c === "col") return "COL";
  if (c === "ecuador" || c === "ecu") return "ECU";
  if (c === "paraguay" || c === "par") return "PAR";
  if (c === "peru" || c === "perú" || c === "per") return "PER";
  if (c === "venezuela" || c === "ven") return "VEN";
  if (c === "francia" || c === "france" || c === "fra") return "FRA";
  if (c === "españa" || c === "esp") return "ESP";
  if (c === "suiza" || c === "sui") return "SUI";
  if (c === "italia" || c === "ita") return "ITA";
  if (c === "alemania" || c === "ger") return "GER";
  if (c === "suecia" || c === "swe") return "SWE";
  if (c === "finlandia" || c === "fin") return "FIN";
  if (c === "polonia" || c === "pol") return "POL";
  if (c === "estados unidos" || c === "usa") return "USA";
  if (c === "canadá" || c === "canada" || c === "can") return "CAN";
  if (c === "méjico" || c === "mexico" || c === "mex") return "MEX";
  if (c === "costa rica" || c === "crc") return "CRC";
  if (c === "australia" || c === "aus") return "AUS";
  if (c === "nueva zelandia" || c === "nueva zelanda" || c === "nzl") return "NZL";
  if (c === "japón" || c === "japon" || c === "jpn") return "JPN";
  return country.trim().slice(0, 3).toUpperCase();
}

export interface CanonicalRunner {
  canonicalName: string;
  canonicalSlug: string;
  gender: "H" | "M";
}

function normalizeStr(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function toTitleCase(str: string): string {
  const lowercaseWords = new Set(["de", "del", "la", "las", "los", "y", "e", "en", "el", "da", "do", "dos", "das", "van", "von"]);
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) => {
      if (i > 0 && lowercaseWords.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

// ─── CANONICAL RUNNER REGISTRY (Deduplication system) ───────────────────────────
interface RawRunnerEntry {
  norm: string;
  gender: "H" | "M";
  tokens: string[];
  variants: Map<string, number>;
  bestDisplay: string;
}

const UNIQUE_RUNNER_ENTRIES = new Map<string, RawRunnerEntry>();

for (const race of RACES_RAW) {
  for (const r of race.results) {
    if (!r.name || !r.name.trim()) continue;
    const raw = r.name.trim();
    const g: "H" | "M" = r.sex === "F" ? "M" : "H";
    const norm = normalizeStr(raw);
    const key = `${norm}|${g}`;
    let item = UNIQUE_RUNNER_ENTRIES.get(key);
    if (!item) {
      item = {
        norm,
        gender: g,
        tokens: norm.split(" "),
        variants: new Map(),
        bestDisplay: raw,
      };
      UNIQUE_RUNNER_ENTRIES.set(key, item);
    }
    item.variants.set(raw, (item.variants.get(raw) || 0) + 1);
  }
}

// Pick the cleanest display name for each entry
for (const val of UNIQUE_RUNNER_ENTRIES.values()) {
  const arr = Array.from(val.variants.keys());
  arr.sort((a, b) => {
    const aAllUpper = a === a.toUpperCase();
    const bAllUpper = b === b.toUpperCase();
    if (aAllUpper !== bAllUpper) return aAllUpper ? 1 : -1;
    const aAcc = /[\u00C0-\u017F]/.test(a) ? 1 : 0;
    const bAcc = /[\u00C0-\u017F]/.test(b) ? 1 : 0;
    if (aAcc !== bAcc) return bAcc - aAcc;
    return b.length - a.length;
  });
  let best = arr[0];
  if (best === best.toUpperCase() && best.length > 3) {
    best = toTitleCase(best);
  }
  val.bestDisplay = best;
}

// Disjoint Set Union (Union-Find) to merge runner variants
const dsuParent = new Map<string, string>();
function dsuFind(k: string): string {
  if (!dsuParent.has(k)) dsuParent.set(k, k);
  const p = dsuParent.get(k)!;
  if (p !== k) {
    const root = dsuFind(p);
    dsuParent.set(k, root);
    return root;
  }
  return k;
}

function dsuUnion(k1: string, k2: string): void {
  const r1 = dsuFind(k1);
  const r2 = dsuFind(k2);
  if (r1 !== r2) {
    const e1 = UNIQUE_RUNNER_ENTRIES.get(r1)!;
    const e2 = UNIQUE_RUNNER_ENTRIES.get(r2)!;
    if (e1.tokens.length > e2.tokens.length) {
      dsuParent.set(r2, r1);
    } else if (e2.tokens.length > e1.tokens.length) {
      dsuParent.set(r1, r2);
    } else {
      if (e1.bestDisplay.length >= e2.bestDisplay.length) {
        dsuParent.set(r2, r1);
      } else {
        dsuParent.set(r1, r2);
      }
    }
  }
}

const runnerEntriesList = Array.from(UNIQUE_RUNNER_ENTRIES.values());
for (let i = 0; i < runnerEntriesList.length; i++) {
  for (let j = i + 1; j < runnerEntriesList.length; j++) {
    const a = runnerEntriesList[i];
    const b = runnerEntriesList[j];
    if (a.gender !== b.gender) continue;

    const longer = a.tokens.length >= b.tokens.length ? a : b;
    const shorter = a.tokens.length >= b.tokens.length ? b : a;

    // Rule 1: omitted second surname (e.g. 'Luis Valle' vs 'Luis Valle Barrientos')
    if (longer.tokens.length === shorter.tokens.length + 1 && shorter.tokens.length >= 2) {
      if (shorter.tokens.every((t, idx) => t === longer.tokens[idx])) {
        dsuUnion(`${a.norm}|${a.gender}`, `${b.norm}|${b.gender}`);
        continue;
      }
    }

    // Rule 2: initial as second surname (e.g. 'Luis Valle B' vs 'Luis Valle Barrientos')
    if (longer.tokens.length === shorter.tokens.length && shorter.tokens.length >= 3) {
      const prefixOk = shorter.tokens.slice(0, -1).every((t, idx) => t === longer.tokens[idx]);
      const lastS = shorter.tokens[shorter.tokens.length - 1];
      const lastL = longer.tokens[longer.tokens.length - 1];
      if (prefixOk && lastS.length === 1 && lastL.length > 1 && lastL.startsWith(lastS)) {
        dsuUnion(`${a.norm}|${a.gender}`, `${b.norm}|${b.gender}`);
        continue;
      }
    }

    // Rule 3: middle name + initial (e.g. 'Celinda Guerrero R' vs 'Celinda Margarita GUERRERO RIVERA')
    if (shorter.tokens.length === 3 && longer.tokens.length === 4) {
      if (
        shorter.tokens[0] === longer.tokens[0] &&
        shorter.tokens[1] === longer.tokens[2] &&
        longer.tokens[3].startsWith(shorter.tokens[2])
      ) {
        dsuUnion(`${a.norm}|${a.gender}`, `${b.norm}|${b.gender}`);
        continue;
      }
    }

    // Rule 4: middle name variation with full surnames (e.g. 'Julia Aros Gamboa' vs 'Julia Elizabeth Aros Gamboa')
    if (shorter.tokens.length === 3 && longer.tokens.length === 4) {
      if (
        shorter.tokens[0] === longer.tokens[0] &&
        shorter.tokens[1] === longer.tokens[2] &&
        shorter.tokens[2] === longer.tokens[3]
      ) {
        dsuUnion(`${a.norm}|${a.gender}`, `${b.norm}|${b.gender}`);
        continue;
      }
    }
  }
}

const CANONICAL_BY_NORM = new Map<string, CanonicalRunner>();
const SLUG_TO_CANONICAL = new Map<string, CanonicalRunner>();
const ALL_CANONICAL_RUNNERS_MAP = new Map<string, CanonicalRunner>();

for (const e of runnerEntriesList) {
  const rootKey = dsuFind(`${e.norm}|${e.gender}`);
  const rootEntry = UNIQUE_RUNNER_ENTRIES.get(rootKey)!;
  const cName = rootEntry.bestDisplay;
  const cSlug = runnerSlug(cName);
  const runner: CanonicalRunner = {
    canonicalName: cName,
    canonicalSlug: cSlug,
    gender: rootEntry.gender,
  };
  CANONICAL_BY_NORM.set(`${e.norm}|${e.gender}`, runner);
  SLUG_TO_CANONICAL.set(runnerSlug(e.norm), runner);
  for (const variant of e.variants.keys()) {
    SLUG_TO_CANONICAL.set(runnerSlug(variant), runner);
  }
  ALL_CANONICAL_RUNNERS_MAP.set(cSlug, runner);
}

export function getCanonicalRunner(rawName: string, sex?: string): CanonicalRunner {
  const g: "H" | "M" = sex === "F" ? "M" : "H";
  const norm = normalizeStr(rawName);
  const found = CANONICAL_BY_NORM.get(`${norm}|${g}`);
  if (found) return found;
  return {
    canonicalName: rawName.trim(),
    canonicalSlug: runnerSlug(rawName),
    gender: g,
  };
}

export function resolveRunnerSlug(slug: string): string {
  const found = SLUG_TO_CANONICAL.get(slug);
  return found?.canonicalSlug ?? slug;
}

export function resolveRunnerBySlug(slug: string): CanonicalRunner | null {
  const found = SLUG_TO_CANONICAL.get(slug);
  if (found) return found;
  return ALL_CANONICAL_RUNNERS_MAP.get(slug) ?? null;
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
    const canonical = getCanonicalRunner(r.name, r.sex);
    return {
      position,
      name: r.name,
      canonicalName: canonical.canonicalName,
      canonicalSlug: canonical.canonicalSlug,
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
      const canonical = getCanonicalRunner(r.name, r.sex);
      const gender = canonical.gender;
      const runnerKey = `${canonical.canonicalSlug}|${gender}`;

      // Para etapas combinadas (ej: Grand K), computar los splits de cada día por separado
      if (course.hasSplits && r.splits) {
        if (r.splits.k21 && r.splits.k21.score > 0) {
          entries.push({
            id: `${race.slug}-${i}-k21`,
            runnerKey,
            name: canonical.canonicalName,
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
            runnerKey,
            name: canonical.canonicalName,
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
      entries.push({
        id: `${race.slug}-${i}`,
        runnerKey,
        name: canonical.canonicalName,
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
  // Include canonical slugs
  for (const cSlug of ALL_CANONICAL_RUNNERS_MAP.keys()) {
    if (cSlug) set.add(cSlug);
  }
  // Include all aliases from results to prevent 404s
  for (const slug of SLUG_TO_CANONICAL.keys()) {
    if (slug) set.add(slug);
  }
  return Array.from(set);
}

export function getRunnerProfile(slug: string): RunnerProfile | null {
  const canonical = resolveRunnerBySlug(slug);
  if (!canonical) return null;
  const targetSlug = canonical.canonicalSlug;

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
        if (row.canonicalSlug === targetSlug) {
          const raw = race.results.find(
            (r) => r.course === course.id && getCanonicalRunner(r.name, r.sex).canonicalSlug === targetSlug
          );
          if (raw) {
            matchedResults.push({ race, course, raw, rowPos: row.position });
          }
        }
      }
    }
  }

  if (matchedResults.length === 0) return null;

  const prime = matchedResults[0];
  const name = canonical.canonicalName;
  const gender: "H" | "M" = canonical.gender;
  const countries = matchedResults.map((m) => countryCode(m.raw.country)).filter((c) => c && c !== "CHI");
  const cCode = countries[0] || countryCode(prime.raw.country) || "CHI";

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
      id: `${race.slug}-${course.id}-${raw.name}`,
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
      terrain: course.terrain,
      climate: course.climate,
      position: rowPos,
    });
  }

  history.sort((a, b) => b.raceDate.localeCompare(a.raceDate));

  const bestScore = validScores.length > 0 ? Math.max(...validScores) : 0;
  const avgScore = validScores.length > 0 ? Math.round(validScores.reduce((acc, v) => acc + v, 0) / validScores.length) : 0;

  return {
    slug: canonical.canonicalSlug,
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
