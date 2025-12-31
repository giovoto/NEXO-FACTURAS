-- ============================================
-- PASO 1: Limpiar Schema Existente (OPCIONAL)
-- Ejecuta esto SOLO si quieres empezar desde cero
-- ⚠️ ADVERTENCIA: Esto eliminará TODOS los datos
-- ============================================

-- Descomentar las siguientes líneas si quieres limpiar todo:
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;

-- ============================================
-- PASO 2: Crear o Actualizar Schema
-- Esta versión es segura de ejecutar múltiples veces
-- ============================================

-- 1. ENUMS (con manejo de existencia)
DO $$ BEGIN
    CREATE TYPE empresa_role AS ENUM ('viewer', 'editor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES (DROP y CREATE para asegurar estructura correcta)

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  google_refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar constraint de foreign key si no existe
DO $$ BEGIN
    ALTER TABLE users ADD CONSTRAINT users_auth_id_fkey 
    FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: empresas  
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  nit TEXT UNIQUE NOT NULL,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: user_empresas
CREATE TABLE IF NOT EXISTS user_empresas (
  user_id UUID,
  empresa_id UUID,
  role empresa_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, empresa_id)
);

-- Agregar foreign keys si no existen
DO $$ BEGIN
    ALTER TABLE user_empresas ADD CONSTRAINT user_empresas_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE user_empresas ADD CONSTRAINT user_empresas_empresa_id_fkey 
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: facturas
CREATE TABLE IF NOT EXISTS facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  
  -- Identificación
  folio TEXT,
  issue_date DATE,
  due_date DATE,
  
  -- Proveedor
  supplier_name TEXT,
  supplier_tax_id TEXT,
  supplier_address TEXT,
  supplier_city TEXT,
  supplier_email TEXT,
  supplier_phone TEXT,
  
  -- Cliente
  customer_name TEXT,
  customer_tax_id TEXT,
  customer_address TEXT,
  customer_city TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  
  -- Financiero
  total DECIMAL(15,2),
  subtotal DECIMAL(15,2),
  taxes DECIMAL(15,2),
  rete_fuente DECIMAL(15,2),
  rete_iva DECIMAL(15,2),
  rete_ica DECIMAL(15,2),
  
  -- Detalles
  currency TEXT DEFAULT 'COP',
  payment_means TEXT,
  doc_type TEXT,
  tax_level_code TEXT,
  tax_regimen TEXT,
  
  -- Metadata
  cufe TEXT,
  estado TEXT DEFAULT 'pendiente',
  qr_code TEXT,
  profile_id TEXT,
  
  -- Items (JSONB)
  lines JSONB,
  
  -- Auditoría
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign keys para facturas
DO $$ BEGIN
    ALTER TABLE facturas ADD CONSTRAINT facturas_empresa_id_fkey 
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE facturas ADD CONSTRAINT facturas_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  ubicacion TEXT,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE warehouses ADD CONSTRAINT warehouses_empresa_id_fkey 
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  nombre TEXT NOT NULL,
  codigo TEXT,
  descripcion TEXT,
  cantidad INTEGER DEFAULT 0,
  precio_unitario DECIMAL(15,2),
  unidad_medida TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE products ADD CONSTRAINT products_empresa_id_fkey 
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE products ADD CONSTRAINT products_warehouse_id_fkey 
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: outgoings
CREATE TABLE IF NOT EXISTS outgoings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  warehouse_id UUID,
  product_id UUID,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  motivo TEXT,
  destino TEXT,
  responsable TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE outgoings ADD CONSTRAINT outgoings_empresa_id_fkey 
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE outgoings ADD CONSTRAINT outgoings_warehouse_id_fkey 
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE outgoings ADD CONSTRAINT outgoings_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES products(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE outgoings ADD CONSTRAINT outgoings_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: eventos
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ,
  ubicacion TEXT,
  tipo TEXT,
  estado TEXT DEFAULT 'pendiente',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE eventos ADD CONSTRAINT eventos_empresa_id_fkey 
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE eventos ADD CONSTRAINT eventos_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES users(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 3. ÍNDICES (DROP IF EXISTS + CREATE)
-- ============================================

-- Users
DROP INDEX IF EXISTS idx_users_auth_id;
CREATE INDEX idx_users_auth_id ON users(auth_id);

DROP INDEX IF EXISTS idx_users_email;
CREATE INDEX idx_users_email ON users(email);

-- Empresas
DROP INDEX IF EXISTS idx_empresas_nit;
CREATE INDEX idx_empresas_nit ON empresas(nit);

-- User Empresas
DROP INDEX IF EXISTS idx_user_empresas_user;
CREATE INDEX idx_user_empresas_user ON user_empresas(user_id);

DROP INDEX IF EXISTS idx_user_empresas_empresa;
CREATE INDEX idx_user_empresas_empresa ON user_empresas(empresa_id);

-- Facturas
DROP INDEX IF EXISTS idx_facturas_empresa;
CREATE INDEX idx_facturas_empresa ON facturas(empresa_id);

DROP INDEX IF EXISTS idx_facturas_supplier_tax_id;
CREATE INDEX idx_facturas_supplier_tax_id ON facturas(supplier_tax_id);

DROP INDEX IF EXISTS idx_facturas_issue_date;
CREATE INDEX idx_facturas_issue_date ON facturas(issue_date DESC);

DROP INDEX IF EXISTS idx_facturas_estado;
CREATE INDEX idx_facturas_estado ON facturas(estado);

DROP INDEX IF EXISTS idx_facturas_cufe;
CREATE INDEX idx_facturas_cufe ON facturas(cufe);

DROP INDEX IF EXISTS idx_facturas_empresa_date;
CREATE INDEX idx_facturas_empresa_date ON facturas(empresa_id, issue_date DESC);

DROP INDEX IF EXISTS idx_facturas_lines;
CREATE INDEX idx_facturas_lines ON facturas USING GIN (lines);

-- Warehouses
DROP INDEX IF EXISTS idx_warehouses_empresa;
CREATE INDEX idx_warehouses_empresa ON warehouses(empresa_id);

-- Products
DROP INDEX IF EXISTS idx_products_empresa;
CREATE INDEX idx_products_empresa ON products(empresa_id);

DROP INDEX IF EXISTS idx_products_warehouse;
CREATE INDEX idx_products_warehouse ON products(warehouse_id);

DROP INDEX IF EXISTS idx_products_codigo;
CREATE INDEX idx_products_codigo ON products(codigo);

DROP INDEX IF EXISTS idx_products_warehouse_codigo;
CREATE INDEX idx_products_warehouse_codigo ON products(warehouse_id, codigo);

-- Outgoings
DROP INDEX IF EXISTS idx_outgoings_empresa;
CREATE INDEX idx_outgoings_empresa ON outgoings(empresa_id);

DROP INDEX IF EXISTS idx_outgoings_warehouse;
CREATE INDEX idx_outgoings_warehouse ON outgoings(warehouse_id);

DROP INDEX IF EXISTS idx_outgoings_product;
CREATE INDEX idx_outgoings_product ON outgoings(product_id);

DROP INDEX IF EXISTS idx_outgoings_created_at;
CREATE INDEX idx_outgoings_created_at ON outgoings(created_at DESC);

-- Eventos
DROP INDEX IF EXISTS idx_eventos_empresa;
CREATE INDEX idx_eventos_empresa ON eventos(empresa_id);

DROP INDEX IF EXISTS idx_eventos_fecha_inicio;
CREATE INDEX idx_eventos_fecha_inicio ON eventos(fecha_inicio);

DROP INDEX IF EXISTS idx_eventos_estado;
CREATE INDEX idx_eventos_estado ON eventos(estado);

-- ============================================
-- 4. FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION user_has_access_to_empresa(empresa_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_empresas ue
    JOIN users u ON u.id = ue.user_id
    WHERE u.auth_id = auth.uid()
    AND ue.empresa_id = empresa_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_warehouse_product_count(warehouse_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM products WHERE warehouse_id = warehouse_uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name'
  )
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. TRIGGERS (DROP IF EXISTS + CREATE)
-- ============================================

DROP TRIGGER IF EXISTS update_facturas_updated_at ON facturas;
CREATE TRIGGER update_facturas_updated_at
  BEFORE UPDATE ON facturas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_empresas_updated_at ON empresas;
CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warehouses_updated_at ON warehouses;
CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON warehouses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_eventos_updated_at ON eventos;
CREATE TRIGGER update_eventos_updated_at
  BEFORE UPDATE ON eventos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 6. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE outgoings ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view their empresas" ON empresas;
DROP POLICY IF EXISTS "Users can update empresas where they are admin" ON empresas;
DROP POLICY IF EXISTS "Users can create empresas" ON empresas;
DROP POLICY IF EXISTS "Users can view their empresa memberships" ON user_empresas;
DROP POLICY IF EXISTS "Users can view facturas of their empresas" ON facturas;
DROP POLICY IF EXISTS "Users can insert facturas in their empresas" ON facturas;
DROP POLICY IF EXISTS "Users can update facturas in their empresas" ON facturas;
DROP POLICY IF EXISTS "Users can delete facturas in their empresas" ON facturas;
DROP POLICY IF EXISTS "Users can view warehouses of their empresas" ON warehouses;
DROP POLICY IF EXISTS "Users can insert warehouses in their empresas" ON warehouses;
DROP POLICY IF EXISTS "Users can update warehouses in their empresas" ON warehouses;
DROP POLICY IF EXISTS "Users can delete warehouses in their empresas" ON warehouses;
DROP POLICY IF EXISTS "Users can view products of their empresas" ON products;
DROP POLICY IF EXISTS "Users can insert products in their empresas" ON products;
DROP POLICY IF EXISTS "Users can update products in their empresas" ON products;
DROP POLICY IF EXISTS "Users can delete products in their empresas" ON products;
DROP POLICY IF EXISTS "Users can view outgoings of their empresas" ON outgoings;
DROP POLICY IF EXISTS "Users can insert outgoings in their empresas" ON outgoings;
DROP POLICY IF EXISTS "Users can view eventos of their empresas" ON eventos;
DROP POLICY IF EXISTS "Users can insert eventos in their empresas" ON eventos;
DROP POLICY IF EXISTS "Users can update eventos in their empresas" ON eventos;
DROP POLICY IF EXISTS "Users can delete eventos in their empresas" ON eventos;

-- Create policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_id);

CREATE POLICY "Users can view their empresas" ON empresas FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_empresas ue JOIN users u ON u.id = ue.user_id WHERE u.auth_id = auth.uid() AND ue.empresa_id = empresas.id));

CREATE POLICY "Users can update empresas where they are admin" ON empresas FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_empresas ue JOIN users u ON u.id = ue.user_id WHERE u.auth_id = auth.uid() AND ue.empresa_id = empresas.id AND ue.role = 'admin'));

CREATE POLICY "Users can create empresas" ON empresas FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their empresa memberships" ON user_empresas FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE users.auth_id = auth.uid() AND users.id = user_empresas.user_id));

CREATE POLICY "Users can view facturas of their empresas" ON facturas FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert facturas in their empresas" ON facturas FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update facturas in their empresas" ON facturas FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete facturas in their empresas" ON facturas FOR DELETE USING (user_has_access_to_empresa(empresa_id));

CREATE POLICY "Users can view warehouses of their empresas" ON warehouses FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert warehouses in their empresas" ON warehouses FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update warehouses in their empresas" ON warehouses FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete warehouses in their empresas" ON warehouses FOR DELETE USING (user_has_access_to_empresa(empresa_id));

CREATE POLICY "Users can view products of their empresas" ON products FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert products in their empresas" ON products FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update products in their empresas" ON products FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete products in their empresas" ON products FOR DELETE USING (user_has_access_to_empresa(empresa_id));

CREATE POLICY "Users can view outgoings of their empresas" ON outgoings FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert outgoings in their empresas" ON outgoings FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));

CREATE POLICY "Users can view eventos of their empresas" ON eventos FOR SELECT USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can insert eventos in their empresas" ON eventos FOR INSERT WITH CHECK (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can update eventos in their empresas" ON eventos FOR UPDATE USING (user_has_access_to_empresa(empresa_id));
CREATE POLICY "Users can delete eventos in their empresas" ON eventos FOR DELETE USING (user_has_access_to_empresa(empresa_id));

-- ============================================
-- 7. STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('facturas-xml', 'facturas-xml', false),
  ('facturas-zip', 'facturas-zip', false),
  ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload XML to their empresa folders" ON storage.objects;
DROP POLICY IF EXISTS "Users can view XML from their empresa folders" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload ZIP to their empresa folders" ON storage.objects;
DROP POLICY IF EXISTS "Users can view ZIP from their empresa folders" ON storage.objects;

CREATE POLICY "Users can upload XML to their empresa folders" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'facturas-xml' AND
    (storage.foldername(name))[1] IN (
      SELECT empresa_id::text FROM user_empresas ue
      JOIN users u ON u.id = ue.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can view XML from their empresa folders" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'facturas-xml' AND
    (storage.foldername(name))[1] IN (
      SELECT empresa_id::text FROM user_empresas ue
      JOIN users u ON u.id = ue.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload ZIP to their empresa folders" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'facturas-zip' AND
    (storage.foldername(name))[1] IN (
      SELECT empresa_id::text FROM user_empresas ue
      JOIN users u ON u.id = ue.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can view ZIP from their empresa folders" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'facturas-zip' AND
    (storage.foldername(name))[1] IN (
      SELECT empresa_id::text FROM user_empresas ue
      JOIN users u ON u.id = ue.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================
-- ✅ VERIFICACIÓN FINAL
-- ============================================

-- Verificar tablas creadas
SELECT 
  'Tables Created' as check_type,
  COUNT(*) as count,
  string_agg(tablename, ', ') as names
FROM pg_tables 
WHERE schemaname = 'public'
GROUP BY check_type;

-- Verificar políticas RLS
SELECT 
  'RLS Policies' as check_type,
  COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY check_type;

-- ============================================
-- ✅ COMPLETADO
-- ============================================
