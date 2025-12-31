import { NextRequest, NextResponse } from 'next/server';
import { scrapeDianDocuments } from '@/services/dian-scraper';
import { DianEmailService } from '@/services/email-service';
import { FirestoreInvoiceService } from '@/services/firestore-service';

/**
 * Endpoint to trigger DIAN synchronization
 * supports both manual token provided in body OR automated email extraction
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { empresaId, emailConfig } = body;
        let { dianTokenUrl } = body;

        if (!empresaId) {
            return NextResponse.json(
                { success: false, message: 'Empresa ID es requerido' },
                { status: 400 }
            );
        }

        console.log(`🚀 API: Iniciando sync para empresa: ${empresaId}`);

        // 1. If no token provided, try to get it from email
        if (!dianTokenUrl && emailConfig) {
            console.log('📧 No token provided, attempting to fetch from email...');
            const emailService = new DianEmailService({
                host: emailConfig.host || 'imap.gmail.com',
                port: emailConfig.port || 993,
                user: emailConfig.user,
                pass: emailConfig.pass
            });

            dianTokenUrl = await emailService.getLatestDianToken();

            if (!dianTokenUrl) {
                return NextResponse.json({
                    success: false,
                    message: 'No se encontró token de la DIAN en el correo configurado.'
                });
            }
        }

        if (!dianTokenUrl) {
            return NextResponse.json(
                { success: false, message: 'Token URL es requerido o configuración de correo válida' },
                { status: 400 }
            );
        }

        // 2. Call the scraper (Automated or Manual Upload based on implementation)
        const result = await scrapeDianDocuments(dianTokenUrl);

        if (!result.success || !result.documents || result.documents.length === 0) {
            return NextResponse.json(result);
        }

        // 3. Save to Firestore
        console.log(`💾 Saving ${result.documents.length} documents to Firestore...`);
        const firestoreService = new FirestoreInvoiceService();
        const saveResult = await firestoreService.saveInvoicesBatch(result.documents, empresaId);

        // 4. Log the attempt
        await firestoreService.logSyncAttempt(
            empresaId,
            'success',
            `Sincronización exitosa. ${saveResult.saved} facturas guardadas.`,
            result.documents.length
        );

        return NextResponse.json({
            success: true,
            message: `Sincronización completa. ${saveResult.saved} facturas nuevas guardadas.`,
            documents: result.documents,
            savedCount: saveResult.saved
        });

    } catch (error: any) {
        console.error('❌ Error en API Route DIAN sync:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
