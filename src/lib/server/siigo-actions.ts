
'use server';

import 'server-only';
import { siigoFetch } from './siigo-client';
import type { ExtractInvoiceDataOutput } from '@/lib/types';

/**
 * Crea una factura de compra en Siigo.
 * Este es un ejemplo y debe ser adaptado al payload exacto que requiere
 * tu tenant de Siigo para facturas de compra o asientos contables.
 */
export async function createPurchaseInvoice(invoiceData: ExtractInvoiceDataOutput): Promise<{ id: string }> {
  console.log('[Siigo Action] Attempting to create purchase invoice in Siigo...');

  // --- MODO SIMULACIÓN ---
  if (process.env.NEXT_PUBLIC_SIMULATE_SIIGO === 'true') {
    return new Promise(resolve => {
      setTimeout(() => {
        const mockSiigoId = `siigo-sim-${Date.now()}`;
        console.log(`[SIMULADO] Factura de compra creada en Siigo para '${invoiceData.supplierName}' con ID: ${mockSiigoId}`);
        resolve({ id: mockSiigoId });
      }, 500);
    });
  }

  // --- MODO REAL ---
  const path = process.env.SIIGO_PURCHASE_INVOICE_PATH || '/v1/purchase-invoices';
  
  const siigoPayload = {
    document: { 
      // ID del tipo de documento en Siigo (ej. 24 para Factura de Compra)
      id: parseInt(process.env.DEFAULT_DOC_TYPE_ID || '24', 10) 
    },
    date: invoiceData.invoiceDate,
    customer: {
      identification: invoiceData.supplierId, // NIT del proveedor
      branch_office: 0,
    },
    // Opcional: si usas centros de costo en Siigo
    // cost_center: {
    //     id: 185 
    // },
    items: [{
      code: "001", // Código de producto/servicio genérico que debe existir en Siigo
      description: `Compra según factura ${invoiceData.invoiceNumber} a ${invoiceData.supplierName}`.slice(0, 255),
      quantity: 1,
      price: invoiceData.totalAmount - invoiceData.vatAmount, // Precio antes de impuestos
       taxes: invoiceData.vatAmount > 0 ? [
        {
          id: 24734, // ID del impuesto (ej. IVA 19%) que debes obtener de tu catálogo de Siigo
          value: invoiceData.vatAmount,
        }
      ] : []
    }],
    payments: [{
      id: 6176, // ID del método de pago (ej. 'Cuenta por Pagar'). Obtener de tu catálogo de Siigo.
      value: invoiceData.totalAmount,
      due_date: invoiceData.fechaVencimiento
    }],
    observations: `Factura procesada automáticamente desde Nexo. Categoría sugerida: ${invoiceData.categoria}`,
  };

  try {
    // La función siigoFetch ahora maneja la autenticación y reintentos
    const response = await siigoFetch<{ id: string }>(path, {
      method: 'POST',
      body: JSON.stringify(siigoPayload),
    });

    console.log(`[Siigo Action] Factura de compra creada exitosamente en Siigo con ID: ${response.id}`);
    return response;

  } catch (error: any) {
    console.error('[Siigo Action] Failed to create purchase invoice:', error.message);
    // El error que se lanza desde siigoFetch ya es detallado.
    // Simplemente lo relanzamos para que la acción que lo llamó lo pueda capturar.
    throw error;
  }
}
