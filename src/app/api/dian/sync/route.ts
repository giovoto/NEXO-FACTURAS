import { NextRequest, NextResponse } from 'next/server';
import { scrapeDianDocuments } from '@/services/dian-scraper';

/**
 * Endpoint to trigger DIAN synchronization
 * TEMPORARILY DISABLED - Awaiting Supabase migration
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { empresaId, dianTokenUrl } = body;

        if (!empresaId || !dianTokenUrl) {
            return NextResponse.json(
                { success: false, message: 'Empresa ID and token URL are required' },
                { status: 400 }
            );
        }

        console.log(`🚀 API: Iniciando sync para empresa: ${empresaId}`);

        // Call the scraper
        const result = await scrapeDianDocuments(dianTokenUrl);

        if (!result.success || !result.documents || result.documents.length === 0) {
            return NextResponse.json(result);
        }

        // TODO: Save to Supabase instead of Firestore
        // For now, just return the scraped data
        return NextResponse.json({
            success: true,
            message: `Sincronización completa. ${result.documents.length} documentos obtenidos.`,
            documents: result.documents,
            note: 'Storage not implemented - awaiting Supabase migration'
        });

    } catch (error: any) {
        console.error('❌ Error en API Route DIAN sync:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
