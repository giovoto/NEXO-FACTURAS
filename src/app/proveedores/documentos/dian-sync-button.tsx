'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CloudDownload, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DianSyncButtonProps {
    onSyncResult?: (result: {
        success: boolean;
        documents?: any[];
        message?: string
    }) => void;
}

export function DianSyncButton({ onSyncResult }: DianSyncButtonProps) {
    const { user, activeEmpresaId } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);
    const [result, setResult] = useState<'success' | 'error' | null>(null);
    const [showTokenDialog, setShowTokenDialog] = useState(false);
    const [dianToken, setDianToken] = useState('');
    const [hasToken, setHasToken] = useState(false);

    const startSyncProcess = () => {
        if (!hasToken) {
            setShowTokenDialog(true);
        } else {
            handleSync();
        }
    };

    const handleSaveTokenAndSync = () => {
        if (!dianToken) return;
        console.log('Saving DIAN Token:', dianToken);
        setHasToken(true);
        setShowTokenDialog(false);
        handleSync(dianToken);
    };

    const handleSync = async (tokenOverride?: string) => {
        if (!user || !activeEmpresaId) return;
        setIsSyncing(true);
        setResult(null);

        const tokenToUse = tokenOverride || dianToken;

        try {
            // Call the API route
            const response = await fetch('/api/dian/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    dianTokenUrl: tokenToUse,
                    empresaId: activeEmpresaId
                })
            });

            const actionResult = await response.json();

            if (actionResult.success) {
                setResult('success');
                setTimeout(() => {
                    if (onSyncResult) {
                        onSyncResult({
                            success: true,
                            documents: actionResult.documents,
                            message: actionResult.message
                        });
                    }
                }, 500);
            } else {
                console.error('DIAN Sync Failed:', actionResult.message);
                setResult('error');
            }

        } catch (error) {
            console.error(error);
            setResult('error');
        } finally {
            setIsSyncing(false);
        }
    };

    if (result === 'success') {
        return (
            <Button variant="outline" className="w-full sm:w-auto text-green-600 border-green-200 bg-green-50">
                <CheckCircle className="mr-2 h-4 w-4" />
                Factura Recibida
            </Button>
        )
    }

    return (
        <div className="flex flex-col gap-2 items-center w-full">
            <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Conexión con la DIAN</DialogTitle>
                        <DialogDescription>
                            Para sincronizar tus documentos, necesitamos tu Token de acceso de la DIAN.
                            Esta configuración solo se realiza una vez.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="token">Token de Acceso (ID Personalización)</Label>
                            <Input
                                id="token"
                                placeholder="Pega aquí tu token largo..."
                                value={dianToken}
                                onChange={(e) => setDianToken(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Puedes encontrar este token en la URL de 'Consultar' de la página de la DIAN.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowTokenDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSaveTokenAndSync} disabled={!dianToken}>Guardar y Sincronizar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button
                onClick={startSyncProcess}
                disabled={isSyncing}
                className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:scale-105"
            >
                {isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <CloudDownload className="h-4 w-4" />
                )}
                {isSyncing ? 'Conectando con DIAN...' : 'Sincronizar desde la DIAN'}
            </Button>

            {isSyncing && (
                <p className="text-xs text-muted-foreground animate-pulse text-center">
                    Autenticando con token seguro...<br />
                    Consultando servicio web de validación previa...
                </p>
            )}
            {result === 'error' && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Error de conexión o Token inválido
                </p>
            )}
        </div>
    );
}
