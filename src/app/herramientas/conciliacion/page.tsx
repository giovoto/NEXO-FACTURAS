
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Upload, Loader2, ArrowLeft, Trash2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { MovimientoBanco, AsientoSiigo } from '@/lib/types';
import { conciliarArchivosAction } from './actions';


interface ReconciliationResult {
    summary: {
        movimientos: { count: number; total: number };
        asientos: { count: number; total: number };
        matched: { count: number; total: number };
    };
    unmatchedMovimientos: MovimientoBanco[];
    unmatchedAsientos: AsientoSiigo[];
}


const FileUploadCard = ({ title, description, files, onFilesChange, isLoading, multiple = false }: { title: string, description: string, files: File[], onFilesChange: (files: File[]) => void, isLoading: boolean, multiple?: boolean }) => {
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = Array.from(e.target.files || []);
        if (multiple) {
            onFilesChange([...files, ...newFiles]);
        } else {
            onFilesChange(newFiles.slice(0, 1));
        }
    }
    
    const handleRemoveFile = (index: number) => {
        onFilesChange(files.filter((_, i) => i !== index));
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <Label htmlFor={`file-upload-${title}`} className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                           <span className="font-semibold">Click para cargar</span> o arrastra
                        </p>
                        <p className="text-xs text-muted-foreground">{multiple ? 'PDF' : 'CSV o XLSX'}</p>
                    </div>
                    <Input id={`file-upload-${title}`} type="file" className="hidden" onChange={handleFileChange} disabled={isLoading} accept={multiple ? ".pdf" : ".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"} multiple={multiple} />
                </Label>
                {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {files.map((file, index) => (
                           <div key={index} className="flex items-center justify-between p-2 text-sm rounded-md bg-muted/70">
                               <span>{file.name}</span>
                               <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveFile(index)}>
                                   <Trash2 className="h-4 w-4" />
                               </Button>
                           </div>
                        ))}
                         {multiple && (
                             <Button variant="outline" size="sm" className="w-full" onClick={() => document.getElementById(`file-upload-${title}`)?.click()}>
                                <Plus className="mr-2 h-4 w-4" /> Añadir otro PDF
                             </Button>
                         )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}


export default function ConciliacionPage() {
  const [libroFile, setLibroFile] = useState<File[]>([]);
  const [extractoFiles, setExtractoFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<ReconciliationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConciliar = async () => {
    if (libroFile.length === 0 || extractoFiles.length === 0) {
      alert('Por favor, carga ambos tipos de archivos para continuar.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResultado(null);
    
    const formData = new FormData();
    formData.append('siigo', libroFile[0]);
    extractoFiles.forEach(file => {
        formData.append('pdfs', file);
    });

    try {
        const result = await conciliarArchivosAction(formData);
        if (result.error) {
            throw new Error(result.error);
        }
        setResultado(result.data as ReconciliationResult);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };
  
  const formatCurrency = (value: number) => value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Conciliación Bancaria con IA</h1>
         <Link href="/herramientas">
            <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Herramientas
            </Button>
         </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FileUploadCard 
            title="1. Libro Auxiliar (Siigo)"
            description="Carga el archivo exportado desde tu software contable (Excel)."
            files={libroFile}
            onFilesChange={setLibroFile}
            isLoading={isLoading}
        />
        <FileUploadCard 
            title="2. Extracto(s) Bancario(s)"
            description="Carga uno o más extractos en formato PDF (Bancolombia)."
            files={extractoFiles}
            onFilesChange={setExtractoFiles}
            isLoading={isLoading}
            multiple={true}
        />
      </div>

       <div className="flex justify-center pt-4">
            <Button onClick={handleConciliar} disabled={isLoading || libroFile.length === 0 || extractoFiles.length === 0} size="lg">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {isLoading ? 'Analizando Archivos...' : 'Conciliar con IA'}
            </Button>
      </div>
      
      {error && (
        <Card className="mt-8 bg-destructive/10 border-destructive/20 text-destructive-foreground">
            <CardHeader>
                <CardTitle>Error en la Conciliación</CardTitle>
                <CardDescription>{error}</CardDescription>
            </CardHeader>
        </Card>
      )}

      {resultado && (
         <Card className="mt-8">
            <CardHeader>
                <CardTitle>Resultado de la Conciliación</CardTitle>
                <CardDescription>Análisis completado. Revisa los resultados a continuación.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <Card className="p-4">
                        <h3 className="text-sm font-semibold text-muted-foreground">REGISTROS EN LIBRO (SIIGO)</h3>
                        <p className="text-2xl font-bold">{resultado.summary.asientos.count}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(resultado.summary.asientos.total)}</p>
                    </Card>
                     <Card className="p-4 bg-primary/10 border-primary/20">
                        <h3 className="text-sm font-semibold text-primary">PARTIDAS CONCILIADAS</h3>
                        <p className="text-2xl font-bold text-primary">{resultado.summary.matched.count}</p>
                        <p className="text-sm text-primary/80">{formatCurrency(resultado.summary.matched.total)}</p>
                    </Card>
                    <Card className="p-4">
                        <h3 className="text-sm font-semibold text-muted-foreground">MOVIMIENTOS EN BANCO (PDF)</h3>
                        <p className="text-2xl font-bold">{resultado.summary.movimientos.count}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(resultado.summary.movimientos.total)}</p>
                    </Card>
                </div>
                
                <div className="space-y-4">
                    <h3 className="font-semibold">Partidas Pendientes en Libro (No encontradas en extracto)</h3>
                     <Table>
                        <TableHeader>
                            <TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Débito</TableHead><TableHead className="text-right">Crédito</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {resultado.unmatchedAsientos.map((a, i) => (
                                <TableRow key={i}><TableCell>{a.fecha}</TableCell><TableCell>{a.descripcion}</TableCell><TableCell className="text-right">{formatCurrency(a.debito)}</TableCell><TableCell className="text-right">{formatCurrency(a.credito)}</TableCell></TableRow>
                            ))}
                        </TableBody>
                     </Table>
                </div>
                
                 <div className="space-y-4">
                    <h3 className="font-semibold">Partidas Pendientes en Banco (No encontradas en libro)</h3>
                    <Table>
                        <TableHeader>
                            <TableRow><TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead className="text-right">Importe</TableHead></TableRow>
                        </TableHeader>
                        <TableBody>
                            {resultado.unmatchedMovimientos.map((m, i) => (
                                <TableRow key={i}><TableCell>{m.fecha}</TableCell><TableCell>{m.descripcion}</TableCell><TableCell className="text-right">{formatCurrency(m.importe)}</TableCell></TableRow>
                            ))}
                        </TableBody>
                     </Table>
                </div>
            </CardContent>
            <CardFooter>
                 <p className="text-xs text-muted-foreground">La conciliación se realizó con una ventana de 3 días para fechas y un 85% de similitud en descripciones.</p>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}
