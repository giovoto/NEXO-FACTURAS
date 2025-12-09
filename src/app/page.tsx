
'use client';

import { useState, useEffect, memo, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Receipt, CheckCircle, XCircle, Hourglass, Info, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import type { Factura } from '@/lib/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { Skeleton } from '@/components/ui/skeleton';

// --- Lazy Loading de Componentes ---
const KpiCard = lazy(() => import('@/components/dashboard/kpi-card'));
const EstadoFacturasChart = lazy(() => import('@/components/dashboard/estado-facturas-chart'));
const FacturasRecientes = lazy(() => import('@/components/dashboard/facturas-recientes'));

// --- Componente Skeleton para KpiCard ---
const KpiCardSkeleton = () => (
    <div className="p-6 border rounded-lg shadow-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-4" />
        </div>
        <div>
            <Skeleton className="h-8 w-1/2" />
        </div>
    </div>
);

const datosContablesData = [
    {
        id: '1',
        titulo: 'Valor UVT 2025 (proyectado)',
        descripcion: 'El valor de la UVT para 2025 se proyecta en $49.850. Este valor se utiliza para determinar las bases de retención en la fuente y otras obligaciones tributarias.'
    },
    {
        id: '2',
        titulo: 'Base Retención Compras Generales 2025',
        descripcion: 'Para personas jurídicas, la base mínima para aplicar retención en la fuente por compras generales es de 27 UVT.'
    },
    {
        id: '3',
        titulo: 'Tarifa General IVA',
        descripcion: 'La tarifa general del Impuesto sobre las Ventas (IVA) en Colombia es del 19%.'
    }
];


function DashboardPage() {
  const { facturas, isFacturasLoading, user, userRole } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    procesado: 0,
    aceptado: 0,
    rechazado: 0,
    valorTotal: 0,
  });

  useEffect(() => {
    if (facturas.length > 0) {
        calculateStats(facturas);
    }
  }, [facturas]);


  const calculateStats = (data: Factura[]) => {
    const valorTotal = data.reduce((sum, f) => {
        const valor = typeof f.valorTotal === 'string' ? parseFloat(f.valorTotal) : f.valorTotal as number;
        return sum + (Number.isNaN(valor) ? 0 : valor);
    }, 0);

    setStats({
      total: data.length,
      procesado: data.filter(f => f.estado === 'Procesado').length,
      aceptado: data.filter(f => f.estado === 'Aceptado').length,
      rechazado: data.filter(f => f.estado === 'Rechazado').length,
      valorTotal: valorTotal
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }
  
  const welcomeMessage = {
    superadmin: 'Bienvenido, Super Admin',
    admin: 'Bienvenido, Admin',
    user: 'Dashboard',
  }

  const isLoading = isFacturasLoading || !user;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
         <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {welcomeMessage[userRole as keyof typeof welcomeMessage] || 'Dashboard'}
            </h1>
            <p className="text-muted-foreground">
              {userRole === 'superadmin' ? 'Tienes control total sobre la plataforma.' : 'Resumen del estado de tus comprobantes electrónicos.'}
            </p>
         </div>
         <Link href="/facturacion" className="w-full sm:w-auto">
            <Button disabled={!user} className="w-full sm:w-auto">
                Ir a Comprobantes <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
         </Link>
      </div>
      
      <main className="space-y-4">
        {userRole === 'superadmin' && (
             <div className="relative pl-4 py-3 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
                 <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 p-2 bg-yellow-100 rounded-full">
                    <ShieldCheck className="w-5 h-5 text-yellow-700"/>
                </div>
                <div>
                    <h4 className="font-semibold text-yellow-800">Vista de Superadministrador</h4>
                    <p className="text-sm text-yellow-700">Estás viendo el dashboard como superadministrador. Próximamente aquí verás analíticas globales y herramientas de gestión de usuarios.</p>
                </div>
            </div>
        )}
        <Carousel
            opts={{
                align: "start",
                loop: true,
            }}
            plugins={[
                Autoplay({
                    delay: 5000,
                    stopOnInteraction: false,
                }),
            ]}
            className="w-full"
            >
            <CarouselContent>
                {datosContablesData.map((dato) => (
                <CarouselItem key={dato.id}>
                    <div className="p-1">
                        <div className="relative pl-4 py-3 bg-accent/50 border-l-4 border-accent-foreground/50 rounded-r-lg">
                             <div className="absolute left-[-12px] top-1/2 -translate-y-1/2 p-2 bg-primary/10 rounded-full">
                                <Info className="w-5 h-5 text-primary"/>
                            </div>
                            <div>
                                <h4 className="font-semibold text-primary">{dato.titulo}</h4>
                                <p className="text-sm text-muted-foreground">{dato.descripcion}</p>
                            </div>
                        </div>
                    </div>
                </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>

         <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Suspense fallback={<KpiCardSkeleton />}>
                <KpiCard title="Total" value={isLoading ? '...' : stats.total} icon={Receipt} color="text-sky-600" />
            </Suspense>
             <Suspense fallback={<KpiCardSkeleton />}>
                <KpiCard title="Procesados" value={isLoading ? '...' : stats.procesado} icon={Hourglass} color="text-amber-600" />
            </Suspense>
             <Suspense fallback={<KpiCardSkeleton />}>
                <KpiCard title="Aceptados" value={isLoading ? '...' : stats.aceptado} icon={CheckCircle} color="text-emerald-600" />
            </Suspense>
             <Suspense fallback={<KpiCardSkeleton />}>
                <KpiCard title="Rechazados" value={isLoading ? '...' : stats.rechazado} icon={XCircle} color="text-red-600" />
            </Suspense>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
                <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                    <FacturasRecientes facturas={facturas} isLoading={isLoading} />
                </Suspense>
            </div>
            <div className="space-y-8 md:col-span-1">
                <Suspense fallback={<KpiCardSkeleton />}>
                    <KpiCard
                        title="Valor Total de Comprobantes"
                        value={isLoading ? '...' : formatCurrency(stats.valorTotal)}
                        description="Suma total de todos los comprobantes."
                        icon={Receipt}
                        color="text-slate-700"
                        valueClassName="text-3xl"
                    />
                </Suspense>
                 <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                    <EstadoFacturasChart stats={stats} isLoading={isLoading} />
                 </Suspense>
            </div>
         </div>
      </main>
    </div>
  );
}

const MemoizedDashboardPage = memo(DashboardPage);
export default MemoizedDashboardPage;
