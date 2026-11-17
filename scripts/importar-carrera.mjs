/**
 * Importa los resultados de una carrera desde un Excel y la agrega al ranking.
 *
 * Uso:
 *   node scripts/importar-carrera.mjs <config.json> <resultados.xlsx>
 *   node scripts/importar-carrera.mjs --reindex      (solo regenera src/data/races/index.ts)
 *
 * El config (ver scripts/carreras/*.config.json) define nombre, fecha y los datos de cada
 * recorrido (km, D+, D-, terreno, clima). Los puntos se calculan al cargar la web.
 */
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";

const ROOT = path.resolve(import.meta.dirname, "..");
const RACES_DIR = path.join(ROOT, "src", "data", "races");

const norm = (s) =>
  String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function cellText(cell) {
  const v = cell.value;
  if (v == null) return "";
  if (typeof v === "object") {
    if (v.result != null) return String(v.result).trim();
    if (v.text != null) return String(v.text).trim();
    if (v.richText) return v.richText.map((t) => t.text).join("").trim();
    if (v instanceof Date) return "";
  }
  return String(v).trim();
}

function validTime(t) {
  const m = /^(\d+):(\d{2})(?::(\d{2}))?$/.exec(t);
  if (!m) return null;
  // mm:ss o hh:mm:ss -> siempre hh:mm:ss
  const [h, mi, s] = m[3] !== undefined ? [+m[1], +m[2], +m[3]] : [0, +m[1], +m[2]];
  if (h + mi + s === 0) return null;
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(mi)}:${p(s)}`;
}

function reindex() {
  fs.mkdirSync(RACES_DIR, { recursive: true });
  const files = fs.readdirSync(RACES_DIR).filter((f) => f.endsWith(".json")).sort();
  const imports = files.map((f, i) => `import r${i} from "./${f}";`).join("\n");
  const list = files.map((_, i) => `r${i}`).join(", ");
  fs.writeFileSync(
    path.join(RACES_DIR, "index.ts"),
    `// ARCHIVO GENERADO por scripts/importar-carrera.mjs. No editar a mano.\n` +
    `import type { RaceData } from "@/lib/raceTypes";\n${imports}\n\n` +
    `export const RACES_RAW = [${list}] as unknown as RaceData[];\n`
  );
  console.log(`[OK] index.ts actualizado con ${files.length} carrera(s).`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--reindex") return reindex();
  const [configPath, xlsxPath] = args;
  if (!configPath || !xlsxPath) {
    console.error("Uso: node scripts/importar-carrera.mjs <config.json> <resultados.xlsx>");
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(configPath, "utf8").replace(/^\uFEFF/, ""));
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);

  const results = [];
  const courses = [];
  for (const c of config.courses) {
    const ws = wb.getWorksheet(c.sheet);
    if (!ws) {
      console.error(`[ERROR] No existe la hoja "${c.sheet}" en el Excel.`);
      process.exit(1);
    }
    const headers = {};
    ws.getRow(1).eachCell((cell, col) => (headers[norm(cellText(cell))] = col));
    const col = (name) => headers[norm(name)];
    const cName = col("Nombre"), cCountry = col("País"), cSex = col("Sexo");
    const cAge = col("Categoría de Edad"), cTime = col("Tiempo");
    if (!cName || !cSex || !cTime) {
      console.error(`[ERROR] Hoja "${c.sheet}": faltan columnas Nombre/Sexo/Tiempo.`);
      process.exit(1);
    }
    let n = 0, skipped = 0;
    ws.eachRow((row, i) => {
      if (i === 1) return;
      const time = validTime(cellText(row.getCell(cTime)));
      const sex = cellText(row.getCell(cSex)).toUpperCase().charAt(0);
      const name = cellText(row.getCell(cName));
      if (!time || !name || (sex !== "M" && sex !== "F")) return void skipped++;
      results.push({
        course: c.id,
        name,
        country: cCountry ? cellText(row.getCell(cCountry)) || "Chile" : "Chile",
        sex,
        ageCategory: cAge ? cellText(row.getCell(cAge)) : "",
        time,
      });
      n++;
    });
    const { sheet, ...course } = c;
    courses.push({ terrain: 3, climate: 3, altitude: 0, nightHours: 0, ...course });
    console.log(`  ${c.id}: ${n} resultados (${skipped} filas omitidas: DNF/DNS/sin tiempo)`);
  }

  const race = {
    slug: config.slug,
    name: config.name,
    date: config.date,
    location: config.location,
    website: config.website,
    courses,
    results,
  };
  fs.mkdirSync(RACES_DIR, { recursive: true });
  fs.writeFileSync(path.join(RACES_DIR, `${config.slug}.json`), JSON.stringify(race, null, 1));
  console.log(`[OK] Carrera "${config.name}" guardada (${results.length} resultados).`);
  reindex();
}

main();
