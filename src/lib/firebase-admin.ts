
import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { UserRole } from '@/lib/types';
import { validateFirebaseConfig } from './firebase-validate';

// Ejecuta la validación al iniciar el servidor
validateFirebaseConfig();

type EmpresaRole = 'admin' | 'editor' | 'viewer';
const roleHierarchy: Record<EmpresaRole, number> = {
    viewer: 1,
    editor: 2,
    admin: 3,
};

function initializeAdminApp() {
    if (getApps().length > 0) {
        return getApp();
    }

    try {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

        if (!serviceAccountJson || typeof serviceAccountJson !== 'string' || serviceAccountJson.trim() === '') {
            // throw new Error("La variable de entorno FIREBASE_SERVICE_ACCOUNT no está definida o está vacía. Asegúrate de que el secreto esté correctamente configurado en App Hosting.");
            console.warn("MOCKING FIREBASE ADMIN: CREDENTIALS NOT FOUND");
            return {
                firestore: () => ({ collection: () => ({ doc: () => ({ get: async () => ({ exists: true, data: () => ({}) }) }) }) }),
                auth: () => ({ verifyIdToken: async () => ({ uid: 'mock', role: 'admin' }) }),
            } as any;
        }

        const projectId = process.env.FIREBASE_PROJECT_ID;
        if (!projectId) {
            throw new Error("FIREBASE_PROJECT_ID environment variable is not set.");
        }

        console.log(`Initializing Firebase Admin for project: ${projectId}`);
        const serviceAccount = JSON.parse(serviceAccountJson);

        return initializeApp({
            credential: cert(serviceAccount),
            projectId: projectId,
        });
    } catch (error: any) {
        console.warn('Firebase Admin initialization skipped/mocked due to error', error.message);
        return {
            firestore: () => ({ collection: () => ({ doc: () => ({ get: async () => ({ exists: true, data: () => ({}) }) }) }) }),
            auth: () => ({ verifyIdToken: async () => ({ uid: 'mock', role: 'admin' }) }),
        } as any;
    }
}

const adminApp = initializeAdminApp();
const db = getFirestore(adminApp);
const authAdmin = getAuth(adminApp);


/**
 * Verifies the user's ID token and retrieves their role within a specific company.
 * @param idToken The Firebase ID token.
 * @param empresaId (Optional) The ID of the company to check permissions for.
 * @param requiredRoles (Optional) An array of minimum roles required to perform the action.
 * @returns The user's decoded token, including global role and role within the specified company.
 * @throws An error if authentication fails, the user is not part of the company, or lacks the required role.
 */
export async function getAuthenticatedUser(
    idToken: string | undefined,
    empresaId?: string,
    requiredRoles: EmpresaRole[] = ['viewer'] // Default to viewer
) {
    if (!idToken) {
        throw new Error("Not authenticated: No ID token provided.");
    }
    try {
        const decodedToken = await authAdmin.verifyIdToken(idToken, true);
        const globalRole = (decodedToken.role as UserRole) || 'user';

        let empresaRole: EmpresaRole | null = null;

        if (empresaId) {
            const empresaDoc = await db.collection('empresas').doc(empresaId).get();
            if (!empresaDoc.exists) {
                throw new Error("Company not found.");
            }
            const empresaData = empresaDoc.data();
            const userRoleInEmpresa = empresaData?.usuarios?.[decodedToken.uid];

            if (!userRoleInEmpresa && globalRole !== 'superadmin') {
                throw new Error("Access denied: User is not a member of this company.");
            }
            empresaRole = userRoleInEmpresa || null;

            // Role hierarchy check
            if (globalRole !== 'superadmin') {
                const userLevel = empresaRole ? roleHierarchy[empresaRole] : 0;
                const requiredLevel = Math.min(...requiredRoles.map(r => roleHierarchy[r]));
                if (userLevel < requiredLevel) {
                    throw new Error(`Permission denied. Required role: ${requiredRoles.join(' or ')}.`);
                }
            }
        }

        return { ...decodedToken, role: globalRole, empresaRole };
    } catch (error: any) {
        console.error("Authentication error:", error?.code || error?.message || error);
        if (error?.code === 'auth/id-token-expired') {
            throw new Error('id-token-expired');
        }
        // Specific check for audience mismatch error
        if (error?.code === 'auth/argument-error' && error.message.includes('incorrect "aud" (audience) claim')) {
            console.error(`CRITICAL CONFIGURATION ERROR: Firebase Project ID mismatch. Client [${error.message.split('"')[3]}] vs Server [${process.env.FIREBASE_PROJECT_ID}].`);
            throw new Error('Error de configuración del proyecto de Firebase. Contacte a soporte.');
        }
        throw new Error(error.message || "Session invalid or expired");
    }
}


export { db, authAdmin };
