
'use server';

import { db } from '@/lib/firebase-admin';
import { getAuthenticatedUser } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Bodega, Producto, Salida } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';


// --- Warehouse Actions ---

const getWarehousesCol = (empresaId: string) => db.collection('empresas').doc(empresaId).collection('warehouses');
const getProductsCol = (empresaId: string) => db.collection('empresas').doc(empresaId).collection('products');
const getOutgoingsCol = (empresaId: string) => db.collection('empresas').doc(empresaId).collection('outgoings');


export async function getWarehousesAction(idToken: string, empresaId: string): Promise<(Bodega & { productCount: number })[]> {
    await getAuthenticatedUser(idToken, empresaId); // Viewer can see warehouses
    
    const warehousesSnapshot = await getWarehousesCol(empresaId).orderBy('nombre').get();
    const productsSnapshot = await getProductsCol(empresaId).get();

    const productCounts = new Map<string, number>();
    productsSnapshot.forEach(doc => {
        const product = doc.data() as Producto;
        if (product.warehouseId) {
            productCounts.set(product.warehouseId, (productCounts.get(product.warehouseId) || 0) + 1);
        }
    });

    if (warehousesSnapshot.empty) {
         console.log(`No warehouses found for company ${empresaId}, creating initial set.`);
         const initialData = [
            { nombre: 'Bodega Principal', ubicacion: 'Zona Industrial, Bogotá' },
            { nombre: 'Punto de Venta Centro', ubicacion: 'Cra 7 # 15-30, Bogotá' },
         ];
         const batch = db.batch();
         const newWarehouses: (Bodega & { productCount: number })[] = [];
         
         initialData.forEach(bodega => {
             const docRef = getWarehousesCol(empresaId).doc();
             batch.set(docRef, bodega);
             newWarehouses.push({ id: docRef.id, ...bodega, productCount: 0 });
         });
         
         await batch.commit();
         return newWarehouses;
    }

    return warehousesSnapshot.docs.map(doc => {
        const warehouse = { id: doc.id, ...doc.data() } as Bodega;
        return {
            ...warehouse,
            productCount: productCounts.get(warehouse.id) || 0,
        };
    });
}

export async function saveWarehouseAction(idToken: string, empresaId: string, data: Omit<Bodega, 'id' | 'userId'> | Bodega) {
    const caller = await getAuthenticatedUser(idToken, empresaId, ['admin', 'editor']);
    if ('id' in data) {
        // Update
        const { id, ...updateData } = data;
        await getWarehousesCol(empresaId).doc(id).update({
            nombre: updateData.nombre,
            ubicacion: updateData.ubicacion,
        });
    } else {
        // Create
        await getWarehousesCol(empresaId).add(data);
    }
    revalidatePath('/inventario');
}


export async function deleteWarehouseAction(idToken: string, empresaId: string, warehouseId: string) {
    const caller = await getAuthenticatedUser(idToken, empresaId, ['admin']);
    const batch = db.batch();
    
    // Delete products in warehouse
    const productsSnapshot = await getProductsCol(empresaId).where('warehouseId', '==', warehouseId).get();
    productsSnapshot.forEach(doc => batch.delete(doc.ref));

    // Delete warehouse
    const warehouseRef = getWarehousesCol(empresaId).doc(warehouseId);
    batch.delete(warehouseRef);

    await batch.commit();
    revalidatePath('/inventario');
}


// --- Product Actions ---

export async function getProductsByWarehouseAction(idToken: string, empresaId: string, warehouseId: string): Promise<Producto[]> {
    await getAuthenticatedUser(idToken, empresaId);
    const snapshot = await getProductsCol(empresaId).where('warehouseId', '==', warehouseId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Producto));
}

export async function getWarehouseDetailsAction(idToken: string, empresaId: string, warehouseId: string): Promise<{name: string, warehouses: Bodega[]}> {
    await getAuthenticatedUser(idToken, empresaId);
    const warehouseDoc = await getWarehousesCol(empresaId).doc(warehouseId).get();
    if (!warehouseDoc.exists) {
        throw new Error("Warehouse not found");
    }
    
    const allWarehousesSnapshot = await getWarehousesCol(empresaId).get();
    const allWarehouses = allWarehousesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bodega));

    return {
        name: warehouseDoc.data()?.nombre || 'N/A',
        warehouses: allWarehouses
    };
}


export async function saveProductAction(idToken: string, empresaId: string, data: Omit<Producto, 'id' | 'userId'> | Omit<Producto, 'userId'>) {
    const caller = await getAuthenticatedUser(idToken, empresaId, ['admin', 'editor']);
     if ('id' in data) {
        // Update
        const { id, ...updateData } = data;
        await getProductsCol(empresaId).doc(id).update(updateData);
    } else {
        // Create
        await getProductsCol(empresaId).add(data);
    }
    revalidatePath(`/inventario/${data.warehouseId}`);
}

export async function addProductsBatchAction(idToken: string, empresaId: string, products: Omit<Producto, 'id' | 'userId'>[]) {
    const caller = await getAuthenticatedUser(idToken, empresaId, ['admin', 'editor']);
    const batch = db.batch();
    let warehouseId = '';
    products.forEach(productData => {
        const docRef = getProductsCol(empresaId).doc();
        batch.set(docRef, productData);
        if (!warehouseId) warehouseId = productData.warehouseId;
    });
    await batch.commit();
    if (warehouseId) {
        revalidatePath(`/inventario/${warehouseId}`);
    }
}

// --- Outgoings Actions ---

export async function getOutgoingsAction(idToken: string, empresaId: string): Promise<Salida[]> {
    await getAuthenticatedUser(idToken, empresaId);
    const snapshot = await getOutgoingsCol(empresaId).orderBy('date', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Salida));
}

export async function createOutgoingAction(
    idToken: string,
    empresaId: string,
    destinatario: string,
    productsToUpdate: { product: Producto, quantity: number }[]
) {
    const caller = await getAuthenticatedUser(idToken, empresaId, ['admin', 'editor']);
    const userId = caller.uid;
    const batch = db.batch();

    // Fetch all warehouse names once to avoid multiple reads
    const warehousesSnapshot = await getWarehousesCol(empresaId).get();
    const warehouseNames = new Map(warehousesSnapshot.docs.map(doc => [doc.id, doc.data().nombre]));

    productsToUpdate.forEach(({ product, quantity }) => {
        // 1. Create outgoing record
        const outgoingRef = getOutgoingsCol(empresaId).doc();
        batch.set(outgoingRef, {
            productId: product.id,
            productName: product.producto,
            warehouseId: product.warehouseId,
            warehouseName: warehouseNames.get(product.warehouseId) || 'N/A',
            quantity: quantity,
            destinatario: destinatario,
            date: new Date().toISOString(),
            userId
        });

        // 2. Decrement product quantity
        const productRef = getProductsCol(empresaId).doc(product.id);
        batch.update(productRef, { cantidad: FieldValue.increment(-quantity) });
    });

    await batch.commit();
    revalidatePath('/inventario/salidas');
    const warehouseId = productsToUpdate[0]?.product.warehouseId;
    if (warehouseId) {
        revalidatePath(`/inventario/${warehouseId}`);
    }
}
