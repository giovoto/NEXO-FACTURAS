import { XMLParser } from 'fast-xml-parser';

export type ParsedInvoice = {
  id?: string;
  issueDate?: string;
  dueDate?: string;
  supplierName?: string;
  supplierTaxId?: string;
  supplierAddress?: string;
  supplierCity?: string;
  customerName?: string;
  customerTaxId?: string;
  customerAddress?: string;
  customerCity?: string;
  currency?: string;
  paymentMeans?: string; // Crédito o Contado
  total?: number;
  subtotal?: number;
  taxes?: number;
  reteFuente?: number;
  reteIVA?: number;
  reteICA?: number;
  docType?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  customerEmail?: string;
  customerPhone?: string;
  taxLevelCode?: string;
  taxRegimen?: string;
  taxDetails?: Array<{ id: string; percent: number; amount: number; name: string }>;
  lines: Array<{ description: string; qty: number; price: number; disk: number; total: number }>;
  metadata?: { cufe?: string, number?: string; qr?: string, profileId?: string };
};

export function parseDianUBL(xml: string): ParsedInvoice {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "#text"
    // removed 'format' as it triggered a type error 
  });
  const obj = parser.parse(xml);

  // 1. Handle AttachedDocument (Container) vs Direct Invoice
  let inv = obj['Invoice'];

  if (!inv && obj['AttachedDocument']) {
    // Logic for AttachedDocument would go here. For now we look for namespaces or fallback.
  }

  // Fallback for namespaced roots commonly found in DIAN XMLs
  if (!inv) inv = obj['fe:Invoice'] || obj['Invoice'] || Object.values(obj).find((val: any) => val && val['cbc:UBLVersionID']);

  if (!inv) {
    if (obj['AttachedDocument']) {
      throw new Error("Formato AttachedDocument detectado. Por favor suba el XML de la Factura (ElectronicInvoice) contenido dentro.");
    }
    throw new Error("No se encontró una estructura de Factura válida (Invoice) en el XML.");
  }

  // Helper to safely access nested properties with or without namespaces (cbc:, cac:, or none)
  const get = (o: any, ...path: string[]): any => {
    if (!o) return undefined;
    const current = path[0];
    if (path.length === 1) {
      return o[current] ?? o[`cbc:${current}`] ?? o[`cac:${current}`];
    }
    const nextObj = o[current] ?? o[`cbc:${current}`] ?? o[`cac:${current}`];
    if (Array.isArray(nextObj)) return get(nextObj[0], ...path.slice(1)); // Take first if array
    return get(nextObj, ...path.slice(1));
  };

  // Helper to get text value
  const val = (node: any) => {
    if (node === undefined || node === null) return undefined;
    if (typeof node !== 'object') return node;
    return node['#text'] ?? node;
  };

  const supplierParty = get(inv, 'AccountingSupplierParty', 'Party');
  const customerParty = get(inv, 'AccountingCustomerParty', 'Party');
  const legalMonetaryTotal = get(inv, 'LegalMonetaryTotal');
  const taxTotal = get(inv, 'TaxTotal');

  // Lines Parsing
  const invoiceLinesRaw = inv['cac:InvoiceLine'] || inv['InvoiceLine'] || [];
  const linesArr = Array.isArray(invoiceLinesRaw) ? invoiceLinesRaw : [invoiceLinesRaw];

  const lines = linesArr.map((line: any) => {
    const qty = Number(val(get(line, 'InvoicedQuantity')) || 1);
    const price = Number(val(get(line, 'Price', 'PriceAmount')) || 0);
    const lineTotal = Number(val(get(line, 'LineExtensionAmount')) || 0);
    const description = val(get(line, 'Item', 'Description')) || val(get(line, 'Item', 'Name')) || 'N/A';

    return {
      description: String(description).trim(),
      qty,
      price,
      disk: 0,
      total: lineTotal || qty * price,
    };
  });

  // Tax Parsing
  const taxDetails: any[] = [];
  const taxesArr = Array.isArray(taxTotal) ? taxTotal : [taxTotal].filter(Boolean);

  taxesArr.forEach((taxGroup: any) => {
    const subTaxes = get(taxGroup, 'TaxSubtotal');
    const subTaxesArr = Array.isArray(subTaxes) ? subTaxes : [subTaxes].filter(Boolean);

    subTaxesArr.forEach((sub: any) => {
      const amount = Number(val(get(sub, 'TaxAmount')) || 0);
      const percent = Number(val(get(sub, 'TaxCategory', 'Percent')) || 0);
      const schemeName = val(get(sub, 'TaxCategory', 'TaxScheme', 'Name')) || 'IMPUESTO';

      taxDetails.push({
        id: val(get(sub, 'TaxCategory', 'TaxScheme', 'ID')),
        name: schemeName,
        percent,
        amount
      });
    });
  });

  const totalTaxes = taxDetails.reduce((acc, curr) => acc + curr.amount, 0);

  // --- EXTRACTION LOGIC ENHANCED FROM VBA MACRO ---

  // 1. Retention Extraction (Fuente, IVA, ICA)
  let reteFuente = 0;
  let reteIVA = 0;
  let reteICA = 0;

  // Search in taxDetails first (which was populated above)
  taxDetails.forEach(t => {
    const id = String(t.id).trim();
    const amount = t.amount;
    if (id === '06') reteFuente += amount;
    if (id === '05') reteIVA += amount;
    if (id === '07') reteICA += amount;
  });

  // Fallback: TotalesCop for specific XMLs (rare but present in VBA logic)
  if (reteFuente === 0 && reteIVA === 0 && reteICA === 0 && obj['TotalesCop']) {
    reteFuente = Number(val(get(obj['TotalesCop'], 'ReteFueCop')) || 0);
    reteIVA = Number(val(get(obj['TotalesCop'], 'ReteIvaCop')) || 0);
    reteICA = Number(val(get(obj['TotalesCop'], 'ReteIcaCop')) || 0);
  }

  // 2. Document Type Logic (ProfileID based)
  const profileID = val(get(inv, 'ProfileID')) || '';
  let docType = 'Desconocido';
  if (profileID.includes('Factura Electrónica de Venta') && !profileID.includes('Nota Crédito')) docType = 'Factura Electrónica De Venta';
  else if (profileID.includes('Nota Crédito')) docType = 'Nota de crédito electrónica';
  else if (profileID.includes('Documento Soporte')) docType = 'Documento Soporte';
  else if (profileID.includes('DIAN 2.1:')) docType = profileID.split('DIAN 2.1: ')[1]?.trim() || profileID;
  else docType = profileID;

  // Check for Nomina
  if (obj['NominaIndividual']) docType = 'Nomina Individual';


  // 3. Extended Supplier Info
  const supplierContact = get(supplierParty, 'Contact');
  const supplierEmail = val(get(supplierContact, 'ElectronicMail'));
  const supplierPhone = val(get(supplierContact, 'Telephone'));
  // Tax Info
  const supplierTaxLevel = val(get(supplierParty, 'PartyTaxScheme', 'TaxLevelCode'));
  const supplierRegimen = val(get(supplierParty, 'PartyTaxScheme', 'TaxScheme', 'ID'));

  // 4. Extended Customer Info
  const customerContact = get(customerParty, 'Contact');
  const customerEmail = val(get(customerContact, 'ElectronicMail'));
  const customerPhone = val(get(customerContact, 'Telephone'));


  return {
    id: val(get(inv, 'ID')),
    issueDate: val(get(inv, 'IssueDate')),
    dueDate: val(get(inv, 'DueDate')) || val(get(inv, 'PaymentMeans', 'PaymentDueDate')),

    supplierName: val(get(supplierParty, 'PartyTaxScheme', 'RegistrationName')) || val(get(supplierParty, 'PartyName', 'Name')) || 'Proveedor Desconocido',
    supplierTaxId: val(get(supplierParty, 'PartyTaxScheme', 'CompanyID')),
    supplierAddress: [
      val(get(supplierParty, 'PhysicalLocation', 'Address', 'CityName')),
      val(get(supplierParty, 'PhysicalLocation', 'Address', 'AddressLine', 'Line')),
      val(get(supplierParty, 'PhysicalLocation', 'Address', 'CountrySubentity')) // Region
    ].filter(Boolean).join(', '),
    supplierCity: val(get(supplierParty, 'PhysicalLocation', 'Address', 'CityName')),
    supplierEmail: supplierEmail,
    supplierPhone: supplierPhone,

    customerName: val(get(customerParty, 'PartyTaxScheme', 'RegistrationName')) || val(get(customerParty, 'PartyName', 'Name')) || 'Cliente Desconocido',
    customerTaxId: val(get(customerParty, 'PartyTaxScheme', 'CompanyID')),
    customerAddress: [
      val(get(customerParty, 'PhysicalLocation', 'Address', 'CityName')),
      val(get(customerParty, 'PhysicalLocation', 'Address', 'AddressLine', 'Line'))
    ].filter(Boolean).join(', '),
    customerEmail: customerEmail,
    customerPhone: customerPhone,

    currency: val(get(inv, 'DocumentCurrencyCode')),
    paymentMeans: val(get(inv, 'PaymentMeans', 'ID')) === '1' ? 'Contado' : 'Crédito',

    // Enhanced Metadata
    docType: docType,
    taxLevelCode: supplierTaxLevel,
    taxRegimen: supplierRegimen,

    total: Number(val(get(legalMonetaryTotal, 'PayableAmount')) || 0),
    subtotal: Number(val(get(legalMonetaryTotal, 'LineExtensionAmount')) || 0),
    taxes: totalTaxes || Number(val(get(taxTotal, 'TaxAmount')) || 0),

    // Parsed Retentions
    reteFuente,
    reteIVA,
    reteICA,

    taxDetails,
    lines,
    metadata: {
      cufe: val(get(inv, 'UUID')),
      number: val(get(inv, 'ID')),
      profileId: profileID,
    }
  };
}
