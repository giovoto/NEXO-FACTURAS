
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { DataTable } from '@/components/data-table';
import { columns as columnsSalida } from './columns';
import type { Salida } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { getOutgoingsAction } from '../actions';
import type { User } from 'firebase/auth';

// Helper to get ID token
async function getIdToken(user: User | null): Promise<string> {
    if (!user) return '';
    return user.getIdToken();
}


export default function SalidasPage() {
  const { user, activeEmpresaId } = useAuth();
  const [salidas, setSalidas] = useState<Salida[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOutgoings = useCallback(async () => {
    if (!user || !activeEmpresaId) return;
    setIsLoading(true);
    try {
        const idToken = await getIdToken(user);
        const data = await getOutgoingsAction(idToken, activeEmpresaId);
        setSalidas(data);
    } catch (error) {
        console.error("Failed to fetch outgoings", error);
    } finally {
        setIsLoading(false);
    }
  }, [user, activeEmpresaId]);

  useEffect(() => {
    fetchOutgoings();
  }, [fetchOutgoings]);

  const salidaColumns = useMemo(() => columnsSalida, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historial de Salidas</h1>
          <p className="text-muted-foreground">Registro de todos los movimientos de salida de inventario.</p>
        </div>
      </div>
       <DataTable 
        columns={salidaColumns} 
        data={salidas} 
        isLoading={isLoading}
      />
    </div>
  );
}
