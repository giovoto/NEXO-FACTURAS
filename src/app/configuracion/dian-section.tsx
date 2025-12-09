'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SettingsCard } from '@/components/settings-card';
import { FileText, Loader2, Save, Key } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useLogs } from '@/lib/logger';
// import { saveDianCredentialsAction } from '@/app/actions'; // To be implemented

export function DianSection() {
    const { user } = useAuth();
    const { addLog } = useLogs();
    const [isLoading, setIsLoading] = useState(false);
    const [token, setToken] = useState('');
    const [softwareId, setSoftwareId] = useState('');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsLoading(true);
        try {
            // Simulate saving
            await new Promise(r => setTimeout(r, 1000));
            // await saveDianCredentialsAction(token, softwareId); 
            addLog('SUCCESS', 'Credenciales DIAN guardadas (Simulado).');
            alert('Configuración DIAN guardada.');
        } catch (error) {
            console.error(error);
            addLog('ERROR', 'Error al guardar credenciales DIAN.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SettingsCard
            title="Conexión DIAN"
            description="Configura el acceso para descargar reportes de facturación electrónica."
            icon={FileText}
        >
            <form onSubmit={handleSave} className="mt-4 border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="dian-token">Token de Acceso (Token de 'Habilitación' o Pruebas)</Label>
                        <div className="relative">
                            <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="dian-token"
                                placeholder="Pegar el token aquí..."
                                className="pl-9"
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Este token suele ser enviado al correo registrado en el RUT para acceder a las pruebas.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="software-id">ID de Software (Opcional)</Label>
                        <Input
                            id="software-id"
                            placeholder="Identificador del software..."
                            value={softwareId}
                            onChange={(e) => setSoftwareId(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Configuración
                    </Button>
                </div>
            </form>
        </SettingsCard>
    );
}
