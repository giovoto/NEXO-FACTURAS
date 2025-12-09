
'use client';

import { useEffect, memo, useState } from 'react';
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
import type { Producto } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  producto: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  sku: z.string().optional().nullable(),
  cantidad: z.coerce.number().min(0, { message: 'La cantidad no puede ser negativa.' }),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  defaultValues?: Producto;
  canEdit: boolean;
}

export const ProductForm = memo(function ProductForm({ isOpen, onClose, onSubmit, defaultValues, canEdit }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      producto: '',
      sku: '',
      cantidad: 0,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    } else {
      form.reset({
        producto: '',
        sku: '',
        cantidad: 0,
      });
    }
  }, [defaultValues, form, isOpen]);


  const handleSubmit = async (data: ProductFormValues) => {
    if (!canEdit) return;
    setIsSubmitting(true);
    try {
        await onSubmit({ ...defaultValues, ...data });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const isEditMode = !!defaultValues;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Producto' : 'Añadir Nuevo Producto'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modifica los detalles del producto.' : 'Añade un nuevo producto al inventario de esta bodega.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <fieldset disabled={!canEdit || isSubmitting} className="space-y-4">
                <FormField
                  control={form.control}
                  name="producto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Producto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Resma de papel carta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: PAP-001" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cantidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </fieldset>
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                {canEdit && (
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? 'Guardar Cambios' : 'Crear Producto'}
                    </Button>
                )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});
