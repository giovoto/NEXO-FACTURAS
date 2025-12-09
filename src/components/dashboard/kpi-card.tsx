
'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  color?: string;
  valueClassName?: string;
}

function KpiCard({ title, value, icon: Icon, description, color, valueClassName }: KpiCardProps) {

  const isLoading = value === '...';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
         <Icon className={cn("h-4 w-4 text-muted-foreground", color)} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <Skeleton className={cn("h-8 w-20", !description && "mt-1")} />
        ) : (
            <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground pt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(KpiCard);
