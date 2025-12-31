'use server';

import 'server-only';
import { z } from 'zod';
import type { Factura, UserRole, Empresa } from '@/lib/types';
import { createPurchaseInvoice } from '@/lib/server/siigo-actions';
import { parseInvoiceZip } from '@/services/zip-service';
import { supabase } from '@/lib/supabase';
import { getSupabaseAdmin, getUserId } from '@/lib/supabase';
// Temporarily disabled Firebase imports
// import { getAuthenticatedUser, db, authAdmin } from '@/lib/firebase-admin';
import { processRecentEmails } from '@/services/gmail-service';
import { findOrCreateContactAction } from './agenda/actions';

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getCurrentUserId(): Promise<string> {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error } = await supabaseAdmin.auth.getUser();

    if (error || !user) {
        throw new Error('Usuario no autenticado');
    }

    // Get user_id from public.users using auth_id
    return await getUserId(user.id);
}

// ============================================
// FACTURAS CRUD
// ============================================

export async function getFacturasAction(empresaId: string): Promise<Factura[]> {
    try {
        const { data: facturas, error } = await supabase
            .from('facturas')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('issue_date', { ascending: false });

        if (error) {
            console.error('Error fetching facturas:', error);
            throw new Error(`Error al obtener facturas: ${error.message}`);
        }

        // Map database fields to Factura interface
        return (facturas || []).map(f => ({
            id: f.id,
            nombreEmisor: f.supplier_name || '',
            folio: f.folio || '',
            fecha: f.issue_date || '',
            fechaVencimiento: f.due_date || '',
            valorTotal: f.total || 0,
            estado: f.estado || 'pendiente',
            categoria: f.doc_type || 'General',
            siigoId: f.profile_id || '',
            // Additional fields
            supplierTaxId: f.supplier_tax_id,
            supplierAddress: f.supplier_address,
            supplierCity: f.supplier_city,
            supplierEmail: f.supplier_email,
            supplierPhone: f.supplier_phone,
            customerName: f.customer_name,
            customerTaxId: f.customer_tax_id,
            subtotal: f.subtotal,
            taxes: f.taxes,
            reteFuente: f.rete_fuente,
            reteIva: f.rete_iva,
            reteIca: f.rete_ica,
            lines: f.lines,
            cufe: f.cufe,
            qrCode: f.qr_code,
        } as Factura));
    } catch (error: any) {
        console.error(`Error al cargar facturas para la empresa ${empresaId}`, error);
        throw new Error(`Error al obtener facturas: ${error.message}`);
    }
}

async function addFacturaAction(empresaId: string, facturaData: Partial<Factura>): Promise<Factura> {
    try {
        const userId = await getCurrentUserId();

        const { data, error } = await supabase
            .from('facturas')
            .insert({
                empresa_id: empresaId,
                supplier_name: facturaData.nombreEmisor,
                folio: facturaData.folio,
                issue_date: facturaData.fecha,
                due_date: facturaData.fechaVencimiento,
                total: facturaData.valorTotal,
                estado: facturaData.estado || 'pendiente',
                doc_type: facturaData.categoria,
                profile_id: facturaData.siigoId,
                created_by: userId,
                // Additional fields
                supplier_tax_id: facturaData.supplierTaxId,
                subtotal: facturaData.subtotal,
                taxes: facturaData.taxes,
                rete_fuente: facturaData.reteFuente,
                rete_iva: facturaData.reteIva,
                rete_ica: facturaData.reteIca,
                lines: facturaData.lines,
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Error al crear factura: ${error.message}`);
        }

        return {
            id: data.id,
            nombreEmisor: data.supplier_name || '',
            folio: data.folio || '',
            fecha: data.issue_date || '',
            fechaVencimiento: data.due_date || '',
            valorTotal: data.total || 0,
            estado: data.estado || 'pendiente',
            categoria: data.doc_type || 'General',
            siigoId: data.profile_id || '',
        } as Factura;
    } catch (error: any) {
        console.error('Error adding factura:', error);
        throw error;
    }
}

export async function updateFacturaStatusAction(
    empresaId: string,
    facturaId: string,
    newStatus: string
): Promise<void> {
    try {
        const { error } = await supabase
            .from('facturas')
            .update({ estado: newStatus })
            .eq('id', facturaId)
            .eq('empresa_id', empresaId);

        if (error) {
            throw new Error(`Error al actualizar factura: ${error.message}`);
        }
    } catch (error: any) {
        console.error('Error updating factura status:', error);
        throw error;
    }
}

// ============================================
// EMAIL PROCESSING
// ============================================

export async function procesarCorreosAction(empresaId: string): Promise<{ success: boolean; message: string }> {
    try {
        const userId = await getCurrentUserId();

        // Get user's google refresh token
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('google_refresh_token')
            .eq('id', userId)
            .single();

        if (userError || !userData?.google_refresh_token) {
            return { success: false, message: 'No has conectado tu cuenta de Google. Ve a Configuración para empezar.' };
        }

        const newInvoicesData = await processRecentEmails(userData.google_refresh_token);

        if (newInvoicesData.length === 0) {
            return { success: true, message: 'No se encontraron nuevas facturas en tu correo.' };
        }

        for (const invoiceData of newInvoicesData) {
            const contact = await findOrCreateContactAction(empresaId, {
                identificacion: invoiceData.supplierId,
                proveedor: invoiceData.supplierName,
            });

            const siigoResponse = await createPurchaseInvoice({
                ...invoiceData,
                supplierId: contact.identificacion,
                supplierName: contact.proveedor,
            });

            await addFacturaAction(empresaId, {
                nombreEmisor: invoiceData.supplierName,
                folio: invoiceData.invoiceNumber,
                fecha: invoiceData.invoiceDate,
                fechaVencimiento: invoiceData.fechaVencimiento,
                valorTotal: invoiceData.totalAmount,
                estado: 'Procesado',
                categoria: invoiceData.categoria,
                siigoId: siigoResponse.id,
            });
        }

        const message = `Se procesaron ${newInvoicesData.length} nuevos comprobantes. Revisa la lista para ver los detalles.`;
        return { success: true, message };
    } catch (error: any) {
        console.error('Error in procesarCorreosAction:', error);
        if (error.message.includes('GMAIL_REFRESH_TOKEN')) {
            return { success: false, message: 'No has conectado tu cuenta de Google. Ve a Configuración para empezar.' };
        }
        return { success: false, message: `Error procesando correos: ${error.message}` };
    }
}

// ============================================
// EXPORT
// ============================================

export async function exportarFacturasAction(empresaId: string): Promise<{ url: string }> {
    try {
        const facturas = await getFacturasAction(empresaId);

        if (facturas.length === 0) {
            return { url: '' };
        }

        const headers = Object.keys(facturas[0] || {}).join(',');
        const rows = facturas.map(factura => Object.values(factura).join(',')).join('\n');
        const csvContent = `${headers}\n${rows}`;
        const url = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);

        return { url };
    } catch (error: any) {
        console.error('Error exporting facturas:', error);
        throw error;
    }
}

// ============================================
// ZIP PROCESSING
// ============================================

export async function actionImportZip(formData: FormData) {
    const empresaId = formData.get('empresaId') as string;
    const file = formData.get('file') as File;

    if (!empresaId || !file) {
        return { success: false, error: 'Faltan datos requeridos (empresa, archivo).' };
    }

    try {
        const buf = await file.arrayBuffer();
        const parsedItems = await parseInvoiceZip(buf);
        const xmlItem = parsedItems.find((item): item is { type: 'xml'; name: string; parsed: any } => item.type === 'xml');

        if (!xmlItem) {
            throw new Error('No se encontró un archivo XML válido en el ZIP.');
        }

        const inv = xmlItem.parsed;

        const contact = await findOrCreateContactAction(empresaId, {
            identificacion: inv.supplierTaxId || 'N/A',
            proveedor: inv.supplierName || 'N/A',
        });

        const invoiceDataForSiigo = {
            invoiceNumber: inv.metadata?.number || inv.id || 'N/A',
            invoiceDate: inv.issueDate || new Date().toISOString().split('T')[0],
            supplierName: contact.proveedor,
            supplierId: contact.identificacion,
            totalAmount: inv.total || 0,
            vatAmount: inv.taxes || 0,
            categoria: 'Importado',
            fechaVencimiento: inv.issueDate || new Date().toISOString().split('T')[0],
        };

        const siigoResponse = await createPurchaseInvoice(invoiceDataForSiigo);

        await addFacturaAction(empresaId, {
            nombreEmisor: invoiceDataForSiigo.supplierName,
            folio: invoiceDataForSiigo.invoiceNumber,
            fecha: invoiceDataForSiigo.invoiceDate,
            fechaVencimiento: invoiceDataForSiigo.fechaVencimiento,
            valorTotal: invoiceDataForSiigo.totalAmount,
            estado: 'Procesado',
            categoria: invoiceDataForSiigo.categoria,
            siigoId: siigoResponse.id,
        });

        return {
            success: true,
            imported: 1,
            invoice: inv,
            siigoId: siigoResponse.id,
        };
    } catch (error) {
        console.error('Error in actionImportZip:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error procesando el archivo ZIP.';
        return { success: false, error: errorMessage };
    }
}

// ============================================
// USER & EMPRESA MANAGEMENT
// ============================================

export async function createEmpresaAction(nombre: string, nit: string): Promise<{ id: string }> {
    try {
        const userId = await getCurrentUserId();

        // Create empresa
        const { data: empresaData, error: empresaError } = await supabase
            .from('empresas')
            .insert({
                nombre,
                nit: nit || 'N/A',
            })
            .select()
            .single();

        if (empresaError) {
            throw new Error(`Error al crear empresa: ${empresaError.message}`);
        }

        // Assign user as admin
        const { error: userEmpresaError } = await supabase
            .from('user_empresas')
            .insert({
                user_id: userId,
                empresa_id: empresaData.id,
                role: 'admin',
            });

        if (userEmpresaError) {
            throw new Error(`Error al asignar usuario a empresa: ${userEmpresaError.message}`);
        }

        return { id: empresaData.id };
    } catch (error: any) {
        console.error('Error creating empresa:', error);
        throw error;
    }
}

// ============================================
// DIAN INTEGRATION
// ============================================

export async function getDianDocumentsAction(empresaId: string, dianTokenUrl: string) {
    try {
        console.log('Iniciando sincronización DIAN para empresa:', empresaId);

        const { scrapeDianDocuments } = await import('@/services/dian-scraper');
        const result = await scrapeDianDocuments(dianTokenUrl);

        return result;
    } catch (error: any) {
        console.error('Error en getDianDocumentsAction:', error);
        return { success: false, message: error.message, documents: [] };
    }
}

export async function saveDianCredentialsAction(token: string, softwareId: string) {
    // TODO: Implement saving to empresa config in Supabase
    console.log('Saving DIAN credentials:', { token: token.substring(0, 5) + '...', softwareId });
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
}
