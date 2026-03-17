import * as XLSX from 'xlsx';
import path from 'path';

export interface MaintenanceRecord {
  date: string;
  type: string;
  description: string;
  responsible: string;
  duration: string;
  status: string;
  year: number;
  month: string;
}

export interface Equipment {
  serialNumber: string;
  assetTag: string;
  service: string;
  name: string;
  brand: string;
  model: string;
  item: string;
  status: string;
  history: MaintenanceRecord[];
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/(?:^|\s|-)\S/g, (char) => char.toUpperCase())
    .trim();
}

export function parseExcelData(): Equipment[] {
  console.log('Current CWD:', process.cwd());
  const possiblePaths = [
    path.join(process.cwd(), '@@ Plan de mantenimiento by felx matris.xlsm'),
    path.join(process.cwd(), 'historial', '@@ Plan de mantenimiento by felx matris.xlsm'),
    path.join('d:', 'sntigravity', 'historial', '@@ Plan de mantenimiento by felx matris.xlsm')
  ];

  let filePath = '';
  const fs = require('fs');
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (!filePath) {
    throw new Error(`File not found in any of these locations: ${possiblePaths.join(', ')}`);
  }

  console.log('Loading Excel from:', filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = 'base de datos para historico';
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(`Sheet ${sheetName} not found`);
  }

  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  // The header seems to be at row 270 (index 269)
  // But let's look for the row that has "SERIE" in the first column
  let headerIndex = -1;
  for (let i = 0; i < data.length; i++) {
    if (data[i] && data[i][0] === "SERIE") {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    // Fallback if search fails
    headerIndex = 269;
  }

  const equipments: Equipment[] = [];

  // Data starts after the header
  for (let i = headerIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue; // Skip empty rows or rows without serial

    const equipment: Equipment = {
      serialNumber: String(row[0] || '').trim(),
      assetTag: String(row[1] || '').trim(),
      service: toTitleCase(String(row[2] || '')),
      name: String(row[3] || '').trim(),
      brand: String(row[4] || '').trim(),
      model: String(row[5] || '').trim(),
      item: String(row[6] || '').trim(),
      status: String(row[7] || '').trim(),
      history: []
    };

    // Maintenance columns
    // 2022: Indices 12 to 23
    // 2023: Indices 24 to 35
    // 2024: Indices 36 to 47
    // 2025: Indices 48 to 59

    const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

    // Process each year dynamically (ready up to 2030)
    for (let year = 2022; year <= 2030; year++) {
      const startCol = 12 + (year - 2022) * 12;
      if (startCol >= row.length) break; // Stop if there are no more columns for future years

      for (let m = 0; m < 12; m++) {
        const cellValue = row[startCol + m];
        if (cellValue && String(cellValue).trim().length > 5) {
          const rawDesc = String(cellValue);

          // Try to extract some info from the raw description
          const type = rawDesc.toUpperCase().includes('CORRECTIVO') ? 'Correctivo' : 'Preventivo';

          // Regex to extract responsible and date if present in the text
          const respMatch = rawDesc.match(/Responsable:\s*([^,]+)/i);
          const dateMatch = rawDesc.match(/fecha\s*([\d/-]+)/i);
          const durationMatch = rawDesc.match(/Horas\s*Usadas:\s*([\d.]+)/i);

          equipment.history.push({
            year,
            month: months[m],
            date: dateMatch ? dateMatch[1] : `${months[m]} ${year}`,
            type,
            description: rawDesc,
            responsible: respMatch ? respMatch[1].trim() : 'No especificado',
            duration: durationMatch ? durationMatch[1] : 'N/A',
            status: equipment.status
          });
        }
      }
    }

    equipments.push(equipment);
  }

  return equipments;
}
