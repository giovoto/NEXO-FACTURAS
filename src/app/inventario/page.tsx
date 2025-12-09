
'use client';

import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Warehouse as WarehouseIcon, MapPin, Package, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import type { Bodega } from '@/lib/types';
import { getWarehousesAction, saveWarehouseAction, deleteWarehouseAction } from './actions';
import type { User } from 'firebase/auth';

const WarehouseForm = lazy(() => import('@/components/inventario/warehouse-form').then(module => ({ default: module.WarehouseForm })));

type WarehouseWithProductCount = Bodega & { productCount: number };

// Helper to get ID token
async function getIdToken(user: User | null): Promise<string> {
    if (!user) return '';
    return user.getIdToken();
}

export default function InventarioPage() {
  const router = useRouter();
  const { user, activeEmpresaId, empresaRole } = useAuth();
  const [warehouses, setWarehouses] = useState<WarehouseWithProductCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Bodega | undefined>(undefined);

  const canEdit = empresaRole === 'admin' || empresaRole === 'editor';
  const canDelete = empresaRole === 'admin';

  const fetchWarehouses = useCallback(async () => {
    if (!user || !activeEmpresaId) return;
    setIsLoading(true);
    try {
      const idToken = await getIdToken(user);
      const warehousesWithCounts = await getWarehousesAction(idToken, activeEmpresaId);
      setWarehouses(warehousesWithCounts);
    } catch (error) {
      console.error("Failed to fetch warehouses with counts", error);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeEmpresaId]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);


  const handleOpenForm = (warehouse?: Bodega) => {
    if (!canEdit) return;
    setSelectedWarehouse(warehouse);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setSelectedWarehouse(undefined);
    setIsFormOpen(false);
  };

  const handleSaveWarehouse = async (data: Omit<Bodega, 'id' | 'userId'> | Bodega) => {
    if (!user || !activeEmpresaId || !canEdit) return;
    try {
        const idToken = await getIdToken(user);
        await saveWarehouseAction(idToken, activeEmpresaId, data);
        await fetchWarehouses(); // Re-fetch all data to update UI
    } catch (error) {
        console.error("Failed to save warehouse", error);
    } finally {
        handleCloseForm();
    }
  };

  const handleDeleteWarehouse = async (warehouseId: string, warehouseName: string) => {
    if (!user || !activeEmpresaId || !canDelete) return;
    if (window.confirm(`¿Estás seguro de que quieres eliminar la bodega "${warehouseName}"? Se borrarán también todos los productos que contiene.`)) {
        try {
            const idToken = await getIdToken(user);
            await deleteWarehouseAction(idToken, activeEmpresaId, warehouseId);
            await fetchWarehouses();
        } catch (error) {
            console.error("Failed to delete warehouse", error);
            alert("Ocurrió un error al eliminar la bodega.");
        }
    }
  }
  
  const handleViewInventory = (warehouseId: string) => {
    router.push(`/inventario/${warehouseId}`);
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Bodegas</h1>
          <p className="text-muted-foreground">Crea y administra tus bodegas para organizar el inventario.</p>
        </div>
        {canEdit && (
            <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto" data-tour-id="new-warehouse" disabled={!activeEmpresaId}>
              <Plus className="mr-2 h-4 w-4" /> 
              Crear Nueva Bodega
            </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {warehouses.length > 0 ? warehouses.map(warehouse => (
              <Card key={warehouse.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <WarehouseIcon className="w-6 h-6 text-primary" />
                    {warehouse.nombre}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 pt-1">
                    <MapPin className="w-4 h-4" />
                    {warehouse.ubicacion}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                   <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        <span>{warehouse.productCount} {warehouse.productCount === 1 ? 'producto' : 'productos'} en inventario</span>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full" onClick={() => handleViewInventory(warehouse.id)}>Ver Inventario</Button>
                    {(canEdit || canDelete) && (
                        <div className="w-full flex gap-2">
                            {canEdit && <Button variant="outline" className="w-full" onClick={() => handleOpenForm(warehouse)}>Editar</Button>}
                            {canDelete && <Button variant="destructive" className="w-full" onClick={() => handleDeleteWarehouse(warehouse.id, warehouse.nombre)}>Eliminar</Button>}
                        </div>
                    )}
                </CardFooter>
              </Card>
           )) : (
             <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-16 border-2 border-dashed rounded-lg">
                <WarehouseIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No hay bodegas creadas</h3>
                <p className="mt-1 text-sm text-muted-foreground">Empieza por crear tu primera bodega para añadir productos.</p>
            </div>
            )}
        </div>
      )}

      <Suspense fallback={<div />}>
        {isFormOpen && (
          <WarehouseForm
            isOpen={isFormOpen}
            onClose={handleCloseForm}
            onSubmit={handleSaveWarehouse}
            defaultValues={selectedWarehouse}
            canEdit={canEdit}
          />
        )}
      </Suspense>
    </div>
  );
}
