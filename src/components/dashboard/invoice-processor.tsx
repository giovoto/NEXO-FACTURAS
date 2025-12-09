
'use client';

import { useState } from 'react';
import { Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { extractInvoiceData } from '@/app/actions';
import type { Factura } from '@/lib/types';
import { useAuth } from '../auth-provider';


interface InvoiceProcessorProps {
  onNewInvoice: (invoice: Factura) => void;
}

export default function InvoiceProcessor({ onNewInvoice }: InvoiceProcessorProps) {
  const [emailContent, setEmailContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!emailContent.trim() || !user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El contenido del correo no puede estar vacío y debes estar autenticado.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const idToken = await user.getIdToken();
      const result = await extractInvoiceData({ emailContent, userId: user.uid, idToken });

      if (result.success && result.data) {
        const newFactura: Factura = {
            id: `new-${Date.now()}`,
            nombreEmisor: result.data.supplierName,
            folio: result.data.invoiceNumber,
            fecha: result.data.invoiceDate,
            fechaVencimiento: result.data.fechaVencimiento,
            valorTotal: result.data.totalAmount,
            estado: 'Procesado',
            categoria: result.data.categoria,
        };
        onNewInvoice(newFactura);
        toast({
          title: 'Éxito',
          description: 'Factura procesada y añadida a la lista.',
        });
        setEmailContent('');
      } else {
        throw new Error(result.error || 'Error desconocido al procesar la factura.');
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      toast({
        variant: 'destructive',
        title: 'Error al procesar',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Procesar Nueva Factura</CardTitle>
          <CardDescription>
            Pega el contenido completo de un correo electrónico con una factura XML para extraer los datos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Pega aquí el contenido del correo..."
            className="min-h-40 resize-y"
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            disabled={isLoading}
          />
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading || !user}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            {isLoading ? 'Procesando...' : 'Extraer Datos con IA'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

    