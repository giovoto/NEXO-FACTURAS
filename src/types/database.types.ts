// This file will be auto-generated from Supabase CLI
// Run: npx supabase gen types typescript --project-id "your-project-ref" > src/types/database.types.ts

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    auth_id: string
                    email: string
                    display_name: string | null
                    google_refresh_token: string | null
                    parameters: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    auth_id: string
                    email: string
                    display_name?: string | null
                    google_refresh_token?: string | null
                    parameters?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    auth_id?: string
                    email?: string
                    display_name?: string | null
                    google_refresh_token?: string | null
                    parameters?: Json | null
                    created_at?: string
                    updated_at?: string
                }
            }
            empresas: {
                Row: {
                    id: string
                    nombre: string
                    nit: string
                    direccion: string | null
                    telefono: string | null
                    email: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    nombre: string
                    nit: string
                    direccion?: string | null
                    telefono?: string | null
                    email?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    nombre?: string
                    nit?: string
                    direccion?: string | null
                    telefono?: string | null
                    email?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            user_empresas: {
                Row: {
                    user_id: string
                    empresa_id: string
                    role: 'viewer' | 'editor' | 'admin'
                    created_at: string
                }
                Insert: {
                    user_id: string
                    empresa_id: string
                    role?: 'viewer' | 'editor' | 'admin'
                    created_at?: string
                }
                Update: {
                    user_id?: string
                    empresa_id?: string
                    role?: 'viewer' | 'editor' | 'admin'
                    created_at?: string
                }
            }
            facturas: {
                Row: {
                    id: string
                    empresa_id: string
                    folio: string | null
                    issue_date: string | null
                    due_date: string | null
                    supplier_name: string | null
                    supplier_tax_id: string | null
                    supplier_address: string | null
                    supplier_city: string | null
                    supplier_email: string | null
                    supplier_phone: string | null
                    customer_name: string | null
                    customer_tax_id: string | null
                    customer_address: string | null
                    customer_city: string | null
                    customer_email: string | null
                    customer_phone: string | null
                    total: number | null
                    subtotal: number | null
                    taxes: number | null
                    rete_fuente: number | null
                    rete_iva: number | null
                    rete_ica: number | null
                    currency: string | null
                    payment_means: string | null
                    doc_type: string | null
                    tax_level_code: string | null
                    tax_regimen: string | null
                    cufe: string | null
                    estado: string | null
                    qr_code: string | null
                    profile_id: string | null
                    lines: Json | null
                    created_by: string | null
                    file_path: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    empresa_id: string
                    folio?: string | null
                    issue_date?: string | null
                    due_date?: string | null
                    supplier_name?: string | null
                    supplier_tax_id?: string | null
                    supplier_address?: string | null
                    supplier_city?: string | null
                    supplier_email?: string | null
                    supplier_phone?: string | null
                    customer_name?: string | null
                    customer_tax_id?: string | null
                    customer_address?: string | null
                    customer_city?: string | null
                    customer_email?: string | null
                    customer_phone?: string | null
                    total?: number | null
                    subtotal?: number | null
                    taxes?: number | null
                    rete_fuente?: number | null
                    rete_iva?: number | null
                    rete_ica?: number | null
                    currency?: string | null
                    payment_means?: string | null
                    doc_type?: string | null
                    tax_level_code?: string | null
                    tax_regimen?: string | null
                    cufe?: string | null
                    estado?: string | null
                    qr_code?: string | null
                    profile_id?: string | null
                    lines?: Json | null
                    created_by?: string | null
                    file_path?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    empresa_id?: string
                    folio?: string | null
                    issue_date?: string | null
                    due_date?: string | null
                    supplier_name?: string | null
                    supplier_tax_id?: string | null
                    supplier_address?: string | null
                    supplier_city?: string | null
                    supplier_email?: string | null
                    supplier_phone?: string | null
                    customer_name?: string | null
                    customer_tax_id?: string | null
                    customer_address?: string | null
                    customer_city?: string | null
                    customer_email?: string | null
                    customer_phone?: string | null
                    total?: number | null
                    subtotal?: number | null
                    taxes?: number | null
                    rete_fuente?: number | null
                    rete_iva?: number | null
                    rete_ica?: number | null
                    currency?: string | null
                    payment_means?: string | null
                    doc_type?: string | null
                    tax_level_code?: string | null
                    tax_regimen?: string | null
                    cufe?: string | null
                    estado?: string | null
                    qr_code?: string | null
                    profile_id?: string | null
                    lines?: Json | null
                    created_by?: string | null
                    file_path?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            warehouses: {
                Row: {
                    id: string
                    empresa_id: string
                    nombre: string
                    ubicacion: string | null
                    descripcion: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    empresa_id: string
                    nombre: string
                    ubicacion?: string | null
                    descripcion?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    empresa_id?: string
                    nombre?: string
                    ubicacion?: string | null
                    descripcion?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    empresa_id: string
                    warehouse_id: string
                    nombre: string
                    codigo: string | null
                    descripcion: string | null
                    cantidad: number | null
                    precio_unitario: number | null
                    unidad_medida: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    empresa_id: string
                    warehouse_id: string
                    nombre: string
                    codigo?: string | null
                    descripcion?: string | null
                    cantidad?: number | null
                    precio_unitario?: number | null
                    unidad_medida?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    empresa_id?: string
                    warehouse_id?: string
                    nombre?: string
                    codigo?: string | null
                    descripcion?: string | null
                    cantidad?: number | null
                    precio_unitario?: number | null
                    unidad_medida?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            outgoings: {
                Row: {
                    id: string
                    empresa_id: string
                    warehouse_id: string | null
                    product_id: string | null
                    cantidad: number
                    motivo: string | null
                    destino: string | null
                    responsable: string | null
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    empresa_id: string
                    warehouse_id?: string | null
                    product_id?: string | null
                    cantidad: number
                    motivo?: string | null
                    destino?: string | null
                    responsable?: string | null
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    empresa_id?: string
                    warehouse_id?: string | null
                    product_id?: string | null
                    cantidad?: number
                    motivo?: string | null
                    destino?: string | null
                    responsable?: string | null
                    created_by?: string | null
                    created_at?: string
                }
            }
            eventos: {
                Row: {
                    id: string
                    empresa_id: string
                    titulo: string
                    descripcion: string | null
                    fecha_inicio: string
                    fecha_fin: string | null
                    ubicacion: string | null
                    tipo: string | null
                    estado: string | null
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    empresa_id: string
                    titulo: string
                    descripcion?: string | null
                    fecha_inicio: string
                    fecha_fin?: string | null
                    ubicacion?: string | null
                    tipo?: string | null
                    estado?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    empresa_id?: string
                    titulo?: string
                    descripcion?: string | null
                    fecha_inicio?: string
                    fecha_fin?: string | null
                    ubicacion?: string | null
                    tipo?: string | null
                    estado?: string | null
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            user_has_access_to_empresa: {
                Args: {
                    empresa_uuid: string
                }
                Returns: boolean
            }
            get_warehouse_product_count: {
                Args: {
                    warehouse_uuid: string
                }
                Returns: number
            }
        }
        Enums: {
            empresa_role: 'viewer' | 'editor' | 'admin'
        }
    }
}
