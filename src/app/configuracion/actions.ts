
'use server';

import { db } from '@/lib/firebase-admin';
import { getAuthenticatedUser } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';

export type DatoContable = {
  id: string;
  titulo: string;
  descripcion: string;
};


// --- Parameters Actions ---

const getParamsDoc = (userId: string) => db.collection('users').doc(userId);

export async function getParamsAction(idToken: string, defaultParams: DatoContable[]): Promise<DatoContable[]> {
    const decodedToken = await getAuthenticatedUser(idToken);
    const userId = decodedToken.uid;
    const doc = await getParamsDoc(userId).get();
    const data = doc.data();

    if (!data || !data.parameters) {
        console.log(`No params found for user ${userId}, setting defaults.`);
        await getParamsDoc(userId).set({ parameters: defaultParams }, { merge: true });
        return defaultParams;
    }
    
    // Ensure all default params exist for the user
    const userParams = data.parameters as DatoContable[];
    const userParamIds = new Set(userParams.map(p => p.id));
    const missingParams = defaultParams.filter(p => !userParamIds.has(p.id));

    if (missingParams.length > 0) {
        const updatedParams = [...userParams, ...missingParams];
        await getParamsDoc(userId).set({ parameters: updatedParams }, { merge: true });
        return updatedParams;
    }
    
    return userParams;
}

export async function saveParamsAction(idToken: string, params: DatoContable[]) {
    const decodedToken = await getAuthenticatedUser(idToken);
    const userId = decodedToken.uid;
    await getParamsDoc(userId).set({ parameters: params }, { merge: true });
    revalidatePath('/configuracion');
}
