# 🚀 Script para Configurar Supabase

Este archivo contiene instrucciones para ejecutar el schema SQL en tu proyecto Supabase.

## ✅ Variables de Entorno Configuradas

El archivo `.env.local` ya está configurado con tus credenciales de Supabase.

## 📋 Siguiente Paso: Ejecutar Schema SQL

### Opción 1: SQL Editor en Supabase Dashboard (Recomendado)

1. **Ir al SQL Editor**
   - Abre **https://supabase.com/dashboard/project/qsojjxzlvpxmhmswnczz**
   - En el menú lateral, haz clic en **SQL Editor**

2. **Crear Nueva Query**
   - Haz clic en **"+ New query"** (esquina superior)

3. **Copiar y Pegar el Schema**
   - Abre el archivo `supabase-schema.sql` en este proyecto
   - Copia **TODO** el contenido (Ctrl+A, Ctrl+C)
   - Pega en el SQL Editor de Supabase

4. **Ejecutar**
   - Haz clic en **"Run"** (o presiona Ctrl+Enter)
   - Espera ~5 segundos
   - Deberías ver: **"Success. No rows returned"**

5. **Verificar**
   - Ve a **Table Editor** en el menú lateral
   - Deberías ver 8 tablas:
     - users
     - empresas
     - user_empresas
     - facturas
     - warehouses
     - products
     - outgoings
     - eventos

### Opción 2: Desde la Terminal (Alternativa)

Si prefieres usar la terminal y tienes Supabase CLI instalado:

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Ejecutar el schema
supabase db push --db-url "postgres://postgres.qsojjxzlvpxmhmswnczz:ye4uqPwz2kNKilkV@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

## ✅ Checklist de Verificación

Después de ejecutar el schema SQL, verifica:

- [ ] 8 tablas creadas en Table Editor
- [ ] Storage tiene 3 buckets (facturas-xml, facturas-zip, documentos)
- [ ] No hay errores en la consola

## 🔧 Troubleshooting

### Error: "relation already exists"
**Solución**: Algunas tablas ya existen. Puedes ignorar este error o ejecutar este comando primero para limpiar:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Luego ejecuta el schema completo nuevamente.

### Error: "permission denied"
**Solución**: Asegúrate de estar usando el SQL Editor en Supabase Dashboard, no la consola de tu computadora.

## 🎯 Una Vez Completado

Cuando hayas ejecutado el schema exitosamente:
1. ✅ Vuelve aquí y avísame
2. 🚀 Continuaré con la migración del código
3. 🧪 Podremos probar login/registro inmediatamente

---

**Proyecto Supabase**: https://supabase.com/dashboard/project/qsojjxzlvpxmhmswnczz
**URL de tu BD**: https://qsojjxzlvpxmhmswnczz.supabase.co
