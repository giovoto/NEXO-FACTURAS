
'use client';

import React, { memo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';

interface SettingsCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  statusSlot?: React.ReactNode;
  action?: () => void;
  actionLabel?: string;
  children?: React.ReactNode;
}

export const SettingsCard = memo(function SettingsCard({ title, description, icon: Icon, statusSlot, action, actionLabel, children }: SettingsCardProps) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {statusSlot}
        {children}
      </CardContent>
       {action && actionLabel && (
         <CardFooter>
            <Button onClick={action} className="w-full">
                {actionLabel}
            </Button>
        </CardFooter>
      )}
    </Card>
  );
});
