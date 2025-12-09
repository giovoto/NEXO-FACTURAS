
'use client';

import { useState, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Producto, Bodega } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { createOutgoingAction } from '@/app/inventario/actions';
import { User } from 'firebase/auth';

const formSchema = z.object({
  destinatario: z.string().min(3, 'El destinatario es requerido.'),
});

type ProductOutFormValues = z.infer<typeof formSchema>;

interface ProductOutFormProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => Promise<void>;
  selectedProducts: Producto[];
  warehouses: Bodega[];
  user: User;
  empresaId: string;
  canEdit: boolean;
}

// Helper to get ID token
async function getIdToken(user: User | null): Promise<string> {
    if (!user) return '';
    return user.getIdToken();
}

export const ProductOutForm = memo(function ProductOutForm({ isOpen, onClose, onComplete, selectedProducts, warehouses, user, empresaId, canEdit }: ProductOutFormProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    selectedProducts.reduce((acc, p) => ({ ...acc, [p.id]: 1 }), {})
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductOutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { destinatario: '' },
  });
  
  const handleQuantityChange = (productId: string, value: string, max: number) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) {
        setQuantities(prev => ({ ...prev, [productId]: 1 }));
    } else if (numValue > max) {
         setQuantities(prev => ({ ...prev, [productId]: max }));
    } else {
        setQuantities(prev => ({ ...prev, [productId]: numValue }));
    }
  }

  const handleSubmit = async (data: ProductOutFormValues) => {
    if (!canEdit) return;
    setIsSubmitting(true);
    try {
        const productsToUpdate = selectedProducts.map(p => ({
            product: p,
            quantity: quantities[p.id]
        })).filter(item => item.quantity > 0);
        
        const idToken = await getIdToken(user);
        await createOutgoingAction(idToken, empresaId, data.destinatario, productsToUpdate);
        await onComplete();

    } catch (error) {
        console.error("Failed to process outgoing products", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Salida de Productos</DialogTitle>
          <DialogDescription>
            Especifica las cantidades y el destinatario para los productos seleccionados.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
             <fieldset disabled={!canEdit || isSubmitting} className="space-y-4">
                <FormField
                  control={form.control}
                  name="destinatario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destinatario / Motivo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Venta a Cliente XYZ, Traslado a Bodega B, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <h4 className="font-medium text-sm">Productos Seleccionados</h4>
                 <ScrollArea className="h-64 border rounded-md p-4">
                    <div className="space-y-4">
                    {selectedProducts.map(p => (
                        <div key={p.id} className="grid grid-cols-3 gap-4 items-center">
                            <div className="col-span-2">
                                <p className="font-medium">{p.producto}</p>
                                <p className="text-xs text-muted-foreground">Disponible: {p.cantidad}</p>
                            </div>
                            <FormItem>
                                <FormLabel htmlFor={`qty-${p.id}`} className="sr-only">Cantidad</FormLabel>
                                 <FormControl>
                                    <Input 
                                        id={`qty-${p.id}`} 
                                        type="number" 
                                        value={quantities[p.id] || 1}
                                        onChange={(e) => handleQuantityChange(p.id, e.target.value, p.cantidad)}
                                        min="1"
                                        max={p.cantidad}
                                    />
                                 </FormControl>
                            </FormItem>
                        </div>
                    ))}
                    </div>
                </ScrollArea>
             </fieldset>

             <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                {canEdit && (
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirmar Salida
                    </Button>
                )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});
