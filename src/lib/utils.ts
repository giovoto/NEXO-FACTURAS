
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parse, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseColMoneyToNumber(s: string): number {
  // Formato típico: -1,234,567.89  ó  35,997,363.00
  if (typeof s !== 'string') return 0;
  const clean = s.replace(/[^\d\-,.]/g, ''); // deja dígitos, coma, punto y signo
  // El patrón real del PDF usa coma como separador de miles y punto como decimal
  // Removemos comas de miles y convertimos a número
  const normalized = clean.replace(/,/g, '');
  const value = Number(normalized);
  return isNaN(value) ? 0 : value;
}

export function yyyymmddFromYYYY_MM_DDslash(fecha: string): string {
  // Recibe "2025/08/21" y devuelve "2025-08-21"
  try {
    const d = parse(fecha, 'yyyy/MM/dd', new Date());
    return format(d, 'yyyy-MM-dd');
  } catch {
    return fecha.replace(/\//g, '-');
  }
}
