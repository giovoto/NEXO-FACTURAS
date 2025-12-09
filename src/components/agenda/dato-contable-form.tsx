
'use client';

import { useEffect, memo } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import type { DatoContable } from '@/app/configuracion/actions';

const formSchema = z.object({
  titulo: z.string().min(5, { message: 'El título debe tener al menos 5 caracteres.' }),
  descripcion: z.string().min(1, { message: 'El valor es requerido.' }),
});

type ParametroFormValues = z.infer<typeof formSchema>;

interface ParametroFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  defaultValues?: DatoContable;
}

export const ParametroForm = memo(function ParametroForm({ isOpen, onClose, onSubmit, defaultValues }: ParametroFormProps) {
  const form = useForm<ParametroFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      descripcion: '',
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    } else {
      form.reset({
        titulo: '',
        descripcion: '',
      });
    }
  }, [defaultValues, form, isOpen]);


  const handleSubmit = (data: ParametroFormValues) => {
    onSubmit({ ...defaultValues, ...data });
  };
  
  const isEditMode = !!defaultValues;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Parámetro' : 'Crear Parámetro'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modifica el valor del parámetro.' : 'Añade un nuevo parámetro al sistema.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Valor UVT 2025" {...field} readOnly={isEditMode} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl>
                    <Input 
                        placeholder="Escribe aquí el valor del parámetro..." 
                        {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button type="submit">{isEditMode ? 'Guardar Cambios' : 'Crear Parámetro'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});

export default ParametroForm;
