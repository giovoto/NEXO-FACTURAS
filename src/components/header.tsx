
'use client';

import { useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { User, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User as UserIcon, HelpCircle, MessageSquare, BookText } from 'lucide-react';
import { useAuth } from './auth-provider';
import { useTour } from './tour/tour-provider';
import Link from 'next/link';
import { Skeleton } from './ui/skeleton';

const ProfileForm = lazy(() => import('./profile/profile-form').then(module => ({ default: module.ProfileForm })));

export function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const [isProfileOpen, setProfileOpen] = useState(false);
  const { startTour } = useTour();

  const handleLogout = () => {
    signOut(auth).then(() => {
      router.push('/login');
    }).catch((error) => {
      console.error('Logout Error:', error);
    });
  };
  
  if (!user) return null;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
          <div className="flex items-center gap-3 md:hidden" data-tour-id="header-mobile">
             <Link href="/" className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-lg flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-foreground">
                    Nexo
                    </h2>
                </div>
             </Link>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4" data-tour-id="profile">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <UserIcon className="h-5 w-5" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                    <p className="text-sm font-medium leading-none">{user.displayName || 'Usuario'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                    </p>
                    <p className="text-[10px] leading-none text-muted-foreground/80 pt-2 font-mono">
                     UID: {user.uid}
                    </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Mi Perfil</span>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => router.push('/logs')} className="cursor-pointer">
                  <BookText className="mr-2 h-4 w-4" />
                  <span>Logs del Sistema</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={startTour} className="cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Ver Tour de Inicio</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <Suspense fallback={<div />}>
            {isProfileOpen && <ProfileForm user={user} isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} />}
        </Suspense>
      </>
  );
}
