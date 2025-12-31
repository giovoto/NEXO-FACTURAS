'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import type { Evento, Contacto } from '@/lib/types';

// ============================================
// EVENTOS (AGENDA) CRUD
// ============================================

export async function getEventosAction(empresaId: string): Promise<Evento[]> {
    try {
        const { data: eventos, error } = await supabase
            .from('eventos')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('fecha_inicio', { ascending: true });

        if (error) {
            throw new Error(`Error fetching eventos: ${error.message}`);
        }

        return (eventos || []).map(e => ({
            id: e.id,
            titulo: e.titulo,
            descripcion: e.descripcion,
            fechaInicio: e.fecha_inicio,
            fechaFin: e.fecha_fin,
            ubicacion: e.ubicacion,
            tipo: e.tipo,
            estado: e.estado,
        })) as Evento[];
    } catch (error: any) {
        console.error('Error in getEventosAction:', error);
        throw error;
    }
}

export async function saveEventoAction(empresaId: string, data: Omit<Evento, 'id'> | Evento) {
    try {
        if ('id' in data && data.id) {
            // Update
            const { id, ...updateData } = data;
            const { error } = await supabase
                .from('eventos')
                .update({
                    titulo: updateData.titulo,
                    descripcion: updateData.descripcion,
                    fecha_inicio: updateData.fechaInicio,
                    fecha_fin: updateData.fechaFin,
                    ubicacion: updateData.ubicacion,
                    tipo: updateData.tipo,
                    estado: updateData.estado,
                })
                .eq('id', id)
                .eq('empresa_id', empresaId);

            if (error) {
                throw new Error(`Error updating evento: ${error.message}`);
            }
        } else {
            // Create
            const { error } = await supabase
                .from('eventos')
                .insert({
                    empresa_id: empresaId,
                    titulo: data.titulo,
                    descripcion: data.descripcion,
                    fecha_inicio: data.fechaInicio,
                    fecha_fin: data.fechaFin,
                    ubicacion: data.ubicacion,
                    tipo: data.tipo,
                    estado: data.estado || 'pendiente',
                });

            if (error) {
                throw new Error(`Error creating evento: ${error.message}`);
            }
        }

        revalidatePath('/agenda');
    } catch (error: any) {
        console.error('Error in saveEventoAction:', error);
        throw error;
    }
}

export async function deleteEventoAction(empresaId: string, eventoId: string) {
    try {
        const { error } = await supabase
            .from('eventos')
            .delete()
            .eq('id', eventoId)
            .eq('empresa_id', empresaId);

        if (error) {
            throw new Error(`Error deleting evento: ${error.message}`);
        }

        revalidatePath('/agenda');
    } catch (error: any) {
        console.error('Error in deleteEventoAction:', error);
        throw error;
    }
}

// ============================================
// CONTACTOS (PROVEEDORES) - Helper para Facturas
// ============================================

// Nota: contactos no están en el schema actual de Supabase
// Esta función retorna un contacto ficticio por ahora
// TODO: Agregar tabla de contactos/proveedores si es necesaria

export async function findOrCreateContactAction(
    empresaId: string,
    data: { identificacion: string; proveedor: string }
): Promise<Contacto> {
    try {
        // Por ahora, retornamos el contacto tal cual
        // En el futuro, se puede crear una tabla 'contactos' en Supabase
        return {
            id: data.identificacion,
            identificacion: data.identificacion,
            proveedor: data.proveedor,
        };
    } catch (error: any) {
        console.error('Error in findOrCreateContactAction:', error);
        throw error;
    }
}

export async function getContactosAction(empresaId: string): Promise<Contacto[]> {
    try {
        // TODO: Implementar cuando se agregue tabla de contactos
        // Por ahora retornamos array vacío
        return [];
    } catch (error: any) {
        console.error('Error in getContactosAction:', error);
        throw error;
    }
}
