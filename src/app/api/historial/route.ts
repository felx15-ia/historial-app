import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import * as xlsx from 'xlsx';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'total.xlsx');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'El archivo total.xlsx no existe' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = 'total'; // or workbook.SheetNames.find(s => s.toLowerCase().includes('total')) || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      return NextResponse.json({ error: 'La hoja "total" no existe' }, { status: 404 });
    }

    // Read data as array of arrays, forcing 'raw: false' to extract properly formatted dates (e.g. "01/02/2024") instead of Excel serials
    const rawData: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false });
    
    // Skip the first 2 rows which might be titles/headers
    const dataRows = rawData.slice(2);
    
    const formattedData = dataRows.map((row) => {
      // Helper to safely get string
      const getStr = (index: number) => row[index] ? String(row[index]).trim() : '';
      
      const otm = getStr(1);
      const serie = getStr(2);
      const denominacion = getStr(5);
      const marca = getStr(6);
      const modelo = getStr(7);
      const responsable = getStr(49);
      
      // Nuevos campos para Analytics Avanzado
      const servicio = getStr(4);
      const prioridad = getStr(10);
      const horasHombre = parseFloat(getStr(54)) || 0; // Columna 54 en número
      const mes = getStr(61);
      let anio = getStr(62);
      const dia = getStr(63); // Para detectar fines de semana
      
      // Limpieza de formato para año (a veces vienen fechas completas como 31/02/2025)
      if (anio.length > 4) {
         const match = anio.match(/\b(20\d{2})\b/);
         if (match) anio = match[1];
      }
      
      // Tipo de Mantenimiento por OTM (OP = Preventivo, OC = Correctivo, OCOMP = Complementario)
      let tipoMantenimiento = getStr(9) || getStr(8) || 'No definido';
      const otmUpper = otm.toUpperCase();
      if (otmUpper.startsWith('OCOMP')) {
        tipoMantenimiento = 'Complementario';
      } else if (otmUpper.startsWith('OC')) {
        tipoMantenimiento = 'Correctivo';
      } else if (otmUpper.startsWith('OP')) {
        tipoMantenimiento = 'Preventivo';
      }

      // Fecha a veces esta en 55, o 56, o 57. Buscamos la primera que parezca fecha
      let fecha = getStr(55) || getStr(56) || getStr(57) || '';
      
      // Para repuestos, solicitados dinámicamente: X(23), AA(26), AD(29), AG(32), AJ(35), AM(38), AP(41), AS(44)
      const repuestosIndices = [23, 26, 29, 32, 35, 38, 41, 44];
      const repCels = [];
      for (const idx of repuestosIndices) {
        const val = getStr(idx);
        if (val && val !== '---' && val !== '-' && val.toLowerCase() !== 'ninguno') {
          repCels.push(val);
        }
      }
      let repuestos = repCels.length > 0 ? repCels.join(', ') : 'Ninguno';

      return {
        otm,
        serie,
        denominacion,
        marca,
        modelo,
        repuestos,
        responsable,
        tipoMantenimiento,
        servicio,
        prioridad,
        horasHombre,
        mes,
        anio,
        dia,
        fecha,
        // Almacenamos el searchString pre-calculado para filtrar rápido (incluyendo fechas para la búsqueda)
        searchString: `${otm} ${serie} ${denominacion} ${marca} ${modelo} ${repuestos} ${responsable} ${tipoMantenimiento} ${servicio} ${fecha}`.toLowerCase()
      };
    }).filter(item => item.otm || item.serie || item.denominacion); // Filtrar filas vacías

    return NextResponse.json(formattedData);
  } catch (error: any) {
    console.error('API Error reading excel:', error);
    return NextResponse.json({ error: error.message || 'Error procesando archivo' }, { status: 500 });
  }
}
