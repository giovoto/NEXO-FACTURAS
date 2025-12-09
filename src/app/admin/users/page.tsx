
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, ShieldCheck } from 'lucide-react';
import { setSuperAdminAction } from '@/app/actions';
import { User } from 'firebase/auth';

// Helper to get ID token
async function getIdToken(user: User | null, forceRefresh = false): Promise<string> {
    if (!user) return '';
    return user.getIdToken(forceRefresh);
}


export default function AdminUsersPage() {
    const { user, userRole } = useAuth();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSetSuperAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setError("No estás autenticado.");
            return;
        }
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            const idToken = await getIdToken(user, true);
            const result = await setSuperAdminAction(idToken, email);
            if (result.success) {
                setMessage(result.message);
            } else {
                setError(result.error || 'Ocurrió un error desconocido.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Protect the route client-side as well
    if (userRole !== 'superadmin') {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Acceso Denegado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>No tienes los permisos necesarios para acceder a esta página.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>

            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-primary" />
                        Asignar Rol de Superadministrador
                    </CardTitle>
                    <CardDescription>
                        Introduce el correo electrónico de un usuario existente para concederle privilegios de superadministrador. Esta acción es irreversible a través de la interfaz.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSetSuperAdmin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo del Usuario</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="usuario@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isLoading ? 'Asignando...' : 'Convertir en Super Admin'}
                        </Button>
                        {message && <p className="text-sm text-green-600">{message}</p>}
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
