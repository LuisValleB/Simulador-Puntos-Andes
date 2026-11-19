import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUTPUT_FILE = path.join(ROOT, "src", "data", "races", "cascada-trail-2026.json");
const EXCEL_FILE = "C:/Proyectos/Resultados de Carreras de Trail/Resultados 2026/Resultados Cascada Trail by Jetour 2026.xlsx";

function validTime(t) {
  const m = /^(\d+):(\d{2})(?::(\d{2}))?$/.exec(String(t || "").trim());
  if (!m) return null;
  const [h, mi, s] = m[3] !== undefined ? [+m[1], +m[2], +m[3]] : [0, +m[1], +m[2]];
  if (h + mi + s === 0) return null;
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(mi)}:${p(s)}`;
}

const raceData = {
  slug: "cascada-trail-2026",
  name: "Cascada Trail by Jetour 2026",
  date: "2026-10-03",
  location: "Cajón del Maipo, Región Metropolitana, Chile",
  courses: [
    {
      id: "30K",
      label: "30K Cascada (29.5 km)",
      discipline: "Short Trail",
      km: 29.5,
      dPlus: 2211,
      dMinus: 2211,
      terrain: 5,
      climate: 2,
      altitude: 1100,
      nightHours: 0,
      pointsEnabled: true,
    },
    {
      id: "21K",
      label: "21K Cascada (20.79 km)",
      discipline: "Classic Trail",
      km: 20.79,
      dPlus: 1470,
      dMinus: 1470,
      terrain: 5,
      climate: 2,
      altitude: 1100,
      nightHours: 0,
      pointsEnabled: true,
    },
    {
      id: "12K",
      label: "12K Cascada (12.77 km)",
      discipline: "Classic Trail",
      km: 12.77,
      dPlus: 882,
      dMinus: 882,
      terrain: 5,
      climate: 2,
      altitude: 1100,
      nightHours: 0,
      pointsEnabled: true,
    },
    {
      id: "6K",
      label: "6K Cascada (5.8 km)",
      discipline: "Classic Trail",
      km: 5.8,
      dPlus: 321,
      dMinus: 321,
      terrain: 5,
      climate: 2,
      altitude: 1100,
      nightHours: 0,
      pointsEnabled: true,
    },
    {
      id: "3K",
      label: "3K Cascada",
      discipline: "Classic Trail",
      km: 3,
      dPlus: 150,
      dMinus: 150,
      terrain: 5,
      climate: 2,
      altitude: 1100,
      nightHours: 0,
      pointsEnabled: true,
    },
  ],
  results: [],
};

async function run() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_FILE);

  const sheets = [
    { name: "30K", courseId: "30K" },
    { name: "21K", courseId: "21K" },
    { name: "12K", courseId: "12K" },
    { name: "6K", courseId: "6K" },
    { name: "3K", courseId: "3K" },
  ];

  for (const s of sheets) {
    const ws = wb.getWorksheet(s.name);
    if (!ws) {
      console.error(`Hoja no encontrada: ${s.name}`);
      continue;
    }
    let count = 0;
    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r).values;
      const rawTime = String(row[6] || "").trim();
      const time = validTime(rawTime);
      if (!time) continue;

      const name = String(row[2] || "").trim();
      const country = String(row[3] || "Chile").trim();
      const sexRaw = String(row[4] || "").trim().toUpperCase();
      const sex = sexRaw === "F" || sexRaw === "W" ? "F" : "M";
      const ageCategory = String(row[5] || "").trim();

      raceData.results.push({
        course: s.courseId,
        name,
        country: country || "Chile",
        sex,
        ageCategory,
        time,
      });
      count++;
    }
    console.log(`[OK] ${s.name} (${s.courseId}): ${count} finalistas`);
  }

  console.log(`Total finalistas Cascada Trail: ${raceData.results.length}`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(raceData, null, 1), "utf8");
  console.log(`[OK] Archivo guardado: ${OUTPUT_FILE}`);
}

run();
