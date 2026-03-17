import { parseExcelData } from './src/lib/excel-parser';

try {
    const data = parseExcelData();
    const statuses = new Set(data.map(e => e.status));
    const services = new Set(data.map(e => e.service));

    console.log('--- ESTADOS ENCONTRADOS ---');
    console.log(Array.from(statuses));

    console.log('\n--- CONTEO POR ESTADO ---');
    const counts: Record<string, number> = {};
    data.forEach(e => {
        counts[e.status] = (counts[e.status] || 0) + 1;
    });
    console.log(counts);

    console.log('\n--- EQUIPOS SIN SERVICIO O CON "0" ---');
    const suspicious = data.filter(e => !e.service || e.service === '0');
    console.log(`Total sospechosos: ${suspicious.length}`);
    if (suspicious.length > 0) {
        console.log('Ejemplo status de sospechosos:', Array.from(new Set(suspicious.map(e => e.status))));
    }

} catch (e) {
    console.error(e);
}
