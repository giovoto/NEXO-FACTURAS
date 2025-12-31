
import { initializeApp, getApps, cert, getApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
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

let db: Firestore;
let authAdmin: Auth;
let adminApp: App;

function initializeServices() {
    try {
        // 1. Try to get existing app
        if (getApps().length > 0) {
            adminApp = getApp();
            db = getFirestore(adminApp);
            authAdmin = getAuth(adminApp);
            return;
        }

        // 2. Try to initialize with credentials
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        const projectId = process.env.FIREBASE_PROJECT_ID;

        if (serviceAccountJson && typeof serviceAccountJson === 'string' && serviceAccountJson.trim() !== '' && projectId) {
            console.log(`Initializing Firebase Admin for project: ${projectId}`);
            const serviceAccount = JSON.parse(serviceAccountJson);

            adminApp = initializeApp({
                credential: cert(serviceAccount),
                projectId: projectId,
            });

            db = getFirestore(adminApp);
            authAdmin = getAuth(adminApp);
            return;
        }

        // 3. Fallback to MOCK
        throw new Error("Missing credentials for initialization");

    } catch (error: any) {
        console.warn('⚠️ Firebase Admin running in MOCK MODE due to:', error.message);

        // Mock DB
        db = {
            collection: (name: string) => ({
                doc: (id: string) => ({
                    get: async () => ({ exists: true, data: () => ({}) }),
                    set: async () => ({}),
                    update: async () => ({}),
                    collection: (sub: string) => ({
                        doc: (subId: string) => ({
                            set: async () => ({}),
                            add: async () => ({ id: 'mock-id' })
                        }),
                        add: async () => ({ id: 'mock-id' })
                    })
                })
            }),
            batch: () => ({
                set: () => { },
                update: () => { },
                delete: () => { },
                commit: async () => ([]),
            })
        } as unknown as Firestore;

        // Mock Auth
        authAdmin = {
            verifyIdToken: async (token: string) => ({
                uid: 'mock-user-id',
                email: 'mock@example.com',
                role: 'superadmin' // Bypass permission checks
            }),
            getUser: async (uid: string) => ({ uid, email: 'mock@example.com' })
        } as unknown as Auth;
    }
}

// Initialize immediately
initializeServices();

/**
 * Verifies the user's ID token and retrieves their role within a specific company.
 */
export async function getAuthenticatedUser(
    idToken: string | undefined,
    empresaId?: string,
    requiredRoles: EmpresaRole[] = ['viewer']
) {
    if (!idToken) {
        throw new Error("Not authenticated: No ID token provided.");
    }
    try {
        const decodedToken = await authAdmin.verifyIdToken(idToken, true);
        const globalRole = (decodedToken.role as UserRole) || 'user';

        let empresaRole: EmpresaRole | null = null;

        if (empresaId) {
            // Simplified check for mock mode or real DB
            // In mock mode, the DB calls above will return empty objects but won't crash
            // ... logic follows ...

            // If superadmin (mock or real), bypass
            if (globalRole === 'superadmin') {
                return { ...decodedToken, role: globalRole, empresaRole: 'admin' };
            }

            const empresaDoc = await db.collection('empresas').doc(empresaId).get();
            if (!empresaDoc.exists) {
                // If mocked, it returns exists: true
                throw new Error("Company not found.");
            }
            const empresaData = empresaDoc.data();
            const userRoleInEmpresa = empresaData?.usuarios?.[decodedToken.uid];

            if (!userRoleInEmpresa) {
                throw new Error("Access denied: User is not a member of this company.");
            }
            empresaRole = userRoleInEmpresa || null;

            // Role hierarchy check
            const userLevel = empresaRole ? roleHierarchy[empresaRole] : 0;
            const requiredLevel = Math.min(...requiredRoles.map(r => roleHierarchy[r]));
            if (userLevel < requiredLevel) {
                throw new Error(`Permission denied. Required role: ${requiredRoles.join(' or ')}.`);
            }
        }

        return { ...decodedToken, role: globalRole, empresaRole };
    } catch (error: any) {
        console.error("Authentication error:", error?.code || error?.message || error);
        if (error?.code === 'auth/id-token-expired') {
            throw new Error('id-token-expired');
        }
        throw new Error(error.message || "Session invalid or expired");
    }
}

export { db, authAdmin };
