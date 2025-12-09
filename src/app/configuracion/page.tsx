'use client';
import { useState, useEffect, use, lazy, Suspense, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertTriangle, Save, RotateCcw } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { SettingsCard } from '@/components/settings-card';
import { BookOpenCheck, Link as LinkIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { DatoContable } from './actions';
import { getParamsAction, saveParamsAction } from './actions';
import type { User } from 'firebase/auth';
import { getAuthStatusAction, saveRefreshTokenAction } from './google-auth-actions';
import { useLogs } from '@/lib/logger';
import { DianSection } from './dian-section';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useForm, Controller } from 'react-hook-form';

// Helper to get ID token


async function getIdToken(user: User | null): Promise<string> {
  if (!user) return '';
  return user.getIdToken();
}

const defaultParams: DatoContable[] = [
  { id: 'uvt', titulo: 'Valor UVT 2025 (proyectado)', descripcion: '49850' },
  { id: 'smlmv', titulo: 'Salario Mínimo Mensual 2025', descripcion: '1430000' },
  { id: 'aux_transporte', titulo: 'Auxilio de Transporte 2025', descripcion: '178000' },
  { id: 'recargo_diurna', titulo: 'Recargo Extra Diurna (Factor)', descripcion: '1.25' },
  { id: 'recargo_nocturna', titulo: 'Recargo Extra Nocturna (Factor)', descripcion: '1.75' },
  { id: 'recargo_dominical', titulo: 'Recargo Dominical/Festivo (Factor)', descripcion: '1.75' }
];

// Helper to convert array to object and back
const paramsArrayToObject = (params: DatoContable[]): Record<string, string> => {
  return params.reduce((acc, param) => {
    acc[param.id] = param.descripcion;
    return acc;
  }, {} as Record<string, string>);
};

const paramsObjectToArray = (obj: Record<string, string>): DatoContable[] => {
  return defaultParams.map(p => ({
    id: p.id,
    titulo: p.titulo,
    descripcion: obj[p.id] || p.descripcion,
  }));
};

export default function SettingsPage() {
  // --- State for Google Connection ---
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const { addLog } = useLogs();

  // --- State for Accounting Data ---
  const [isLoadingParams, setIsLoadingParams] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: paramsArrayToObject(defaultParams)
  });

  // --- Effects ---
  const fetchParams = useCallback(async () => {
    if (!user) return;
    setIsLoadingParams(true);
    try {
      const idToken = await getIdToken(user);
      const params = await getParamsAction(idToken, defaultParams);
      reset(paramsArrayToObject(params));
    } catch (error) {
      console.error("Failed to fetch params:", error);
    } finally {
      setIsLoadingParams(false);
    }
  }, [user, reset]);

  useEffect(() => {
    if (user) {
      fetchParams();
    }
  }, [user, fetchParams]);

  // Check for auth code or error from Google redirect
  useEffect(() => {
    const authCode = searchParams.get('code');
    const authError = searchParams.get('error');

    if (authError) {
      const errorMessage = `Error de autenticación de Google: ${authError}`;
      setError(errorMessage);
      addLog('ERROR', errorMessage);
      return;
    }

    if (authCode && user) {
      const saveToken = async () => {
        setLoading(true);
        addLog('INFO', 'Código de autorización de Google recibido. Intentando guardar refresh token...');
        try {
          const idToken = await getIdToken(user);
          const result = await saveRefreshTokenAction(idToken, authCode);
          if (result.success) {
            setIsConnected(true);
            addLog('SUCCESS', `Conexión con Google establecida para el usuario ${user.email}.`);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            throw new Error(result.error);
          }
        } catch (err: any) {
          const errorMessage = `Error al guardar el token de Google: ${err.message}`;
          setError(errorMessage);
          addLog('ERROR', errorMessage, err);
        } finally {
          setLoading(false);
        }
      };
      saveToken();
    }
  }, [searchParams, user, addLog]);

  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!user) return;
      setCheckingStatus(true);
      setError('');
      try {
        const idToken = await getIdToken(user);
        const status = await getAuthStatusAction(idToken);
        setIsConnected(status.isConnected);
      } catch (err: any) {
        setError('No se pudo verificar el estado de la conexión con el servidor.');
      } finally {
        setCheckingStatus(false);
      }
    };
    checkConnectionStatus();
  }, [user]);

  // --- Handlers for Google Connection ---
  const connect = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    addLog('INFO', 'Iniciando el flujo de conexión con Google...');

    try {
      // The server will respond with a redirect to Google's auth page.
      window.location.href = '/api/gmail/auth';
    } catch (err: any) {
      const errorMessage = err.message || 'Ocurrió un error desconocido';
      setError(`No se pudo iniciar la conexión: ${errorMessage}`);
      addLog('ERROR', `Fallo al iniciar la conexión con Google: ${errorMessage}`);
      setLoading(false);
    }
  };

  const handleSaveParams = async (data: Record<string, string>) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const idToken = await getIdToken(user);
      const paramsToSave = paramsObjectToArray(data);
      await saveParamsAction(idToken, paramsToSave);
      addLog('SUCCESS', 'Parámetros guardados correctamente.');
      alert('Parámetros guardados con éxito.');
    } catch (error) {
      console.error("Failed to save parameters:", error);
      addLog('ERROR', 'Error al guardar parámetros.', error);
    } finally {
      setIsSaving(false);
    }
  }

  const handleRestoreDefaults = async () => {
    if (!user) return;
    if (window.confirm("¿Estás seguro de que deseas restaurar los valores por defecto para 2025?")) {
      setIsSaving(true);
      try {
        const idToken = await getIdToken(user);
        await saveParamsAction(idToken, defaultParams);
        reset(paramsArrayToObject(defaultParams)); // Update form state
        addLog('INFO', 'Parámetros restaurados a los valores por defecto.');
      } catch (error) {
        console.error("Failed to restore default parameters:", error);
        addLog('ERROR', 'Error al restaurar parámetros.', error);
      } finally {
        setIsSaving(false);
      }
    }
  }


  const renderConnectionButton = () => {
    if (checkingStatus) {
      return (
        <Button disabled className="w-full sm:w-auto mt-2">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Verificando...
        </Button>
      );
    }

    if (isConnected) {
      return (
        <div className="text-sm font-medium text-green-600 flex items-center gap-2 mt-2">
          <CheckCircle className="h-5 w-5" />
          <span>Conectado</span>
        </div>
      );
    }

    return (
      <Button onClick={connect} disabled={loading || !user} className="w-full sm:w-auto mt-2">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Conectar Cuenta de Google
      </Button>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
      </div>

      <form onSubmit={handleSubmit(handleSaveParams)} className="space-y-6">
        <SettingsCard
          title="Parámetros de Nómina y Fiscales"
          description="Gestiona los valores base para los cálculos de la aplicación."
          icon={BookOpenCheck}
        >
          <div className="mt-4 border-t pt-4">
            {isLoadingParams ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {defaultParams.map(param => (
                  <Controller
                    key={param.id}
                    name={param.id}
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label htmlFor={param.id}>{param.titulo}</Label>
                        <Input id={param.id} {...field} />
                      </div>
                    )}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={handleRestoreDefaults} disabled={isSaving || isLoadingParams}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restaurar
              </Button>
              <Button type="submit" disabled={isSaving || isLoadingParams}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Cambios
              </Button>
            </div>
          </div>
        </SettingsCard>
      </form>

      <SettingsCard
        title="Conexión con Google"
        description="Permite que la app acceda a Gmail para leer facturas y a Drive para organizarlas."
        icon={LinkIcon}
        statusSlot={renderConnectionButton()}
      />

      <DianSection />


      {error && (
        <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 flex items-center gap-3 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      )}

      <div className="text-xs text-muted-foreground pt-4 border-t max-w-2xl">
        <p>
          Al conectar tu cuenta, aceptas que la aplicación use los permisos solicitados de acuerdo a nuestra
          <a href="/politica-de-privacidad" className="underline hover:text-primary"> Política de Privacidad</a>.
          El uso de la información recibida de las APIs de Google se adhiere a la Política de Datos de Usuario de los Servicios API de Google, incluyendo los requisitos de Uso Limitado.
        </p>
      </div>
    </div>
  );
}
