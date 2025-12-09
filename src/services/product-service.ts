
// This file is no longer in use. All database operations have been moved to 
// src/app/inventario/actions.ts for improved security and to run on the server.
// This centralization prevents direct client-side database access, enhancing data integrity
// and security by ensuring all modifications go through a controlled server environment.
// The file is kept to avoid breaking existing imports, but its functions are now empty.

export async function getProductsByWarehouse(userId: string, warehouseId?: string): Promise<any[]> {
    console.warn("DEPRECATED: getProductsByWarehouse called from client-side service. Use getProductsByWarehouseAction instead.");
    return [];
}

export async function addProductsBatch(userId: string, products: any[]): Promise<void> {
    console.warn("DEPRECATED: addProductsBatch called from client-side service. Use addProductsBatchAction instead.");
}

export async function createProduct(userId: string, data: any): Promise<any> {
    console.warn("DEPRECATED: createProduct called from client-side service. Use saveProductAction instead.");
    return {};
}

export async function updateProduct(userId: string, productId: string, data: any): Promise<void> {
    console.warn("DEPRECATED: updateProduct called from client-side service. Use saveProductAction instead.");
}

export async function updateProductQuantities(userId: string, updates: any[]): Promise<void> {
    console.warn("DEPRECATED: updateProductQuantities called from client-side service. Use createOutgoingAction instead for stock movements.");
}
