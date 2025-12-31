
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Chrome, MessageSquare, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Correo o contraseña incorrectos. Por favor, verifica tus datos.');
        } else {
          setError(`Error: ${error.message}`);
        }
      } else if (data.user) {
        router.push('/');
      }
    } catch (error: any) {
      setError(`Error inesperado: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        if (error.message.includes('popup')) {
          setError('El proceso de inicio de sesión fue cancelado.');
        } else {
          setError(`Error con Google: ${error.message}`);
        }
      }
      // Note: El navegador será redirigido automáticamente a Google
      // No necesitamos manejar la respuesta aquí
    } catch (error: any) {
      setError(`Error inesperado: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-3 mb-2">
              <div className="p-2 bg-primary rounded-lg">
                <MessageSquare className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground text-left">
                  Nexo
                </h2>
                <p className="text-sm text-muted-foreground text-left">Gestión Inteligente</p>
              </div>
            </div>
            <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Introduce tus credenciales para acceder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading}>
                <Chrome className="mr-2 h-4 w-4" />
                Continuar con Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    O continuar con
                  </span>
                </div>
              </div>
              <form onSubmit={handleLogin} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nombre@ejemplo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Contraseña</Label>
                    <Link href="/reestablecer-clave" className="ml-auto inline-block text-sm underline">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Accediendo...' : 'Acceder'}
                </Button>
              </form>
            </div>
            <div className="mt-4 text-center text-sm">
              ¿No tienes una cuenta?{' '}
              <Link href="/registro" className="underline">
                Regístrate
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* --- Bloque de Diagnóstico --- */}
        <Card className="mt-4 border-green-500 bg-green-50">
          <CardHeader className="flex-row items-center gap-3 space-y-0 p-3">
            <MessageSquare className="w-5 h-5 text-green-700" />
            <h3 className="font-semibold text-green-800 text-sm">✅ Supabase Configurado</h3>
          </CardHeader>
          <CardContent className="p-3 pt-0 text-xs text-green-900 space-y-1 font-mono">
            <p><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'No definido'}</p>
            <p><strong>Auth:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Configurado' : '✗ No configurado'}</p>
          </CardContent>
        </Card>

        <footer className="mt-4 text-center text-xs text-muted-foreground">
          <Link href="/politica-de-privacidad" className="underline hover:text-primary">
            Política de Privacidad
          </Link>
        </footer>
      </div>
    </div>
  );
}
