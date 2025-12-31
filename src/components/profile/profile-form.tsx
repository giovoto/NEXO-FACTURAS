
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
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useLogs } from '@/lib/logger'; // Removed .tsx extension from import
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

  // Get display name from user_metadata or standard property
  const currentDisplayName = user.user_metadata?.full_name || user.user_metadata?.display_name || '';

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: currentDisplayName,
    },
  });

  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.full_name || user.user_metadata?.display_name || '';
      form.reset({
        displayName: name,
      });
    }
    setError('');
  }, [user, isOpen, form]);

  const handleSubmit = async (data: ProfileFormValues) => {
    setError('');
    setIsLoading(true);
    addLog('INFO', 'Intentando actualizar el perfil del usuario...');
    try {
      // Update Supabase Auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: data.displayName, display_name: data.displayName }
      });

      if (authError) throw authError;

      // Update public users table
      const { error: dbError } = await supabase
        .from('users')
        .update({ display_name: data.displayName })
        .eq('auth_id', user.id);

      if (dbError) throw dbError;

      addLog('SUCCESS', 'Perfil actualizado correctamente.');

      // Force refresh of the page or session might be needed to see changes immediately
      // router.refresh(); // Optional
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
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
