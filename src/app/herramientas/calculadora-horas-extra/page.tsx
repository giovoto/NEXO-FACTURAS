
"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

// =====================
// Componentes UI de ShadCN (integrados para consistencia)
// =====================
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/auth-provider";
import { getParamsAction } from "@/app/configuracion/actions";
import type { DatoContable } from "@/app/configuracion/actions";
import { RATES as defaultRates } from "@/lib/salary";


// =====================
// Utilidades
// =====================
const money = (n: number) =>
  (n || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const parseMoney = (str: string | number) => {
  if (typeof str === "number") return str;
  const v = Number(String(str).replace(/[^\d]/g, ""));
  return isNaN(v) ? 0 : v;
};

// =====================
// Tipos y constantes
// =====================

type Exo = "auto" | "si" | "no";

interface State {
  tipoSalario: "ordinario" | "integral";
  salario: number;
  pagoSalarial: number;
  pagoNoSalarial: number;
  horas: Record<string, number>;
  riesgo: number; // porcentaje en decimal (0.00522 = 0.522%)
  exoneracion: Exo;
}

const ITEMS_CONFIG = [
  { key: "horaExtraDiurna", label: "Hora extra diurna" },
  { key: "horaExtraNocturna", label: "Hora extra nocturna" },
  { key: "recargoNocturno", label: "Recargo nocturno" },
  { key: "horaExtraDiurnaDomFest", label: "Hora extra diurna dominical/festiva" },
  { key: "horaExtraNocturnaDomFest", label: "Hora extra nocturna dominical/festiva" },
  { key: "recargoDomFest", label: "Recargo dominical/festivo" },
];

function CurrencyInput({ id, label, value, onChange, hint }: { id?: string; label?: string; hint?: string; value: number; onChange: (n: number) => void }) {
  const [text, setText] = useState(money(value));
  useEffect(() => setText(money(value)), [value]);

  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input
        id={id}
        value={text}
        inputMode="numeric"
        onChange={(e) => {
          const t = e.target.value;
          setText(t);
          onChange(parseMoney(t));
        }}
        onBlur={() => setText(money(parseMoney(text)))}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}


export default function CalculadoraNominaPage() {
  const { user } = useAuth();
  const [isLoadingParams, setIsLoadingParams] = useState(true);
  const [calcParams, setCalcParams] = useState({
      smlmv: defaultRates.smlmv,
      auxTransporte: defaultRates.auxTransporte,
      horas: defaultRates.horas,
  });

  const [state, setState] = useState<State>({
    tipoSalario: "ordinario",
    salario: defaultRates.smlmv,
    pagoSalarial: 0,
    pagoNoSalarial: 0,
    horas: Object.fromEntries(ITEMS_CONFIG.map((i) => [i.key, 0])),
    riesgo: 0.00522,
    exoneracion: "auto",
  });
  
  // Load parameters from backend
  const loadParams = useCallback(async () => {
    if (!user) {
        setIsLoadingParams(false);
        setState(s => ({ ...s, salario: defaultRates.smlmv }));
        return;
    };
    setIsLoadingParams(true);
    try {
        const idToken = await user.getIdToken();
        const params: DatoContable[] = await getParamsAction(idToken, []);
        
        const getNumericParam = (id: string, defaultValue: number) => {
            const p = params.find(param => param.id === id);
            const value = p ? parseFloat(p.descripcion) : defaultValue;
            return isNaN(value) ? defaultValue : value;
        }

        const newSmlmv = getNumericParam('smlmv', defaultRates.smlmv);
        
        setCalcParams({
            smlmv: newSmlmv,
            auxTransporte: getNumericParam('aux_transporte', defaultRates.auxTransporte),
            horas: {
                ...defaultRates.horas,
                extraDiurnaFactor: getNumericParam('recargo_diurna', defaultRates.horas.extraDiurnaFactor),
                extraNocturnaFactor: getNumericParam('recargo_nocturna', defaultRates.horas.extraNocturnaFactor),
                dominicalFestivoFactor: getNumericParam('recargo_dominical', defaultRates.horas.dominicalFestivoFactor),
            },
        });

        // Set initial salary to the fetched smlmv only if it's the default
        setState(s => ({ ...s, salario: s.salario === defaultRates.smlmv ? newSmlmv : s.salario }));

    } catch(e) {
        console.error("Failed to load calculation params", e);
        // Fallback to defaults
        setState(s => ({ ...s, salario: defaultRates.smlmv }));
    } finally {
        setIsLoadingParams(false);
    }
  }, [user]);

  useEffect(() => {
    loadParams();
  }, [loadParams]);

  // Derivados y Cálculos
  const auxilioActivo = useMemo(() => state.salario < 2 * calcParams.smlmv, [state.salario, calcParams.smlmv]);
  const valorHora = useMemo(() => Math.max(0, Math.round(state.salario / calcParams.horas.baseMensualHoras)), [state.salario, calcParams.horas.baseMensualHoras]);

  // Generate dynamic item list with current factors
   const ITEMS = useMemo(() => [
        { key: "horaExtraDiurna", label: "Hora extra diurna", factor: calcParams.horas.extraDiurnaFactor, tip: `Factor ${calcParams.horas.extraDiurnaFactor * 100}%.` },
        { key: "horaExtraNocturna", label: "Hora extra nocturna", factor: calcParams.horas.extraNocturnaFactor, tip: `Factor ${calcParams.horas.extraNocturnaFactor * 100}%.` },
        { key: "recargoNocturno", label: "Recargo nocturno", factor: calcParams.horas.recargoNocturnoFactor, tip: `Factor +${calcParams.horas.recargoNocturnoFactor * 100}%.` },
        { key: "horaExtraDiurnaDomFest", label: "Hora extra diurna dominical/festiva", factor: calcParams.horas.extraDiurnaDomFestFactor, tip: `Factor ${calcParams.horas.extraDiurnaDomFestFactor * 100}%.` },
        { key: "horaExtraNocturnaDomFest", label: "Hora extra nocturna dominical/festiva", factor: calcParams.horas.extraNocturnaDomFestFactor, tip: `Factor ${calcParams.horas.extraNocturnaDomFestFactor * 100}%.` },
        { key: "recargoDomFest", label: "Recargo dominical/festivo", factor: calcParams.horas.dominicalFestivoFactor, tip: `Factor +${(calcParams.horas.dominicalFestivoFactor -1) * 100}%.` },
   ], [calcParams.horas]);


  const subtotalesHE = useMemo(() => {
    return ITEMS.reduce((acc, i) => {
      const h = state.horas[i.key] || 0;
      acc[i.key] = Math.round(h * valorHora * i.factor);
      return acc;
    }, {} as Record<string, number>);
  }, [state.horas, valorHora, ITEMS]);

  const totalExtrasYRecargos = useMemo(() => Object.values(subtotalesHE).reduce((a, b) => a + b, 0), [subtotalesHE]);
  
  const baseSalarial = useMemo(() => state.salario + state.pagoSalarial + totalExtrasYRecargos, [state.salario, state.pagoSalarial, totalExtrasYRecargos]);

  const excedenteNoSalarial = useMemo(() => {
    const totalRemuneracion = baseSalarial + state.pagoNoSalarial;
    const maxNoSal = 0.4 * totalRemuneracion;
    return Math.max(0, Math.round(state.pagoNoSalarial - maxNoSal));
  }, [baseSalarial, state.pagoNoSalarial]);

  const IBC = useMemo(() => {
    if (state.tipoSalario === "integral") {
      const baseIntegral = state.salario * 0.7;
      const variables = baseSalarial - state.salario;
      return Math.max(0, Math.round(baseIntegral + variables + excedenteNoSalarial));
    }
    return Math.max(0, Math.round(baseSalarial + excedenteNoSalarial));
  }, [state.tipoSalario, state.salario, baseSalarial, excedenteNoSalarial]);
  
  const exonerado = useMemo(() => {
    if (state.exoneracion === "si") return true;
    if (state.exoneracion === "no") return false;
    return IBC < 10 * calcParams.smlmv;
  }, [IBC, calcParams.smlmv, state.exoneracion]);

  const totalDevengado = baseSalarial + (auxilioActivo ? calcParams.auxTransporte : 0);

  const deduccionesEmpleado = useMemo(() => ({
    salud: IBC * defaultRates.ssEmpleado.salud,
    pension: IBC * defaultRates.ssEmpleado.pension,
    total: IBC * (defaultRates.ssEmpleado.salud + defaultRates.ssEmpleado.pension),
  }), [IBC]);
  
  const aportesEmpleador = useMemo(() => {
      const salud = exonerado ? 0 : IBC * defaultRates.ssEmpleador.salud;
      const pension = IBC * defaultRates.ssEmpleador.pension;
      const arl = IBC * state.riesgo;
      const cajaCompensacion = IBC * defaultRates.parafiscales.cajas;
      const icbf = exonerado ? 0 : IBC * defaultRates.parafiscales.icbf;
      const sena = exonerado ? 0 : IBC * defaultRates.parafiscales.sena;
      return { salud, pension, arl, cajaCompensacion, icbf, sena, total: salud + pension + arl + cajaCompensacion + icbf + sena };
  }, [IBC, exonerado, state.riesgo]);

  const provisiones = useMemo(() => {
      const basePrest = state.tipoSalario === 'integral' ? 0 : (baseSalarial + (auxilioActivo ? calcParams.auxTransporte : 0));
      const cesantias = basePrest * defaultRates.prestaciones.cesantias;
      const interesesCesantias = cesantias * defaultRates.prestaciones.interesesCesantias;
      const prima = basePrest * defaultRates.prestaciones.prima;
      const vacaciones = state.tipoSalario === 'integral' ? IBC * defaultRates.prestaciones.vacaciones : baseSalarial * defaultRates.prestaciones.vacaciones;
      return { cesantias, interesesCesantias, prima, vacaciones, total: cesantias + interesesCesantias + prima + vacaciones };
  }, [state.tipoSalario, baseSalarial, auxilioActivo, calcParams.auxTransporte, IBC]);

  const costoTotalEmpresa = totalDevengado + aportesEmpleador.total + provisiones.total;

  if (isLoadingParams) {
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
             <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-1/3" />
                <Skeleton className="h-10 w-44" />
             </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-80 w-full" />
                </div>
                <div className="lg:col-span-2">
                    <Skeleton className="h-[80vh] w-full" />
                </div>
             </div>
        </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Calculadora de Nómina</h1>
             <Link href="/herramientas">
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Herramientas
                </Button>
             </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Columna de Configuración */}
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader><CardTitle>1. Salario y Pagos</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                           <Label htmlFor="tipoSalario">Tipo de salario</Label>
                           <Select value={state.tipoSalario} onValueChange={(v) => setState({ ...state, tipoSalario: v as any })}>
                               <SelectTrigger><SelectValue /></SelectTrigger>
                               <SelectContent><SelectItem value="ordinario">Ordinario</SelectItem><SelectItem value="integral">Integral</SelectItem></SelectContent>
                           </Select>
                        </div>
                         <CurrencyInput label="Salario mensual" value={state.salario} onChange={(n) => setState({ ...state, salario: n })} />
                         <CurrencyInput label="Pagos salariales adicionales" value={state.pagoSalarial} onChange={(n) => setState({ ...state, pagoSalarial: n })} />
                         <CurrencyInput label="Pagos NO salariales" value={state.pagoNoSalarial} onChange={(n) => setState({ ...state, pagoNoSalarial: n })} />
                         <p className="text-xs text-muted-foreground pt-2">Auxilio de transporte {auxilioActivo ? `activo (${money(calcParams.auxTransporte)})` : 'inactivo'}.</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>2. Horas Extras y Recargos</CardTitle>
                        <CardDescription>Valor hora ordinaria: {money(valorHora)}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         {ITEMS.map((item) => (
                             <div key={item.key} className="flex justify-between items-center">
                                 <Label htmlFor={`horas-${item.key}`} className="flex items-center gap-2">
                                     {item.label}
                                     <TooltipProvider>
                                        <Tooltip><TooltipTrigger asChild><button className="text-muted-foreground text-xs font-normal focus:outline-none" tabIndex={-1}>(i)</button></TooltipTrigger><TooltipContent><p>{item.tip}</p></TooltipContent></Tooltip>
                                     </TooltipProvider>
                                 </Label>
                                 <Input 
                                    id={`horas-${item.key}`} 
                                    type="number" 
                                    className="w-24"
                                    min={0}
                                    value={state.horas[item.key] || ''}
                                    onChange={(e) => setState(s => ({...s, horas: {...s.horas, [item.key]: Number(e.target.value)} }))}
                                 />
                             </div>
                         ))}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>3. Configuración Adicional</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                           <Label htmlFor="riesgo">Clase de riesgo (ARL)</Label>
                           <Select value={String(state.riesgo)} onValueChange={(v) => setState({ ...state, riesgo: Number(v) })}>
                               <SelectTrigger><SelectValue /></SelectTrigger>
                               <SelectContent>
                                    <SelectItem value="0.00522">I — 0.522%</SelectItem>
                                    <SelectItem value="0.01044">II — 1.044%</SelectItem>
                                    <SelectItem value="0.02436">III — 2.436%</SelectItem>
                                    <SelectItem value="0.04350">IV — 4.350%</SelectItem>
                                    <SelectItem value="0.06960">V — 6.960%</SelectItem>
                               </SelectContent>
                           </Select>
                        </div>
                         <div className="space-y-2">
                           <Label htmlFor="exoneracion">Exoneración Ley 1607</Label>
                           <Select value={state.exoneracion} onValueChange={(v) => setState({ ...state, exoneracion: v as any })}>
                               <SelectTrigger><SelectValue /></SelectTrigger>
                               <SelectContent>
                                    <SelectItem value="auto">Automático (si IBC &lt; 10 SMLMV)</SelectItem>
                                    <SelectItem value="si">Forzar SÍ</SelectItem>
                                    <SelectItem value="no">Forzar NO</SelectItem>
                               </SelectContent>
                           </Select>
                        </div>
                    </CardContent>
                </Card>
            </div>
             {/* Columna de Resultados */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen del Cálculo</CardTitle>
                        <CardDescription>Base de Cotización (IBC): {money(IBC)} - {exonerado ? "Exonerado" : "No Exonerado"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                           <h3 className="font-semibold mb-2">Devengos del Empleado</h3>
                           <Table>
                               <TableBody>
                                   <TableRow><TableCell>Salario Base</TableCell><TableCell className="text-right">{money(state.salario)}</TableCell></TableRow>
                                   <TableRow><TableCell>Pagos Salariales Adicionales</TableCell><TableCell className="text-right">{money(state.pagoSalarial)}</TableCell></TableRow>
                                   <TableRow><TableCell>Auxilio de Transporte</TableCell><TableCell className="text-right">{money(auxilioActivo ? calcParams.auxTransporte : 0)}</TableCell></TableRow>
                                   <TableRow><TableCell>Total Horas Extras y Recargos</TableCell><TableCell className="text-right">{money(totalExtrasYRecargos)}</TableCell></TableRow>
                                   <TableRow className="font-bold"><TableCell>Total Devengado</TableCell><TableCell className="text-right">{money(totalDevengado)}</TableCell></TableRow>
                               </TableBody>
                           </Table>
                        </div>
                         <div>
                           <h3 className="font-semibold mb-2">Deducciones del Empleado</h3>
                           <Table>
                               <TableBody>
                                   <TableRow><TableCell>Salud (4%)</TableCell><TableCell className="text-right">{money(deduccionesEmpleado.salud)}</TableCell></TableRow>
                                   <TableRow><TableCell>Pensión (4%)</TableCell><TableCell className="text-right">{money(deduccionesEmpleado.pension)}</TableCell></TableRow>
                                   <TableRow className="font-bold"><TableCell>Total Deducciones</TableCell><TableCell className="text-right">{money(deduccionesEmpleado.total)}</TableCell></TableRow>
                               </TableBody>
                           </Table>
                        </div>
                         <Card className="bg-muted/50 p-4">
                           <div className="flex justify-between items-center">
                               <h3 className="text-lg font-bold">Neto a Pagar al Empleado</h3>
                               <p className="text-lg font-bold">{money(totalDevengado - deduccionesEmpleado.total)}</p>
                           </div>
                        </Card>
                         <div>
                           <h3 className="font-semibold mb-2">Aportes y Provisiones del Empleador</h3>
                           <Table>
                               <TableHeader>
                                 <TableRow>
                                   <TableHead>Concepto</TableHead>
                                   <TableHead className="text-right">Aportes</TableHead>
                                   <TableHead className="text-right">Provisiones</TableHead>
                                 </TableRow>
                               </TableHeader>
                               <TableBody>
                                    <TableRow><TableCell>Salud ({exonerado ? '0%' : '8.5%'})</TableCell><TableCell className="text-right">{money(aportesEmpleador.salud)}</TableCell><TableCell></TableCell></TableRow>
                                    <TableRow><TableCell>Pensión (12%)</TableCell><TableCell className="text-right">{money(aportesEmpleador.pension)}</TableCell><TableCell></TableCell></TableRow>
                                    <TableRow><TableCell>ARL ({(state.riesgo * 100).toFixed(3)}%)</TableCell><TableCell className="text-right">{money(aportesEmpleador.arl)}</TableCell><TableCell></TableCell></TableRow>
                                    <TableRow><TableCell>Caja de Compensación (4%)</TableCell><TableCell className="text-right">{money(aportesEmpleador.cajaCompensacion)}</TableCell><TableCell></TableCell></TableRow>
                                    <TableRow><TableCell>ICBF ({exonerado ? '0%' : '3%'})</TableCell><TableCell className="text-right">{money(aportesEmpleador.icbf)}</TableCell><TableCell></TableCell></TableRow>
                                    <TableRow><TableCell>SENA ({exonerado ? '0%' : '2%'})</TableCell><TableCell className="text-right">{money(aportesEmpleador.sena)}</TableCell><TableCell></TableCell></TableRow>
                                    <TableRow><TableCell>Cesantías</TableCell><TableCell></TableCell><TableCell className="text-right">{money(provisiones.cesantias)}</TableCell></TableRow>
                                    <TableRow><TableCell>Intereses sobre Cesantías</TableCell><TableCell></TableCell><TableCell className="text-right">{money(provisiones.interesesCesantias)}</TableCell></TableRow>
                                    <TableRow><TableCell>Prima de Servicios</TableCell><TableCell></TableCell><TableCell className="text-right">{money(provisiones.prima)}</TableCell></TableRow>
                                    <TableRow><TableCell>Vacaciones</TableCell><TableCell></TableCell><TableCell className="text-right">{money(provisiones.vacaciones)}</TableCell></TableRow>
                                    <TableRow className="font-bold"><TableCell>Totales</TableCell><TableCell className="text-right">{money(aportesEmpleador.total)}</TableCell><TableCell className="text-right">{money(provisiones.total)}</TableCell></TableRow>
                               </TableBody>
                           </Table>
                        </div>
                         <Card className="bg-primary/10 border-primary/20 p-4">
                           <div className="flex justify-between items-center">
                               <h3 className="text-lg font-bold text-primary">Costo Total para la Empresa</h3>
                               <p className="text-lg font-bold text-primary">{money(costoTotalEmpresa)}</p>
                           </div>
                        </Card>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
