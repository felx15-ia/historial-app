const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const possiblePaths = [
    path.join(process.cwd(), '@@ Plan de mantenimiento by felx matris.xlsm'),
    path.join(process.cwd(), 'historial', '@@ Plan de mantenimiento by felx matris.xlsm'),
    'd:/sntigravity/historial/@@ Plan de mantenimiento by felx matris.xlsm'
];

let filePath = '';
for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        filePath = p;
        break;
    }
}

if (!filePath) {
    console.log('File not found');
    process.exit(1);
}

const fileBuffer = fs.readFileSync(filePath);
const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
const sheetName = 'base de datos para historico';
const worksheet = workbook.Sheets[sheetName];

const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
let headerIndex = -1;
for (let i = 0; i < data.length; i++) {
    if (data[i] && data[i][0] === "SERIE") {
        headerIndex = i;
        break;
    }
}

const statuses = new Set();
const services = new Set();
const statusServiceMap = [];

for (let i = headerIndex + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;
    const status = String(row[7] || '').trim();
    const service = String(row[2] || '').trim();
    statuses.add(status);
    services.add(service);
    if (status.toLowerCase().includes('baja') || service === '0' || service === '') {
        statusServiceMap.push({ status, service, type: 'BAJA' });
    } else if (status.toLowerCase().includes('inop')) {
        statusServiceMap.push({ status, service, type: 'INOPERATIVO' });
    } else {
        statusServiceMap.push({ status, service, type: 'OTRO' });
    }
}

console.log('--- TODOS LOS ESTADOS ---');
console.log(Array.from(statuses));

console.log('\n--- CONTEO POR TIPO ---');
const counts = statusServiceMap.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
}, {});
console.log(counts);

console.log('\n--- EJEMPLOS DE OTRO ---');
console.log(statusServiceMap.filter(x => x.type === 'OTRO').slice(0, 5));
