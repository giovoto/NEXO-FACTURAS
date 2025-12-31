'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, AlertTriangle } from 'lucide-react';
import { actionImportZip } from '@/app/actions';
import { InvoiceViewer } from '@/components/dashboard/invoice-viewer';
import { ParsedInvoice } from '@/services/xml-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DianSyncButton } from './dian-sync-button';
import { InvoiceTable } from './invoice-table';


export default function DocumentosPage() {
    const { user, activeEmpresaId } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{ success: boolean; message?: string; invoice?: ParsedInvoice } | null>(null);
    const [dianInvoices, setDianInvoices] = useState<ParsedInvoice[]>([]);
    const [syncMessage, setSyncMessage] = useState<string>('');

    // Load invoices from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('dianInvoices');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setDianInvoices(parsed);
                console.log(`✅ Restored ${parsed.length} invoices from localStorage`);
            } catch (e) {
                console.error('Failed to parse saved invoices:', e);
            }
        }
    }, []);

    // Save invoices to localStorage whenever they change
    useEffect(() => {
        if (dianInvoices.length > 0) {
            localStorage.setItem('dianInvoices', JSON.stringify(dianInvoices));
            console.log(`💾 Saved ${dianInvoices.length} invoices to localStorage`);
        }
    }, [dianInvoices]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !activeEmpresaId) return;

        setIsUploading(true);
        setUploadResult(null);

        try {
            const token = await user.getIdToken();
            // We can use the existing ZIP import action which now supports XML extraction
            // Or we could create a dedicated XML action. For robust DIAN handling, ZIP is standard.
            // If user uploads XML, we might need a small adapter, but let's try assuming ZIP/XML support in action.
            // Note: actionImportZip takes a File object directly in server actions if setup correctly, 
            // but passing complex objects like File to server actions directly from client often requires FormData.
            // Let's wrap in a simple function here or use FormData if actionImportZip expects it.
            // Actually actionImportZip signature is (token, empresaId, File). Next.js actions support passing FormData.

            const formData = new FormData();
            formData.append('idToken', token);
            formData.append('empresaId', activeEmpresaId);
            formData.append('file', file);

            const res = await actionImportZip(formData);

            if (res.success && res.invoice) {
                setUploadResult({ success: true, invoice: res.invoice as ParsedInvoice });
            } else {
                setUploadResult({ success: false, message: res.error || 'Error al procesar el archivo.' });
            }

        } catch (error: any) {
            setUploadResult({ success: false, message: error.message || 'Error inesperado.' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Documentos de Proveedores</h1>
                    <p className="text-slate-500">Gestiona y visualiza las facturas electrónicas recibidas.</p>
                </div>
            </div>

            <Tabs defaultValue="upload" className="w-full">
                <TabsList>
                    <TabsTrigger value="upload">Cargar Documento</TabsTrigger>
                    <TabsTrigger value="history">Historial</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cargar Factura Electrónica (XML/ZIP)</CardTitle>
                            <CardDescription>
                                Sube el archivo .zip o .xml que recibiste de la DIAN o tu proveedor.
                                El sistema extraerá automáticamente la información.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
                                <div className="p-4 bg-blue-50 text-blue-600 rounded-full mb-4">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-medium mb-2">Arrastra tu archivo aquí o haz clic para buscar</h3>
                                <p className="text-sm text-slate-400 mb-6">Soporta archivos .xml y .zip (UBL 2.1)</p>

                                <label htmlFor="file-upload" className="cursor-pointer">
                                    <Input
                                        id="file-upload"
                                        type="file"
                                        accept=".xml,.zip"
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        disabled={isUploading}
                                    />
                                    <Button disabled={isUploading} variant="outline" className="pointer-events-none">
                                        {isUploading ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
                                        ) : (
                                            'Seleccionar Archivo'
                                        )}
                                    </Button>
                                </label>
                            </div>

                            {/* Instrucciones para descargar desde DIAN */}
                            <Alert className="mt-6 bg-blue-50 border-blue-200">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-blue-900">Sincronización Automática DIAN (Beta)</AlertTitle>
                                <AlertDescription className="text-blue-800 text-sm space-y-2">
                                    <p>Prueba la sincronización automática usando el token de la DIAN:</p>
                                    <DianSyncButton onSyncResult={(result) => {
                                        if (result.success && result.documents) {
                                            setDianInvoices(result.documents);
                                            setSyncMessage(result.message || '');
                                        }
                                    }} />

                                    {/* Success message after sync */}
                                    {dianInvoices.length > 0 && (
                                        <Alert className="mt-4 bg-green-50 border-green-200">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <AlertTitle className="text-green-900">Sincronización Exitosa</AlertTitle>
                                            <AlertDescription className="text-green-800">
                                                {syncMessage} - {dianInvoices.length} facturas cargadas. Ve a la pestaña "Historial" para verlas todas.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="mt-4 pt-4 border-t border-blue-300">
                                        <p className="font-medium mb-2">O descarga manualmente:</p>
                                        <ol className="list-decimal list-inside space-y-1">
                                            <li>Ingresa al <a href="https://catalogo-vpfe.dian.gov.co" target="_blank" rel="noopener noreferrer" className="underline font-medium">portal de la DIAN</a></li>
                                            <li>Inicia sesión con tu certificado digital o usuario</li>
                                            <li>Ve a "Documentos Recibidos" o "Facturas Recibidas"</li>
                                            <li>Selecciona el rango de fechas y descarga el archivo ZIP</li>
                                            <li>Sube el archivo ZIP aquí para procesarlo automáticamente</li>
                                        </ol>
                                    </div>
                                </AlertDescription>
                            </Alert>

                            {uploadResult && !uploadResult.success && (
                                <Alert variant="destructive" className="mt-6">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>{uploadResult.message}</AlertDescription>
                                </Alert>
                            )}

                            {uploadResult && uploadResult.success && uploadResult.invoice && (
                                <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <Alert className="bg-green-50 border-green-200 text-green-800">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <AlertTitle>Lectura Exitosa</AlertTitle>
                                        <AlertDescription>
                                            La factura <strong>{uploadResult.invoice.metadata?.number}</strong> de <strong>{uploadResult.invoice.supplierName}</strong> ha sido procesada correctamente.
                                        </AlertDescription>
                                    </Alert>

                                    <InvoiceViewer invoice={uploadResult.invoice} />

                                    {/* ALERTA DE PROVEEDOR FICTICIO (Simulada o Real) */}
                                    {['900123456', '890987654'].includes(uploadResult.invoice.supplierTaxId?.replace(/\D/g, '') || '') && (
                                        <Alert variant="destructive" className="border-red-600 bg-red-50">
                                            <AlertTriangle className="h-4 w-4 text-red-600" />
                                            <AlertTitle className="text-red-700 font-bold">¡ALERTA DE PROVEEDOR FICTICIO!</AlertTitle>
                                            <AlertDescription className="text-red-600">
                                                El NIT <strong>{uploadResult.invoice.supplierTaxId}</strong> aparece en el listado de proveedores ficticios de la DIAN.
                                                Verifique inmediatamente esta operación.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            )}

                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Historial de Documentos</CardTitle>
                                <CardDescription>Facturas cargadas anteriormente.</CardDescription>
                            </div>
                            <Button
                                onClick={async () => {
                                    // Export DIAN invoices if available, otherwise use mock
                                    const dataToExport = dianInvoices.length > 0
                                        ? dianInvoices
                                        : [uploadResult?.invoice].filter(Boolean);

                                    if (dataToExport.length === 0) {
                                        alert('No hay facturas para exportar. Sincroniza con la DIAN primero.');
                                        return;
                                    }

                                    const { exportInvoicesToExcel } = await import('@/services/excel-service');
                                    await exportInvoicesToExcel(dataToExport as any, 'Reporte_DIAN.xlsx');
                                }}
                                variant="outline"
                                className="gap-2 text-green-700 border-green-200 hover:bg-green-50"
                            >
                                <FileText className="w-4 h-4" />
                                Exportar a Excel
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <InvoiceTable invoices={dianInvoices} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
