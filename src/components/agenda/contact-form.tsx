
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
import { Contacto } from '@/lib/types';

const formSchema = z.object({
  proveedor: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  identificacion: z.string().min(5, { message: 'La identificación es requerida.' }),
  email: z.string().email({ message: 'Email inválido.' }).nullable().optional(),
  telefono: z.string().nullable().optional(),
});

type ContactFormValues = z.infer<typeof formSchema>;

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  defaultValues?: Contacto;
  canEdit: boolean;
}

export const ContactForm = memo(function ContactForm({ isOpen, onClose, onSubmit, defaultValues, canEdit }: ContactFormProps) {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      proveedor: '',
      identificacion: '',
      email: '',
      telefono: '',
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        proveedor: defaultValues.proveedor,
        identificacion: defaultValues.identificacion,
        email: defaultValues.email,
        telefono: defaultValues.telefono,
      });
    } else {
      form.reset({
        proveedor: '',
        identificacion: '',
        email: '',
        telefono: '',
      });
    }
  }, [defaultValues, form]);


  const handleSubmit = (data: ContactFormValues) => {
    if (!canEdit) return;
    onSubmit({ ...defaultValues, ...data });
  };
  
  const isEditMode = !!defaultValues;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Contacto' : 'Crear Contacto'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modifica los detalles del contacto.' : 'Añade un nuevo contacto a tu agenda.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <fieldset disabled={!canEdit} className="space-y-4">
                <FormField
                  control={form.control}
                  name="proveedor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Proveedor</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Alfonso Mora Aponte" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="identificacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identificación</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 93369534" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="proveedor@ejemplo.com" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="3001234567" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </fieldset>
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                {canEdit && (
                  <Button type="submit">{isEditMode ? 'Guardar Cambios' : 'Crear Contacto'}</Button>
                )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});
