'use client';

import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";

import type { Invoice } from '@/lib/types';

interface SpendingChartProps {
  invoices: Invoice[];
}

export default function SpendingChart({ invoices }: SpendingChartProps) {
  const chartData = useMemo(() => {
    const spendingBySupplier = invoices.reduce((acc, invoice) => {
      acc[invoice.supplierName] = (acc[invoice.supplierName] || 0) + invoice.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(spendingBySupplier)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [invoices]);
  
  const chartConfig = {
    total: {
      label: "Total",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gasto por Proveedor</CardTitle>
        <CardDescription>
          Visualización del total gastado en cada proveedor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={100}
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                  />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--accent))', radius: 4 }}
                  content={<ChartTooltipContent
                    formatter={(value) => new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0
                    }).format(Number(value))}
                    indicator="dot"
                  />}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              No hay datos para mostrar.
            </div>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
