import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Validación de variables de entorno
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Cliente Supabase para uso en el cliente (browser)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
})

// Cliente Supabase para uso en el servidor con service role key
// Solo usar en Server Components o API Routes
export const getSupabaseAdmin = () => {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY')
    }

    return createClient<Database>(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

// Helper para obtener la sesión del usuario actual
export const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user ?? null
}

// Helper para obtener el user_id desde la tabla users
export const getUserId = async (authId: string) => {
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', authId)
        .single()

    if (error) {
        console.error('Error getting user_id:', error)
        return null
    }

    return data?.id ?? null
}
