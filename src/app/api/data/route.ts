import { NextResponse } from 'next/server';
import { parseExcelData } from '@/lib/excel-parser';

export async function GET() {
    try {
        const data = parseExcelData();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching data:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
