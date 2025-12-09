
'use client';

import { memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface EstadoFacturasChartProps {
  stats: {
    aceptado: number;
    rechazado: number;
    procesado: number;
  };
  isLoading: boolean;
}

const COLORS = {
  aceptado: 'hsl(var(--primary))',
  rechazado: 'hsl(var(--destructive))',
  procesado: 'hsl(var(--secondary))',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col space-y-1">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {payload[0].name}
            </span>
            <span className="font-bold text-muted-foreground">
              {payload[0].value}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

function EstadoFacturasChart({ stats, isLoading }: EstadoFacturasChartProps) {
  const data = [
    { name: 'Aceptados', value: stats.aceptado },
    { name: 'Rechazados', value: stats.rechazado },
    { name: 'En Proceso', value: stats.procesado },
  ].filter(item => item.value > 0);
  
  const colorMapping = {
    'Aceptados': COLORS.aceptado,
    'Rechazados': COLORS.rechazado,
    'En Proceso': COLORS.procesado,
  };

  const total = stats.aceptado + stats.rechazado + stats.procesado;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="flex justify-center items-center h-48">
           <Skeleton className="h-36 w-36 rounded-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Estados</CardTitle>
        <CardDescription>
          Proporción de comprobantes por estado.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-48">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colorMapping[entry.name as keyof typeof colorMapping]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
           <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              No hay datos para mostrar.
            </div>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(EstadoFacturasChart);
