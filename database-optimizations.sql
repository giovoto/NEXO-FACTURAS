-- ============================================
-- OPTIMIZACIONES Y MEJORAS PARA SUPABASE
-- ============================================

-- 1. ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================

-- Facturas: búsquedas frecuentes por empresa, estado y fecha
CREATE INDEX IF NOT EXISTS idx_facturas_empresa_estado 
  ON facturas(empresa_id, estado);

CREATE INDEX IF NOT EXISTS idx_facturas_empresa_fecha 
  ON facturas(empresa_id, issue_date DESC);

CREATE INDEX IF NOT EXISTS idx_facturas_supplier_name 
  ON facturas(supplier_name);

CREATE INDEX IF NOT EXISTS idx_facturas_folio 
  ON facturas(folio);

-- Products: búsquedas por bodega y código
CREATE INDEX IF NOT EXISTS idx_products_warehouse 
  ON products(warehouse_id, nombre);

CREATE INDEX IF NOT EXISTS idx_products_codigo 
  ON products(codigo);

-- Warehouses: búsqueda por empresa
CREATE INDEX IF NOT EXISTS idx_warehouses_empresa 
  ON warehouses(empresa_id, nombre);

-- Outgoings: búsquedas por producto y bodega
CREATE INDEX IF NOT EXISTS idx_outgoings_product 
  ON outgoings(product_id);

CREATE INDEX IF NOT EXISTS idx_outgoings_warehouse 
  ON outgoings(warehouse_id);

CREATE INDEX IF NOT EXISTS idx_outgoings_created 
  ON outgoings(created_at DESC);

-- Eventos: búsquedas por empresa y fechas
CREATE INDEX IF NOT EXISTS idx_eventos_empresa_fecha 
  ON eventos(empresa_id, fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_eventos_tipo 
  ON eventos(tipo, estado);

-- User_empresas: búsquedas bidireccionales
CREATE INDEX IF NOT EXISTS idx_user_empresas_empresa 
  ON user_empresas(empresa_id, role);

-- 2. TRIGGERS DE AUDITORÍA
-- ============================================

-- Crear tabla de auditoría si no existe
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Función genérica de auditoría
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id::text, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_log (table_name, record_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id::text, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar triggers de auditoría a tablas importantes
DROP TRIGGER IF EXISTS audit_facturas ON facturas;
CREATE TRIGGER audit_facturas
  AFTER INSERT OR UPDATE OR DELETE ON facturas
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_empresas ON empresas;
CREATE TRIGGER audit_empresas
  AFTER INSERT OR UPDATE OR DELETE ON empresas
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_user_empresas ON user_empresas;
CREATE TRIGGER audit_user_empresas
  AFTER INSERT OR UPDATE OR DELETE ON user_empresas
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- 3. FUNCIONES SQL ÚTILES
-- ============================================

-- Función para obtener resumen de facturas por empresa
CREATE OR REPLACE FUNCTION get_facturas_summary(p_empresa_id UUID)
RETURNS TABLE (
  total_facturas BIGINT,
  total_monto NUMERIC,
  pendientes BIGINT,
  procesadas BIGINT,
  vencidas BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_facturas,
    COALESCE(SUM(total), 0)::NUMERIC as total_monto,
    COUNT(*) FILTER (WHERE estado = 'pendiente')::BIGINT as pendientes,
    COUNT(*) FILTER (WHERE estado = 'procesado')::BIGINT as procesadas,
    COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND estado = 'pendiente')::BIGINT as vencidas
  FROM facturas
  WHERE empresa_id = p_empresa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener inventario total por empresa
CREATE OR REPLACE FUNCTION get_inventario_summary(p_empresa_id UUID)
RETURNS TABLE (
  total_products BIGINT,
  total_warehouses BIGINT,
  total_value NUMERIC,
  low_stock_items BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT p.id)::BIGINT as total_products,
    COUNT(DISTINCT w.id)::BIGINT as total_warehouses,
    COALESCE(SUM(p.cantidad * p.precio_unitario), 0)::NUMERIC as total_value,
    COUNT(*) FILTER (WHERE p.cantidad < 10)::BIGINT as low_stock_items
  FROM products p
  JOIN warehouses w ON w.id = p.warehouse_id
  WHERE w.empresa_id = p_empresa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener próximos eventos
CREATE OR REPLACE FUNCTION get_upcoming_eventos(p_empresa_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID,
  titulo TEXT,
  fecha_inicio TIMESTAMP WITH TIME ZONE,
  tipo TEXT,
  dias_restantes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.titulo,
    e.fecha_inicio,
    e.tipo,
    EXTRACT(DAY FROM e.fecha_inicio - NOW())::INTEGER as dias_restantes
  FROM eventos e
  WHERE e.empresa_id = p_empresa_id
    AND e.fecha_inicio BETWEEN NOW() AND NOW() + (p_days || ' days')::INTERVAL
    AND e.estado != 'completado'
  ORDER BY e.fecha_inicio ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. POLÍTICAS RLS AVANZADAS
-- ============================================

-- Política para permitir a admins ver audit_log
DROP POLICY IF EXISTS "Admins can view audit log" ON audit_log;
CREATE POLICY "Admins can view audit log" ON audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_empresas ue
      JOIN users u ON u.id = ue.user_id
      WHERE u.auth_id = auth.uid()
        AND ue.role = 'admin'
    )
  );

-- Permitir que el sistema inserte en audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_log;
CREATE POLICY "System can insert audit logs" ON audit_log
  FOR INSERT
  WITH CHECK (true);

-- 5. VISTAS ÚTILES
-- ============================================

-- Vista de facturas con información de empresa
CREATE OR REPLACE VIEW facturas_with_empresa AS
SELECT 
  f.*,
  e.nombre as empresa_nombre,
  e.nit as empresa_nit
FROM facturas f
JOIN empresas e ON e.id = f.empresa_id;

-- Vista de productos con información de bodega
CREATE OR REPLACE VIEW products_with_warehouse AS
SELECT 
  p.*,
  w.nombre as warehouse_nombre,
  w.ubicacion as warehouse_ubicacion,
  w.empresa_id
FROM products p
JOIN warehouses w ON w.id = p.warehouse_id;

-- Vista de usuarios por empresa con su rol
CREATE OR REPLACE VIEW empresa_users_view AS
SELECT 
  e.id as empresa_id,
  e.nombre as empresa_nombre,
  u.id as user_id,
  u.email,
  u.display_name,
  ue.role,
  ue.created_at as joined_at
FROM empresas e
JOIN user_empresas ue ON ue.empresa_id = e.id
JOIN users u ON u.id = ue.user_id;

-- 6. CONSTRAINT CHECKS ADICIONALES
-- ============================================

-- Validar que cantidad en products sea positiva
ALTER TABLE products 
  DROP CONSTRAINT IF EXISTS products_cantidad_positive;

ALTER TABLE products 
  ADD CONSTRAINT products_cantidad_positive 
  CHECK (cantidad >= 0);

-- Validar que precio_unitario sea positivo
ALTER TABLE products 
  DROP CONSTRAINT IF EXISTS products_precio_positive;

ALTER TABLE products 
  ADD CONSTRAINT products_precio_positive 
  CHECK (precio_unitario >= 0);

-- Validar que total en facturas sea positivo
ALTER TABLE facturas 
  DROP CONSTRAINT IF EXISTS facturas_total_positive;

ALTER TABLE facturas 
  ADD CONSTRAINT facturas_total_positive 
  CHECK (total >= 0);

-- Validar que cantidad en outgoings sea positiva
ALTER TABLE outgoings 
  DROP CONSTRAINT IF EXISTS outgoings_cantidad_positive;

ALTER TABLE outgoings 
  ADD CONSTRAINT outgoings_cantidad_positive 
  CHECK (cantidad > 0);

-- 7. FUNCIONES DE STATS EN TIEMPO REAL
-- ============================================

-- Stats dashboard para una empresa
CREATE OR REPLACE FUNCTION get_empresa_dashboard_stats(p_empresa_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'facturas', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'pendientes', COUNT(*) FILTER (WHERE estado = 'pendiente'),
        'total_monto', COALESCE(SUM(total), 0)
      )
      FROM facturas WHERE empresa_id = p_empresa_id
    ),
    'inventario', (
      SELECT jsonb_build_object(
        'total_products', COUNT(DISTINCT p.id),
        'total_warehouses', COUNT(DISTINCT w.id),
        'low_stock', COUNT(*) FILTER (WHERE p.cantidad < 10)
      )
      FROM products p
      JOIN warehouses w ON w.id = p.warehouse_id
      WHERE w.empresa_id = p_empresa_id
    ),
    'eventos', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'proximos_7_dias', COUNT(*) FILTER (
          WHERE fecha_inicio BETWEEN NOW() AND NOW() + INTERVAL '7 days'
        )
      )
      FROM eventos WHERE empresa_id = p_empresa_id
    ),
    'usuarios', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'admins', COUNT(*) FILTER (WHERE role = 'admin')
      )
      FROM user_empresas WHERE empresa_id = p_empresa_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios en las tablas para documentación
COMMENT ON TABLE facturas IS 'Registro de facturas electrónicas recibidas';
COMMENT ON TABLE productos IS 'Catálogo de productos de inventario';
COMMENT ON TABLE warehouses IS 'Bodegas/almacenes de la empresa';
COMMENT ON TABLE outgoings IS 'Salidas de inventario';
COMMENT ON TABLE eventos IS 'Agenda/calendario de eventos';
COMMENT ON TABLE audit_log IS 'Log de auditoría de cambios importantes';

-- ============================================
-- FIN DE OPTIMIZACIONES
-- ============================================
