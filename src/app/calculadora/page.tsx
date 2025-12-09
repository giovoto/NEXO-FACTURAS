
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';


const tablaRetencion = {
  compras_generales: { declarante: { base: 498000, tarifa: 0.025 }, no_declarante: { base: 498000, tarifa: 0.035 } },
  servicios_generales: { declarante: { base: 100000, tarifa: 0.04 }, no_declarante: { base: 100000, tarifa: 0.06 } },
  arrendamiento_inmuebles: { declarante: { base: 498000, tarifa: 0.035 }, no_declarante: { base: 498000, tarifa: 0.035 } },
  arrendamiento_muebles: { base: 0, tarifa: 0.04 },
  honorarios_juridica: { base: 0, tarifa: 0.11 },
  honorarios_natural: { declarante: { base: 0, tarifa: 0.11 }, no_declarante: { base: 0, tarifa: 0.10 } },
  compras_agricolas: { base: 3486000, tarifa: 0.015 },
  transporte_carga: { base: 100000, tarifa: 0.01 },
  intereses_financieros: { base: 0, tarifa: 0.07 },
};

const conceptosConDeclarantes = ['compras_generales', 'servicios_generales', 'honorarios_natural', 'arrendamiento_inmuebles'];

const responsabilidadesData = {
  persona_juridica: [
    { value: 'O-13', label: 'O-13 - Gran Contribuyente' },
    { value: 'O-15', label: 'O-15 - Autorretenedor' },
    { value: 'O-23', label: 'O-23 - Agente de Retención IVA' },
    { value: 'O-47', label: 'O-47 - Régimen Simple' },
    { value: 'R-99-PN', label: 'R-99-PN - No responsable' },
  ],
  persona_natural: [
    { value: 'O-47', label: 'O-47 - Régimen Simple' },
    { value: 'R-99-PN', label: 'R-99-PN - No responsable' },
  ],
};

const conceptosOperacion = [
    { label: '🛒 Compras', options: [
        { value: 'compras_generales', label: 'Compras generales' },
        { value: 'compras_agricolas', label: 'Compras agrícolas sin procesamiento industrial' }
    ]},
    { label: '🔧 Servicios', options: [ { value: 'servicios_generales', label: 'Servicios generales' } ]},
    { label: '🏢 Arrendamientos', options: [
        { value: 'arrendamiento_inmuebles', label: 'Arrendamiento de inmuebles' },
        { value: 'arrendamiento_muebles', label: 'Arrendamiento de bienes muebles' }
    ]},
    { label: '💼 Honorarios y Comisiones', options: [
        { value: 'honorarios_juridica', label: 'Honorarios (persona jurídica)' },
        { value: 'honorarios_natural', label: 'Honorarios (persona natural)' }
    ]},
    { label: '🚛 Transporte', options: [ { value: 'transporte_carga', label: 'Transporte de carga' } ]},
    { label: '🏦 Financieros', options: [ { value: 'intereses_financieros', label: 'Intereses o rendimientos financieros' } ]}
];

const tarifasICA = [ "4.14", "6.9", "7.0", "9.66", "11.04", "13.8" ];

const formatCurrency = (value: number, minimumFractionDigits = 2) => {
    return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits, maximumFractionDigits: 2 });
};

export default function CalculadoraPage() {
  const [formData, setFormData] = useState({
    quienCompra: 'persona_juridica',
    quienVende: 'persona_juridica',
    esNoDeclarante: false,
    razonSocial: '',
    responsabilidades: [] as string[],
    valor: '',
    conceptoOperacion: '',
    iva: '0',
    esBogota: false,
    tarifaICA: '',
  });
  const [resultado, setResultado] = useState<any>(null);

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
     setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleIvaCheckboxChange = (value: string) => {
    setFormData(prev => ({...prev, iva: prev.iva === value ? '0' : value }));
  }

  const handleResponsabilidadChange = (value: string, checked: boolean) => {
    setFormData(prev => {
        const newResponsibilities = checked 
            ? [...prev.responsabilidades, value]
            : prev.responsabilidades.filter(r => r !== value);
        return { ...prev, responsabilidades: newResponsibilities };
    });
  }

  const responsabilidadesOptions = useMemo(() => {
    return responsabilidadesData[formData.quienVende as keyof typeof responsabilidadesData] || [];
  }, [formData.quienVende]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, responsabilidades: [] }));
  }, [formData.quienVende]);
  
  const showDeclaranteCheckbox = conceptosConDeclarantes.includes(formData.conceptoOperacion);
  useEffect(() => {
    if (!showDeclaranteCheckbox) {
      setFormData(prev => ({...prev, esNoDeclarante: false}));
    }
  }, [showDeclaranteCheckbox, formData.conceptoOperacion]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const valorBase = parseFloat(formData.valor) || 0;
    const tarifaIVA = parseFloat(formData.iva);
    const valorIVA = valorBase * tarifaIVA;
    const valorTotalConIVA = valorBase + valorIVA;
    
    const esRegimenSimple = formData.responsabilidades.includes('O-47');
    
    let reteIVA = 0;
    if (tarifaIVA > 0 && formData.responsabilidades.includes('O-23')) {
        reteIVA = valorIVA * 0.15;
    }

    let retefuente = 0;
    let tarifaAplicada = 0;
    const datosRetencion = tablaRetencion[formData.conceptoOperacion as keyof typeof tablaRetencion];

    if (datosRetencion && !formData.responsabilidades.includes('O-15') && !esRegimenSimple) {
      if ('tarifa' in datosRetencion) { // Conceptos sin distinción declarante/no-declarante
        if (valorBase >= datosRetencion.base) {
          retefuente = valorBase * datosRetencion.tarifa;
          tarifaAplicada = datosRetencion.tarifa;
        }
      } else { // Conceptos CON distinción declarante/no-declarante
        const tipo = formData.esNoDeclarante ? 'no_declarante' : 'declarante';
        const datos = datosRetencion[tipo as keyof typeof datosRetencion];
        if (datos && valorBase >= datos.base) {
          retefuente = valorBase * datos.tarifa;
          tarifaAplicada = datos.tarifa;
        }
      }
    }
    
    const ica = formData.esBogota ? valorBase * (parseFloat(formData.tarifaICA || '0') / 1000) : 0;
    const totalRetenciones = retefuente + reteIVA + ica;
    const valorNeto = valorTotalConIVA - totalRetenciones;
    
    setResultado({
      razonSocial: formData.razonSocial,
      valorBase,
      tarifaIVA,
      valorIVA,
      tarifaAplicada,
      retefuente,
      reteIVA,
      tarifaICA: parseFloat(formData.tarifaICA || '0'),
      ica,
      esRegimenSimple,
      totalRetenciones,
      valorNeto,
    });
  };

  const handleClear = () => {
    setFormData({
        quienCompra: 'persona_juridica',
        quienVende: 'persona_juridica',
        esNoDeclarante: false,
        razonSocial: '',
        responsabilidades: [],
        valor: '',
        conceptoOperacion: '',
        iva: '0',
        esBogota: false,
        tarifaICA: '',
    });
    setResultado(null);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Calculadora de Retención 2025</h1>
         <Link href="/herramientas">
            <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Herramientas
            </Button>
         </Link>
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <Card className="w-full lg:max-w-md">
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <Label htmlFor="quienCompra">¿Quién compra?</Label>
                             <Select name="quienCompra" value={formData.quienCompra} onValueChange={v => handleSelectChange('quienCompra', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="persona_juridica">Persona Jurídica</SelectItem><SelectItem value="persona_natural">Persona Natural</SelectItem></SelectContent>
                             </Select>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="quienVende">¿Quién vende?</Label>
                             <Select name="quienVende" value={formData.quienVende} onValueChange={v => handleSelectChange('quienVende', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="persona_juridica">Persona Jurídica</SelectItem><SelectItem value="persona_natural">Persona Natural</SelectItem></SelectContent>
                             </Select>
                        </div>
                    </div>

                    {showDeclaranteCheckbox && (
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="esNoDeclarante" checked={formData.esNoDeclarante} onCheckedChange={c => handleCheckboxChange('esNoDeclarante', !!c)} />
                            <Label htmlFor="esNoDeclarante" className="text-sm font-normal">¿La persona natural no es declarante del impuesto de renta?</Label>
                        </div>
                    )}
                    
                    <div className="space-y-2">
                         <Label htmlFor="razonSocial">Razón Social (opcional)</Label>
                         <Input id="razonSocial" name="razonSocial" value={formData.razonSocial} onChange={handleInputChange} placeholder="Ej: Constructora XYZ S.A.S" />
                    </div>

                    <div className="space-y-2">
                        <Label>Responsabilidades fiscales</Label>
                         <div className="space-y-2 p-3 border rounded-md max-h-48 overflow-y-auto">
                            {responsabilidadesOptions.map(opt => (
                               <div key={opt.value} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`resp-${opt.value}`}
                                    checked={formData.responsabilidades.includes(opt.value)}
                                    onCheckedChange={(checked) => handleResponsabilidadChange(opt.value, !!checked)}
                                  />
                                  <Label htmlFor={`resp-${opt.value}`} className="font-normal text-sm">{opt.label}</Label>
                                </div>
                            ))}
                         </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="valor">Valor de la operación (sin IVA)</Label>
                        <Input id="valor" name="valor" type="number" value={formData.valor} onChange={handleInputChange} placeholder="0" min="0" step="0.01" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="conceptoOperacion">Concepto de la operación</Label>
                        <Select name="conceptoOperacion" value={formData.conceptoOperacion} onValueChange={v => handleSelectChange('conceptoOperacion', v)} required>
                            <SelectTrigger><SelectValue placeholder="Seleccione un concepto" /></SelectTrigger>
                            <SelectContent>
                                {conceptosOperacion.map(group => (
                                    <SelectGroup key={group.label}>
                                        <SelectLabel>{group.label}</SelectLabel>
                                        {group.options.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                                    </SelectGroup>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Tarifa de IVA</Label>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
                             <div className="flex items-center"><Checkbox checked={formData.iva === '0.05'} onCheckedChange={() => handleIvaCheckboxChange('0.05')} id="iva5" /><Label htmlFor="iva5" className="ml-2 font-normal">IVA 5%</Label></div>
                             <div className="flex items-center"><Checkbox checked={formData.iva === '0.19'} onCheckedChange={() => handleIvaCheckboxChange('0.19')} id="iva19" /><Label htmlFor="iva19" className="ml-2 font-normal">IVA 19%</Label></div>
                             <div className="flex items-center"><Checkbox checked={formData.iva === '0_exento'} onCheckedChange={() => handleIvaCheckboxChange('0_exento')} id="ivaExento" /><Label htmlFor="ivaExento" className="ml-2 font-normal">Exento</Label></div>
                             <div className="flex items-center"><Checkbox checked={formData.iva === '0_excluido'} onCheckedChange={() => handleIvaCheckboxChange('0_excluido')} id="ivaExcluido" /><Label htmlFor="ivaExcluido" className="ml-2 font-normal">Excluido</Label></div>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                       <Checkbox id="esBogota" checked={formData.esBogota} onCheckedChange={c => handleCheckboxChange('esBogota', !!c)} />
                       <Label htmlFor="esBogota" className="font-normal">¿La operación se realiza en Bogotá?</Label>
                    </div>
                    
                    {formData.esBogota && (
                        <div className="space-y-2">
                            <Label htmlFor="tarifaICA">Tarifa ICA Bogotá (‰)</Label>
                             <Select name="tarifaICA" value={formData.tarifaICA} onValueChange={v => handleSelectChange('tarifaICA', v)}>
                                <SelectTrigger><SelectValue placeholder="Seleccione una tarifa" /></SelectTrigger>
                                <SelectContent>
                                    {tarifasICA.map(t => <SelectItem key={t} value={t}>{t} ‰</SelectItem>)}
                                </SelectContent>
                             </Select>
                        </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-2 pt-4">
                        <Button type="submit" className="w-full">Calcular</Button>
                        <Button type="button" variant="outline" onClick={handleClear} className="w-full">Limpiar</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
        
        {resultado && (
            <Card className="w-full lg:max-w-sm sticky top-24">
                <CardHeader>
                    <CardTitle>Resultado del Cálculo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    {resultado.razonSocial && <p><strong>Razón Social:</strong> {resultado.razonSocial}</p>}
                    <p className="text-muted-foreground"><strong>Valor base:</strong> {formatCurrency(resultado.valorBase)}</p>
                    <p className="text-muted-foreground"><strong>IVA ({(resultado.tarifaIVA * 100).toFixed(0)}%):</strong> {formatCurrency(resultado.valorIVA)}</p>
                     <p className="text-muted-foreground"><strong>Retefuente ({(resultado.tarifaAplicada * 100).toFixed(1)}%):</strong> {formatCurrency(resultado.retefuente)}</p>
                    <p className="text-muted-foreground"><strong>ReteIVA (15% sobre IVA):</strong> {formatCurrency(resultado.reteIVA)}</p>
                    <p className="text-muted-foreground"><strong>ICA Bogotá ({resultado.tarifaICA.toFixed(2)}‰):</strong> {formatCurrency(resultado.ica, 2)}</p>
                    {resultado.esRegimenSimple && <p className="text-xs text-muted-foreground pt-2">Nota: El vendedor pertenece al Régimen Simple (O-47). No se aplica retención en la fuente.</p>}

                    <div className="pt-4 space-y-2">
                        <p className="text-lg font-bold">Total Retenciones: {formatCurrency(Math.round(resultado.totalRetenciones), 0)}</p>
                        <p className="text-lg font-bold">Valor neto a pagar: {formatCurrency(Math.round(resultado.valorNeto), 0)}</p>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
