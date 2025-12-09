
import { differenceInDays } from 'date-fns';
import { compareTwoStrings } from 'string-similarity';
import type { MovimientoBanco, AsientoSiigo } from '@/lib/types';

interface ReconcileOptions {
  dateWindowDays?: number;
  similarityThreshold?: number;
}

const defaultOptions: ReconcileOptions = {
  dateWindowDays: 3,
  similarityThreshold: 0.85,
};

export function reconcile(
  movimientos: MovimientoBanco[],
  asientos: AsientoSiigo[],
  options: ReconcileOptions = {}
) {
  const opts = { ...defaultOptions, ...options };
  const matchedMovimientos = new Set<number>();
  const matchedAsientos = new Set<number>();

  // Helper to get asiento amount
  const getAsientoAmount = (asiento: AsientoSiigo) => asiento.credito > 0 ? asiento.credito : -asiento.debito;

  // 1. Exact match: Same date, same amount
  for (let i = 0; i < movimientos.length; i++) {
    for (let j = 0; j < asientos.length; j++) {
      if (matchedMovimientos.has(i) || matchedAsientos.has(j)) continue;

      if (
        movimientos[i].fecha === asientos[j].fecha &&
        Math.abs(movimientos[i].importe - getAsientoAmount(asientos[j])) < 0.01 // float comparison
      ) {
        matchedMovimientos.add(i);
        matchedAsientos.add(j);
        break; // Move to next movimiento
      }
    }
  }

  // 2. Window match: Same amount, date within window
  for (let i = 0; i < movimientos.length; i++) {
    for (let j = 0; j < asientos.length; j++) {
      if (matchedMovimientos.has(i) || matchedAsientos.has(j)) continue;

      const dateDiff = Math.abs(differenceInDays(new Date(movimientos[i].fecha), new Date(asientos[j].fecha)));
      if (
        Math.abs(movimientos[i].importe - getAsientoAmount(asientos[j])) < 0.01 &&
        dateDiff <= opts.dateWindowDays!
      ) {
        matchedMovimientos.add(i);
        matchedAsientos.add(j);
        break;
      }
    }
  }
  
  // 3. Similarity match: Same amount, similar description
   for (let i = 0; i < movimientos.length; i++) {
    for (let j = 0; j < asientos.length; j++) {
      if (matchedMovimientos.has(i) || matchedAsientos.has(j)) continue;
      
      const similarity = compareTwoStrings(movimientos[i].descripcion.toLowerCase(), asientos[j].descripcion.toLowerCase());
      if (
        Math.abs(movimientos[i].importe - getAsientoAmount(asientos[j])) < 0.01 &&
        similarity >= opts.similarityThreshold!
      ) {
         matchedMovimientos.add(i);
         matchedAsientos.add(j);
         break;
      }
    }
  }

  // Prepare results
  const unmatchedMovimientos = movimientos.filter((_, i) => !matchedMovimientos.has(i));
  const unmatchedAsientos = asientos.filter((_, i) => !matchedAsientos.has(i));

  const matchedTotal = Array.from(matchedMovimientos).reduce((sum, i) => sum + Math.abs(movimientos[i].importe), 0);
  const totalMovimientos = movimientos.reduce((s, m) => s + Math.abs(m.importe), 0);
  const totalAsientos = asientos.reduce((s, a) => s + (a.debito > 0 ? a.debito : a.credito), 0);

  return {
    summary: {
      movimientos: { count: movimientos.length, total: totalMovimientos },
      asientos: { count: asientos.length, total: totalAsientos },
      matched: { count: matchedMovimientos.size, total: matchedTotal },
    },
    unmatchedMovimientos,
    unmatchedAsientos,
  };
}
