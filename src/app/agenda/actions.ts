
'use server';

import { db } from '@/lib/firebase-admin';
import { getAuthenticatedUser } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { Contacto } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';

// --- Contact Actions ---

const getContactsCol = (empresaId: string) => db.collection('empresas').doc(empresaId).collection('contacts');

export async function getContactsAction(idToken: string, empresaId: string): Promise<Contacto[]> {
    await getAuthenticatedUser(idToken, empresaId); // Viewers can see contacts
    const snapshot = await getContactsCol(empresaId).orderBy('proveedor').get();
    
    if (snapshot.empty) {
        console.log(`No contacts found for company ${empresaId}, creating initial contact.`);
        const initialContact = {
            proveedor: 'Proveedor de Ejemplo S.A.S',
            identificacion: '900123456-7',
            email: 'ejemplo@proveedor.com',
            telefono: '3001234567',
        };
        const docRef = await getContactsCol(empresaId).add(initialContact);
        return [{ id: docRef.id, ...initialContact }];
    }
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contacto));
}

export async function saveContactAction(idToken: string, empresaId: string, data: Omit<Contacto, 'id' | 'userId'> | Omit<Contacto, 'userId'>) {
    const caller = await getAuthenticatedUser(idToken, empresaId, ['admin', 'editor']);
    if ('id' in data) {
        // Update
        const { id, ...updateData } = data;
        await getContactsCol(empresaId).doc(id).update(updateData);
    } else {
        // Create
        await getContactsCol(empresaId).add(data);
    }
    revalidatePath('/agenda');
}


export async function deleteContactAction(idToken: string, empresaId: string, contactId: string) {
    const caller = await getAuthenticatedUser(idToken, empresaId, ['admin', 'editor']);
    await getContactsCol(empresaId).doc(contactId).delete();
    revalidatePath('/agenda');
}

export async function findOrCreateContactAction(idToken: string, empresaId: string, contactData: {
    identificacion: string,
    proveedor: string,
    email?: string | null,
    telefono?: string | null,
}): Promise<Contacto> {
    await getAuthenticatedUser(idToken, empresaId, ['admin', 'editor']);
    const contactsCol = getContactsCol(empresaId);

    const snapshot = await contactsCol.where('identificacion', '==', contactData.identificacion).limit(1).get();

    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const existingContact = { id: doc.id, ...doc.data() } as Contacto;
        
        // Update with new info if provided
        const updateData: Partial<Contacto> = {};
        if (contactData.proveedor && contactData.proveedor !== existingContact.proveedor) {
            updateData.proveedor = contactData.proveedor;
        }
        if (contactData.email && contactData.email !== existingContact.email) {
            updateData.email = contactData.email;
        }
        if (contactData.telefono && contactData.telefono !== existingContact.telefono) {
            updateData.telefono = contactData.telefono;
        }

        if (Object.keys(updateData).length > 0) {
            await doc.ref.update(updateData);
        }

        return { ...existingContact, ...updateData };
    } else {
        const docRef = await contactsCol.add(contactData);
        return { id: docRef.id, ...contactData };
    }
}
