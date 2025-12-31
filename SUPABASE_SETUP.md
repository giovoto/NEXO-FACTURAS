# Guía de Configuración de Supabase

Esta guía te ayudará a configurar Supabase para tu proyecto Studio.

## 📋 Pasos para Configuración

### 1. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Inicia sesión o crea una cuenta
3. Haz clic en "New Project"
4. Completa los datos:
   - **Nombre del proyecto**: Studio
   - **Database Password**: Elige una contraseña segura (guárdala)
   - **Región**: Elige la más cercana (ej: South America - São Paulo)
   - **Plan**: Free (suficiente para empezar)
5. Haz clic en "Create new project"
6. Espera 2-3 minutos mientras se provisiona el proyecto

### 2. Obtener Credenciales

Una vez creado el proyecto:

1. Ve a **Settings** → **API** en el menú lateral
2. Copia las siguientes credenciales:
   - **URL** (bajo "Project URL")
   - **anon public** key (bajo "Project API keys")
   - **service_role** key (bajo "Project API keys" - ⚠️ NUNCA expongas esta clave en el cliente)

### 3. Configurar Variables de Entorno

1. En tu proyecto, crea o edita el archivo `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

2. Reemplaza los valores con tus credenciales reales

⚠️ **IMPORTANTE**: 
- Nunca subas `.env.local` a Git
- El archivo `.env.supabase.example` es solo una plantilla
- Asegúrate de que `.env.local` esté en tu `.gitignore`

### 4. Ejecutar el Schema SQL

1. En Supabase, ve a **SQL Editor** en el menú lateral
2. Haz clic en "New query"
3. Copia y pega **todo el contenido** del archivo `supabase-schema.sql`
4. Haz clic en "Run" (esquina inferior derecha)
5. Verifica que no haya errores (debe mostrar "Success. No rows returned")

Esto creará:
- ✅ 8 tablas (users, empresas, user_empresas, facturas, warehouses, products, outgoings, eventos)
- ✅ Todos los índices para optimización
- ✅ Row Level Security (RLS) policies
- ✅ Triggers automáticos
- ✅ Funciones helper
- ✅ Storage buckets

### 5. Verificar la Configuración

En el SQL Editor, ejecuta:

```sql
-- Ver todas las tablas creadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Ver todas las policies de RLS
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

Deberías ver:
- 8 tablas en el primer query
- Múltiples políticas RLS en el segundo query

### 6. Configurar Storage (Opcional pero Recomendado)

1. Ve a **Storage** en el menú lateral
2. Deberías ver 3 buckets creados:
   - `facturas-xml`
   - `facturas-zip`
   - `documentos`
3. Si no están creados, créalos manualmente:
   - Haz clic en "Create a new bucket"
   - Nombre: `facturas-xml`
   - Public: **No** (desactivado)
   - Repeat for the other buckets

## 🧪 Probar la Conexión

Después de configurar todo, prueba que la conexión funcione:

```bash
npm run dev
```

Si todo está correcto:
- ✅ No deberías ver errores de "Missing env.NEXT_PUBLIC_SUPABASE_URL"
- ✅ La aplicación debe cargar sin errores en la consola
- ✅ (Próximamente) Podrás registrarte/iniciar sesión

## 🔐 Seguridad

### RLS (Row Level Security)

Todas las tablas tienen RLS habilitado, lo que significa:
- Los usuarios solo pueden ver datos de empresas a las que pertenecen
- No es posible acceder a datos de otras empresas, incluso con la API
- Las políticas se aplican automáticamente en cada query

### Storage Policies

Los archivos están organizados por carpetas de empresa:
```
facturas-xml/
  └── {empresa_id}/
      └── archivo.xml
```

Los usuarios solo pueden:
- Subir archivos a carpetas de sus empresas
- Ver archivos de carpetas de sus empresas

## 📊 Explorar los Datos

### Table Editor

1. Ve a **Table Editor** en Supabase
2. Puedes ver todas las tablas
3. Ver, editar, insertar datos manualmente (útil para testing)

### SQL Editor

Ejecuta queries SQL directamente:

```sql
-- Ver todas las empresas
SELECT * FROM empresas;

-- Ver usuarios y sus empresas
SELECT 
  u.email,
  e.nombre as empresa,
  ue.role
FROM users u
JOIN user_empresas ue ON u.id = ue.user_id
JOIN empresas e ON ue.empresa_id = e.id;

-- Ver facturas con totales por empresa
SELECT 
  e.nombre as empresa,
  COUNT(*) as total_facturas,
  SUM(f.total) as total_monto
FROM facturas f
JOIN empresas e ON f.empresa_id = e.id
GROUP BY e.nombre;
```

## 🚀 Siguiente Paso

Una vez completada la configuración, el siguiente paso es:

1. ✅ Migrar la autenticación (login, registro, recuperación de contraseña)
2. Migrar los Server Actions de facturas
3. Migrar inventario
4. Migrar agenda
5. Testing completo

## 🆘 Troubleshooting

### Error: "Missing env.NEXT_PUBLIC_SUPABASE_URL"

**Solución**: Verifica que el archivo `.env.local` existe y tiene la variable correcta.

### Error al ejecutar el schema SQL

**Solución**: 
- Asegúrate de copiar **todo** el contenido del archivo `supabase-schema.sql`
- Verifica que no haya queries previas ejecutadas que puedan conflictuar
- Si hay errores, puedes ejecutar query por query para identificar el problema

### Error: "relation already exists"

**Solución**: Ya ejecutaste el schema antes. Puedes:
- Ignorar el error si solo algunas tablas ya existen
- O hacer un DROP completo y volver a crear (⚠️ perderás datos):

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Luego ejecuta el schema nuevamente.

## 📚 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)
