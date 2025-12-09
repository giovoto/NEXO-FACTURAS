
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
import { createEmpresaAction } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import type { User } from 'firebase/auth';

const formSchema = z.object({
  nombre: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
  nit: z.string().optional(),
});

type CreateEmpresaFormValues = z.infer<typeof formSchema>;

interface CreateEmpresaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEmpresaId: string) => void;
  user: User;
}

async function getIdToken(user: User | null): Promise<string> {
    if (!user) return '';
    return user.getIdToken();
}

export const CreateEmpresaForm = memo(function CreateEmpresaForm({ isOpen, onClose, onSuccess, user }: CreateEmpresaFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<CreateEmpresaFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: '',
      nit: '',
    },
  });

  const handleSubmit = async (data: CreateEmpresaFormValues) => {
    setIsLoading(true);
    setError('');

    try {
        const idToken = await getIdToken(user);
        const result = await createEmpresaAction(idToken, data.nombre, data.nit || 'N/A');
        onSuccess(result.id);
    } catch (err: any) {
        setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Empresa</DialogTitle>
          <DialogDescription>
            Dale un nombre a tu nueva empresa para empezar a organizar tus documentos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Mi Negocio S.A.S" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIT (Opcional)</FormLabel>
                   <FormControl>
                    <Input placeholder="Ej: 900123456-7" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Empresa
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});

export default CreateEmpresaForm;
