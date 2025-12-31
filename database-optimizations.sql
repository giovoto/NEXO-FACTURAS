/*
  OPTIMIZACIONES DE BASE DE DATOS - NEXO FACTURAS
  -----------------------------------------------
  Este script aplica índices, activadores de auditoría y funciones útiles
  para mejorar el rendimiento y la trazabilidad.
*/

-- =============================================
-- 1. ÍNDICES DE RENDIMIENTO
-- =============================================

-- Índices para FACTURAS
CREATE INDEX IF NOT EXISTS idx_facturas_empresa_estado ON facturas(empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_facturas_empresa_fecha ON facturas(empresa_id, issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_facturas_supplier_name ON facturas(empresa_id, supplier_name);
CREATE INDEX IF NOT EXISTS idx_facturas_folio ON facturas(empresa_id, folio);
CREATE INDEX IF NOT EXISTS idx_facturas_created_by ON facturas(created_by);

-- Índices para PRODUCTS (Inventario)
CREATE INDEX IF NOT EXISTS idx_products_warehouse ON products(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_products_empresa_codigo ON products(empresa_id, codigo);
CREATE INDEX IF NOT EXISTS idx_products_nombre ON products(empresa_id, nombre);

-- Índices para WAREHOUSES
CREATE INDEX IF NOT EXISTS idx_warehouses_empresa ON warehouses(empresa_id);

-- Índices para OUTGOINGS
CREATE INDEX IF NOT EXISTS idx_outgoings_empresa_date ON outgoings(empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outgoings_product ON outgoings(product_id);

-- Índices para EVENTOS
CREATE INDEX IF NOT EXISTS idx_eventos_empresa_fecha ON eventos(empresa_id, fecha_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_estado ON eventos(empresa_id, estado);

-- Índices para USER_EMPRESAS (Permisos)
CREATE INDEX IF NOT EXISTS idx_user_empresas_user ON user_empresas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_empresas_role ON user_empresas(empresa_id, role);


-- =============================================
-- 2. SISTEMA DE AUDITORÍA
-- =============================================

-- Tabla de auditoría
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by UUID DEFAULT auth.uid(),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Proteger la tabla de auditoría (Solo lectura para admins, insert por sistema)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_log;

CREATE POLICY "Admins can view audit logs" ON audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_empresas ue
      WHERE ue.user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
      AND ue.role = 'admin'
    )
  );

-- Función para el trigger de auditoría
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id::TEXT, 'DELETE', row_to_json(OLD), auth.uid());
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (TG_TABLE_NAME, OLD.id::TEXT, 'UPDATE', row_to_json(OLD), row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_log (table_name, record_id, action, new_data, changed_by)
    VALUES (TG_TABLE_NAME, NEW.id::TEXT, 'INSERT', row_to_json(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar triggers a tablas críticas
DROP TRIGGER IF EXISTS audit_facturas ON facturas;
CREATE TRIGGER audit_facturas
  AFTER INSERT OR UPDATE OR DELETE ON facturas
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_empresas ON empresas;
CREATE TRIGGER audit_empresas
  AFTER INSERT OR UPDATE OR DELETE ON empresas
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_user_empresas ON user_empresas;
CREATE TRIGGER audit_user_empresas
  AFTER INSERT OR UPDATE OR DELETE ON user_empresas
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();

DROP TRIGGER IF EXISTS audit_products ON products;
CREATE TRIGGER audit_products
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION log_audit_event();


-- =============================================
-- 3. FUNCIONES DE UTILIDAD (DASHBOARD)
-- =============================================

-- Resumen de facturas por empresa
DROP FUNCTION IF EXISTS get_facturas_summary(UUID);
CREATE OR REPLACE FUNCTION get_facturas_summary(p_empresa_id UUID)
RETURNS TABLE (
  total_count BIGINT,
  total_amount NUMERIC,
  pending_count BIGINT,
  processed_count BIGINT,
  overdue_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_count,
    COALESCE(SUM(total), 0) as total_amount,
    COUNT(*) FILTER (WHERE estado = 'pendiente') as pending_count,
    COUNT(*) FILTER (WHERE estado = 'procesado') as processed_count,
    COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND estado = 'pendiente') as overdue_count
  FROM facturas
  WHERE empresa_id = p_empresa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Próximos eventos
DROP FUNCTION IF EXISTS get_upcoming_eventos(UUID, INT);
CREATE OR REPLACE FUNCTION get_upcoming_eventos(p_empresa_id UUID, p_days INT DEFAULT 7)
RETURNS SETOF eventos AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM eventos
  WHERE empresa_id = p_empresa_id
  AND fecha_inicio >= CURRENT_DATE
  AND fecha_inicio <= (CURRENT_DATE + (p_days || ' days')::INTERVAL)
  ORDER BY fecha_inicio ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =============================================
-- 4. VISTAS DE CONVENIENCIA
-- =============================================

CREATE OR REPLACE VIEW products_with_warehouse AS
SELECT
  p.*,
  w.nombre as warehouse_name,
  w.ubicacion as warehouse_location
FROM products p
JOIN warehouses w ON p.warehouse_id = w.id;

CREATE OR REPLACE VIEW facturas_full_details AS
SELECT
  f.*,
  e.nombre as empresa_nombre,
  e.nit as empresa_nit
FROM facturas f
JOIN empresas e ON f.empresa_id = e.id;
