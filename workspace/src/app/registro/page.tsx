
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { MessageSquare, Chrome } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { onUserCreateAction } from '../actions';


export default function RegistroPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        // After user creation, call the server action to set the default role.
        await onUserCreateAction(userCredential.user.uid, userCredential.user.email);
        router.push('/');
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;

        if (errorCode === 'auth/email-already-in-use') {
          setError('Este correo electrónico ya está en uso.');
        } else if (errorCode === 'auth/weak-password') {
          setError('La contraseña debe tener al menos 6 caracteres.');
        }
        else {
          setError(errorMessage);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleGoogleSignIn = () => {
    setError('');
    setIsLoading(true);

    signInWithPopup(auth, googleProvider)
      .then(async (result) => {
        // The onAuthStateChanged listener in AuthProvider will handle the role assignment logic.
        // We can optionally call the server action here too for redundancy if needed.
        router.push('/');
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        if (errorCode === 'auth/unauthorized-domain' || errorCode === 'auth/configuration-not-found') {
            setError('Error: Este dominio no está autorizado para la autenticación. Por favor, añádelo en la configuración de Authentication en tu consola de Firebase.');
        } else {
            setError(errorMessage);
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
            <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
            <CardDescription>
              Introduce tus datos para crear una nueva cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading}>
                  <Chrome className="mr-2 h-4 w-4" />
                  Registrarse con Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    O continuar con correo
                  </span>
                </div>
              </div>
              <form onSubmit={handleRegister} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input 
                    id="name" 
                    placeholder="Juan Pérez" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
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
                  <Label htmlFor="password">Contraseña</Label>
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
                  {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Button>
              </form>
            </div>
            <div className="mt-4 text-center text-sm">
              ¿Ya tienes una cuenta?{' '}
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
