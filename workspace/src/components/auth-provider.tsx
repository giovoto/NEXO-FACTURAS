
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { MessageSquare } from 'lucide-react';
import { getFacturasAction, updateFacturaStatusAction, onUserCreateAction } from '@/app/actions';
import { useLogs } from '@/lib/logger.tsx';
import { TourProvider } from '@/components/tour/tour-provider';
import type { UserRole } from '@/lib/types';

const publicRoutes = ['/login', '/registro', '/reestablecer-clave', '/politica-de-privacidad'];

export type Factura = {
  id: string;
  [key: string]: any;
};

interface AuthContextType {
    user: User | null;
    userRole: UserRole;
    isAuthLoading: boolean;
    facturas: Factura[];
    setFacturas: React.Dispatch<React.SetStateAction<Factura[]>>;
    isFacturasLoading: boolean;
    reloadFacturas: (force?: boolean) => void;
    handleStatusChange: (facturaId: string, newStatus: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get ID token
async function getIdToken(user: User | null, forceRefresh = false): Promise<string> {
    if (!user) return '';
    return user.getIdToken(forceRefresh); // Force refresh to get latest claims
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [isFacturasLoading, setIsFacturasLoading] = useState(true);
  const { addLog } = useLogs();

  const loadFacturas = useCallback(async (force = false) => {
    if (!user) return;

    setIsFacturasLoading(true);
    try {
      addLog('INFO', 'Buscando facturas del usuario...');
      const idToken = await getIdToken(user);
      const data = await getFacturasAction(idToken);
      if (Array.isArray(data)) {
        setFacturas(data);
        addLog('SUCCESS', `Facturas cargadas: ${data.length}`);
      }
    } catch (error) {
      addLog('ERROR', 'Error al cargar facturas', error);
    } finally {
      setIsFacturasLoading(false);
    }
  }, [user, addLog]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        try {
          // This action handles both new user role assignment and first superadmin check.
          await onUserCreateAction(currentUser.uid, currentUser.email);

          // Force a token refresh to get the latest custom claims
          const idTokenResult = await currentUser.getIdTokenResult(true);
          const role = (idTokenResult.claims.role as UserRole) || 'user';
          
          if (role !== userRole) {
             addLog('INFO', `User role updated to: ${role}. Reloading for changes to take effect.`);
             // A one-time reload ensures the UI (e.g., sidebar) correctly reflects the new role.
             window.location.reload();
             return;
          }
          setUserRole(role);
          addLog('INFO', `User role detected: ${role}`);

        } catch (error) {
          addLog('ERROR', 'Error fetching user role', error);
          setUserRole('user'); // Default to 'user' on error
        }
      } else {
        setUser(null);
        setUserRole('user'); // Reset role on logout
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, [addLog, userRole]);
  
  useEffect(() => {
    if (user && !isAuthLoading) {
        loadFacturas();
    }
  }, [user, isAuthLoading, loadFacturas]);

  useEffect(() => {
    if (isAuthLoading) return;

    const isPublicPage = publicRoutes.includes(pathname);

    if (!user && !isPublicPage) {
      router.push('/login');
    } else if (user && isPublicPage) {
      router.push('/');
    }
  }, [user, isAuthLoading, pathname, router]);

  const handleStatusChange = useCallback(async (facturaId: string, newStatus: string) => {
      if (!user) return;
      
      setFacturas(prevFacturas =>
        prevFacturas.map(f => (f.id === facturaId ? { ...f, estado: newStatus } : f))
      );

      try {
          const idToken = await getIdToken(user);
          await updateFacturaStatusAction(idToken, facturaId, newStatus);
          addLog('INFO', `Estado de la factura ${facturaId} cambiado a ${newStatus} en Firestore.`);
      } catch (error) {
          addLog('ERROR', `No se pudo actualizar el estado de la factura ${facturaId}`, error);
          loadFacturas(); 
      }
  }, [user, addLog, loadFacturas]);


  const contextValue = useMemo(() => ({
    user, 
    userRole,
    isAuthLoading, 
    facturas, 
    setFacturas, 
    isFacturasLoading, 
    reloadFacturas: loadFacturas,
    handleStatusChange,
  }), [user, userRole, isAuthLoading, facturas, isFacturasLoading, loadFacturas, handleStatusChange]);

  if (isAuthLoading) {
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
  
  const isPublicPage = publicRoutes.includes(pathname);
  
  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      <TourProvider>
        {user ? <LayoutWrapper>{children}</LayoutWrapper> : null}
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
