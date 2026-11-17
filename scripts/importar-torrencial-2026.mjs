import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUTPUT_FILE = path.join(ROOT, "src", "data", "races", "torrencial-valdivia-2026.json");

const EXCEL_MAIN = "C:/Proyectos/Resultados de Carreras de Trail/Resultados 2026/Resultados Torrencial Valdivia 2026.xlsx";
const EXCEL_12K = "C:/Proyectos/Resultados de Carreras de Trail/Resultados 2026/Torrencial_Chile_2026_12K_Resultados.xlsx";

function validTime(t) {
  const m = /^(\d+):(\d{2})(?::(\d{2}))?$/.exec(String(t || "").trim());
  if (!m) return null;
  const [h, mi, s] = m[3] !== undefined ? [+m[1], +m[2], +m[3]] : [0, +m[1], +m[2]];
  if (h + mi + s === 0) return null;
  const p = (n) => String(n).padStart(2, "0");
  return `${p(h)}:${p(mi)}:${p(s)}`;
}

const raceData = {
  slug: "torrencial-valdivia-2026",
  name: "Torrencial Chile by UTMB 2026",
  date: "2026-06-27",
  location: "Valdivia, Los Ríos, Chile",
  courses: [
    {
      id: "100K",
      label: "100K Pilolcura (106 km)",
      discipline: "Long Trail",
      km: 106,
      dPlus: 4500,
      dMinus: 4500,
      terrain: 5,
      climate: 5,
      altitude: 100,
      nightHours: 8,
      pointsEnabled: true,
    },
    {
      id: "65K",
      label: "65K Oncol (62 km)",
      discipline: "Long Trail",
      km: 62,
      dPlus: 2400,
      dMinus: 2400,
      terrain: 5,
      climate: 5,
      altitude: 100,
      nightHours: 5,
      pointsEnabled: true,
    },
    {
      id: "44K",
      label: "44K Llancahue",
      discipline: "Short Trail",
      km: 44,
      dPlus: 1400,
      dMinus: 1400,
      terrain: 5,
      climate: 5,
      altitude: 100,
      nightHours: 0,
      pointsEnabled: true,
    },
    {
      id: "21K",
      label: "21K Collico (20 km)",
      discipline: "Classic Trail",
      km: 20,
      dPlus: 750,
      dMinus: 750,
      terrain: 5,
      climate: 5,
      altitude: 100,
      nightHours: 0,
      pointsEnabled: true,
    },
    {
      id: "12K",
      label: "12K Torrencial",
      discipline: "Classic Trail",
      km: 12,
      dPlus: 350,
      dMinus: 350,
      terrain: 5,
      climate: 5,
      altitude: 100,
      nightHours: 2,
      pointsEnabled: true,
    },
    {
      id: "6K",
      label: "6K Isla Teja",
      discipline: "Classic Trail",
      km: 6,
      dPlus: 170,
      dMinus: 170,
      terrain: 5,
      climate: 5,
      altitude: 100,
      nightHours: 0,
      pointsEnabled: true,
    },
  ],
  results: [],
};

async function run() {
  const wbMain = new ExcelJS.Workbook();
  await wbMain.xlsx.readFile(EXCEL_MAIN);

  const mainSheets = [
    { name: "100K Pilolcura", courseId: "100K" },
    { name: "65K Oncol", courseId: "65K" },
    { name: "44K Llancahue", courseId: "44K" },
    { name: "21K Collico", courseId: "21K" },
    { name: "6K Isla Teja", courseId: "6K" },
  ];

  for (const s of mainSheets) {
    const ws = wbMain.getWorksheet(s.name);
    if (!ws) {
      console.error(`Hoja no encontrada: ${s.name}`);
      continue;
    }
    let count = 0;
    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r).values;
      const estado = String(row[7] || "").trim().toLowerCase();
      const rawTime = String(row[3] || "").trim();
      if (estado !== "finisher" || !rawTime || rawTime === "-") continue;

      const time = validTime(rawTime);
      if (!time) continue;

      const name = String(row[2] || "").trim();
      const sexRaw = String(row[4] || "").trim().toLowerCase();
      const sex = sexRaw.startsWith("h") || sexRaw === "m" ? "M" : "F";
      const ageCategory = String(row[5] || "").trim();
      const country = String(row[6] || "Chile").trim();

      raceData.results.push({
        course: s.courseId,
        name,
        country,
        sex,
        ageCategory,
        time,
      });
      count++;
    }
    console.log(`[OK] ${s.name} (${s.courseId}): ${count} finalistas`);
  }

  // 12K
  const wb12 = new ExcelJS.Workbook();
  await wb12.xlsx.readFile(EXCEL_12K);
  const ws12 = wb12.getWorksheet(1);
  let count12 = 0;
  for (let r = 2; r <= ws12.rowCount; r++) {
    const row = ws12.getRow(r).values;
    const rawTime = String(row[8] || "").trim();
    if (!rawTime || rawTime === "-" || rawTime === "00:00:00") continue;
    const time = validTime(rawTime);
    if (!time) continue;

    const name = String(row[2] || "").trim();
    const sexRaw = String(row[7] || "").trim().toUpperCase();
    const sex = sexRaw === "W" || sexRaw === "F" ? "F" : "M";
    const ageCategory = String(row[6] || "").trim();
    const country = String(row[4] || "CHI").trim();

    raceData.results.push({
      course: "12K",
      name,
      country,
      sex,
      ageCategory,
      time,
    });
    count12++;
  }
  console.log(`[OK] Resultados 12K (12K): ${count12} finalistas`);
  console.log(`Total finalistas Torrencial: ${raceData.results.length}`);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(raceData, null, 1), "utf8");
  console.log(`[OK] Archivo guardado: ${OUTPUT_FILE}`);
}

run();
