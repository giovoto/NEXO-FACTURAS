
'use client';

import { useState, lazy, Suspense, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import type { User } from 'firebase/auth';
import { getUsuariosEmpresaAction } from './actions';
import type { UsuarioEmpresa } from './actions';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { columns } from './columns';
import { Plus } from 'lucide-react';

const InviteUserForm = lazy(() => import('@/components/empresa/invite-user-form').then(module => ({ default: module.InviteUserForm })));

// Helper to get ID token
async function getIdToken(user: User | null): Promise<string> {
    if (!user) return '';
    return user.getIdToken();
}

export default function EmpresaUsuariosPage() {
    const { user, empresaRole, activeEmpresaId } = useAuth();
    const [usuarios, setUsuarios] = useState<UsuarioEmpresa[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setFormOpen] = useState(false);

    const canManage = empresaRole === 'admin';

    const fetchUsers = useCallback(async () => {
        if (!user || !activeEmpresaId || !canManage) {
            setUsuarios([]);
            setIsLoading(false);
            return;
        };
        setIsLoading(true);
        try {
            const idToken = await getIdToken(user);
            const userList = await getUsuariosEmpresaAction(idToken, activeEmpresaId);
            setUsuarios(userList);
        } catch (error) {
            console.error("Failed to fetch company users:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user, activeEmpresaId, canManage]);
    
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const pageColumns = columns({ canManage, empresaId: activeEmpresaId || '' });

    if (!canManage) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <h1 className="text-3xl font-bold tracking-tight">Acceso Denegado</h1>
                <p className="text-muted-foreground">No tienes permisos de administrador para gestionar los usuarios de esta empresa.</p>
            </div>
        );
    }
    
    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
                    <p className="text-muted-foreground">Invita, gestiona roles y revoca el acceso de los miembros de tu empresa.</p>
                </div>
                <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto" disabled={!activeEmpresaId}>
                    <Plus className="mr-2 h-4 w-4" /> 
                    Invitar Usuario
                </Button>
            </div>
            
            <DataTable 
                columns={pageColumns} 
                data={usuarios} 
                isLoading={isLoading}
            />

            <Suspense fallback={<div/>}>
                {isFormOpen && activeEmpresaId && (
                    <InviteUserForm
                        isOpen={isFormOpen}
                        onClose={() => setFormOpen(false)}
                        onSuccess={fetchUsers}
                        empresaId={activeEmpresaId}
                    />
                )}
            </Suspense>
        </div>
    );
}
