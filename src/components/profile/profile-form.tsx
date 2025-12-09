
'use client';

import { useEffect, useState, memo } from 'react';
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
import { User, updateProfile } from 'firebase/auth';
import { useLogs } from '@/lib/logger.tsx';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  displayName: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres.' }),
});

type ProfileFormValues = z.infer<typeof formSchema>;

interface ProfileFormProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileForm = memo(function ProfileForm({ user, isOpen, onClose }: ProfileFormProps) {
  const { addLog } = useLogs();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: user.displayName || '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        displayName: user.displayName || '',
      });
    }
    setError('');
  }, [user, isOpen, form]);

  const handleSubmit = async (data: ProfileFormValues) => {
    setError('');
    setIsLoading(true);
    addLog('INFO', 'Intentando actualizar el perfil del usuario...');
    try {
      await updateProfile(user, {
        displayName: data.displayName,
      });
      addLog('SUCCESS', 'Perfil actualizado correctamente.');
      onClose();
    } catch (err: any) {
      const errorMessage = `Error al actualizar el perfil: ${err.message}`;
      addLog('ERROR', errorMessage, err);
      setError('No se pudo actualizar el nombre. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Actualiza tu nombre. Este nombre será visible en la aplicación.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});
