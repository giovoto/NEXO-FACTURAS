
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { convertirExtractoAction } from './actions';

export default function ConvertidorExtractoPage() {
  const [extractoFile, setExtractoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExtractoFile(e.target.files ? e.target.files[0] : null);
    setError(null);
  };

  const handleConvertir = async () => {
    if (!extractoFile) {
      setError('Por favor, carga un archivo PDF.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('pdf', extractoFile);
      const result = await convertirExtractoAction(formData);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.data) {
        // Create a link and trigger download
        const link = document.createElement('a');
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data}`;
        link.download = `extracto_${extractoFile.name.replace('.pdf', '')}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Convertidor de Extracto a Excel</h1>
         <Link href="/herramientas">
            <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Herramientas
            </Button>
         </Link>
      </div>

      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Cargar Extracto Bancario</CardTitle>
          <CardDescription>Sube el archivo en formato PDF (optimizado para Bancolombia). El sistema lo convertirá a un archivo Excel (XLSX).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Label htmlFor="extracto-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <FileSpreadsheet className="w-10 h-10 mb-4 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                        {extractoFile ? <span className="font-semibold text-primary">{extractoFile.name}</span> : <span><span className="font-semibold">Click para cargar</span> o arrastra el PDF aquí</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">PDF (MAX. 5MB)</p>
                </div>
                <Input id="extracto-upload" type="file" className="hidden" onChange={handleFileChange} disabled={isLoading} accept="application/pdf" />
            </Label>
            {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <div className="flex justify-center pt-6">
              <Button onClick={handleConvertir} disabled={isLoading || !extractoFile} size="lg">
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  {isLoading ? 'Convirtiendo...' : 'Convertir a Excel'}
              </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
