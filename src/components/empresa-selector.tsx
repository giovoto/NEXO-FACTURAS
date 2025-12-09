
'use client';

import { useState, lazy, Suspense } from 'react';
import { useAuth } from '@/components/auth-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from './ui/skeleton';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';

const CreateEmpresaForm = lazy(() => import('./empresa/create-empresa-form').then(module => ({ default: module.CreateEmpresaForm })));

export function EmpresaSelector() {
  const { activeEmpresaId, userEmpresas, switchEmpresa, isAuthLoading, reloadAuth, user } = useAuth();
  const [isFormOpen, setFormOpen] = useState(false);

  const handleCreateSuccess = (newEmpresaId: string) => {
      setFormOpen(false);
      reloadAuth(); // This will re-fetch user data, including the new company
  }

  if (isAuthLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  const activeEmpresa = userEmpresas.find(e => e.id === activeEmpresaId);

  return (
    <div className="space-y-2">
      <Select onValueChange={switchEmpresa} value={activeEmpresaId || undefined} disabled={userEmpresas.length === 0}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={userEmpresas.length > 0 ? "Selecciona una empresa" : "Crea tu primera empresa"}>
            {activeEmpresa?.nombre}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {userEmpresas.map(e => (
            <SelectItem key={e.id} value={e.id}>
              {e.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" className="w-full" onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Empresa
      </Button>
       <Suspense fallback={<div />}>
        {isFormOpen && user && (
          <CreateEmpresaForm
            isOpen={isFormOpen}
            onClose={() => setFormOpen(false)}
            onSuccess={handleCreateSuccess}
            user={user}
          />
        )}
      </Suspense>
    </div>
  );
}
