
import type { DatoContable } from '@/app/configuracion/actions';
export type RiskLevel = 'I' | 'II' | 'III' | 'IV' | 'V';

// ======= Parámetros (se sobreescriben desde la UI) =======
export const RATES = {
  smlmv: 1430000,
  auxTransporte: 178000,
  ssEmpleado: { salud: 0.04, pension: 0.04 },
  ssEmpleador: {
    salud: 0.085,     // si NO exonerado
    pension: 0.12
  },
  arl: { I: 0.00522, II: 0.01044, III: 0.02436, IV: 0.0435, V: 0.06960 },
  parafiscales: { sena: 0.02, icbf: 0.03, cajas: 0.04 }, // 9% total (si aplica)
  prestaciones: {
    cesantiasSobre: 'salario+aux',        // base cesantías
    cesantias: 1 / 12,                    // 8.33%
    interesesCesantias: 0.12,             // 12% anual
    prima: 1 / 12,                        // 8.33%
    vacaciones: 0.0417,                   // 4.17% (15/360)
  },
  horas: {
    baseMensualHoras: 220, // Se usan 220 para cálculo de hora ordinaria
    extraDiurnaFactor: 1.25,
    extraNocturnaFactor: 1.75,
    dominicalFestivoFactor: 1.75,
    recargoNocturnoFactor: 0.35,
    extraDiurnaDomFestFactor: 2.0, // 1 (base) + 0.75 (dom) + 0.25 (extra) = 2.0
    extraNocturnaDomFestFactor: 2.5, // 1 (base) + 0.75 (dom) + 0.75 (extra noct) = 2.5
  },
  exoneracion: {
    aplicaParafiscales: (exonerado: boolean) => !exonerado,
    aplicaSaludEmpleador: (exonerado: boolean) => !exonerado
  }
};
// ===========================================================


// Helper para formateo
export const money = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);
