
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, ArrowLeft, FileScan } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function AnalizadorRUTPage() {
  const [rutFile, setRutFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null); // Placeholder for AI results

  const handleAnalizar = async () => {
    if (!rutFile) {
      alert('Por favor, carga un archivo RUT en formato PDF.');
      return;
    }
    setIsLoading(true);
    // TODO: Connect to AI flow for RUT analysis
    console.log('Iniciando análisis de RUT con:', rutFile.name);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock result
    setResultado({
      razonSocial: 'Constructora XYZ S.A.S',
      nit: '900.123.456-7',
      responsabilidades: ['O-13 Gran Contribuyente', 'O-15 Autorretenedor', 'O-48 Impuesto sobre la Renta'],
      actividadPrincipal: '4111 - Construcción de edificios residenciales'
    });
    
    setIsLoading(false);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analizador de RUT con IA</h1>
         <Link href="/herramientas">
            <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Herramientas
            </Button>
         </Link>
      </div>

      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Cargar Certificado RUT</CardTitle>
          <CardDescription>Sube el archivo en formato PDF. La IA se encargará de leerlo y extraer la información fiscal más relevante.</CardDescription>
        </CardHeader>
        <CardContent>
           <Label htmlFor="rut-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <FileScan className="w-10 h-10 mb-4 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                        {rutFile ? <span className="font-semibold text-primary">{rutFile.name}</span> : <span><span className="font-semibold">Click para cargar</span> o arrastra el PDF aquí</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">PDF (MAX. 5MB)</p>
                </div>
                <Input id="rut-upload" type="file" className="hidden" onChange={(e) => setRutFile(e.target.files ? e.target.files[0] : null)} disabled={isLoading} accept="application/pdf" />
            </Label>
            <div className="flex justify-center pt-6">
              <Button onClick={handleAnalizar} disabled={isLoading || !rutFile} size="lg">
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  {isLoading ? 'Analizando RUT...' : 'Analizar con IA'}
              </Button>
            </div>
        </CardContent>
      </Card>
      
      {resultado && (
         <Card className="max-w-xl mx-auto mt-8">
            <CardHeader>
                <CardTitle>Resultado del Análisis</CardTitle>
                <CardDescription>Esta es la información extraída del documento RUT.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label className="text-xs text-muted-foreground">Razón Social</Label>
                    <p className="font-semibold">{resultado.razonSocial}</p>
                </div>
                 <div>
                    <Label className="text-xs text-muted-foreground">NIT</Label>
                    <p className="font-semibold">{resultado.nit}</p>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">Actividad Económica Principal</Label>
                    <p className="font-semibold">{resultado.actividadPrincipal}</p>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">Responsabilidades Fiscales</Label>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                        {resultado.responsabilidades.map((resp: string) => <li key={resp}>{resp}</li>)}
                    </ul>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
