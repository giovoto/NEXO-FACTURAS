'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, FileText, CircleDollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CausacionModal } from './causacion-modal';
import { Factura } from '@/lib/types';

interface FacturasRecientesProps {
    facturas: Factura[];
    isLoading: boolean;
}

const estadoColores: { [key: string]: string } = {
    Procesado: "bg-amber-100 text-amber-800 border-amber-200",
    Aceptado: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Rechazado: "bg-red-100 text-red-800 border-red-200",
    "Por Causar": "bg-blue-100 text-blue-800 border-blue-200",
    Causado: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

export default function FacturasRecientes({ facturas = [], isLoading }: FacturasRecientesProps) {
    const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const formatCurrency = (value: any) => {
        const amount = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(amount)) return 'N/A';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    const formatDate = (value: any) => {
        try {
            const date = new Date(value);
            if (isNaN(date.getTime())) return 'Fecha inválida';
            // Formatear a 'dd MMM yyyy'
            return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
        } catch (e) {
            return 'Fecha inválida';
        }
    }

    const handleOpenCausar = (factura: Factura) => {
        setSelectedFactura(factura);
        setIsModalOpen(true);
    };

    const handleModalSuccess = () => {
        // El estado se actualizará via auth provider
    };

    return (
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm h-full">
            <CardHeader className="p-6 border-b border-slate-200/60">
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Comprobantes Recientes
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/80">
                                <TableHead className="font-semibold text-slate-700">Emisor</TableHead>
                                <TableHead className="font-semibold text-slate-700 hidden md:table-cell">Fecha</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-right">Valor Total</TableHead>
                                <TableHead className="font-semibold text-slate-700">Estado</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence>
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : facturas.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-2">
                                                <FileText className="w-12 h-12 text-slate-300" />
                                                <p className="text-slate-500 font-medium">No hay comprobantes aún</p>
                                                <p className="text-sm text-slate-400">Procesa tu primer correo para comenzar</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    facturas.slice(0, 7).map((factura, index) => (
                                        <motion.tr
                                            key={factura.cufe as string || index}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-slate-50/60 transition-colors duration-200"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-slate-100 rounded-md hidden sm:block">
                                                        <Building2 className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-900">{factura.nombreEmisor as string}</p>
                                                        <p className="text-sm text-slate-500">{factura.folio as string}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(factura.fecha)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-slate-800 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <CircleDollarSign className="w-4 h-4 text-slate-400" />
                                                    {formatCurrency(factura.valorTotal)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={cn(estadoColores[factura.estado as string] || 'bg-slate-100 text-slate-800', "border font-medium")}
                                                >
                                                    {factura.estado as string}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className={cn(
                                                        "text-primary hover:text-primary/80 hover:bg-primary/10",
                                                        factura.estado === 'Causado' && "text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    )}
                                                    disabled={factura.estado === 'Causado'}
                                                    onClick={() => handleOpenCausar(factura)}
                                                >
                                                    {factura.estado === 'Causado' ? 'Completado' : 'Causar'}
                                                </Button>
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <CausacionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                factura={selectedFactura}
                onSuccess={handleModalSuccess}
            />
        </Card>
    );
}
