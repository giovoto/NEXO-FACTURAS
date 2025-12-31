'use server';

import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export type DatoContable = {
    id: string;
    titulo: string;
    descripcion: string;
};

// ============================================
// CONFIGURACIÓN (USER PARAMETERS)
// ============================================

// Nota: Los parámetros de configuración podrían almacenarse en una tabla separada
// o en un campo JSONB en la tabla users. Por ahora, usaremos un enfoque simple
// almacenándolos como JSONB en users si existe el campo, o en una tabla config separada

export async function getParamsAction(defaultParams: DatoContable[]): Promise<DatoContable[]> {
    try {
        // Get current user's session
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            throw new Error('Usuario no autenticado');
        }

        const userId = await getUserId(user.id);

        if (!userId) {
            return defaultParams;
        }

        // Try to get parameters from users table
        // This assumes there's a parameters column (JSONB) in users table
        // If not, we'll need to create a separate config table

        // For now, return default params
        // TODO: Implement when parameters field is added to schema
        return defaultParams;

    } catch (error: any) {
        console.error('Error in getParamsAction:', error);
        return defaultParams;
    }
}

export async function saveParamsAction(params: DatoContable[]) {
    try {
        // Get current user's session
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            throw new Error('Usuario no autenticado');
        }

        const userId = await getUserId(user.id);

        if (!userId) {
            throw new Error('Usuario no encontrado en base de datos');
        }

        // Save parameters
        // TODO: Implement when parameters field is added to schema
        // For now, this is a stub

        revalidatePath('/configuracion');
    } catch (error: any) {
        console.error('Error in saveParamsAction:', error);
        throw error;
    }
}

// ============================================
// GOOGLE AUTH CONFIGURATION
// ============================================

export async function saveGoogleRefreshTokenAction(refreshToken: string) {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            throw new Error('Usuario no autenticado');
        }

        const userId = await getUserId(user.id);

        if (!userId) {
            throw new Error('Usuario no encontrado');
        }

        // Save google refresh token
        const { error } = await supabase
            .from('users')
            .update({ google_refresh_token: refreshToken })
            .eq('id', userId);

        if (error) {
            throw new Error(`Error saving google token: ${error.message}`);
        }

        revalidatePath('/configuracion');
    } catch (error: any) {
        console.error('Error in saveGoogleRefreshTokenAction:', error);
        throw error;
    }
}

export async function getGoogleRefreshTokenAction(): Promise<string | null> {
    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return null;
        }

        const userId = await getUserId(user.id);

        if (!userId) {
            return null;
        }

        const { data, error } = await supabase
            .from('users')
            .select('google_refresh_token')
            .eq('id', userId)
            .single();

        if (error || !data) {
            return null;
        }

        return data.google_refresh_token;
    } catch (error: any) {
        console.error('Error in getGoogleRefreshTokenAction:', error);
        return null;
    }
}
