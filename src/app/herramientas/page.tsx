
'use client';

import { SettingsCard } from '@/components/settings-card';
import { Calculator, Scale, FileScan, Clock, BookOpen, FileSpreadsheet } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ToolsPage() {
    const router = useRouter();
    return (
        <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Herramientas Contables</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <SettingsCard
                    title="Conciliación Bancaria con IA"
                    description="Carga tu libro auxiliar y extracto bancario para que la IA realice la conciliación."
                    icon={Scale}
                    action={() => router.push('/herramientas/conciliacion')}
                    actionLabel="Iniciar Conciliación"
                />
                <SettingsCard
                    title="Convertidor de Extracto a Excel"
                    description="Sube un extracto bancario en PDF y descárgalo como un archivo Excel (XLSX)."
                    icon={FileSpreadsheet}
                    action={() => router.push('/herramientas/convertidor-extracto')}
                    actionLabel="Abrir Convertidor"
                />
                <SettingsCard
                    title="Calculadora de Retención"
                    description="Calcula la retención en la fuente, IVA e ICA para diferentes tipos de operaciones."
                    icon={Calculator}
                    action={() => router.push('/calculadora')}
                    actionLabel="Abrir Calculadora"
                />
                 <SettingsCard
                    title="Tabla de Retención 2025"
                    description="Consulta rápidamente las bases y tarifas de retención en la fuente vigentes."
                    icon={BookOpen}
                    action={() => router.push('/herramientas/tabla-retencion')}
                    actionLabel="Ver Tabla"
                />
                 <SettingsCard
                    title="Analizador de RUT con IA"
                    description="Sube un RUT en PDF y la IA extraerá las responsabilidades y datos fiscales clave."
                    icon={FileScan}
                    action={() => router.push('/herramientas/analizador-rut')}
                    actionLabel="Analizar RUT"
                />
                 <SettingsCard
                    title="Calculadora de Nómina"
                    description="Calcula el costo de nómina, incluyendo horas extra, prestaciones y aportes."
                    icon={Clock}
                    action={() => router.push('/herramientas/calculadora-horas-extra')}
                    actionLabel="Abrir Calculadora"
                />
            </div>
        </div>
    );
}
