

// This file is no longer in use. All database operations have been moved to 
// src/app/configuracion/actions.ts for improved security and to run on the server.
// This centralization prevents direct client-side database access, enhancing data integrity
// and security by ensuring all modifications go through a controlled server environment.
// The file is kept to avoid breaking existing imports, but its functions are now empty.

import type { DatoContable } from '@/app/configuracion/actions';

export const defaultParams: DatoContable[] = [
    {
        id: 'uvt',
        titulo: 'Valor UVT 2025 (proyectado)',
        descripcion: '49850'
    },
    {
        id: 'smlmv',
        titulo: 'Salario Mínimo Mensual 2025',
        descripcion: '1430000'
    },
    {
        id: 'aux_transporte',
        titulo: 'Auxilio de Transporte 2025',
        descripcion: '178000'
    },
    {
        id: 'recargo_diurna',
        titulo: 'Recargo Extra Diurna (Factor)',
        descripcion: '1.25'
    },
    {
        id: 'recargo_nocturna',
        titulo: 'Recargo Extra Nocturna (Factor)',
        descripcion: '1.75'
    },
    {
        id: 'recargo_dominical',
        titulo: 'Recargo Dominical/Festivo (Factor)',
        descripcion: '1.75'
    }
];

export function getParams(userId: string): DatoContable[] {
    console.warn("DEPRECATED: getParams called from client-side service. Use getParamsAction instead.");
    return defaultParams;
}

export function saveParams(userId: string, params: DatoContable[]): void {
     console.warn("DEPRECATED: saveParams called from client-side service. Use saveParamsAction instead.");
}
