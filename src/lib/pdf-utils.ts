
import { parse, format } from 'date-fns';

export const toISO = (s: string, pattern='yyyy/MM/dd') => {
  try { return format(parse(s.trim(), pattern, new Date()), 'yyyy-MM-dd'); }
  catch { return s.replace(/\//g, '-'); }
};

export const money = (s: string) => {
  // Maneja “35,997,363.00” o “-1,387.00”
  if (typeof s !== 'string') return 0;
  const clean = s.replace(/[^\d\-,.]/g, '');
  const normalized = clean
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')  // quita puntos de miles
    .replace(/,(?=\d{3}(?:\D|$))/g, '')   // quita comas de miles
    .replace(/,/g, '.');                  // coma decimal → punto
  const value = Number(normalized);
  return isNaN(value) ? 0 : value;
};

// Heurística: último bloque numérico largo en la descripción
export const guessCodigoOperacion = (desc: string) => {
  const m = desc.match(/(\d{6,})\b(?!.*\d)/);
  return m ? m[1] : '';
};
