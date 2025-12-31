# Studio - Plataforma de Gestión de Facturas Electrónicas

## 📋 Descripción General del Proyecto

**Studio** es una plataforma web de gestión de facturas electrónicas diseñada para empresas colombianas. Replica las funcionalidades principales de *Payana* pero como aplicación propietaria, permitiendo:

- Importar y procesar facturas electrónicas XML/ZIP de proveedores
- Sincronizar facturas desde el portal de la DIAN (vía carga manual o scraping)
- Visualizar y gestionar documentos recibidos
- Exportar datos a Excel para contabilidad
- Verificar proveedores ficticios contra listas de la DIAN
- Gestión multi-empresa y roles de usuario

---

## 🏗️ Arquitectura y Stack Tecnológico

### Frontend
- **Framework:** Next.js 14.2.5 (App Router)
- **Lenguaje:** TypeScript
- **UI Library:** React 18, Shadcn UI (Radix UI primitives)
- **Estilos:** Tailwind CSS
- **Iconos:** Lucide React

### Backend (Supabase)
- **Base de Datos:** PostgreSQL
- **Autenticación:** Supabase Auth (Email/Password, Google OAuth)
- **Almacenamiento:** Supabase Storage (para XMLs, ZIPs y documentos)
- **Seguridad:** Row Level Security (RLS) para aislamiento de datos por empresa
- **Lógica de Negocio:** Next.js Server Actions (usando SDK de Supabase)

### Librerías Clave
- **Validación:** `zod` - esquemas estrictos para integridad de datos
- **Procesamiento XML:** `xml2js` - parsear facturas UBL 2.1
- **Excel:** `xlsx` - leer exports de DIAN y generar reportes
- **Automatización:** `puppeteer` - scraping de DIAN (lado servidor)

---

## 📂 Estructura del Proyecto

```
studio/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── actions.ts               # Server Actions Globales (Facturas)
│   │   ├── api/                     # API Routes (Legacy/Webhooks)
│   │   ├── agenda/                  # Módulo de Agenda
│   │   │   └── actions.ts           # Actions de Agenda
│   │   ├── configuracion/           # Módulo de Configuración
│   │   │   └── actions.ts           # Actions de Configuración
│   │   ├── empresa/                 # Gestión de Empresa y Usuarios
│   │   ├── inventario/              # Módulo de Inventario
│   │   ├── login/                   # Autenticación
│   │   └── registro/                # Registro de usuarios
│   ├── components/
│   │   ├── ui/                      # Componentes Shadcn UI
│   │   ├── auth-provider.tsx        # Contexto de sesión
│   │   ├── sidebar.tsx              # Navegación lateral
│   │   └── zip-uploader.tsx         # Carga de archivos
│   ├── lib/
│   │   ├── supabase.ts              # Cliente y Admin Supabase
│   │   ├── types.ts                 # Definiciones de Tipos y Zod Schemas
│   │   └── logger.ts                # Sistema de logs
│   ├── services/
│   │   ├── xml-service.ts           # Parser XML
│   │   └── dian-scraper.ts          # Integración DIAN
│   └── types/
│       └── database.types.ts        # Tipos generados de Supabase
├── supabase/                        # Configuraciones de Supabase (local)
└── public/
```

---

## 🔄 Flujos de Trabajo Principales

### 1. Gestión de Facturas
- **Carga:** Usuarios suben facturas (XML o ZIP) a través de `actionImportZip`.
- **Procesamiento:** Se extraen datos UBL 2.1, se calculan impuestos (ReteFuente, ReteIVA) y se guardan en PostgreSQL.
- **Almacenamiento:** Los archivos físicos se guardan en el bucket `facturas-zip` o `facturas-xml`.
- **Consulta:** `getFacturasAction` utiliza `unstable_cache` para listar facturas rápidamente, filtrando por `empresa_id` mediante RLS.

### 2. Autenticación y Seguridad
- **Login:** Usuarios se autentican con Supabase Auth.
- **Roles:** Tabla `user_empresas` define roles (`admin`, `editor`, `viewer`) para cada empresa.
- **Protección:** Middleware y RLS aseguran que un usuario solo acceda a los datos de las empresas donde tiene permiso.

### 3. Módulos Adicionales
- **Inventario:** Gestión de bodegas, productos y salidas.
- **Agenda:** Control de eventos y contactos.
- **Configuración:** Preferencias de usuario persistentes (JSONB en tabla `users`).

---

## 📊 Estado de Implementación (Migración Completada)

### ✅ Completado
- [x] Migración total de Firebase a Supabase (Auth, DB, Storage)
- [x] Implementación de RLS Policies para seguridad robusta
- [x] Optimización de base de datos (Índices y Auditoría)
- [x] Validación de datos con Zod en todas las entradas
- [x] Sistema de caché para consultas frecuentes
- [x] Módulos de Facturación, Inventario, Agenda y Configuración funcionales

### 🚧 En Mantenimiento / Mejora
- [ ] Automatización completa de descarga DIAN (sujeta a cambios en el portal DIAN)
- [ ] Sincronización avanzada con software contable (Siigo)

---

## 🔧 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build producción
npm run build

# Generar tipos de base de datos
npx supabase gen types typescript --project-id "tu-proyecto" > src/types/database.types.ts
```

---

## 🔐 Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key (Solo servidor)
```
