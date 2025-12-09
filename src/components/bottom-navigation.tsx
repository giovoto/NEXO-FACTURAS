
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { menuItems } from './sidebar';
import { LayoutDashboard, FileText, Contact, BookCheck, Settings } from 'lucide-react';

// Define a specific list for the bottom navigation to ensure key items are present.
const bottomNavMenuItems = [
  { href: '/', name: 'Dashboard', icon: LayoutDashboard },
  { href: '/facturacion', name: 'Comprobantes', icon: FileText },
  { href: '/agenda', name: 'Agenda', icon: Contact },
  { href: '/herramientas', name: 'Herramientas', icon: BookCheck },
  { href: '/configuracion', name: 'Configuración', icon: Settings },
];


export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background border-t shadow-[0_-1px_4px_rgba(0,0,0,0.05)]">
      <div className="flex h-16 max-w-full mx-auto justify-around items-center">
        {bottomNavMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center text-muted-foreground transition-colors hover:text-primary p-2 w-full',
                isActive ? 'text-primary' : 'hover:text-primary/80'
              )}
            >
              <item.icon className="w-6 h-6" />
              {isActive && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
              )}
              <span className="sr-only">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
