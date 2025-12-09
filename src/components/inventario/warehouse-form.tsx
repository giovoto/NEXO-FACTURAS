
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
import type { Bodega } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  nombre: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  ubicacion: z.string().min(5, { message: 'La ubicación es requerida y debe ser más descriptiva.' }),
});

type WarehouseFormValues = z.infer<typeof formSchema>;

interface WarehouseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  defaultValues?: Bodega;
  canEdit: boolean;
}

export const WarehouseForm = memo(function WarehouseForm({ isOpen, onClose, onSubmit, defaultValues, canEdit }: WarehouseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<WarehouseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      ubicacion: '',
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    } else {
      form.reset({
        nombre: '',
        ubicacion: '',
      });
    }
  }, [defaultValues, form, isOpen]);


  const handleSubmit = async (data: WarehouseFormValues) => {
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Bodega' : 'Crear Nueva Bodega'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modifica los detalles de la bodega.' : 'Añade una nueva bodega para organizar tu inventario.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <fieldset disabled={!canEdit || isSubmitting} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Bodega</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Bodega Principal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ubicacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ubicación</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Zona Franca, Bogotá" {...field} />
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
                        {isEditMode ? 'Guardar Cambios' : 'Crear Bodega'}
                    </Button>
                )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});
