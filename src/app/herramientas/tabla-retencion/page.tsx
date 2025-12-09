
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const uvtValue = 49800; // Valor aproximado para los cálculos, las bases en pesos se muestran directamente.

const formatCurrency = (value: number) => {
  return value.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const comprasData = [
  { concept: 'Compras generales (declarantes)', baseUVT: 10, baseCOP: 498000, tariff: '2,50%' },
  { concept: 'Compras generales (no declarantes)', baseUVT: 10, baseCOP: 498000, tariff: '3,50%' },
  { concept: 'Compras con tarjeta débito o crédito', baseUVT: 0, baseCOP: 0, tariff: '1,50%' },
  { concept: 'Compras de bienes o productos agrícolas o pecuarios sin procesamiento industrial', baseUVT: 70, baseCOP: 3486000, tariff: '1,50%' },
  { concept: 'Compras de bienes o productos agrícolas o pecuarios con procesamiento industrial (declarantes)', baseUVT: 10, baseCOP: 498000, tariff: '2,50%' },
  { concept: 'Compras de bienes o productos agrícolas o pecuarios con procesamiento industrial (no declarantes)', baseUVT: 10, baseCOP: 498000, tariff: '3,50%' },
  { concept: 'Compras de café pergamino o cereza', baseUVT: 70, baseCOP: 3486000, tariff: '0,50%' },
  { concept: 'Compras de combustibles derivados del petróleo', baseUVT: 0, baseCOP: 0, tariff: '0,10%' },
  { concept: 'Enajenación de activos fijos de personas naturales', baseUVT: 0, baseCOP: 0, tariff: '1%' },
  { concept: 'Compras de vehículos', baseUVT: 0, baseCOP: 0, tariff: '1%' },
  { concept: 'Compra de oro por Sociedades de Comercialización Internacional', baseUVT: 0, baseCOP: 0, tariff: '2,5%' },
];

const bienesRaicesData = [
    { concept: 'Compras de bienes raíces para vivienda (primeras 10.000 UVT)', baseUVT: 0, baseCOP: 0, tariff: '1%' },
    { concept: 'Compras de bienes raíces para vivienda (exceso de 10.000 UVT)', baseUVT: 10000, baseCOP: 497990000, tariff: '2,50%' },
    { concept: 'Compras de bienes raíces para uso distinto a vivienda', baseUVT: 0, baseCOP: 0, tariff: '2,50%' },
];

const serviciosData = [
    { concept: 'Servicios generales (declarantes)', baseUVT: 2, baseCOP: 100000, tariff: '4%' },
    { concept: 'Servicios generales (no declarantes)', baseUVT: 2, baseCOP: 100000, tariff: '6%' },
    { concept: 'Por emolumentos eclesiásticos (declarantes)', baseUVT: 10, baseCOP: 498000, tariff: '4%' },
    { concept: 'Por emolumentos eclesiásticos (no declarantes)', baseUVT: 10, baseCOP: 498000, tariff: '3,50%' },
    { concept: 'Servicios de transporte de carga', baseUVT: 2, baseCOP: 100000, tariff: '1%' },
    { concept: 'Servicios de transporte nacional de pasajeros por vía terrestre', baseUVT: 10, baseCOP: 498000, tariff: '3,50%' },
    { concept: 'Servicios de transporte nacional de pasajeros por vía aérea o marítima', baseUVT: 2, baseCOP: 100000, tariff: '1%' },
    { concept: 'Servicios prestados por empresas de servicios temporales (sobre AIU)', baseUVT: 2, baseCOP: 100000, tariff: '1%' },
    { concept: 'Servicios prestados por empresas de vigilancia y aseo (sobre AIU)', baseUVT: 2, baseCOP: 100000, tariff: '2%' },
    { concept: 'Servicios integrales de salud prestados por IPS', baseUVT: 2, baseCOP: 100000, tariff: '2%' },
    { concept: 'Servicios de hoteles y restaurantes', baseUVT: 2, baseCOP: 100000, tariff: '3,50%' },
];

const arrendamientosData = [
    { concept: 'Arrendamiento de bienes muebles', baseUVT: 0, baseCOP: 0, tariff: '4%' },
    { concept: 'Arrendamiento de bienes inmuebles (declarantes)', baseUVT: 10, baseCOP: 498000, tariff: '3,50%' },
    { concept: 'Arrendamiento de bienes inmuebles (no declarantes)', baseUVT: 10, baseCOP: 498000, tariff: '3,50%' },
];

const otrosIngresosData = [
    { concept: 'Otros ingresos tributarios (declarantes)', baseUVT: 10, baseCOP: 498000, tariff: '2,50%' },
    { concept: 'Otros ingresos tributarios (no declarantes)', baseUVT: 10, baseCOP: 498000, tariff: '3,50%' },
    { concept: 'Honorarios y comisiones (personas jurídicas)', baseUVT: 0, baseCOP: 0, tariff: '11%' },
    { concept: 'Honorarios y comisiones (personas naturales > 3.300 UVT)', baseUVT: 0, baseCOP: 0, tariff: '11%' },
    { concept: 'Honorarios y comisiones (no declarantes)', baseUVT: 0, baseCOP: 0, tariff: '10%' },
    { concept: 'Servicios de licenciamiento o derecho de uso de software', baseUVT: 0, baseCOP: 0, tariff: '3,50%' },
    { concept: 'Intereses o rendimientos financieros', baseUVT: 0, baseCOP: 0, tariff: '7%' },
    { concept: 'Rendimientos financieros de títulos de renta fija', baseUVT: 0, baseCOP: 0, tariff: '4%' },
    { concept: 'Loterías, rifas, apuestas y similares', baseUVT: 48, baseCOP: 2390000, tariff: '20%' },
    { concept: 'Colocación independiente de juegos de suerte y azar', baseUVT: 5, baseCOP: 249000, tariff: '3%' },
    { concept: 'Contratos de construcción y urbanización', baseUVT: 10, baseCOP: 498000, tariff: '2%' },
];

const reteIVAData = [
    { concept: 'Retención de IVA en servicios', baseUVT: 2, baseCOP: 100000, tariff: '15%' },
    { concept: 'Retención de IVA en compras', baseUVT: 10, baseCOP: 498000, tariff: '15%' },
];

const pagosExteriorData = [
    { concept: 'Intereses, comisiones, honorarios, regalías, arrendamientos, servicios, etc.', tariff: '20%' },
    { concept: 'Consultorías, servicios técnicos y asistencia técnica', tariff: '20%' },
    { concept: 'Rendimientos financieros de créditos a >= 1 año o leasing', tariff: '15%' },
    { concept: 'Leasing sobre naves, helicópteros y/o aerodinos', tariff: '1%' },
    { concept: 'Rendimientos financieros de créditos a >= 8 años para infraestructura (APP)', tariff: '5%' },
    { concept: 'Prima cedida por reaseguros', tariff: '1%' },
    { concept: 'Administración o dirección (Art. 124 E.T.)', tariff: '33%' },
];


const RetentionTable = ({ title, data }: { title: string, data: any[] }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-center">Base (UVT)</TableHead>
                        <TableHead className="text-center">Base (COP)</TableHead>
                        <TableHead className="text-right">Tarifa</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.concept}>
                            <TableCell className="font-medium">{row.concept}</TableCell>
                            <TableCell className="text-center">{row.baseUVT > 0 ? row.baseUVT : 'N/A'}</TableCell>
                            <TableCell className="text-center">{row.baseCOP > 0 ? formatCurrency(row.baseCOP) : 'Sin base'}</TableCell>
                            <TableCell className="text-right font-semibold">{row.tariff}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

const PagosExteriorTable = ({ title, data }: { title: string, data: any[] }) => (
     <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">Tarifa</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.concept}>
                            <TableCell className="font-medium">{row.concept}</TableCell>
                            <TableCell className="text-right font-semibold">{row.tariff}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
)

export default function TablaRetencionPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tabla de Retención en la Fuente 2025</h1>
        <Link href="/herramientas">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Herramientas
          </Button>
        </Link>
      </div>
      <CardDescription>
        Consulta rápida de conceptos, bases y tarifas para el año gravable 2025.
        Valor UVT de referencia para los cálculos: {formatCurrency(uvtValue)}.
      </CardDescription>

      <div className="space-y-6">
        <RetentionTable title="Compras" data={comprasData} />
        <RetentionTable title="Bienes Raíces" data={bienesRaicesData} />
        <RetentionTable title="Servicios" data={serviciosData} />
        <RetentionTable title="Arrendamientos" data={arrendamientosData} />
        <RetentionTable title="Otros Ingresos y Honorarios" data={otrosIngresosData} />
        <RetentionTable title="Retención de IVA (ReteIVA)" data={reteIVAData} />
        <PagosExteriorTable title="Retención por Pagos al Exterior" data={pagosExteriorData} />
      </div>

       <p className="text-xs text-muted-foreground pt-4">
        Nota: Esta tabla es una guía de referencia y no reemplaza la asesoría de un contador profesional. Las tarifas pueden variar según el tipo de contribuyente y la naturaleza de la operación.
      </p>
    </div>
  );
}
