
import { z } from 'zod';

// User Roles
export type UserRole = 'superadmin' | 'admin' | 'user';
export type EmpresaRole = 'admin' | 'editor' | 'viewer';


// Schema for Company (Tenant)
export const EmpresaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  nit: z.string().optional(),
  usuarios: z.record(z.string(), z.enum(['admin', 'editor', 'viewer'])), // Map of UID to role
});
export type Empresa = z.infer<typeof EmpresaSchema>;

// Schema for Contacts in the Agenda
export const ContactoSchema = z.object({
  id: z.string(),
  proveedor: z.string(),
  identificacion: z.string(),
  email: z.string().nullable().optional(),
  telefono: z.string().nullable().optional(),
});
export type Contacto = z.infer<typeof ContactoSchema>;

// Tipos para el procesamiento de facturas individuales
export const ExtractInvoiceDataOutputSchema = z.object({
  invoiceNumber: z.string().describe('The invoice number.'),
  invoiceDate: z.string().describe('The date of the invoice in ISO format (YYYY-MM-DD).'),
  supplierName: z.string().describe('The name of the supplier.'),
  supplierId: z.string().describe("The supplier's identification number (NIT)."),
  totalAmount: z.number().describe('The total amount of the invoice.'),
  vatAmount: z.number().describe('The VAT amount of the invoice.'),
  xmlContent: z.string().optional().describe('The extracted XML content of the invoice, if available.'),
  categoria: z.string().describe('The suggested expense category for the invoice based on the supplier or content. Examples: Servicios Públicos, Transporte, Suminstros de Oficina, Arrendamientos, Honorarios.'),
  fechaVencimiento: z.string().describe('The calculated due date of the invoice in ISO format (YYYY-MM-DD).'),
});
export type ExtractInvoiceDataOutput = z.infer<typeof ExtractInvoiceDataOutputSchema>;


// Tipos para el asistente de IA que consulta múltiples facturas
const FacturaSchema = z.object({
  id: z.string(),
  nombreEmisor: z.string(),
  folio: z.string(),
  fecha: z.string(), // ISO String date
  fechaVencimiento: z.string().optional(), // ISO String date
  valorTotal: z.number(),
  estado: z.string(),
  categoria: z.string().optional(),
  siigoId: z.string().optional(),
});
export type Factura = z.infer<typeof FacturaSchema>;

// Tipos de datos normalizados para facturas
export type TaxItem = { taxId: string; amount: number };

export type NormalizedInvoice = {
  cufe: string;
  invoiceNumber: string;
  issueDate: string; // YYYY-MM-DD
  supplier: { nit: string; name: string };
  buyer: { nit: string; name: string };
  totals: { subtotal: number; taxes: number; grandTotal: number };
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    base: number;
    taxes?: TaxItem[];
    glAccount?: string;
  }>;
  raw?: { xml?: string };
};

// Inventory Types
export type Bodega = {
  id: string;
  nombre: string;
  ubicacion: string;
};

export type Producto = {
  id: string;
  warehouseId: string;
  producto: string;
  sku: string | null;
  cantidad: number;
  customFields?: Record<string, any>;
};

export type Salida = {
  id: string;
  productId: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  destinatario: string;
  date: string; // ISO String
  userId: string;
};

// Reconciliation Types
export type MovimientoBanco = {
  fecha: string;         // ISO yyyy-mm-dd
  descripcion: string;   // Descripción completa (incluye canal/referencias si las hubiera)
  importe: number;       // >0 abono (crédito), <0 débito
  banco: 'Bancolombia';
  fuente: 'pdf';
};

export type AsientoSiigo = {
  fecha: string;         // ISO yyyy-mm-dd
  descripcion: string;
  debito: number;
  credito: number;
  tercero?: string;
  cuenta?: string;
  numeroDoc?: string;
  fuente: 'siigo';
};


// Deprecated Invoice type - to be removed
export type Invoice = ExtractInvoiceDataOutput;
