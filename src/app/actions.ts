
'use server';

import 'server-only';
import { z } from 'zod';
import type { Factura, UserRole, Empresa } from '@/lib/types';
import { createPurchaseInvoice } from '@/lib/server/siigo-actions';
import { parseInvoiceZip } from '@/services/zip-service';
import { getAuthenticatedUser, db, authAdmin } from '@/lib/firebase-admin';
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp, getDoc, doc, updateDoc, Timestamp, writeBatch, setDoc } from 'firebase/firestore';
import { processRecentEmails } from '@/services/gmail-service';
import { findOrCreateContactAction } from './agenda/actions';

const getFacturasCollection = (empresaId: string) => collection(db, 'empresas', empresaId, 'invoices');
const getEmpresasCollection = () => collection(db, 'empresas');
const getUsersCollection = () => collection(db, 'users');

// Helper to convert Firestore Timestamps to ISO strings
const convertTimestamps = (data: any) => {
    const newData: any = {};
    for (const key in data) {
        if (data[key] instanceof Timestamp) {
            newData[key] = data[key].toDate().toISOString();
        } else if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
            newData[key] = convertTimestamps(data[key]);
        }
        else {
            newData[key] = data[key];
        }
    }
    return newData;
};

async function getInitialFacturas(empresaId: string, userId: string): Promise<any[]> {
    const initialData = [
        {
            nombreEmisor: 'Digital Solutions S.A.S.',
            folio: 'FVE-001',
            fecha: '2024-07-22',
            fechaVencimiento: '2024-08-21',
            valorTotal: 1190000,
            estado: 'Aceptado',
            categoria: 'Servicios Digitales',
            siigoId: `siigo-sim-${Date.now()}`,
        },
        {
            nombreEmisor: 'Logística Total Ltda.',
            folio: 'LT-8452',
            fecha: '2024-07-21',
            fechaVencimiento: '2024-08-05',
            valorTotal: 250000,
            estado: 'Procesado',
            categoria: 'Transporte',
        },
    ];

    const facturasCollection = getFacturasCollection(empresaId);
    const batch = db.batch();
    initialData.forEach(factura => {
        const docRef = doc(facturasCollection); // Create a new doc reference
        batch.set(docRef, { ...factura, userId, createdAt: serverTimestamp() });
    });
    await batch.commit();

    const snapshot = await getDocs(query(facturasCollection, orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) }));
}


// --- API Functions ---
// --- API Functions ---
export async function getFacturasAction(idToken: string, empresaId: string): Promise<Factura[]> {
    // MOCK DATA FOR PROTOTYPE
    console.log('Returning MOCK facturas for prototype');
    return [
        {
            id: '1',
            nombreEmisor: 'Digital Solutions S.A.S.',
            folio: 'FVE-001',
            fecha: '2024-07-22',
            fechaVencimiento: '2024-08-21',
            valorTotal: 1190000,
            estado: 'Aceptado',
            categoria: 'Servicios Digitales',
            siigoId: `siigo-sim-1`,
        },
        {
            id: '2',
            nombreEmisor: 'Logística Total Ltda.',
            folio: 'LT-8452',
            fecha: '2024-07-21',
            fechaVencimiento: '2024-08-05',
            valorTotal: 250000,
            estado: 'Procesado',
            categoria: 'Transporte',
        },
        {
            id: '3',
            nombreEmisor: 'Papelería y Suministros El Centro',
            folio: 'FAC-2024-88',
            fecha: '2024-12-08',
            fechaVencimiento: '2024-12-15',
            valorTotal: 450000,
            estado: 'Por Causar',
            categoria: 'Suministros',
        }
    ];

    //   const caller = await getAuthenticatedUser(idToken, empresaId); // Default role 'viewer' is enough
    //   const userId = caller.uid;

    //   try {
    //     const facturasCollection = getFacturasCollection(empresaId);
    //     const snapshot = await getDocs(query(facturasCollection, orderBy('fecha', 'desc')));

    //     if (snapshot.empty) {
    //         // Only create initial data if the user is an admin of the company
    //         if (caller.empresaRole === 'admin') {
    //             return await getInitialFacturas(empresaId, userId);
    //         }
    //         return [];
    //     }

    //     const facturas = snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestamps(doc.data()) } as Factura));
    //     return facturas;

    //   } catch (error: any) {
    //       console.error(`Error al cargar facturas para la empresa ${empresaId}`, error);
    //       throw new Error(`Error al obtener facturas: ${error.message}`);
    //   }
}

async function addFacturaAction(idToken: string, empresaId: string, facturaData: Omit<Factura, 'id' | 'userId' | 'createdAt'>): Promise<Factura> {
    const caller = await getAuthenticatedUser(idToken, empresaId, ['admin', 'editor']);
    const facturasCollection = getFacturasCollection(empresaId);
    const docRef = await addDoc(facturasCollection, { ...facturaData, userId: caller.uid, createdAt: serverTimestamp() });
    const newDoc = await getDoc(docRef);
    return { id: newDoc.id, ...convertTimestamps(newDoc.data()) } as Factura;
}

export async function updateFacturaStatusAction(idToken: string, empresaId: string, facturaId: string, newStatus: string): Promise<void> {
    const caller = await getAuthenticatedUser(idToken, empresaId, ['admin', 'editor']);
    const facturaRef = doc(db, 'empresas', empresaId, 'invoices', facturaId);
    await updateDoc(facturaRef, { estado: newStatus });
}


export async function procesarCorreosAction(idToken: string, empresaId: string): Promise<{ success: boolean; message: string }> {
    const caller = await getAuthenticatedUser(idToken, empresaId, ['admin']);
    const userId = caller.uid;

    try {
        const newInvoicesData = await processRecentEmails(userId);

        if (newInvoicesData.length === 0) {
            return { success: true, message: 'No se encontraron nuevas facturas en tu correo.' };
        }

        for (const invoiceData of newInvoicesData) {
            const contact = await findOrCreateContactAction(idToken, empresaId, {
                identificacion: invoiceData.supplierId,
                proveedor: invoiceData.supplierName,
            });

            const siigoResponse = await createPurchaseInvoice({ ...invoiceData, supplierId: contact.identificacion, supplierName: contact.proveedor });

            await addFacturaAction(idToken, empresaId, {
                nombreEmisor: invoiceData.supplierName,
                folio: invoiceData.invoiceNumber,
                fecha: invoiceData.invoiceDate,
                fechaVencimiento: invoiceData.fechaVencimiento,
                valorTotal: invoiceData.totalAmount,
                estado: 'Procesado',
                categoria: invoiceData.categoria,
                siigoId: siigoResponse.id,
            });
        }

        const message = `Se procesaron ${newInvoicesData.length} nuevos comprobantes. Revisa la lista para ver los detalles.`;
        return { success: true, message };

    } catch (error: any) {
        console.error('Error in procesarCorreosAction:', error);
        if (error.message.includes('GMAIL_REFRESH_TOKEN is not set')) {
            return { success: false, message: 'No has conectado tu cuenta de Google. Ve a Configuración para empezar.' };
        }
        return { success: false, message: `Error procesando correos: ${error.message}` };
    }
}


export async function exportarFacturasAction(idToken: string, empresaId: string): Promise<{ url: string }> {
    await getAuthenticatedUser(idToken, empresaId); // Viewer can export
    const userFacturas = await getFacturasAction(idToken, empresaId);
    if (userFacturas.length === 0) {
        return { url: '' };
    }
    const headers = Object.keys(userFacturas[0] || {}).join(',');
    const rows = userFacturas.map(factura => Object.values(factura).join(',')).join('\n');
    const csvContent = `${headers}\n${rows}`;
    const url = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);

    return { url };
}



// --- ZIP Processing Action ---

export async function actionImportZip(idToken: string, empresaId: string, file: File) {
    try {
        const caller = await getAuthenticatedUser(idToken, empresaId, ['admin', 'editor']);
        const buf = await file.arrayBuffer();
        const parsedItems = await parseInvoiceZip(buf);
        const xmlItem = parsedItems.find((item): item is { type: 'xml'; name: string; parsed: any } => item.type === 'xml');

        if (!xmlItem) {
            throw new Error("No se encontró un archivo XML válido en el ZIP.");
        }

        const inv = xmlItem.parsed;

        const contact = await findOrCreateContactAction(idToken, empresaId, {
            identificacion: inv.supplierTaxId || 'N/A',
            proveedor: inv.supplierName || 'N/A',
        });

        const invoiceDataForSiigo = {
            invoiceNumber: inv.metadata?.number || inv.id || 'N/A',
            invoiceDate: inv.issueDate || new Date().toISOString().split('T')[0],
            supplierName: contact.proveedor,
            supplierId: contact.identificacion,
            totalAmount: inv.total || 0,
            vatAmount: inv.taxes || 0,
            categoria: 'Importado',
            fechaVencimiento: inv.issueDate || new Date().toISOString().split('T')[0],
        };

        const siigoResponse = await createPurchaseInvoice(invoiceDataForSiigo);

        await addFacturaAction(idToken, empresaId, {
            nombreEmisor: invoiceDataForSiigo.supplierName,
            folio: invoiceDataForSiigo.invoiceNumber,
            fecha: invoiceDataForSiigo.invoiceDate,
            fechaVencimiento: invoiceDataForSiigo.fechaVencimiento,
            valorTotal: invoiceDataForSiigo.totalAmount,
            estado: 'Procesado',
            categoria: invoiceDataForSiigo.categoria,
            siigoId: siigoResponse.id,
        });


        return {
            success: true,
            imported: 1,
            invoice: inv,
            siigoId: siigoResponse.id,
        };
    } catch (error) {
        console.error('Error in actionImportZip:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error procesando el archivo ZIP.';
        return { success: false, error: errorMessage };
    }
}

// --- ACCIONES DIAN REALES ---

export async function getDianDocumentsAction(token: string, empresaId: string, dianTokenUrl: string) {
    try {
        console.log('Iniciando sincronización DIAN para empresa:', empresaId);

        // Dynamic import to avoid bundling issues if any
        const { scrapeDianDocuments } = await import('@/services/dian-scraper');

        const result = await scrapeDianDocuments(dianTokenUrl);

        return result;

    } catch (error: any) {
        console.error('Error en getDianDocumentsAction:', error);
        return { success: false, message: error.message, documents: [] };
    }
}

// --- Role and Company Management ---

async function assignInitialSuperAdmin(email: string): Promise<{ wasAssigned: boolean; userExists: boolean }> {
    try {
        const superAdminUsers = await authAdmin.listUsers(1).then(res =>
            res.users.filter(u => u.customClaims?.role === 'superadmin')
        );

        if (superAdminUsers.length > 0) return { wasAssigned: false, userExists: true };

        const user = await authAdmin.getUserByEmail(email);

        if (!user.customClaims?.role) {
            await authAdmin.setCustomUserClaims(user.uid, { role: 'superadmin' });
            return { wasAssigned: true, userExists: true };
        }
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') return { wasAssigned: false, userExists: false };
        console.error("Error in initial superadmin assignment:", error);
    }
    return { wasAssigned: false, userExists: true };
}


export async function setSuperAdminAction(idToken: string, email: string): Promise<{ success: boolean; message: string; error?: string }> {
    try {
        const caller = await getAuthenticatedUser(idToken);
        if (caller.role !== 'superadmin') {
            throw new Error('Permission denied. Only superadmins can assign roles.');
        }

        const userToUpdate = await authAdmin.getUserByEmail(email);
        if (userToUpdate.customClaims?.role === 'superadmin') {
            return { success: true, message: `El usuario ${email} ya es superadministrador.` };
        }

        await authAdmin.setCustomUserClaims(userToUpdate.uid, { role: 'superadmin' });
        return { success: true, message: `El usuario ${email} ahora es superadministrador.` };
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            return { success: false, error: `El usuario con el email ${email} no fue encontrado.` };
        }
        return { success: false, error: error.message };
    }
}

async function createInitialEmpresaAction(uid: string, email: string | undefined | null, displayName: string | undefined | null): Promise<string> {
    const userDocRef = getUsersCollection().doc(uid);
    const userDoc = await userDocRef.get();

    // Check if user already has companies
    const existingEmpresas = userDoc.data()?.empresas;
    if (existingEmpresas && Object.keys(existingEmpresas).length > 0) {
        return Object.keys(existingEmpresas)[0]; // Return first company ID
    }

    const newEmpresaRef = getEmpresasCollection().doc();
    const newEmpresaData = {
        nombre: `Empresa de ${displayName || email}`,
        nit: 'N/A',
        createdAt: serverTimestamp(),
        usuarios: {
            [uid]: 'admin' // The creator is the admin
        }
    };

    await setDoc(newEmpresaRef, newEmpresaData);

    // Update the user's document with the new company and role
    await setDoc(userDocRef, {
        empresas: {
            [newEmpresaRef.id]: 'admin'
        }
    }, { merge: true });

    return newEmpresaRef.id;
}


export async function onUserCreateAction(uid: string, email: string | null, displayName?: string | null): Promise<void> {
    const userDocRef = getUsersCollection().doc(uid);
    const userDoc = await userDoc.get();

    // Set custom claim if not present
    const user = await authAdmin.getUser(uid);
    if (!user.customClaims || Object.keys(user.customClaims).length === 0) {
        if (email === 'govany.neuta@hotmail.com') {
            await assignInitialSuperAdmin(email);
        } else {
            await authAdmin.setCustomUserClaims(uid, { role: 'user' });
        }
    }

    // Create User document in Firestore if it doesn't exist
    if (!userDoc.exists) {
        await setDoc(userDocRef, {
            email: email,
            displayName: displayName,
            createdAt: serverTimestamp(),
            empresas: {}
        });
        // Create an initial company for the new user
        await createInitialEmpresaAction(uid, email, displayName);
    }
}


export async function createEmpresaAction(idToken: string, nombre: string, nit: string): Promise<{ id: string }> {
    const caller = await getAuthenticatedUser(idToken);
    const uid = caller.uid;

    const newEmpresaRef = getEmpresasCollection().doc();
    const newEmpresaData = {
        nombre,
        nit: nit || 'N/A',
        createdAt: serverTimestamp(),
        usuarios: {
            [uid]: 'admin' // The creator is the admin
        }
    };

    await setDoc(newEmpresaRef, newEmpresaData);

    // Update the user's document with the new company and role
    await setDoc(getUsersCollection().doc(uid), {
        empresas: {
            [newEmpresaRef.id]: 'admin'
        }
    }, { merge: true });

    return { id: newEmpresaRef.id };
}

export async function saveDianCredentialsAction(token: string, softwareId: string) {
    'use server';
    // Here we would effectively save to Firestore under /companies/{id}/config/dian
    console.log('Saving DIAN credentials:', { token: token.substring(0, 5) + '...', softwareId });
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
}
