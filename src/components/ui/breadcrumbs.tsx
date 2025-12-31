'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, FileText, Settings, LayoutDashboard, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, JSX.Element> = {
    dashboard: <LayoutDashboard className="h-4 w-4" />,
    facturacion: <FileText className="h-4 w-4" />,
    configuracion: <Settings className="h-4 w-4" />,
    usuarios: <Users className="h-4 w-4" />,
};

const labelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    facturacion: 'Facturación',
    configuracion: 'Configuración',
    usuarios: 'Usuarios',
    admin: 'Administración',
};

interface BreadcrumbsProps {
    className?: string;
    maxItems?: number;
}

export function Breadcrumbs({ className, maxItems = 5 }: BreadcrumbsProps) {
    const pathname = usePathname();

    const segments = React.useMemo(() => {
        const paths = pathname.split('/').filter(Boolean);

        // Don't show breadcrumbs on home page or auth pages
        if (paths.length === 0 || paths[0] === 'login' || paths[0] === 'register') {
            return [];
        }

        const breadcrumbs = [
            { label: 'Inicio', href: '/', icon: <Home className="h-4 w-4" /> },
        ];

        let currentPath = '';
        paths.forEach((segment, index) => {
            currentPath += `/${segment}`;
            const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
            const icon = iconMap[segment];

            breadcrumbs.push({
                label,
                href: currentPath,
                icon,
            });
        });

        // Truncate if too many items
        if (breadcrumbs.length > maxItems) {
            return [
                breadcrumbs[0],
                { label: '...', href: '#', icon: null },
                ...breadcrumbs.slice(-(maxItems - 2)),
            ];
        }

        return breadcrumbs;
    }, [pathname, maxItems]);

    if (segments.length === 0) {
        return null;
    }

    return (
        <nav
            aria-label="Breadcrumb"
            className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}
        >
            <ol className="flex items-center space-x-1">
                {segments.map((segment, index) => {
                    const isLast = index === segments.length - 1;
                    const isEllipsis = segment.label === '...';

                    return (
                        <li key={segment.href} className="flex items-center">
                            {index > 0 && (
                                <ChevronRight className="h-4 w-4 mx-1 flex-shrink-0" />
                            )}

                            {isEllipsis ? (
                                <span className="px-2">...</span>
                            ) : isLast ? (
                                <span className="flex items-center gap-1.5 font-medium text-foreground">
                                    {segment.icon}
                                    {segment.label}
                                </span>
                            ) : (
                                <Link
                                    href={segment.href}
                                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                                >
                                    {segment.icon}
                                    {segment.label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
