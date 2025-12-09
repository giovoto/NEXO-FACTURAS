
'use client';

import { useState, useEffect, useMemo, lazy, Suspense, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Upload, ArrowRightFromLine, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { buildColumns } from '../columns';
import type { Producto, Bodega } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import {
    getProductsByWarehouseAction,
    addProductsBatchAction,
    saveProductAction,
    getWarehouseDetailsAction,
} from '../actions';
import type { User } from 'firebase/auth';

const ProductForm = lazy(() => import('@/components/inventario/product-form').then(module => ({ default: module.ProductForm })));
const ImportWizard = lazy(() => import('@/components/inventario/import-wizard').then(module => ({ default: module.ImportWizard })));
const ProductOutForm = lazy(() => import('@/components/inventario/product-out-form').then(module => ({ default: module.ProductOutForm })));

// Helper to get ID token
async function getIdToken(user: User | null): Promise<string> {
    if (!user) return '';
    return user.getIdToken();
}

export default function WarehouseInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const warehouseId = params.id as string;
  const { user, activeEmpresaId, empresaRole } = useAuth();

  const [warehouseName, setWarehouseName] = useState('');
  const [warehouses, setWarehouses] = useState<Bodega[]>([]);
  const [products, setProducts] = useState<Producto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setImportOpen] = useState(false);
  const [isOutFormOpen, setOutFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | undefined>(undefined);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const canEdit = empresaRole === 'admin' || empresaRole === 'editor';

  const selectedProducts = useMemo(() => 
    Object.keys(rowSelection).filter(id => rowSelection[id]).map(id => products.find(p => p.id === id)).filter(Boolean) as Producto[],
    [rowSelection, products]
  );
  
  const fetchData = useCallback(async () => {
    if (!warehouseId || !user || !activeEmpresaId) return;
    setIsLoading(true);
    try {
        const idToken = await getIdToken(user);
        const [warehouseDetails, fetchedProducts] = await Promise.all([
            getWarehouseDetailsAction(idToken, activeEmpresaId, warehouseId),
            getProductsByWarehouseAction(idToken, activeEmpresaId, warehouseId)
        ]);
        
        setWarehouseName(warehouseDetails.name);
        setWarehouses(warehouseDetails.warehouses);
        setProducts(fetchedProducts);
    } catch (error) {
        console.error("Failed to fetch warehouse data", error);
        setWarehouseName('Bodega no encontrada');
    } finally {
        setIsLoading(false);
    }
  }, [warehouseId, user, activeEmpresaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  

  const productColumns = useMemo(() => buildColumns({ onEdit: (product) => handleOpenForm(product), data: products, canEdit }), [products, canEdit]);
  
  const handleOpenForm = (product?: Producto) => {
    if (!canEdit) return;
    setSelectedProduct(product);
    setIsFormOpen(true);
  };
  
  const handleCloseForm = () => {
    setSelectedProduct(undefined);
    setIsFormOpen(false);
    setOutFormOpen(false);
    setRowSelection({});
  };

  const handleSaveProduct = async (data: Omit<Producto, 'id' | 'userId' | 'warehouseId'> | Omit<Producto, 'userId' | 'warehouseId'>) => {
    if (!user || !activeEmpresaId || !canEdit) return;
    try {
        const idToken = await getIdToken(user);
        if ('id' in data) {
            await saveProductAction(idToken, activeEmpresaId, data);
        } else {
            const newProductData = { ...data, warehouseId };
            await saveProductAction(idToken, activeEmpresaId, newProductData);
        }
        await fetchData();
    } catch (error) {
        console.error("Failed to save product", error);
    } finally {
        handleCloseForm();
    }
  };
  
  const handleImportComplete = async (newProducts: Omit<Producto, 'id' | 'userId' | 'warehouseId'>[]) => {
    if (!user || !activeEmpresaId || !canEdit) return;
    const productsToCreate = newProducts.map(p => ({ ...p, warehouseId }));
    try {
        const idToken = await getIdToken(user);
        await addProductsBatchAction(idToken, activeEmpresaId, productsToCreate);
        await fetchData();
    } catch (error) {
        console.error("Failed to import products", error);
    } finally {
        setImportOpen(false);
    }
  }
  
  const handleOutComplete = async () => {
    await fetchData();
    handleCloseForm();
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.push('/inventario')} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Bodegas
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Inventario de: {warehouseName}</h1>
          <p className="text-muted-foreground">Gestiona los productos de esta bodega.</p>
        </div>
        {canEdit && (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                 <Button variant="secondary" onClick={() => setOutFormOpen(true)} className="w-full sm:w-auto" disabled={selectedProducts.length === 0}>
                  <ArrowRightFromLine className="mr-2 h-4 w-4" /> 
                  Registrar Salida
                </Button>
                <Button variant="outline" onClick={() => setImportOpen(true)} className="w-full sm:w-auto">
                  <Upload className="mr-2 h-4 w-4" /> 
                  Importar Inventario
                </Button>
                <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> 
                  Añadir Producto
                </Button>
            </div>
        )}
      </div>
      
      <DataTable 
        columns={productColumns} 
        data={products} 
        isLoading={isLoading}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        canEdit={canEdit}
      />

      <Suspense fallback={<div />}>
        {isFormOpen && (
          <ProductForm
            isOpen={isFormOpen}
            onClose={handleCloseForm}
            onSubmit={handleSaveProduct}
            defaultValues={selectedProduct}
            canEdit={canEdit}
          />
        )}
        {isImportOpen && (
            <ImportWizard 
                isOpen={isImportOpen}
                onClose={() => setImportOpen(false)}
                onComplete={handleImportComplete}
            />
        )}
        {isOutFormOpen && user && activeEmpresaId && (
            <ProductOutForm
                isOpen={isOutFormOpen}
                onClose={handleCloseForm}
                onComplete={handleOutComplete}
                selectedProducts={selectedProducts}
                warehouses={warehouses}
                user={user}
                empresaId={activeEmpresaId}
                canEdit={canEdit}
            />
        )}
      </Suspense>
    </div>
  );
}
