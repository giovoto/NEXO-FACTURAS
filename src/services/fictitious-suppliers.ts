
// Servicio para verificar Proveedores Ficticios
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

// Lista cacheada de NITs ficticios (simularemos algunos para la demo y prepararemos la carga real)
let fictitiousNits: Set<string> = new Set([
    // Ejemplos de prueba (puedes agregar más manualmente o cargar el PDF real)
    '900123456',
    '890987654',
    // Aquí se cargarían los del PDF
]);

export async function loadFictitiousSuppliersFromPdf(pdfPath: string) {
    try {
        if (!fs.existsSync(pdfPath)) {
            console.warn(`Archivo PDF de proveedores ficticios no encontrado en: ${pdfPath}`);
            return;
        }

        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);

        // Lógica simple de extracción de NITs (AJUSTAR SEGÚN FORMATO REAL DEL PDF)
        // Buscamos patrones numéricos de 9 o 10 dígitos comunes en NITs
        const text = data.text;
        const nitRegex = /\b\d{9,10}\b/g;
        const matches = text.match(nitRegex);

        if (matches) {
            matches.forEach(nit => fictitiousNits.add(nit));
            console.log(`Cargados ${matches.length} NITs de proveedores ficticios.`);
        }

    } catch (error) {
        console.error("Error cargando PDF de proveedores ficticios:", error);
    }
}

export function isFictitiousSupplier(nit: string): boolean {
    if (!nit) return false;
    // Limpiar el NIT de puntos, guiones y dígito de verificación
    const cleanNit = nit.replace(/\D/g, '');

    // Verificar si existe en la lista (revisamos el NIT base, a veces sin DV)
    // Intentamos coincidencia exacta o subcadena
    for (const bannedNit of fictitiousNits) {
        if (cleanNit.includes(bannedNit) || bannedNit.includes(cleanNit)) {
            return true;
        }
    }
    return false;
}
