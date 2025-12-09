
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Shield, Trash2, MoreHorizontal } from 'lucide-react';
import { UsuarioEmpresa } from './actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { updateUserRoleAction, removeUserFromEmpresaAction } from './actions';
import { useAuth } from '@/components/auth-provider';
import type { User } from 'firebase/auth';

type GetColumnsProps = {
  canManage: boolean;
  empresaId: string;
}

const roles: {value: 'admin' | 'editor' | 'viewer', label: string}[] = [
    { value: 'admin', label: 'Administrador' },
    { value: 'editor', label: 'Editor' },
    { value: 'viewer', label: 'Visualizador' },
];

// Helper to get ID token
async function getIdToken(user: User | null): Promise<string> {
    if (!user) return '';
    return user.getIdToken();
}


export const columns = ({ canManage, empresaId }: GetColumnsProps): ColumnDef<UsuarioEmpresa>[] => [
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Email
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
     cell: ({ row }) => (
        <div className="pl-4">
            <div className="font-medium">{row.original.email}</div>
            <div className="text-xs text-muted-foreground">{row.original.displayName}</div>
        </div>
     ),
  },
  {
    accessorKey: 'rol',
    header: 'Rol',
    cell: ({ row }) => {
        const roleLabel = roles.find(r => r.value === row.original.rol)?.label || 'N/A';
        return <div className="font-medium capitalize">{roleLabel}</div>
    }
  },
  {
    id: 'acciones',
    cell: ({ row }) => {
        const { user } = useAuth();
        const usuario = row.original;

        const handleRoleChange = async (newRole: 'admin' | 'editor' | 'viewer') => {
            if (!user || !empresaId) return;
            try {
                const idToken = await getIdToken(user);
                await updateUserRoleAction(idToken, empresaId, usuario.uid, newRole);
                // The page will re-fetch data upon success
            } catch (error: any) {
                alert(`Error: ${error.message}`);
            }
        };

        const handleRemove = async () => {
             if (!user || !empresaId) return;
             if (window.confirm(`¿Estás seguro de que quieres revocar el acceso de ${usuario.email} a esta empresa?`)) {
                 try {
                    const idToken = await getIdToken(user);
                    await removeUserFromEmpresaAction(idToken, empresaId, usuario.uid);
                 } catch (error: any) {
                    alert(`Error: ${error.message}`);
                 }
             }
        }
      
        if (!canManage || user?.uid === usuario.uid) return null; // Can't edit yourself

        return (
            <div className="text-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Cambiar Rol</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                             <DropdownMenuSubContent>
                                {roles.map(role => (
                                    <DropdownMenuItem key={role.value} onClick={() => handleRoleChange(role.value)}>
                                        {role.label}
                                    </DropdownMenuItem>
                                ))}
                             </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuItem onClick={handleRemove} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Revocar Acceso
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
