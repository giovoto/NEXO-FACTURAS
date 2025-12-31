'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  FileText,
  Settings,
  Contact,
  ChevronsLeft,
  MessageSquare,
  LucideIcon,
  BookCheck,
  Package,
  ArrowRightFromLine,
  Users,
  ShieldCheck,
  Banknote,
  CreditCard,
  ArrowLeftRight,
  Calendar,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { useTour } from './tour/tour-provider';
import { useAuth } from './auth-provider';
import { EmpresaSelector } from './empresa-selector';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface MenuItem {
  href: string;
  name: string;
  icon: LucideIcon;
  tourId?: string;
  roles?: ('superadmin' | 'admin')[]; // Show only to these global or company roles
  empresaRoles?: ('admin')[];
  submenu?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  { href: '/', name: 'Inicio', icon: LayoutDashboard, tourId: 'Dashboard' },
  {
    name: 'Proveedores',
    href: '#proveedores',
    icon: Users,
    submenu: [
      { name: 'Documentos', href: '/proveedores/documentos', icon: FileText, tourId: 'Documentos' },
      { name: 'Comprobantes', href: '/facturacion', icon: Banknote }, // Mantiene la ruta anterior pero con nuevo nombre
      { name: 'Pagos', href: '/pagos', icon: CreditCard },
      { name: 'Lotes', href: '/lotes', icon: Package },
    ]
  },
  { href: '/nomina', name: 'Pago de nómina', icon: Banknote },
  { href: '/cuentas-por-cobrar', name: 'Cuentas por cobrar', icon: CreditCard },
  { href: '/transacciones', name: 'Transacciones', icon: ArrowLeftRight },
  { href: '/agenda', name: 'Agenda', icon: Calendar, tourId: 'Agenda' },
  { href: '/soporte', name: 'Soporte', icon: HelpCircle },

  // Existing App Links - Kept for functionality
  { href: '/inventario', name: 'Bodegas', icon: Package, tourId: 'Inventario' },
  { href: '/inventario/salidas', name: 'Salidas', icon: ArrowRightFromLine, tourId: 'Salidas' },
  { href: '/herramientas', name: 'Herramientas', icon: BookCheck, tourId: 'Herramientas' },

  // Admin Links
  { href: '/empresa/usuarios', name: 'Gestión de Empresa', icon: Users, tourId: 'EmpresaUsers', empresaRoles: ['admin'] },
  { href: '/admin/users', name: 'Gestión Global', icon: ShieldCheck, tourId: 'AdminUsers', roles: ['superadmin'] },
  { href: '/configuracion', name: 'Configuración', icon: Settings, tourId: 'Configuración' },
];


interface SidebarProps {
  user: User | null;
  isCollapsed: boolean;
  setCollapsed: (isCollapsed: boolean) => void;
}

export function Sidebar({ user, isCollapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { userRole, empresaRole, activeEmpresaId } = useAuth();

  // Only render if we have a user (or mock user)
  if (!user) return null;

  const visibleMenuItems = menuItems.filter(item => {
    // Superadmin sees everything
    if (userRole === 'superadmin') return true;

    // Check global roles
    if (item.roles && !item.roles.includes(userRole as any)) {
      return false;
    }

    // Check company-specific roles
    if (item.empresaRoles && !item.empresaRoles.includes(empresaRole as any)) {
      return false;
    }

    // Hide company-specific management links if no company is active
    if (item.href.includes('/empresa/') && !activeEmpresaId) {
      return false;
    }

    return true;
  });

  return (
    <aside
      className={cn(
        'hidden md:flex fixed left-0 top-0 h-full flex-col border-r bg-background sidebar-transition z-50',
        isCollapsed ? 'w-20' : 'w-64'
      )}
      data-tour-id="sidebar"
    >
      <div className={cn(
        "flex items-center border-b",
        isCollapsed ? "h-16 justify-center" : "h-16 px-6"
      )}>
        <Link href="/" className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <div className="p-2 bg-primary rounded-lg">
            <MessageSquare className="w-6 h-6 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <span className="font-bold whitespace-nowrap">Nexo</span>
          )}
        </Link>
      </div>

      <div className={cn("p-2 border-b", isCollapsed && "hidden")}>
        <EmpresaSelector />
      </div>

      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        <TooltipProvider delayDuration={0}>
          {visibleMenuItems.map((item) => {
            let finalHref = item.href;
            if (item.href.includes('[empresaId]')) {
              finalHref = activeEmpresaId ? item.href.replace('[empresaId]', activeEmpresaId) : '#';
            }

            const isActive = pathname === finalHref || (item.href.includes('[empresaId]') && pathname.startsWith(`/empresa/`));
            const hasSubmenu = item.submenu && item.submenu.length > 0;

            if (hasSubmenu && !isCollapsed) {
              return (
                <Collapsible key={item.name} className="group/collapsible">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className={cn(
                      'w-full justify-between px-3 py-2 h-auto font-normal hover:bg-accent hover:text-accent-foreground',
                      pathname.startsWith(item.href) || item.submenu?.some(sub => pathname === sub.href) ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <ul className="pl-9 space-y-1 mt-1">
                      {item.submenu!.map((subItem) => (
                        <li key={subItem.name}>
                          <Link
                            href={subItem.href}
                            className={cn(
                              'block px-3 py-2 rounded-lg text-sm transition-colors',
                              pathname === subItem.href
                                ? 'text-primary font-medium bg-primary/5'
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                            )}
                          >
                            {subItem.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </Collapsible>
              )
            }


            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link href={finalHref} data-tour-id={item.tourId}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn('w-full', isCollapsed ? 'justify-center' : 'justify-start')}
                      disabled={finalHref === '#'}
                    >
                      <item.icon className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
                      {!isCollapsed && <span>{item.name}</span>}
                    </Button>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" sideOffset={5}>
                    {item.name}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      <div className="border-t p-2" data-tour-id="collapse-sidebar">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn('w-full', isCollapsed ? 'justify-center' : 'justify-start')}
                onClick={() => setCollapsed(!isCollapsed)}
              >
                <ChevronsLeft className={cn("h-5 w-5 transition-transform", !isCollapsed && "rotate-180")} />
                {!isCollapsed && <span className="ml-3">Contraer</span>}
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" sideOffset={5}>
                Expandir
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}
