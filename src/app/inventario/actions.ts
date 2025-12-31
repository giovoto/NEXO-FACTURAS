'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import type { Bodega, Producto, Salida } from '@/lib/types';
import type { Database } from '@/types/database.types';

// ============================================
// WAREHOUSE (BODEGAS) CRUD
// ============================================

export async function getWarehousesAction(empresaId: string): Promise<(Bodega & { productCount: number })[]> {
    try {
        // Obtener bodegas con conteo de productos
        const { data: warehouses, error } = await supabase
            .from('warehouses')
            .select('id, nombre, ubicacion, descripcion')
            .eq('empresa_id', empresaId)
            .order('nombre');

        if (error) {
            console.error('Error fetching warehouses:', error);
            throw new Error(`Error al obtener bodegas: ${error.message}`);
        }

        if (!warehouses || warehouses.length === 0) {
            // Crear bodegas iniciales
            console.log(`No warehouses found for company ${empresaId}, creating initial set.`);
            const initialData = [
                { empresa_id: empresaId, nombre: 'Bodega Principal', ubicacion: 'Zona Industrial, Bogotá' },
                { empresa_id: empresaId, nombre: 'Punto de Venta Centro', ubicacion: 'Cra 7 # 15-30, Bogotá' },
            ];

            const { data: newWarehouses, error: insertError } = await supabase
                .from('warehouses')
                .insert(initialData)
                .select();

            if (insertError) {
                throw new Error(`Error creating initial warehouses: ${insertError.message}`);
            }

            return (newWarehouses || []).map(w => ({ ...w, productCount: 0 }));
        }

        // Contar productos por bodega
        const warehousesWithCount = await Promise.all(
            warehouses.map(async (warehouse) => {
                const { count } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .eq('warehouse_id', warehouse.id);

                return {
                    ...warehouse,
                    productCount: count || 0,
                };
            })
        );

        return warehousesWithCount as (Bodega & { productCount: number })[];
    } catch (error: any) {
        console.error('Error in getWarehousesAction:', error);
        throw error;
    }
}

export async function saveWarehouseAction(empresaId: string, data: Omit<Bodega, 'id' | 'userId'> | Bodega) {
    try {
        if ('id' in data) {
            // Update
            const { id, ...updateData } = data;
            const { error } = await supabase
                .from('warehouses')
                .update({
                    nombre: updateData.nombre,
                    ubicacion: updateData.ubicacion,
                })
                .eq('id', id)
                .eq('empresa_id', empresaId);

            if (error) {
                throw new Error(`Error updating warehouse: ${error.message}`);
            }
        } else {
            // Create
            const { error } = await supabase
                .from('warehouses')
                .insert({
                    empresa_id: empresaId,
                    ...data,
                });

            if (error) {
                throw new Error(`Error creating warehouse: ${error.message}`);
            }
        }

        revalidatePath('/inventario');
    } catch (error: any) {
        console.error('Error in saveWarehouseAction:', error);
        throw error;
    }
}

export async function deleteWarehouseAction(empresaId: string, warehouseId: string) {
    try {
        // PostgreSQL CASCADE will handle deleting products automatically
        const { error } = await supabase
            .from('warehouses')
            .delete()
            .eq('id', warehouseId)
            .eq('empresa_id', empresaId);

        if (error) {
            throw new Error(`Error deleting warehouse: ${error.message}`);
        }

        revalidatePath('/inventario');
    } catch (error: any) {
        console.error('Error in deleteWarehouseAction:', error);
        throw error;
    }
}

// ============================================
// PRODUCT (PRODUCTOS) CRUD
// ============================================

export async function getProductsByWarehouseAction(empresaId: string, warehouseId: string): Promise<Producto[]> {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .eq('empresa_id', empresaId)
            .eq('warehouse_id', warehouseId);

        if (error) {
            throw new Error(`Error fetching products: ${error.message}`);
        }

        return (products || []).map(p => ({
            id: p.id,
            warehouseId: p.warehouse_id,
            producto: p.nombre,
            codigo: p.codigo,
            descripcion: p.descripcion,
            cantidad: p.cantidad,
            precioUnitario: p.precio_unitario,
            unidadMedida: p.unidad_medida,
        })) as Producto[];
    } catch (error: any) {
        console.error('Error in getProductsByWarehouseAction:', error);
        throw error;
    }
}

export async function getWarehouseDetailsAction(empresaId: string, warehouseId: string): Promise<{ name: string, warehouses: Bodega[] }> {
    try {
        // Get specific warehouse
        const { data: warehouse, error: warehouseError } = await supabase
            .from('warehouses')
            .select('nombre')
            .eq('id', warehouseId)
            .eq('empresa_id', empresaId)
            .single();

        if (warehouseError) {
            throw new Error('Warehouse not found');
        }

        // Get all warehouses for navigation
        const { data: allWarehouses, error: allError } = await supabase
            .from('warehouses')
            .select('id, nombre, ubicacion, descripcion')
            .eq('empresa_id', empresaId);

        if (allError) {
            throw new Error(`Error fetching warehouses: ${allError.message}`);
        }

        return {
            name: warehouse.nombre || 'N/A',
            warehouses: (allWarehouses || []) as Bodega[],
        };
    } catch (error: any) {
        console.error('Error in getWarehouseDetailsAction:', error);
        throw error;
    }
}

export async function saveProductAction(empresaId: string, data: Omit<Producto, 'id' | 'userId'> | Omit<Producto, 'userId'>) {
    try {
        if ('id' in data) {
            // Update
            const { id, ...updateData } = data;
            const { error } = await supabase
                .from('products')
                .update({
                    nombre: updateData.producto,
                    codigo: updateData.codigo,
                    descripcion: updateData.descripcion,
                    cantidad: updateData.cantidad,
                    precio_unitario: updateData.precioUnitario,
                    unidad_medida: updateData.unidadMedida,
                    warehouse_id: updateData.warehouseId,
                })
                .eq('id', id)
                .eq('empresa_id', empresaId);

            if (error) {
                throw new Error(`Error updating product: ${error.message}`);
            }
        } else {
            // Create
            const { error } = await supabase
                .from('products')
                .insert({
                    empresa_id: empresaId,
                    warehouse_id: data.warehouseId,
                    nombre: data.producto,
                    codigo: data.codigo,
                    descripcion: data.descripcion,
                    cantidad: data.cantidad,
                    precio_unitario: data.precioUnitario,
                    unidad_medida: data.unidadMedida,
                });

            if (error) {
                throw new Error(`Error creating product: ${error.message}`);
            }
        }

        revalidatePath(`/inventario/${data.warehouseId}`);
    } catch (error: any) {
        console.error('Error in saveProductAction:', error);
        throw error;
    }
}

export async function addProductsBatchAction(empresaId: string, products: Omit<Producto, 'id' | 'userId'>[]) {
    try {
        const productsToInsert = products.map(p => ({
            empresa_id: empresaId,
            warehouse_id: p.warehouseId,
            nombre: p.producto,
            codigo: p.codigo,
            descripcion: p.descripcion,
            cantidad: p.cantidad,
            precio_unitario: p.precioUnitario,
            unidad_medida: p.unidadMedida,
        }));

        const { error } = await supabase
            .from('products')
            .insert(productsToInsert);

        if (error) {
            throw new Error(`Error adding products batch: ${error.message}`);
        }

        const warehouseId = products[0]?.warehouseId;
        if (warehouseId) {
            revalidatePath(`/inventario/${warehouseId}`);
        }
    } catch (error: any) {
        console.error('Error in addProductsBatchAction:', error);
        throw error;
    }
}

// ============================================
// OUTGOINGS (SALIDAS) CRUD
// ============================================

export async function getOutgoingsAction(empresaId: string): Promise<Salida[]> {
    try {
        const { data: outgoings, error } = await supabase
            .from('outgoings')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Error fetching outgoings: ${error.message}`);
        }

        const typedOutgoings = (outgoings as unknown) as Database['public']['Tables']['outgoings']['Row'][];

        return typedOutgoings.map(o => ({
            id: o.id,
            productId: o.product_id || '',
            productName: o.product_id || 'Producto Desconocido', // Should ideally join
            warehouseId: o.warehouse_id || '',
            warehouseName: o.warehouse_id || 'Bodega Desconocida', // Should ideally join
            quantity: o.cantidad,
            destinatario: o.destino || '',
            date: o.created_at,
            userId: o.created_by || '',
        })) as Salida[];
    } catch (error: any) {
        console.error('Error in getOutgoingsAction:', error);
        throw error;
    }
}

export async function createOutgoingAction(
    empresaId: string,
    destinatario: string,
    productsToUpdate: { product: Producto, quantity: number }[]
) {
    try {
        for (const { product, quantity } of productsToUpdate) {
            // 1. Create outgoing record
            const { error: outgoingError } = await supabase
                .from('outgoings')
                .insert({
                    empresa_id: empresaId,
                    product_id: product.id,
                    warehouse_id: product.warehouseId,
                    cantidad: quantity,
                    destino: destinatario,
                    motivo: 'Salida de inventario',
                } as any);

            if (outgoingError) {
                throw new Error(`Error creating outgoing: ${outgoingError.message}`);
            }

            // 2. Decrement product quantity
            const { error: updateError } = await supabase
                .from('products')
                .update({ cantidad: product.cantidad - quantity })
                .eq('id', product.id)
                .eq('empresa_id', empresaId);

            if (updateError) {
                throw new Error(`Error updating product quantity: ${updateError.message}`);
            }
        }

        revalidatePath('/inventario/salidas');
        const warehouseId = productsToUpdate[0]?.product.warehouseId;
        if (warehouseId) {
            revalidatePath(`/inventario/${warehouseId}`);
        }
    } catch (error: any) {
        console.error('Error in createOutgoingAction:', error);
        throw error;
    }
}
