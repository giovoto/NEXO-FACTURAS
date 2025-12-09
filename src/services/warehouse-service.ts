
// This file is no longer in use. All database operations have been moved to 
// src/app/inventario/actions.ts for improved security and to run on the server.
// This centralization prevents direct client-side database access, enhancing data integrity
// and security by ensuring all modifications go through a controlled server environment.
// The file is kept to avoid breaking existing imports, but its functions are now empty.

export async function getWarehouses(userId: string): Promise<any[]> {
    console.warn("DEPRECATED: getWarehouses called from client-side service. Use getWarehousesAction instead.");
    return [];
}

export async function getWarehouseById(userId: string, id: string): Promise<any | undefined> {
    console.warn("DEPRECATED: getWarehouseById called from client-side service. Use getWarehouseDetailsAction instead.");
    return undefined;
}

export async function createWarehouse(userId: string, data: any): Promise<any> {
    console.warn("DEPRECATED: createWarehouse called from client-side service. Use saveWarehouseAction instead.");
    return {};
}

export async function updateWarehouse(userId: string, warehouseId: string, data: any): Promise<void> {
    console.warn("DEPRECATED: updateWarehouse called from client-side service. Use saveWarehouseAction instead.");
}

export async function deleteWarehouse(userId: string, warehouseId: string): Promise<void> {
    console.warn("DEPRECATED: deleteWarehouse called from client-side service. Use deleteWarehouseAction instead.");
}
