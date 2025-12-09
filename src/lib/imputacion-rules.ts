
export type ReglaImputacion = {
  test: RegExp;
  imputacion: string;        // etiqueta/categoría
  cuenta?: string;           // opcional: cuenta contable
};

export const REGLAS_IMPUTACION: ReglaImputacion[] = [
  { test: /IMPTO\s+GOBIERNO\s+4X1000/i, imputacion: 'Impuesto 4x1000', cuenta: '530535' },
  { test: /APORTES?\s+EN\s+LINEA/i,      imputacion: 'Seguridad social', cuenta: '2370xx' },
  { test: /PAGO\s+A\s+NOMIN|NOMINA/i,   imputacion: 'Nómina', cuenta: '5105xx' },
  { test: /ORGANIZACION\s+TERPEL|GASOLINA|COMBUSTIBLE/i, imputacion: 'Combustible', cuenta: '5120xx' },
  { test: /CELSIA|ENERG|SERVICIOS\s+GENERALES/i, imputacion: 'Servicios públicos', cuenta: '5135xx' },
  { test: /CUOTA\s+MANEJO|SOBREGIRO|COMISION/i, imputacion: 'Gastos bancarios', cuenta: '5195xx' },
  { test: /INTERBANC|TRANSFERENCIA/i, imputacion: 'Transferencias', cuenta: '1105↔1110' },
  { test: /PAGO\s+DE\s+PROV|A\s+PROV(?!E)/i, imputacion: 'Pago a proveedores', cuenta: '2205↔2335' },
  // fallback
  { test: /.*/, imputacion: 'Por clasificar' }
];
