import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function exportToPDF(equipment: any) {
    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text('REPORTE DE HISTORIAL BIOMÉDICO', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generado el: ${new Date().toLocaleDateString()}`, pageWidth / 2, 27, { align: 'center' });

    // Equipment Info Box
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 35, pageWidth - 28, 50, 'F');

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL EQUIPO', 20, 45);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`EQUIPO: ${equipment.name}`, 20, 52);
    doc.text(`MARCA/MODELO: ${equipment.brand} - ${equipment.model}`, 20, 58);
    doc.text(`SERIE: ${equipment.serialNumber}`, 20, 64);
    doc.text(`PLACA/TAG: ${equipment.assetTag}`, 20, 70);

    doc.text(`SERVICIO: ${equipment.service.toUpperCase()}`, 120, 52);
    doc.text(`ESTADO: ${equipment.status.toUpperCase()}`, 120, 58);
    doc.text(`ITEM: ${equipment.item}`, 120, 64);

    // Table
    const tableData = equipment.history.map((h: any) => [
        `${h.month} ${h.year}`,
        h.type,
        h.description,
        h.responsible,
        h.duration
    ]);

    doc.autoTable({
        startY: 90,
        head: [['PERIODO', 'TIPO', 'DESCRIPCIÓN DEL TRABAJO', 'RESPONSABLE', 'DURACIÓN']],
        body: tableData,
        headStyles: { fillColor: [37, 99, 235], fontSize: 10, halign: 'center' },
        styles: { fontSize: 8, cellPadding: 4 },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 20 },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 30 },
            4: { cellWidth: 20 }
        }
    });

    doc.save(`Historial_${equipment.serialNumber}.pdf`);
}

import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export async function exportToExcel(equipment: any) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historial de Mantenimiento', {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
        views: [{ showGridLines: false }] // Hide default gridlines for cleaner look
    });

    // 1. Report Header
    worksheet.mergeCells('A1:H2');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'REPORTE DE HISTORIAL BIOMÉDICO';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }; // Blue-800
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Set Base Column Widths
    worksheet.columns = [
        { width: 18 }, // A: Label / Período
        { width: 20 }, // B: Value / Fecha
        { width: 18 }, // C: Label / Tipo
        { width: 25 }, // D: Value / Desc
        { width: 18 }, // E: Label / Desc
        { width: 20 }, // F: Value / Desc
        { width: 15 }, // G: Label / Responsable
        { width: 15 }  // H: Value / Duración
    ];

    const generateBorder = (): Partial<ExcelJS.Borders> => ({
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    });

    // 2. Equipment Summary Section
    worksheet.mergeCells('A4:H4');
    const eqTitleCell = worksheet.getCell('A4');
    eqTitleCell.value = 'DETALLES DEL ACTIVO FIJO';
    eqTitleCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1E40AF' } };
    eqTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Slate-100
    eqTitleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    eqTitleCell.border = generateBorder();

    // Row 5: Name and Service
    worksheet.getCell('A5').value = 'EQUIPO:';
    worksheet.getCell('B5').value = equipment.name;
    worksheet.mergeCells('B5:D5');
    worksheet.getCell('E5').value = 'SERVICIO / ÁREA:';
    worksheet.getCell('F5').value = equipment.service;
    worksheet.mergeCells('F5:H5');

    // Row 6: Brand, Model, Serial
    worksheet.getCell('A6').value = 'MARCA:';
    worksheet.getCell('B6').value = equipment.brand;
    worksheet.getCell('C6').value = 'MODELO:';
    worksheet.getCell('D6').value = equipment.model;
    worksheet.getCell('E6').value = 'N° SERIE:';
    worksheet.getCell('F6').value = equipment.serialNumber;
    worksheet.getCell('G6').value = 'ESTADO:';
    worksheet.getCell('H6').value = equipment.status;

    // Row 7: Tags & Items
    worksheet.getCell('A7').value = 'PLACA / TAG:';
    worksheet.getCell('B7').value = equipment.assetTag || 'N/A';
    worksheet.getCell('C7').value = 'ITEM NO:';
    worksheet.getCell('D7').value = equipment.item || 'N/A';
    worksheet.mergeCells('E7:H7');

    const equipmentFields = ['A5', 'E5', 'A6', 'C6', 'E6', 'G6', 'A7', 'C7'];
    equipmentFields.forEach(cellAddress => {
        const cell = worksheet.getCell(cellAddress);
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF64748B' } }; // Slate-500
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    });

    const equipmentValues = ['B5', 'F5', 'B6', 'D6', 'F6', 'H6', 'B7', 'D7'];
    equipmentValues.forEach(cellAddress => {
        const cell = worksheet.getCell(cellAddress);
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } }; // Slate-900
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    });

    // Color code Status
    const statusCell = worksheet.getCell('H6');
    if (equipment.status.toLowerCase().includes('op')) {
        statusCell.font = { ...statusCell.font, color: { argb: 'FF059669' } }; // Emerald-600
    } else {
        statusCell.font = { ...statusCell.font, color: { argb: 'FFE11D48' } }; // Rose-600
    }

    for (let r = 5; r <= 7; r++) {
        for (let c = 1; c <= 8; c++) {
            worksheet.getCell(r, c).border = generateBorder();
            if (c % 2 !== 0 && c <= 7 && r <= 7) {
                worksheet.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            }
        }
    }

    // 3. Maintenance History Section
    worksheet.mergeCells('A9:H9');
    const histTitleCell = worksheet.getCell('A9');
    histTitleCell.value = 'TRAZABILIDAD DE INTERVENCIONES TÉCNICAS';
    histTitleCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    histTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } }; // Blue-500
    histTitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    histTitleCell.border = generateBorder();

    // Table Headers
    const headerRow = worksheet.getRow(10);
    headerRow.values = ['PERÍODO', 'FECHA', 'TIPO TRABAJO', 'DESCRIPCIÓN DE LA ACTIVIDAD', '', '', 'TÉCNICO', 'HORAS'];
    worksheet.mergeCells('D10:F10');

    headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF334155' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } }; // Slate-200
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = generateBorder();
    });

    // Fill History Records
    let currentRow = 11;
    if (!equipment.history || equipment.history.length === 0) {
        worksheet.mergeCells(`A${currentRow}:H${currentRow}`);
        const emptyCell = worksheet.getCell(`A${currentRow}`);
        emptyCell.value = 'No se encontraron registros de mantenimiento para este equipo.';
        emptyCell.alignment = { vertical: 'middle', horizontal: 'center' };
        emptyCell.font = { italic: true, color: { argb: 'FF94A3B8' } };
    } else {
        equipment.history.forEach((h: any) => {
            const row = worksheet.getRow(currentRow);
            row.values = [
                `${h.month} ${h.year}`.toUpperCase(),
                h.date,
                h.type.toUpperCase(),
                h.description,
                '',
                '',
                h.responsible.toUpperCase(),
                Number(h.duration) || h.duration
            ];

            worksheet.mergeCells(`D${currentRow}:F${currentRow}`);

            row.eachCell((cell, colNumber) => {
                let align: 'left' | 'center' | 'right' = 'center';
                if (colNumber === 4) align = 'left'; // Description aligned left

                cell.alignment = { vertical: 'middle', horizontal: align, wrapText: colNumber === 4 };
                cell.font = { name: 'Arial', size: 9 };
                cell.border = generateBorder();
            });

            row.getCell(1).font = { ...row.getCell(1).font, bold: true, color: { argb: 'FF475569' } };

            // Format work type colors
            const typeCell = row.getCell(3);
            typeCell.font = { ...typeCell.font, bold: true };
            if (h.type.toLowerCase() === 'preventivo') {
                typeCell.font.color = { argb: 'FF059669' };
                typeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
            } else if (h.type.toLowerCase() === 'correctivo') {
                typeCell.font.color = { argb: 'FFE11D48' };
                typeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF1F2' } };
            }

            row.height = 30; // Better readability for description
            currentRow++;
        });
    }

    // Process and Download PDF
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Historial_${equipment.serialNumber}.xlsx`);
}
