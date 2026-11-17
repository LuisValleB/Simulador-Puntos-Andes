import ExcelJS from "exceljs";

async function checkMixto() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile("C:\\Proyectos\\Resultados de Carreras de Trail\\Resultados 2026\\Resultados ASICS K42 2026.xlsx");
  const ws = wb.getWorksheet("2x21K");
  ws.eachRow((r, i) => {
    if (i > 1 && r.getCell(5).text === 'Mixto') {
      console.log(`Row ${i}: Sexo=${r.getCell(4).text}, Cat=${r.getCell(5).text}, Name=${r.getCell(2).text}`);
    }
  });
}
checkMixto();
