'use client';

import { useState, useEffect, useCallback } from 'react';
import { Info, Calculator, Building2, User } from 'lucide-react';

// Tabla de retención basada en normativa colombiana 2025
const tablaRetencion = {
    compras_generales: { declarante: { base: 498000, tarifa: 0.025 }, no_declarante: { base: 498000, tarifa: 0.035 } },
    compras_tarjeta: { base: 0, tarifa: 0.015 },
    compras_agricolas_sin_procesamiento: { base: 3486000, tarifa: 0.015 },
    compras_agricolas_con_procesamiento: { declarante: { base: 498000, tarifa: 0.025 }, no_declarante: { base: 498000, tarifa: 0.035 } },
    compras_cafe: { base: 3486000, tarifa: 0.005 },
    compras_combustibles: { base: 0, tarifa: 0.001 },
    compras_vehiculos: { base: 0, tarifa: 0.01 },
    servicios_generales: { declarante: { base: 100000, tarifa: 0.04 }, no_declarante: { base: 100000, tarifa: 0.06 } },
    transporte_carga: { base: 100000, tarifa: 0.01 },
    transporte_pasajeros_terrestre: { declarante: { base: 498000, tarifa: 0.035 }, no_declarante: { base: 498000, tarifa: 0.035 } },
    servicios_temporales: { base: 100000, tarifa: 0.01 },
    servicios_vigilancia_aseo: { base: 100000, tarifa: 0.02 },
    servicios_hoteles_restaurantes: { declarante: { base: 100000, tarifa: 0.035 }, no_declarante: { base: 100000, tarifa: 0.035 } },
    arrendamiento_inmuebles: { declarante: { base: 498000, tarifa: 0.035 }, no_declarante: { base: 498000, tarifa: 0.035 } },
    arrendamiento_muebles: { base: 0, tarifa: 0.04 },
    honorarios_juridica: { base: 0, tarifa: 0.11 },
    honorarios_natural: { declarante: { base: 0, tarifa: 0.11 }, no_declarante: { base: 0, tarifa: 0.10 } },
    contratos_construccion: { base: 498000, tarifa: 0.02 },
    rendimientos_financieros: { base: 0, tarifa: 0.07 },
    otros_ingresos: { declarante: { base: 498000, tarifa: 0.025 }, no_declarante: { base: 498000, tarifa: 0.035 } }
};

const conceptLabels: Record<string, string> = {
    compras_generales: 'Compras Generales',
    compras_tarjeta: 'Compras con Tarjeta',
    compras_agricolas_sin_procesamiento: 'Compras Agrícolas (Sin Procesamiento)',
    compras_agricolas_con_procesamiento: 'Compras Agrícolas (Con Procesamiento)',
    compras_cafe: 'Compras de Café',
    compras_combustibles: 'Compras de Combustibles',
    compras_vehiculos: 'Compras de Vehículos',
    servicios_generales: 'Servicios Generales',
    transporte_carga: 'Transporte de Carga',
    transporte_pasajeros_terrestre: 'Transporte de Pasajeros Terrestre',
    servicios_temporales: 'Servicios Temporales',
    servicios_vigilancia_aseo: 'Servicios de Vigilancia/Aseo',
    servicios_hoteles_restaurantes: 'Servicios Hoteles/Restaurantes',
    arrendamiento_inmuebles: 'Arrendamiento de Inmuebles',
    arrendamiento_muebles: 'Arrendamiento de Muebles',
    honorarios_juridica: 'Honorarios (Persona Jurídica)',
    honorarios_natural: 'Honorarios (Persona Natural)',
    contratos_construccion: 'Contratos de Construcción',
    rendimientos_financieros: 'Rendimientos Financieros',
    otros_ingresos: 'Otros Ingresos'
};

const regimeOptionsJuridica = [
    { value: 'ordinario', label: 'Común / Ordinario' },
    { value: 'gran_contribuyente', label: 'Gran Contribuyente (O-13)' },
    { value: 'autorretenedor', label: 'Autorretenedor (O-15)' },
    { value: 'regimen_simple', label: 'Régimen Simple (O-47)' }
];

const regimeOptionsNatural = [
    { value: 'declarante', label: 'Persona Natural Declarante' },
    { value: 'no_declarante', label: 'Persona Natural No Declarante' },
    { value: 'regimen_simple', label: 'Régimen Simple (O-47)' }
];

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

export default function CalculadoraRetencionPage() {
    const [price, setPrice] = useState<string>('');
    const [concept, setConcept] = useState<string>('compras_generales');
    const [hasIva, setHasIva] = useState<boolean>(true);
    const [ivaRate, setIvaRate] = useState<number>(19);
    const [applyIca, setApplyIca] = useState<boolean>(false);
    const [icaRate, setIcaRate] = useState<string>('4.14');

    const [buyerType, setBuyerType] = useState<'juridica' | 'natural'>('juridica');
    const [buyerRegime, setBuyerRegime] = useState<string>('ordinario');
    const [sellerType, setSellerType] = useState<'juridica' | 'natural'>('juridica');
    const [sellerRegime, setSellerRegime] = useState<string>('ordinario');

    const [isReteIvaAgent, setIsReteIvaAgent] = useState<boolean>(false);
    const [reteIvaRate, setReteIvaRate] = useState<number>(15);

    const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

    // Results
    const [results, setResults] = useState({
        base: 0,
        iva: 0,
        autorrete: 0,
        rete: 0,
        reteIva: 0,
        ica: 0,
        total: 0,
        retePerc: 0,
        reteIvaPerc: 0
    });

    const calculate = useCallback(() => {
        const p = parseFloat(price) || 0;
        const ivaPerc = hasIva ? ivaRate : 0;
        const icaMil = applyIca ? parseFloat(icaRate) || 0 : 0;

        // 1. Calculate Base and Total
        const base = p;
        const ivaAmount = hasIva ? Math.round(base * (ivaPerc / 100)) : 0;
        const totalPrice = base + ivaAmount;

        // 2. Roles extraction
        const buyerIsSimple = buyerRegime === 'regimen_simple';
        const sellerIsSimple = sellerRegime === 'regimen_simple';
        const sellerIsGC = sellerRegime === 'gran_contribuyente';
        const sellerIsAuto = sellerRegime === 'autorretenedor';
        const sellerIsNoDeclarante = sellerType === 'natural' && sellerRegime === 'no_declarante';

        // 3. Retefuente Calculation
        let reteAmount = 0;
        let autoReteAmount = 0;
        let retePerc = 0;
        const data = tablaRetencion[concept as keyof typeof tablaRetencion];

        if (data) {
            let config: { base: number; tarifa: number };

            if ('tarifa' in data && typeof data.tarifa === 'number') {
                config = data as { base: number; tarifa: number };
            } else {
                const dataWithRoles = data as { declarante: { base: number; tarifa: number }; no_declarante: { base: number; tarifa: number } };
                config = sellerIsNoDeclarante ? dataWithRoles.no_declarante : dataWithRoles.declarante;
            }

            if (base >= config.base) {
                const calculatedValue = Math.round(base * config.tarifa);
                retePerc = config.tarifa * 100;

                if (!buyerIsSimple) {
                    if (sellerIsSimple) {
                        autoReteAmount = calculatedValue;
                    } else if (!sellerIsGC && !sellerIsAuto) {
                        reteAmount = calculatedValue;
                    }
                }
            }
        }

        // 4. ReteIVA Calculation
        let reteIvaAmount = 0;
        let reteIvaPerc = 0;

        if (ivaAmount > 0 && isReteIvaAgent) {
            const manualRate = reteIvaRate / 100;
            reteIvaAmount = Math.round(ivaAmount * manualRate);
            reteIvaPerc = reteIvaRate;
        }

        // 5. ICA Calculation
        let icaAmount = 0;
        if (applyIca && !buyerIsSimple && !sellerIsSimple && !sellerIsGC) {
            icaAmount = Math.round(base * (icaMil / 1000));
        }

        // 6. Final Total
        const total = totalPrice - reteAmount - reteIvaAmount - icaAmount;

        setResults({
            base,
            iva: ivaAmount,
            autorrete: autoReteAmount,
            rete: reteAmount,
            reteIva: reteIvaAmount,
            ica: icaAmount,
            total,
            retePerc,
            reteIvaPerc
        });
    }, [price, concept, hasIva, ivaRate, applyIca, icaRate, buyerType, buyerRegime, sellerType, sellerRegime, isReteIvaAgent, reteIvaRate]);

    useEffect(() => {
        calculate();
    }, [calculate]);

    // Update buyer regime options when type changes
    useEffect(() => {
        if (buyerType === 'natural') {
            if (!regimeOptionsNatural.find(o => o.value === buyerRegime)) {
                setBuyerRegime('declarante');
            }
        } else {
            if (!regimeOptionsJuridica.find(o => o.value === buyerRegime)) {
                setBuyerRegime('ordinario');
            }
        }
    }, [buyerType, buyerRegime]);

    useEffect(() => {
        if (sellerType === 'natural') {
            if (!regimeOptionsNatural.find(o => o.value === sellerRegime)) {
                setSellerRegime('declarante');
            }
        } else {
            if (!regimeOptionsJuridica.find(o => o.value === sellerRegime)) {
                setSellerRegime('ordinario');
            }
        }
    }, [sellerType, sellerRegime]);

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9.]/g, '');
        const parts = val.split('.');
        if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');

        const numericVal = parseFloat(val);
        if (numericVal > 999999999999999) val = '999999999999999';

        setPrice(val);
    };

    const buyerRegimeOptions = buyerType === 'juridica' ? regimeOptionsJuridica : regimeOptionsNatural;
    const sellerRegimeOptions = sellerType === 'juridica' ? regimeOptionsJuridica : regimeOptionsNatural;

    return (
        <div className="min-h-screen bg-background p-4 md:p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <header className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3">
                                <Calculator className="w-8 h-8 text-primary" />
                                Calculadora de Retención
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Digita el precio de compra o venta y nosotros calculamos el valor de las retenciones.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowInfoModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-full text-sm font-semibold hover:bg-accent transition-colors"
                        >
                            <Info className="w-4 h-4" />
                            Info
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Form Section */}
                    <div className="space-y-4">
                        {/* Price Input */}
                        <div className="bg-card border border-border rounded-2xl p-4">
                            <label className="block text-sm font-semibold mb-2">Valor Base (COP)</label>
                            <input
                                type="text"
                                value={price}
                                onChange={handlePriceChange}
                                placeholder="Ej: 1000000"
                                className="w-full px-4 py-3 border border-border rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        {/* Concept Select */}
                        <div className="bg-card border border-border rounded-2xl p-4">
                            <label className="block text-sm font-semibold mb-2">Concepto de Retención</label>
                            <select
                                value={concept}
                                onChange={(e) => setConcept(e.target.value)}
                                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {Object.entries(conceptLabels).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Buyer Accordion */}
                        <div className="bg-card border border-border rounded-2xl overflow-hidden">
                            <details className="group">
                                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50">
                                    <span className="flex items-center gap-2 font-semibold">
                                        <Building2 className="w-4 h-4" />
                                        Comprador
                                    </span>
                                    <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="p-4 pt-0 space-y-4">
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="buyerType"
                                                value="juridica"
                                                checked={buyerType === 'juridica'}
                                                onChange={() => setBuyerType('juridica')}
                                                className="accent-primary"
                                            />
                                            <span className="text-sm">Jurídica</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="buyerType"
                                                value="natural"
                                                checked={buyerType === 'natural'}
                                                onChange={() => setBuyerType('natural')}
                                                className="accent-primary"
                                            />
                                            <span className="text-sm">Natural</span>
                                        </label>
                                    </div>
                                    <select
                                        value={buyerRegime}
                                        onChange={(e) => setBuyerRegime(e.target.value)}
                                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        {buyerRegimeOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </details>
                        </div>

                        {/* Seller Accordion */}
                        <div className="bg-card border border-border rounded-2xl overflow-hidden">
                            <details className="group">
                                <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50">
                                    <span className="flex items-center gap-2 font-semibold">
                                        <User className="w-4 h-4" />
                                        Vendedor
                                    </span>
                                    <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                                </summary>
                                <div className="p-4 pt-0 space-y-4">
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="sellerType"
                                                value="juridica"
                                                checked={sellerType === 'juridica'}
                                                onChange={() => setSellerType('juridica')}
                                                className="accent-primary"
                                            />
                                            <span className="text-sm">Jurídica</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="sellerType"
                                                value="natural"
                                                checked={sellerType === 'natural'}
                                                onChange={() => setSellerType('natural')}
                                                className="accent-primary"
                                            />
                                            <span className="text-sm">Natural</span>
                                        </label>
                                    </div>
                                    <select
                                        value={sellerRegime}
                                        onChange={(e) => setSellerRegime(e.target.value)}
                                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        {sellerRegimeOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </details>
                        </div>

                        {/* IVA Switch */}
                        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm">¿Operación con IVA?</span>
                                <label className="relative inline-flex cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hasIva}
                                        onChange={(e) => setHasIva(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                            {hasIva && (
                                <select
                                    value={ivaRate}
                                    onChange={(e) => setIvaRate(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value={19}>IVA 19%</option>
                                    <option value={5}>IVA 5%</option>
                                    <option value={0}>Exento (0%)</option>
                                </select>
                            )}
                        </div>

                        {/* ReteIVA Switch */}
                        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm">¿Es agente retenedor de IVA?</span>
                                <label className="relative inline-flex cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isReteIvaAgent}
                                        onChange={(e) => setIsReteIvaAgent(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                            {isReteIvaAgent && (
                                <select
                                    value={reteIvaRate}
                                    onChange={(e) => setReteIvaRate(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value={15}>ReteIVA 15%</option>
                                    <option value={100}>ReteIVA 100%</option>
                                </select>
                            )}
                        </div>

                        {/* ICA Switch */}
                        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm">¿Aplicar ReteICA?</span>
                                <label className="relative inline-flex cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={applyIca}
                                        onChange={(e) => setApplyIca(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                            {applyIca && (
                                <div>
                                    <label className="block text-xs text-muted-foreground mb-1">Tarifa ICA (x 1000)</label>
                                    <input
                                        type="text"
                                        value={icaRate}
                                        onChange={(e) => setIcaRate(e.target.value)}
                                        placeholder="Ej: 4.14"
                                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="space-y-3">
                        <div className="bg-card border border-border rounded-2xl p-4">
                            <span className="text-xs text-muted-foreground">Base Gravable</span>
                            <p className="text-xl font-bold">{formatCurrency(results.base)}</p>
                        </div>

                        {results.iva > 0 && (
                            <div className="bg-card border border-border rounded-2xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-muted-foreground">IVA</span>
                                        <p className="text-xl font-bold">{formatCurrency(results.iva)}</p>
                                    </div>
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs font-bold">{ivaRate}%</span>
                                </div>
                            </div>
                        )}

                        {results.autorrete > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-amber-600">Autorretención (Informativa)</span>
                                        <p className="text-xl font-bold text-amber-700">{formatCurrency(results.autorrete)}</p>
                                    </div>
                                    <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold">{results.retePerc.toFixed(2)}%</span>
                                </div>
                            </div>
                        )}

                        {results.rete > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-red-600">Retención en la Fuente</span>
                                        <p className="text-xl font-bold text-red-700">- {formatCurrency(results.rete)}</p>
                                    </div>
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold">{results.retePerc.toFixed(2)}%</span>
                                </div>
                            </div>
                        )}

                        {results.reteIva > 0 && (
                            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-purple-600">Retención de IVA</span>
                                        <p className="text-xl font-bold text-purple-700">- {formatCurrency(results.reteIva)}</p>
                                    </div>
                                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-bold">{results.reteIvaPerc}% s/IVA</span>
                                </div>
                            </div>
                        )}

                        {results.ica > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="text-xs text-orange-600">Retención de ICA</span>
                                        <p className="text-xl font-bold text-orange-700">- {formatCurrency(results.ica)}</p>
                                    </div>
                                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-xs font-bold">{icaRate} x 1000</span>
                                </div>
                            </div>
                        )}

                        {/* Total */}
                        <div className="bg-primary/10 border-2 border-primary rounded-2xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-primary font-medium">Total a Pagar</span>
                                    <p className="text-2xl font-extrabold text-primary">{formatCurrency(results.total)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Modal */}
            {showInfoModal && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowInfoModal(false)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold mb-4">Recomendaciones antes de aplicar retenciones</h2>
                        <ul className="space-y-3 text-sm">
                            <li className="flex gap-2">
                                <span className="text-primary font-bold">•</span>
                                <span><strong>Revisa el RUT del proveedor o cliente:</strong> Verifica si es gran contribuyente, autorretenedor, régimen simple o si tiene exenciones.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary font-bold">•</span>
                                <span><strong>Ten en cuenta los montos mínimos:</strong> Algunas retenciones solo aplican si el valor supera cierto umbral.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary font-bold">•</span>
                                <span><strong>Confirma si la operación genera retención:</strong> No todas las compras o servicios aplican.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary font-bold">•</span>
                                <span><strong>Considera la ciudad para calcular ICA:</strong> El porcentaje de ICA cambia según la ciudad y la actividad económica.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary font-bold">•</span>
                                <span><strong>Conserva los soportes:</strong> Guarda RUT, certificados y facturas para efectos contables y tributarios.</span>
                            </li>
                        </ul>
                        <div className="bg-primary/10 p-4 rounded-xl mt-4 border-l-4 border-primary">
                            <p className="text-sm"><strong>Tip:</strong> Aplicar correctamente las retenciones mejora la reputación de tu negocio y evita conflictos por descuentos indebidos.</p>
                        </div>
                        <p className="text-xs text-center text-muted-foreground mt-4 uppercase tracking-wide">
                            Haz clic en cualquier parte para cerrar
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
