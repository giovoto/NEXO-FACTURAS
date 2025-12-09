'use client';

import { useState, useMemo, memo, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Upload, FileCheck2, Plus, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MappedField {
    id: number;
    excelHeader: string;
    systemName: string;
}

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (newProducts: any[]) => void;
}

export const ImportWizard = memo(function ImportWizard({ isOpen, onClose, onComplete }: ImportWizardProps) {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [fileHeaders, setFileHeaders] = useState<string[]>([]);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [allData, setAllData] = useState<any[]>([]);
    const [mapping, setMapping] = useState<MappedField[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const processFile = (file: File) => {
        setIsLoading(true);
        setFile(file);
        
        const reader = new FileReader();

        reader.onload = (e) => {
            const data = e.target?.result;
            let results: { data: any[], meta: { fields?: string[] } };

            if (file.name.endsWith('.csv')) {
                results = Papa.parse(data as string, {
                    header: true,
                    skipEmptyLines: true,
                    transformHeader: header => header.trim(),
                });
            } else {
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
                
                const rawHeaders = (jsonData[0] as any[]) || [];
                const trimmedHeaders = rawHeaders.map(h => String(h).trim()).filter(h => h);
                const rows = jsonData.slice(1) as any[][];
                
                results = {
                    data: rows.map(row => {
                        const rowData: any = {};
                        trimmedHeaders.forEach((header, index) => {
                            rowData[header] = row[index];
                        });
                        return rowData;
                    }),
                    meta: { fields: trimmedHeaders }
                };
            }
            
            const validData = results.data.filter(row => Object.values(row).some(val => val !== null && val !== ''));
            const headers = results.meta.fields || [];
            
            setAllData(validData);
            setFileHeaders(headers);
            setPreviewData(validData.slice(0, 5));

            // *** NEW: Auto-populate mapping from file headers ***
            const initialMapping = headers.map((header, index) => ({
                id: Date.now() + index,
                excelHeader: header,
                systemName: header, // Default to the same name
            }));
            setMapping(initialMapping);
            
            setStep(2);
            setIsLoading(false);
        };
        
        reader.onerror = (error) => {
            console.error("File reading error:", error);
            alert("Error al leer el archivo.");
            setIsLoading(false);
        }

        if (file.name.endsWith('.csv')) {
             reader.readAsText(file);
        } else {
             reader.readAsBinaryString(file);
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;
        processFile(selectedFile);
    };

    const isMappingComplete = useMemo(() => {
        return mapping.length > 0 && mapping.every(f => f.excelHeader && f.systemName);
    }, [mapping]);


    const mappedPreview = useMemo(() => {
        return previewData.map(row => {
            const newRow: any = {};
            mapping.forEach(field => {
                if(field.excelHeader && field.systemName) {
                    newRow[field.systemName] = row[field.excelHeader] ?? '';
                }
            });
            return newRow;
        })
    }, [mapping, previewData]);
    
    const handleAddField = () => {
        setMapping(prev => [...prev, { id: Date.now(), excelHeader: '', systemName: '' }]);
    }
    
    const handleRemoveField = (id: number) => {
        setMapping(prev => prev.filter(f => f.id !== id));
    }
    
    const handleFieldChange = (id: number, type: 'excelHeader' | 'systemName', value: string) => {
        setMapping(prev => prev.map(f => f.id === id ? { ...f, [type]: value } : f));
    }

    const handleImport = () => {
        if (!file || !isMappingComplete) return;
        setIsLoading(true);
    
        const newProducts = allData.map((row: any) => {
            if (mapping.length === 0) return null;

            const primaryField = mapping[0];
            const customFields: Record<string, any> = {};
    
            mapping.forEach(field => {
                if (field.excelHeader && field.systemName) {
                    customFields[field.systemName] = row[field.excelHeader] ?? '';
                }
            });

            return {
                producto: row[primaryField.excelHeader] ?? 'N/A',
                sku: null,
                cantidad: 0,
                customFields: customFields,
            };
        }).filter(p => p && p.producto && typeof p.producto === 'string' && p.producto.trim() !== '');
        
        onComplete(newProducts);
        resetState();
    };
    
    const resetState = () => {
        setStep(1);
        setFile(null);
        setFileHeaders([]);
        setPreviewData([]);
        setMapping([]);
        setIsLoading(false);
    }
    
    const handleClose = () => {
        resetState();
        onClose();
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Asistente de Importación de Inventario</DialogTitle>
                    <DialogDescription>
                        Sigue los pasos para importar tus productos desde un archivo CSV o Excel.
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="py-8">
                        <Label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/75">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-10 h-10 mb-4 text-muted-foreground animate-spin" />
                                        <p>Procesando archivo...</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-10 h-10 mb-4 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground">
                                            <span className="font-semibold">Click para cargar</span> o arrastra tu archivo aquí
                                        </p>
                                        <p className="text-xs text-muted-foreground">CSV o XLSX</p>
                                    </>
                                )}
                            </div>
                            <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} disabled={isLoading} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
                        </Label>
                    </div>
                )}
                
                {step === 2 && (
                    <div className="space-y-4 py-4">
                       <ScrollArea className="h-[70vh] p-1">
                        <div>
                            <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 border border-green-200">
                               <FileCheck2 className="h-5 w-5 text-green-700" />
                               <p className="text-sm font-medium text-green-800">Archivo cargado: <span className="font-bold">{file?.name}</span></p>
                            </div>
                        </div>
                        <h3 className="font-semibold">2. Mapea las Columnas</h3>
                        <p className="text-sm text-muted-foreground">
                           Revisa las columnas de tu Excel. El primer campo se usará como el nombre principal del producto. Puedes renombrar o eliminar campos que no necesites.
                        </p>
                        
                        <div className="space-y-3 rounded-md border p-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-medium">Campos a Importar</h4>
                                <Button size="sm" variant="outline" onClick={handleAddField}><Plus className="mr-2 h-4 w-4" /> Añadir Campo</Button>
                            </div>
                            {mapping.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">No se detectaron cabeceras o el archivo está vacío.</p>
                            )}
                            {mapping.map((field, index) => (
                                <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-center">
                                     <Select value={field.excelHeader} onValueChange={(value) => handleFieldChange(field.id, 'excelHeader', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Columna del Excel" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {fileHeaders.map(header => <SelectItem key={header} value={header}>{header}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Input 
                                        placeholder="Nombre en el sistema"
                                        value={field.systemName} 
                                        onChange={(e) => handleFieldChange(field.id, 'systemName', e.target.value)} 
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveField(field.id)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        
                        
                        <h3 className="font-semibold pt-4">3. Vista Previa de Datos</h3>
                        <div className="rounded-md border max-h-60 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {mapping.map(field => <TableHead key={field.id}>{field.systemName || "..."}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mappedPreview.length > 0 ? mappedPreview.map((row, index) => (
                                        <TableRow key={index}>
                                            {mapping.map(field => <TableCell key={field.id}>{String(row[field.systemName])}</TableCell>)}
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={mapping.length || 1} className="h-24 text-center">
                                                {mapping.length > 0 ? "Vista previa de los datos a importar." : "Añade y mapea campos para ver una vista previa."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                       </ScrollArea>
                         <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setStep(1)}>Volver</Button>
                            <Button onClick={handleImport} disabled={!isMappingComplete || isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Importar {allData.length} Productos
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
});
