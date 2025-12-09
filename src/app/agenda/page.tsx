
'use client';

import { useState, lazy, Suspense, useMemo, useEffect, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { columns as columnsContacto } from './columns';
import type { Contacto } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { getContactsAction, saveContactAction, deleteContactAction } from './actions';
import type { User } from 'firebase/auth';

const ContactForm = lazy(() => import('@/components/agenda/contact-form').then(module => ({ default: module.ContactForm })));

// Helper to get ID token
async function getIdToken(user: User | null): Promise<string> {
    if (!user) return '';
    return user.getIdToken();
}


// Memoize the TabContent to prevent re-renders on tab switch
const TabContent = memo(function TabContent({ columns, data, placeholder, onEdit, isLoading = false }: { columns: any, data: any[], placeholder: string, onEdit: (item: any) => void, isLoading?: boolean }) {
    return (
        <div className="space-y-4">
            <div className="relative flex items-center">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input placeholder={placeholder} className="pl-10" />
            </div>
            <DataTable columns={columns} data={data} isLoading={isLoading} />
        </div>
    );
});


export default function AgendaPage() {
  const [activeTab, setActiveTab] = useState('proveedores');
  const { user, activeEmpresaId, empresaRole } = useAuth();
  
  // State for contacts
  const [contacts, setContacts] = useState<Contacto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contacto | undefined>(undefined);

  const canEdit = empresaRole === 'admin' || empresaRole === 'editor';

  const fetchContacts = useCallback(async () => {
    if (!user || !activeEmpresaId) return;
    setIsLoading(true);
    try {
        const idToken = await getIdToken(user);
        const fetchedContacts = await getContactsAction(idToken, activeEmpresaId);
        setContacts(fetchedContacts);
    } catch (error) {
        console.error("Failed to fetch contacts:", error);
    } finally {
        setIsLoading(false);
    }
  }, [user, activeEmpresaId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);


  const contactColumns = useMemo(() => columnsContacto({ onEdit: (contact) => handleOpenForm(contact), canEdit }), [canEdit]);

  const handleOpenForm = (item?: any) => {
      if (!canEdit) return;
      setSelectedContact(item);
      setIsContactFormOpen(true);
  };

  const handleCloseForms = () => {
    setSelectedContact(undefined);
    setIsContactFormOpen(false);
  };
  
  const handleSaveContact = async (data: Omit<Contacto, 'id' | 'userId'> | Contacto) => {
    if (!user || !activeEmpresaId || !canEdit) return;
    try {
        const idToken = await getIdToken(user);
        await saveContactAction(idToken, activeEmpresaId, data);
        await fetchContacts();
    } catch (error) {
        console.error("Failed to save contact:", error);
    } finally {
        handleCloseForms();
    }
  }
  

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
        {canEdit && (
            <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto" disabled={!activeEmpresaId}>
                <Plus className="mr-2 h-4 w-4" /> 
                Nuevo Contacto
            </Button>
        )}
      </div>

      <Suspense fallback={<div />}>
        {isContactFormOpen && (
          <ContactForm
            isOpen={isContactFormOpen}
            onClose={handleCloseForms}
            onSubmit={handleSaveContact}
            defaultValues={selectedContact}
            canEdit={canEdit}
          />
        )}
      </Suspense>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
          <TabsTrigger value="empleados">Empleados</TabsTrigger>
          <TabsTrigger value="servicios">Servicios</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="destinatarios">Destinatarios</TabsTrigger>
        </TabsList>
        <TabsContent value="proveedores">
           <TabContent columns={contactColumns} data={contacts} placeholder="Buscar proveedor..." onEdit={(item) => handleOpenForm(item)} isLoading={isLoading} />
        </TabsContent>
         <TabsContent value="empleados">
           <TabContent columns={contactColumns} data={[]} placeholder="Buscar empleado..." onEdit={(item) => handleOpenForm(item)} />
        </TabsContent>
        <TabsContent value="servicios">
           <TabContent columns={contactColumns} data={[]} placeholder="Buscar servicio..." onEdit={(item) => handleOpenForm(item)}/>
        </TabsContent>
        <TabsContent value="clientes">
           <TabContent columns={contactColumns} data={[]} placeholder="Buscar cliente..." onEdit={(item) => handleOpenForm(item)}/>
        </TabsContent>
        <TabsContent value="destinatarios">
           <TabContent columns={contactColumns} data={[]} placeholder="Buscar destinatario..." onEdit={(item) => handleOpenForm(item)}/>
        </TabsContent>
      </Tabs>
    </div>
  );
}
