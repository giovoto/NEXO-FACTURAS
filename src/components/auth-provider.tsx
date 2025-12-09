'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { MessageSquare } from 'lucide-react';
import { getFacturasAction, updateFacturaStatusAction, onUserCreateAction } from '@/app/actions';
import { useLogs } from '@/lib/logger';
import { TourProvider } from '@/components/tour/tour-provider';
import { UserRole, Empresa, EmpresaRole } from '@/lib/types';
import { db } from '@/lib/firebase'; // Client-side db
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

const publicRoutes = ['/login', '/registro', '/reestablecer-clave', '/politica-de-privacidad', '/test-viewer'];

export type Factura = {
  id: string;
  [key: string]: any;
};


interface AuthContextType {
  user: User | null;
  userRole: UserRole; // Global role (e.g., 'superadmin')
  empresaRole: EmpresaRole; // Role within the active company
  isAuthLoading: boolean;
  facturas: Factura[];
  setFacturas: React.Dispatch<React.SetStateAction<Factura[]>>;
  isFacturasLoading: boolean;
  reloadFacturas: (force?: boolean) => void;
  handleStatusChange: (facturaId: string, newStatus: string) => void;
  activeEmpresaId: string | null;
  userEmpresas: Empresa[];
  switchEmpresa: (empresaId: string) => void;
  reloadAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get ID token
async function getIdToken(user: User | null, forceRefresh = false): Promise<string> {
  if (!user) return '';
  return user.getIdToken(forceRefresh);
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [empresaRole, setEmpresaRole] = useState<EmpresaRole>('viewer');
  const [isAuthLoading, setIsAuthLoading] = useState(false); // Force false for mock to avoid loading screen lock

  const [activeEmpresaId, setActiveEmpresaId] = useState<string | null>(null);
  const [userEmpresas, setUserEmpresas] = useState<Empresa[]>([]);

  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [isFacturasLoading, setIsFacturasLoading] = useState(true);
  const { addLog } = useLogs();

  const loadUserData = useCallback(async (currentUser: User) => {
    setIsAuthLoading(true);
    try {
      await onUserCreateAction(currentUser.uid, currentUser.email, currentUser.displayName);
      const idTokenResult = await currentUser.getIdTokenResult(true);
      const globalRole = (idTokenResult.claims.role as UserRole) || 'user';
      setUserRole(globalRole);
      addLog('INFO', `Global user role detected: ${globalRole}`);

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userEmpresasMap = userData.empresas || {};

        if (Object.keys(userEmpresasMap).length > 0) {
          const empresaIds = Object.keys(userEmpresasMap);
          const empresasQuery = query(collection(db, 'empresas'), where('__name__', 'in', empresaIds));
          const empresasSnapshot = await getDocs(empresasQuery);
          const empresasData = empresasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Empresa));
          setUserEmpresas(empresasData);

          const currentActiveId = activeEmpresaId && empresaIds.includes(activeEmpresaId) ? activeEmpresaId : empresaIds[0];
          setActiveEmpresaId(currentActiveId);
          setEmpresaRole(userEmpresasMap[currentActiveId] || 'viewer');
          addLog('INFO', `Active company set to ${currentActiveId} with role ${userEmpresasMap[currentActiveId]}`);
        } else {
          setUserEmpresas([]);
          setActiveEmpresaId(null);
          setEmpresaRole('viewer');
        }
      }
    } catch (error) {
      addLog('ERROR', 'Error fetching user roles and companies', error);
      setUserRole('user');
      setEmpresaRole('viewer');
    } finally {
      setIsAuthLoading(false);
    }
  }, [addLog, activeEmpresaId]);

  const switchEmpresa = useCallback(async (newEmpresaId: string) => {
    if (newEmpresaId !== activeEmpresaId && user) {
      setIsFacturasLoading(true); // Show loading state while switching
      setActiveEmpresaId(newEmpresaId);
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const newRole = userData.empresas?.[newEmpresaId] as EmpresaRole || 'viewer';
        setEmpresaRole(newRole);
        addLog('INFO', `Switched to company ${newEmpresaId} with role ${newRole}`);
      }
    }
  }, [activeEmpresaId, user, addLog]);

  const loadFacturas = useCallback(async (force = false) => {
    if (!user || !activeEmpresaId) {
      setFacturas([]);
      setIsFacturasLoading(false);
      return;
    };

    setIsFacturasLoading(true);
    try {
      addLog('INFO', `Buscando facturas para la empresa ${activeEmpresaId}...`);
      const idToken = await getIdToken(user, force);
      const data = await getFacturasAction(idToken, activeEmpresaId);
      if (Array.isArray(data)) {
        setFacturas(data);
        addLog('SUCCESS', `Facturas cargadas: ${data.length}`);
      }
    } catch (error: any) {
      if (String(error?.message).includes('id-token-expired')) {
        addLog('INFO', 'Token expired, refreshing and retrying...');
        try {
          const freshIdToken = await getIdToken(user, true);
          const data = await getFacturasAction(freshIdToken, activeEmpresaId);
          if (Array.isArray(data)) {
            setFacturas(data);
            addLog('SUCCESS', `Facturas cargadas con éxito en el reintento: ${data.length}`);
          }
        } catch (retryError: any) {
          addLog('ERROR', 'Error al cargar facturas en el reintento.', retryError);
        }
      } else {
        addLog('ERROR', 'Error al cargar facturas', error);
      }
    } finally {
      setIsFacturasLoading(false);
    }
  }, [user, addLog, activeEmpresaId]);

  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false); // Firebase not configured, stop loading
      return;
    }
    // const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    //   setUser(currentUser);
    //   if (currentUser) {
    //     await loadUserData(currentUser);
    //   } else {
    //     setUserRole('user');
    //     setEmpresaRole('viewer');
    //     setActiveEmpresaId(null);
    //     setUserEmpresas([]);
    //     setIsAuthLoading(false);
    //   }
    // });
    // return () => unsubscribe();

    // MOCK USER IMPLEMENTATION
    const mockUser = {
      uid: 'mock-uid-123',
      email: 'provisional@test.com',
      displayName: 'Usuario Provisional',
      emailVerified: true,
      isAnonymous: false,
      getIdToken: async () => 'mock-token',
      getIdTokenResult: async () => ({ claims: { role: 'admin' } } as any),
    } as unknown as User;

    // Mock enterprise data
    const mockEmpresas = [{ id: 'empresa-demo', name: 'Empresa Demo SAS', nit: '900123456' } as any];

    // Set state in batch to avoid multiple renders
    setUser(mockUser);
    setUserRole('admin');
    setEmpresaRole('admin');
    setUserEmpresas(mockEmpresas);
    setActiveEmpresaId('empresa-demo');
    setIsAuthLoading(false);

    return () => { };
  }, []); // Empty dependency for mock init

  useEffect(() => {
    if (user && !isAuthLoading && activeEmpresaId) {
      loadFacturas(false);
    }
  }, [user?.uid, isAuthLoading, activeEmpresaId]);

  useEffect(() => {
    if (isAuthLoading) return;
    const isPublicPage = publicRoutes.includes(pathname);
    if (!user && !isPublicPage) {
      // router.push('/login'); // Disable redirect for mock
    } else if (user && isPublicPage) {
      router.push('/');
    }
  }, [user, isAuthLoading, pathname, router]);

  const handleStatusChange = useCallback(async (facturaId: string, newStatus: string) => {
    if (!user || !activeEmpresaId) return;

    setFacturas(prevFacturas =>
      prevFacturas.map(f => (f.id === facturaId ? { ...f, estado: newStatus } : f))
    );

    try {
      const idToken = await getIdToken(user, true);
      await updateFacturaStatusAction(idToken, activeEmpresaId, facturaId, newStatus);
      addLog('INFO', `Estado de la factura ${facturaId} cambiado a ${newStatus} en Firestore.`);
    } catch (error) {
      addLog('ERROR', `No se pudo actualizar el estado de la factura ${facturaId}`, error);
      loadFacturas(true);
    }
  }, [user, addLog, loadFacturas, activeEmpresaId]);


  const contextValue = useMemo(() => ({
    user,
    userRole,
    empresaRole,
    isAuthLoading,
    facturas,
    setFacturas,
    isFacturasLoading,
    reloadFacturas: loadFacturas,
    handleStatusChange,
    activeEmpresaId,
    userEmpresas,
    switchEmpresa,
    reloadAuth: () => user ? loadUserData(user) : {},
  }), [user, userRole, empresaRole, isAuthLoading, facturas, isFacturasLoading, loadFacturas, handleStatusChange, activeEmpresaId, userEmpresas, switchEmpresa, loadUserData]);

  const isPublicPage = publicRoutes.includes(pathname);

  if (isAuthLoading && !isPublicPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary rounded-lg">
            <MessageSquare className="w-6 h-6 text-primary-foreground" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            Nexo
          </h2>
        </div>
        <p className="text-muted-foreground">Verificando sesión...</p>
      </div>
    );
  }

  if (isPublicPage) {
    console.log("Rendering public page directly:", pathname);
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      <TourProvider>
        {user ? <LayoutWrapper>{children}</LayoutWrapper> : null}
        {!user && !isAuthLoading && (
          <div className="p-10 text-center">
            User not authenticated but not redirected. This state should be unreachable in production.
          </div>
        )}
      </TourProvider>
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
