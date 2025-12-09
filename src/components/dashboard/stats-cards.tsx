import { FileText, DollarSign, BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Invoice } from '@/lib/types';

interface StatsCardsProps {
  invoices: Invoice[];
}

export default function StatsCards({ invoices }: StatsCardsProps) {
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const averageAmount = totalInvoices > 0 ? totalAmount / totalInvoices : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      title: 'Facturas Totales',
      value: totalInvoices.toString(),
      icon: FileText,
    },
    {
      title: 'Gasto Total',
      value: formatCurrency(totalAmount),
      icon: DollarSign,
    },
    {
      title: 'Gasto Promedio',
      value: formatCurrency(averageAmount),
      icon: BarChart,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
