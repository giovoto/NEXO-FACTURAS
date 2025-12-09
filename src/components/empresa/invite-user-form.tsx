
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { useAuth } from '../auth-provider';
import { inviteUserAction } from '@/app/empresa/usuarios/actions';
import type { EmpresaRole } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import type { User } from 'firebase/auth';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, introduce un correo válido.' }),
  rol: z.enum(['admin', 'editor', 'viewer']),
});

type InviteFormValues = z.infer<typeof formSchema>;

interface InviteUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  empresaId: string;
}

// Helper to get ID token
async function getIdToken(user: User | null): Promise<string> {
    if (!user) return '';
    return user.getIdToken();
}


export const InviteUserForm = memo(function InviteUserForm({ isOpen, onClose, onSuccess, empresaId }: InviteUserFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      rol: 'viewer',
    },
  });

  const handleSubmit = async (data: InviteFormValues) => {
    if (!user || !empresaId) return;

    setIsLoading(true);
    setError('');

    try {
        const idToken = await getIdToken(user);
        const result = await inviteUserAction(idToken, empresaId, data.email, data.rol as EmpresaRole);
        if (result.success) {
            onSuccess();
            onClose();
        } else {
            setError(result.message);
        }
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
          <DialogTitle>Invitar Usuario a la Empresa</DialogTitle>
          <DialogDescription>
            Introduce el correo y asigna un rol. Si el usuario no tiene cuenta, se creará una.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo del Usuario</FormLabel>
                  <FormControl>
                    <Input placeholder="usuario@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol en la Empresa</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
             <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Añadir Usuario
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
});

export default InviteUserForm;
