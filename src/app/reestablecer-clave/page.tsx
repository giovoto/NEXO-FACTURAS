
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ReestablecerClavePage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    sendPasswordResetEmail(auth, email)
      .then(() => {
        setMessage('Se ha enviado un enlace para restablecer tu contraseña a tu correo electrónico. Por favor, revisa tu bandeja de entrada.');
      })
      .catch((error) => {
        const errorCode = error.code;
        // Firebase returns 'auth/invalid-email' for non-existent users for security reasons
        if (errorCode === 'auth/invalid-email') {
             setMessage('Si existe una cuenta con este correo, se ha enviado un enlace de restablecimiento.');
        } else {
            setError(error.message);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
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
            <CardTitle className="text-2xl">Restablecer Contraseña</CardTitle>
            <CardDescription>
              Introduce tu correo y te enviaremos un enlace para que puedas volver a acceder a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message ? (
               <div className="text-center space-y-4">
                  <p className="text-green-600">{message}</p>
                  <Link href="/login">
                     <Button className="w-full">Volver a Iniciar Sesión</Button>
                  </Link>
               </div>
            ) : (
              <form onSubmit={handleResetPassword} className="grid gap-4">
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
                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Enviando...' : 'Enviar Enlace de Restablecimiento'}
                </Button>
              </form>
            )}
             <div className="mt-4 text-center text-sm">
              ¿Recordaste tu contraseña?{' '}
              <Link href="/login" className="underline">
                Inicia Sesión
              </Link>
            </div>
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
