'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Factura } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';

// Mock PUC Accounts
const pucAccounts = [
    { code: '519530', name: 'Utiles, papeleria y fotocopias' },
    { code: '519525', name: 'Elementos de aseo y cafeteria' },
    { code: '513505', name: 'Servicios de aseo y vigilancia' },
    { code: '514510', name: 'Construcciones y edificaciones' },
    { code: '130505', name: 'Clientes Nacionales' },
    { code: '233595', name: 'Costos y gastos por pagar - Otros' },
];

interface CausacionModalProps {
    factura: Factura | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CausacionModal({ factura, isOpen, onClose, onSuccess }: CausacionModalProps) {
    const { handleStatusChange } = useAuth();
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!factura) return null;

    const handleCausar = async () => {
        if (!selectedAccount) return;

        setIsSubmitting(true);
        try {
            // En una implementación real, aquí guardaríamos la cuenta contable
            // junto con la factura.
            console.log(`Causando factura ${factura.id} con cuenta ${selectedAccount}`);

            await handleStatusChange(factura.id, 'Causado');
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error al causar factura", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Causar Factura</DialogTitle>
                    <DialogDescription>
                        Asigna la cuenta contable para procesar esta factura.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Emisor</Label>
                        <div className="col-span-3 font-medium">
                            {factura.nombreEmisor}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Total</Label>
                        <div className="col-span-3 font-medium">
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(factura.valorTotal)}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="account" className="text-right">
                            Cuenta (PUC)
                        </Label>
                        <Select onValueChange={setSelectedAccount} value={selectedAccount}>
                            <SelectTrigger className="col-span-3" id="account">
                                <SelectValue placeholder="Seleccionar cuenta..." />
                            </SelectTrigger>
                            <SelectContent>
                                {pucAccounts.map((acc) => (
                                    <SelectItem key={acc.code} value={acc.code}>
                                        {acc.code} - {acc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button onClick={handleCausar} disabled={!selectedAccount || isSubmitting}>
                        {isSubmitting ? 'Procesando...' : 'Causar Factura'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
