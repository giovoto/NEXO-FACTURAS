
// This file is no longer in use. All database operations have been moved to 
// src/app/inventario/actions.ts for improved security and to run on the server.
// This centralization prevents direct client-side database access, enhancing data integrity
// and security by ensuring all modifications go through a controlled server environment.
// The file is kept to avoid breaking existing imports, but its functions are now empty.

export async function getOutgoings(userId: string): Promise<any[]> {
    console.warn("DEPRECATED: getOutgoings called from client-side service. Use getOutgoingsAction instead.");
    return [];
}

export async function createOutgoing(userId: string, outgoingData: any): Promise<any> {
     console.warn("DEPRECATED: createOutgoing called from client-side service. Use createOutgoingAction instead.");
    return {};
}
