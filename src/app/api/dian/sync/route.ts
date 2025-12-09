import { NextRequest, NextResponse } from 'next/server';
import { scrapeDianDocuments } from '@/services/dian-scraper';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { dianTokenUrl, empresaId } = body;

        if (!dianTokenUrl || !empresaId) {
            return NextResponse.json(
                { success: false, message: 'Token URL y empresa ID son requeridos' },
                { status: 400 }
            );
        }

        console.log('API Route: Iniciando sincronización DIAN para empresa:', empresaId);

        // Call the scraper
        const result = await scrapeDianDocuments(dianTokenUrl);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error en API Route DIAN sync:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Error interno del servidor', documents: [] },
            { status: 500 }
        );
    }
}
