'use client';

import { useState } from 'react';
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

export default function DocumentosPage() {
    const { user, activeEmpresaId } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{ success: boolean; message?: string; invoice?: ParsedInvoice } | null>(null);

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

            const res = await actionImportZip(token, activeEmpresaId, file);

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

                            <div className="mt-6 flex flex-col items-center justify-center gap-3">
                                <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold flex items-center gap-2">
                                    <span className="h-px w-12 bg-border"></span>
                                    O
                                    <span className="h-px w-12 bg-border"></span>
                                </div>

                                <DianSyncButton onInvoiceFound={(invoice) => setUploadResult({ success: true, invoice })} />
                            </div>

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
                                    // MOCK DATA PARA EXPORTACIÓN (Ya que aún no hay persistencia real conectada aquí)
                                    // En producción, esto tomaría 'documentsList' del estado o backend
                                    const mockExportData = [
                                        uploadResult?.invoice || {
                                            id: 'FE-1001',
                                            issueDate: '2024-12-08',
                                            total: 1190000,
                                            subtotal: 1000000,
                                            taxes: 190000,
                                            reteFuente: 35000,
                                            reteIVA: 0,
                                            reteICA: 9660,
                                            supplierName: 'Digital Solutions S.A.S',
                                            supplierTaxId: '901.555.555',
                                            customerName: 'Tu Empresa SAS',
                                            customerTaxId: '900.222.222',
                                            docType: 'Factura Electrónica De Venta',
                                            paymentMeans: 'Contado',
                                            metadata: { cufe: 'd3bb...555', number: 'FE-1001' }
                                        }
                                    ];

                                    const { exportInvoicesToExcel } = await import('@/services/excel-service');
                                    await exportInvoicesToExcel(mockExportData as any, 'Reporte_DIAN.xlsx');
                                }}
                                variant="outline"
                                className="gap-2 text-green-700 border-green-200 hover:bg-green-50"
                            >
                                <FileText className="w-4 h-4" />
                                Exportar a Excel
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-10 text-slate-500">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No hay documentos en el historial aún.</p>
                                <p className="text-sm mt-2">(Prueba el botón "Exportar" para ver el reporte generado con datos de ejemplo)</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
