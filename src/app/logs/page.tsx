
'use client';

import { useLogs } from '@/lib/logger.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const levelColors: { [key in 'INFO' | 'ERROR' | 'SUCCESS']: string } = {
  INFO: 'bg-blue-100 text-blue-800 border-blue-200',
  ERROR: 'bg-red-100 text-red-800 border-red-200',
  SUCCESS: 'bg-green-100 text-green-800 border-green-200',
};

export default function LogsPage() {
  const { logs, clearLogs } = useLogs();

  const formatTimestamp = (isoString: string) => {
    return new Date(isoString).toLocaleString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hour12: true,
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Logs del Sistema</h1>
        <Button variant="outline" onClick={clearLogs}>
          <Trash2 className="mr-2 h-4 w-4" />
          Limpiar Logs
        </Button>
      </div>

      <Card className="font-mono">
        <CardContent className="p-0">
          <div className="overflow-auto h-[75vh]">
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No hay logs para mostrar. Navega por la aplicación para generar eventos.</p>
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex items-start gap-4 p-3 border-b">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTimestamp(log.timestamp)}</span>
                  <Badge className={cn("text-xs", levelColors[log.level])}>{log.level}</Badge>
                  <div className="flex-grow">
                    <p className="text-sm">{log.message}</p>
                    {log.details && (
                      <pre className="mt-2 p-2 bg-muted/50 rounded-md text-xs whitespace-pre-wrap break-words">
                        <code>{log.details}</code>
                      </pre>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
