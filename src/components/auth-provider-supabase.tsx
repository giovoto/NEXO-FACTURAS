'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getUserId } from '@/lib/supabase';
import { LayoutWrapper } from '@/components/layout-wrapper';
import { MessageSquare } from 'lucide-react';
import { getFacturasAction, updateFacturaStatusAction } from '@/app/actions';
import { useLogs } from '@/lib/logger';
import { TourProvider } from '@/components/tour/tour-provider';
import { UserRole, Empresa, EmpresaRole } from '@/lib/types';

const publicRoutes = ['/login', '/registro', '/reestablecer-clave', '/politica-de-privacidad', '/test-viewer'];

export type Factura = {
    id: string;
    [key: string]: any;
};

interface AuthContextType {
    user: User | null;
    userRole: UserRole;
    empresaRole: EmpresaRole;
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

export function AuthProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<UserRole>('user');
    const [empresaRole, setEmpresaRole] = useState<EmpresaRole>('viewer');
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const [activeEmpresaId, setActiveEmpresaId] = useState<string | null>(null);
    const [userEmpresas, setUserEmpresas] = useState<Empresa[]>([]);

    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [isFacturasLoading, setIsFacturasLoading] = useState(true);
    const { addLog } = useLogs();

    const loadUserData = useCallback(async (currentUser: User) => {
        setIsAuthLoading(true);
        try {
            addLog('INFO', `Loading user data for ${currentUser.email}`);

            // Obtener el user_id de la tabla users usando auth_id
            const userId = await getUserId(currentUser.id);

            if (!userId) {
                addLog('ERROR', 'User not found in users table');
                setUserRole('user');
                setEmpresaRole('viewer');
                setIsAuthLoading(false);
                return;
            }

            // Obtener las empresas del usuario desde user_empresas
            const { data: userEmpresasData, error: empresasError } = await supabase
                .from('user_empresas')
                .select(`
          empresa_id,
          role,
          empresas (
            id,
            nombre,
            nit,
            direccion,
            telefono,
            email
          )
        `)
                .eq('user_id', userId);

            if (empresasError) {
                addLog('ERROR', 'Error fetching user empresas', empresasError);
                setUserEmpresas([]);
                setActiveEmpresaId(null);
                setEmpresaRole('viewer');
            } else if (userEmpresasData && userEmpresasData.length > 0) {
                // Mapear los datos a la estructura esperada
                const empresasData = userEmpresasData.map(item => ({
                    id: item.empresa_id,
                    ...(item.empresas as any)
                })) as Empresa[];

                setUserEmpresas(empresasData);

                // Establecer empresa activa
                const currentActiveId = activeEmpresaId &&
                    userEmpresasData.some(e => e.empresa_id === activeEmpresaId)
                    ? activeEmpresaId
                    : userEmpresasData[0].empresa_id;

                setActiveEmpresaId(currentActiveId);

                // Establecer rol en la empresa activa
                const activeEmpresaData = userEmpresasData.find(e => e.empresa_id === currentActiveId);
                setEmpresaRole(activeEmpresaData?.role || 'viewer');

                addLog('INFO', `Active company set to ${currentActiveId} with role ${activeEmpresaData?.role}`);
            } else {
                // Usuario no tiene empresas asignadas
                setUserEmpresas([]);
                setActiveEmpresaId(null);
                setEmpresaRole('viewer');
                addLog('INFO', 'User has no assigned companies');
            }

            // Por ahora, establecer userRole como 'user' (en el futuro se puede agregar campo de rol global)
            setUserRole('user');

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
            setIsFacturasLoading(true);
            setActiveEmpresaId(newEmpresaId);

            try {
                const userId = await getUserId(user.id);

                if (userId) {
                    // Obtener el nuevo rol
                    const { data, error } = await supabase
                        .from('user_empresas')
                        .select('role')
                        .eq('user_id', userId)
                        .eq('empresa_id', newEmpresaId)
                        .single();

                    if (!error && data) {
                        setEmpresaRole(data.role as EmpresaRole);
                        addLog('INFO', `Switched to company ${newEmpresaId} with role ${data.role}`);
                    }
                }
            } catch (error) {
                addLog('ERROR', 'Error switching empresa', error);
            }
        }
    }, [activeEmpresaId, user, addLog]);

    const loadFacturas = useCallback(async (force = false) => {
        if (!user || !activeEmpresaId) {
            setFacturas([]);
            setIsFacturasLoading(false);
            return;
        }

        setIsFacturasLoading(true);
        try {
            addLog('INFO', `Buscando facturas para la empresa ${activeEmpresaId}...`);
            const data = await getFacturasAction(activeEmpresaId);

            if (Array.isArray(data)) {
                setFacturas(data);
                addLog('SUCCESS', `Facturas cargadas: ${data.length}`);
            }
        } catch (error: any) {
            addLog('ERROR', 'Error al cargar facturas', error);
        } finally {
            setIsFacturasLoading(false);
        }
    }, [user, addLog, activeEmpresaId]);

    // Suscripción a cambios de autenticación de Supabase
    useEffect(() => {
        // Obtener sesión inicial
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadUserData(session.user);
            } else {
                setIsAuthLoading(false);
            }
        });

        // Escuchar cambios de autenticación
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log('Auth state changed:', _event);
            setUser(session?.user ?? null);

            if (session?.user) {
                await loadUserData(session.user);
            } else {
                setUserRole('user');
                setEmpresaRole('viewer');
                setActiveEmpresaId(null);
                setUserEmpresas([]);
                setIsAuthLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [loadUserData]);

    // Cargar facturas cuando cambie la empresa activa
    useEffect(() => {
        if (user && !isAuthLoading && activeEmpresaId) {
            loadFacturas(false);
        }
    }, [user, isAuthLoading, activeEmpresaId, loadFacturas]);

    // Redirigir según autenticación
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
        if (!user || !activeEmpresaId) return;

        // Actualizar UI optimísticamente
        setFacturas(prevFacturas =>
            prevFacturas.map(f => (f.id === facturaId ? { ...f, estado: newStatus } : f))
        );

        try {
            await updateFacturaStatusAction(activeEmpresaId, facturaId, newStatus);
            addLog('INFO', `Estado de la factura ${facturaId} cambiado a ${newStatus}.`);
        } catch (error) {
            addLog('ERROR', `No se pudo actualizar el estado de la factura ${facturaId}`, error);
            // Recargar facturas en caso de error
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
    }), [
        user,
        userRole,
        empresaRole,
        isAuthLoading,
        facturas,
        isFacturasLoading,
        loadFacturas,
        handleStatusChange,
        activeEmpresaId,
        userEmpresas,
        switchEmpresa,
        loadUserData
    ]);

    const isPublicPage = publicRoutes.includes(pathname);

    // Loading screen
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

    // Páginas públicas
    if (isPublicPage) {
        return <>{children}</>;
    }

    // Usuario autenticado - mostrar layout
    return (
        <AuthContext.Provider value={contextValue}>
            <TourProvider>
                {user ? <LayoutWrapper>{children}</LayoutWrapper> : null}
                {!user && !isAuthLoading && (
                    <div className="p-10 text-center">
                        Redirigiendo al login...
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
