
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLogs } from '@/lib/logger.tsx';
import { actionImportZip } from '@/app/actions';
import { useAuth } from './auth-provider';

interface ZipUploaderProps {
  onProcessComplete: () => void;
}

export function ZipUploader({ onProcessComplete }: ZipUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { addLog } = useLogs();
  const { user, activeEmpresaId } = useAuth();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !activeEmpresaId) return;

    setIsLoading(true);
    addLog('INFO', `Comenzando a procesar el archivo ZIP: ${file.name}`);

    try {
      // Create FormData for Server Action
      const formData = new FormData();
      formData.append('file', file);
      formData.append('empresaId', activeEmpresaId);

      const result = await actionImportZip(formData);

      if (result.success) {
        addLog('SUCCESS', `Archivo procesado. Se importaron ${result.imported} facturas.`);
        alert(`Proceso completado. Se importaron ${result.imported} facturas desde el ZIP.`);
        onProcessComplete();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      addLog('ERROR', 'Error al procesar el archivo ZIP.', error.message);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
      event.target.value = ''; // Reset input to allow re-uploading the same file
    }
  };

  return (
    <>
      <Button asChild variant="outline" className="w-full sm:w-auto" disabled={isLoading || !activeEmpresaId}>
        <label htmlFor="zip-upload" className="cursor-pointer">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Cargar ZIP
        </label>
      </Button>
      <Input
        id="zip-upload"
        type="file"
        className="hidden"
        accept=".zip"
        onChange={handleFileChange}
        disabled={isLoading || !activeEmpresaId}
      />
    </>
  );
}
