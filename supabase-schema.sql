-- ============================================
-- Supabase Database Schema for Studio
-- Migration from Firebase Firestore
-- ============================================

-- ============================================
-- 1. ENUMS
-- ============================================

CREATE TYPE empresa_role AS ENUM ('viewer', 'editor', 'admin');

-- ============================================
-- 2. TABLES
-- ============================================

-- Table: users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  google_refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);

COMMENT ON TABLE users IS 'Extended user information linked to Supabase auth.users';

-- Table: empresas  
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  nit TEXT UNIQUE NOT NULL,
  direccion TEXT,
  telefono TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_empresas_nit ON empresas(nit);

COMMENT ON TABLE empresas IS 'Companies/Organizations in the system';

-- Table: user_empresas (Many-to-Many relationship)
CREATE TABLE user_empresas (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  role empresa_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, empresa_id)
);

CREATE INDEX idx_user_empresas_user ON user_empresas(user_id);
CREATE INDEX idx_user_empresas_empresa ON user_empresas(empresa_id);

COMMENT ON TABLE user_empresas IS 'User roles within companies';

-- Table: facturas
CREATE TABLE facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  
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
  
  -- Items (JSONB para estructura flexible)
  lines JSONB,
  
  -- Auditoría
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas comunes
CREATE INDEX idx_facturas_empresa ON facturas(empresa_id);
CREATE INDEX idx_facturas_supplier_tax_id ON facturas(supplier_tax_id);
CREATE INDEX idx_facturas_issue_date ON facturas(issue_date DESC);
CREATE INDEX idx_facturas_estado ON facturas(estado);
CREATE INDEX idx_facturas_cufe ON facturas(cufe);
CREATE INDEX idx_facturas_empresa_date ON facturas(empresa_id, issue_date DESC);

-- Índice GIN para búsqueda en JSONB
CREATE INDEX idx_facturas_lines ON facturas USING GIN (lines);

COMMENT ON TABLE facturas IS 'Electronic invoices from suppliers';

-- Table: warehouses
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  ubicacion TEXT,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_warehouses_empresa ON warehouses(empresa_id);

COMMENT ON TABLE warehouses IS 'Inventory warehouses';

-- Table: products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  codigo TEXT,
  descripcion TEXT,
  cantidad INTEGER DEFAULT 0,
  precio_unitario DECIMAL(15,2),
  unidad_medida TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_empresa ON products(empresa_id);
CREATE INDEX idx_products_warehouse ON products(warehouse_id);
CREATE INDEX idx_products_codigo ON products(codigo);
CREATE INDEX idx_products_warehouse_codigo ON products(warehouse_id, codigo);

COMMENT ON TABLE products IS 'Products in inventory';

-- Table: outgoings (Salidas de Inventario)
CREATE TABLE outgoings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  product_id UUID REFERENCES products(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  motivo TEXT,
  destino TEXT,
  responsable TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outgoings_empresa ON outgoings(empresa_id);
CREATE INDEX idx_outgoings_warehouse ON outgoings(warehouse_id);
CREATE INDEX idx_outgoings_product ON outgoings(product_id);
CREATE INDEX idx_outgoings_created_at ON outgoings(created_at DESC);

COMMENT ON TABLE outgoings IS 'Inventory outgoing movements';

-- Table: eventos (Agenda/Calendario)
CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ,
  ubicacion TEXT,
  tipo TEXT,
  estado TEXT DEFAULT 'pendiente',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_eventos_empresa ON eventos(empresa_id);
CREATE INDEX idx_eventos_fecha_inicio ON eventos(fecha_inicio);
CREATE INDEX idx_eventos_estado ON eventos(estado);

COMMENT ON TABLE eventos IS 'Calendar events and tasks';

-- ============================================
-- 3. FUNCTIONS
-- ============================================

-- Función: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Verificar acceso del usuario a una empresa
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

-- Función: Obtener contador de productos por bodega
CREATE OR REPLACE FUNCTION get_warehouse_product_count(warehouse_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER FROM products WHERE warehouse_id = warehouse_uuid;
$$ LANGUAGE sql STABLE;

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Trigger: Actualizar updated_at en facturas
CREATE TRIGGER update_facturas_updated_at
  BEFORE UPDATE ON facturas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Actualizar updated_at en empresas
CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Actualizar updated_at en warehouses
CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON warehouses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Actualizar updated_at en products
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Actualizar updated_at en eventos
CREATE TRIGGER update_eventos_updated_at
  BEFORE UPDATE ON eventos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Crear usuario en tabla users al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE outgoings ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

-- Políticas para users (los usuarios solo pueden ver y editar su propio perfil)
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = auth_id);

-- Políticas para empresas (los usuarios ven empresas donde son miembros)
CREATE POLICY "Users can view their empresas"
  ON empresas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_empresas ue
      JOIN users u ON u.id = ue.user_id
      WHERE u.auth_id = auth.uid()
      AND ue.empresa_id = empresas.id
    )
  );

CREATE POLICY "Users can update empresas where they are admin"
  ON empresas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_empresas ue
      JOIN users u ON u.id = ue.user_id
      WHERE u.auth_id = auth.uid()
      AND ue.empresa_id = empresas.id
      AND ue.role = 'admin'
    )
  );

CREATE POLICY "Users can create empresas"
  ON empresas FOR INSERT
  WITH CHECK (true);

-- Políticas para user_empresas
CREATE POLICY "Users can view their empresa memberships"
  ON user_empresas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.id = user_empresas.user_id
    )
  );

-- Políticas para facturas
CREATE POLICY "Users can view facturas of their empresas"
  ON facturas FOR SELECT
  USING (user_has_access_to_empresa(empresa_id));

CREATE POLICY "Users can insert facturas in their empresas"
  ON facturas FOR INSERT
  WITH CHECK (user_has_access_to_empresa(empresa_id));

CREATE POLICY "Users can update facturas in their empresas"
  ON facturas FOR UPDATE
  USING (user_has_access_to_empresa(empresa_id));

CREATE POLICY "Users can delete facturas in their empresas"
  ON facturas FOR DELETE
  USING (user_has_access_to_empresa(empresa_id));

-- Políticas para warehouses
CREATE POLICY "Users can view warehouses of their empresas"
  ON warehouses FOR SELECT
  USING (user_has_access_to_empresa(empresa_id));

CREATE POLICY "Users can insert warehouses in their empresas"
  ON warehouses FOR INSERT
  WITH CHECK (user_has_access_to_empresa(empresa_id));

CREATE POLICY "Users can update warehouses in their empresas"
  ON warehouses FOR UPDATE
  USING (user_has_access_to_empresa(empresa_id));

CREATE POLICY "Users can delete warehouses in their empresas"
  ON warehouses FOR DELETE
  USING (user_has_access_to_empresa(empresa_id));

-- Políticas para products
CREATE POLICY "Users can view products of their empresas"
  ON products FOR SELECT
  USING (user_has_access_to_empresa(empresa_id));

CREATE POLICY "Users can insert products in their empresas"
  ON products FOR INSERT
  WITH CHECK (user_has_access_to_empresa(empresa_id));

CREATE POLICY "Users can update products in their empresas"
  ON products FOR UPDATE
  USING (user_has_access_to_empresa(empresa_id));

CREATE POLICY "Users can delete products in their empresas"
  ON products FOR DELETE
  USING (user_has_access_to_empresa(empresa_id));

-- Políticas para outgoings
CREATE POLICY "Users can view outgoings of their empresas"
  ON outgoings FOR SELECT
  USING (user_has_access_to_empresa(empresa_id));

CREATE POLICY "Users can insert outgoings in their empresas"
  ON outgoings FOR INSERT
  WITH CHECK (user_has_access_to_empresa(empresa_id));

-- Políticas para eventos
CREATE POLICY "Users can view eventos of their empresas"
  ON eventos FOR SELECT
  USING (user_has_access_to_empresa(empresa_id));

CREATE POLICY "Users can insert eventos in their empresas"
  ON eventos FOR INSERT
  WITH CHECK (user_has_access_to_empresa(empresa_id));

CREATE POLICY "Users can update eventos in their empresas"
  ON eventos FOR UPDATE
  USING (user_has_access_to_empresa(empresa_id));

CREATE POLICY "Users can delete eventos in their empresas"
  ON eventos FOR DELETE
  USING (user_has_access_to_empresa(empresa_id));

-- ============================================
-- 6. STORAGE BUCKETS
-- ============================================

-- Crear buckets de almacenamiento
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('facturas-xml', 'facturas-xml', false),
  ('facturas-zip', 'facturas-zip', false),
  ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para facturas-xml
CREATE POLICY "Users can upload XML to their empresa folders"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'facturas-xml' AND
    (storage.foldername(name))[1] IN (
      SELECT empresa_id::text FROM user_empresas ue
      JOIN users u ON u.id = ue.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can view XML from their empresa folders"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'facturas-xml' AND
    (storage.foldername(name))[1] IN (
      SELECT empresa_id::text FROM user_empresas ue
      JOIN users u ON u.id = ue.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Políticas similares para facturas-zip y documentos
CREATE POLICY "Users can upload ZIP to their empresa folders"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'facturas-zip' AND
    (storage.foldername(name))[1] IN (
      SELECT empresa_id::text FROM user_empresas ue
      JOIN users u ON u.id = ue.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

CREATE POLICY "Users can view ZIP from their empresa folders"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'facturas-zip' AND
    (storage.foldername(name))[1] IN (
      SELECT empresa_id::text FROM user_empresas ue
      JOIN users u ON u.id = ue.user_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- ============================================
-- 7. INITIAL DATA (OPTIONAL)
-- ============================================

-- Crear empresa demo para desarrollo
-- Descomentar si necesitas datos de prueba

-- INSERT INTO empresas (id, nombre, nit, direccion, email)
-- VALUES (
--   'f47ac10b-58cc-4372-a567-0e02b2c3d479',
--   'Empresa Demo SAS',
--   '900123456-7',
--   'Calle 123 #45-67, Bogotá',
--   'contacto@demo.com'
-- );

-- ============================================
-- FIN DEL SCHEMA
-- ============================================

-- Para verificar que todo se creó correctamente:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- SELECT * FROM information_schema.table_constraints WHERE table_schema = 'public';
