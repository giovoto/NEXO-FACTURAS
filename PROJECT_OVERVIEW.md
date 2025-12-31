# Studio - Plataforma de Gestión de Facturas Electrónicas

## 📋 Descripción General del Proyecto

**Studio** es una plataforma web de gestión de facturas electrónicas diseñada para empresas colombianas. Replica las funcionalidades principales de **Payana** pero como aplicación local, permitiendo:

- Importar y procesar facturas electrónicas XML de proveedores
- Sincronizar facturas desde el portal de la DIAN
- Visualizar y gestionar documentos recibidos
- Exportar datos a Excel para contabilidad
- Verificar proveedores ficticios contra listas de la DIAN
- Integración futura con Siigo (software contable)

---

## 🏗️ Arquitectura y Stack Tecnológico

### Frontend
- **Framework:** Next.js 14.2.5 (App Router)
- **Lenguaje:** TypeScript
- **UI Library:** React 18
- **Componentes:** Shadcn UI (Radix UI primitives)
- **Estilos:** Tailwind CSS
- **Iconos:** Lucide React

### Backend
- **Runtime:** Node.js (Next.js Server Components y API Routes)
- **Base de Datos:** Firebase Firestore
- **Autenticación:** Firebase Auth (actualmente mock para desarrollo)
- **Storage:** Firebase Storage (para archivos)

### Librerías Clave
- **Procesamiento XML:** `xml2js` - parsear facturas UBL 2.1
- **Excel:** `xlsx` - leer exports de DIAN y generar reportes
- **ZIP:** `adm-zip` - extraer archivos comprimidos
- **Automatización:** `puppeteer` - intentos de scraping automatizado de DIAN
- **HTTP:** `axios` - llamadas API

---

## 📂 Estructura del Proyecto

```
studio/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx               # Layout principal
│   │   ├── page.tsx                 # Dashboard home
│   │   ├── actions.ts               # Server Actions
│   │   ├── api/                     # API Routes
│   │   │   └── dian/
│   │   │       └── sync/route.ts    # Endpoint de sincronización DIAN
│   │   ├── proveedores/
│   │   │   └── documentos/
│   │   │       ├── page.tsx         # Página principal de documentos
│   │   │       ├── dian-sync-button.tsx
│   │   │       └── invoice-table.tsx
│   │   └── configuracion/
│   ├── components/
│   │   ├── ui/                      # Componentes Shadcn UI
│   │   ├── sidebar.tsx              # Navegación lateral
│   │   ├── auth-provider.tsx        # Context de autenticación
│   │   └── dashboard/
│   │       └── invoice-viewer.tsx   # Visualizador de facturas
│   ├── services/
│   │   ├── xml-service.ts           # Parser XML UBL 2.1
│   │   ├── dian-scraper.ts          # Automatización DIAN
│   │   ├── dian-excel-parser.ts     # Parser Excel DIAN
│   │   ├── excel-service.ts         # Exportación Excel
│   │   └── fictitious-suppliers.ts  # Verificación proveedores
│   └── lib/
│       ├── firebase.ts              # Cliente Firebase
│       └── firebase-admin.ts        # Admin Firebase
├── public/
└── package.json
```

---

## 🔄 Flujos de Trabajo Principales

### 1. Carga Manual de Facturas XML/ZIP

**Proceso:**
1. Usuario sube archivo `.xml` o `.zip` desde interfaz
2. `xml-service.ts` parsea el XML UBL 2.1
3. Extrae campos:
   - Datos del proveedor (NIT, nombre, dirección)
   - Datos del cliente
   - Ítems de la factura
   - Impuestos (IVA, retenciones)
   - CUFE (código único)
4. Muestra factura en `invoice-viewer.tsx`
5. Verifica NIT contra lista de proveedores ficticios
6. (Futuro) Guarda en Firebase Firestore

### 2. Sincronización con DIAN

**Objetivo:** Descargar facturas recibidas directamente del portal DIAN.

**Flujo Actual (con problemas):**

1. Usuario hace clic en "Sincronizar desde la DIAN"
2. Modal solicita token de autenticación DIAN
3. Backend recibe token en `/api/dian/sync`
4. `dian-scraper.ts` intenta:
   - **Opción A (Puppeteer):** Automatizar navegación en portal DIAN
     - Autenticar con token
     - Ir a Documentos → Recibidos
     - Clic en "Exportar Excel"
     - Confirmar modal JavaScript
     - Descargar ZIP
   - **Problema:** DIAN detecta bot, falla consistentemente
   
5. Si descarga exitosa:
   - Extrae archivo Excel del ZIP
   - `dian-excel-parser.ts` lee el Excel
   - Filtra documentos del grupo "Recibidos"
   - Mapea a formato `ParsedInvoice`
   - Devuelve array de facturas
   
6. Frontend:
   - Recibe facturas en `dian-sync-button.tsx`
   - Actualiza estado `dianInvoices` en `page.tsx`
   - Guarda en `localStorage` para persistencia
   - Muestra mensaje de éxito con cantidad
   - Usuario ve tabla completa en pestaña "Historial"

**Estado Actual:** Puppeteer falla por detección anti-bot de DIAN.

### 3. Visualización de Facturas en Tabla

**Componente:** `invoice-table.tsx`

**Características:**
- Muestra TODAS las facturas en formato tabla
- Columnas: Fecha, Folio, Proveedor, NIT, Total, Estado
- Formato de moneda colombiana (COP)
- Formato de fecha español
- Badges de estado con colores
- Empty state cuando no hay datos
- Hover effects

**Persistencia:**
- Facturas guardadas en `localStorage`
- Se restauran automáticamente al recargar
- No se pierden al cambiar de pestaña

### 4. Exportación a Excel

**Función:** Exportar facturas a archivo `.xlsx`

**Ubicación:** `excel-service.ts`

**Proceso:**
1. Usuario hace clic en "Exportar a Excel"
2. Toma facturas de `dianInvoices` (o datos mock si vacío)
3. Crea workbook con columnas:
   - Folio, Fecha Emisión, Fecha Vencimiento
   - Proveedor, NIT
   - Tipo Documento, Medio de Pago
   - Subtotal, IVA, Retención, Total
4. Descarga como `Reporte_DIAN.xlsx`

---

## 🎯 Tipos de Datos Principales

### ParsedInvoice

```typescript
export type ParsedInvoice = {
  // Identificación
  id?: string;
  issueDate?: string;
  dueDate?: string;
  
  // Proveedor
  supplierName?: string;
  supplierTaxId?: string;
  supplierAddress?: string;
  supplierCity?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  
  // Cliente
  customerName?: string;
  customerTaxId?: string;
  customerAddress?: string;
  customerCity?: string;
  customerEmail?: string;
  customerPhone?: string;
  
  // Financiero
  total?: number;
  subtotal?: number;
  taxes?: number;
  reteFuente?: number;
  reteIVA?: number;
  reteICA?: number;
  
  // Detalles
  currency?: string;
  paymentMeans?: string; // "Crédito" o "Contado"
  docType?: string;
  taxLevelCode?: string;
  taxRegimen?: string;
  
  // Items
  lines: Array<{
    description: string;
    qty: number;
    price: number;
    disk: number;
    total: number;
  }>;
  
  // Metadata
  metadata?: {
    cufe?: string;
    number?: string;
    qr?: string;
    profileId?: string;
    estado?: string;    // De DIAN Excel
    divisa?: string;
  };
}
```

---

## 🐛 Problemas Actuales y Limitaciones

### 1. Automatización DIAN con Puppeteer (CRÍTICO)

**Problema:**
- Portal DIAN detecta Puppeteer como bot
- Falla al intentar automatizar descarga
- Token de autenticación no es suficiente
- Modal de confirmación JavaScript no se puede clickear

**Intentos Realizados:**
- ✅ Puppeteer con user agent personalizado
- ✅ Screenshots de debug en cada paso
- ✅ Esperas de timeout
- ❌ Todo falla con "Error de conexión o Token inválido"

**Causa Probable:**
- DIAN usa detección anti-bot
- Posible CAPTCHA invisible
- Validación de sesión humana
- Headers o cookies especiales requeridos

**Solución Actual:** 
- Requiere descarga manual del ZIP
- Archivo hardcoded en `e:\0DESARROLLO\studio\39f24ab0-0745-4ef2-a661-7a1e62956dc3.zip`

**Solución Propuesta:**
- Implementar input de subida de archivo ZIP
- Usuario descarga manualmente desde DIAN
- Sube ZIP en la interfaz
- Sistema lo procesa automáticamente

### 2. Firebase Admin en Next.js

**Problema:**
- Errores intermitentes: "Service is not a function"
- Conflictos con `https-proxy-agent`
- Compilación falla cuando Firebase Admin está activo

**Workaround Temporal:**
- Código de `google-auth-actions.ts` comentado
- Permite desarrollo del scraper DIAN
- Debe re-habilitarse después

### 3. Persistencia de Datos

**Estado:**
- ✅ LocalStorage implementado
- ✅ Datos persisten al cambiar pestañas
- ❌ No hay sincronización multi-dispositivo
- ❌ No se guardan en Firebase Firestore aún

**Próximos Pasos:**
- Implementar `saveInvoices` action
- Guardar en Firestore cuando usuario está autenticado
- Sincronizar entre dispositivos

### 4. Autenticación

**Estado Actual:**
- Mock user hardcoded en development
- No requiere login real
- Firebase Auth deshabilitado temporalmente

**Producción Requiere:**
- Habilitar Firebase Auth
- Login con email/password
- Asignar empresas a usuarios
- Roles y permisos

---

## 📊 Estado de Implementación

### ✅ Completado

- [x] UI base con Shadcn + Tailwind
- [x] Sidebar de navegación (estilo Payana)
- [x] Parser XML UBL 2.1 completo
- [x] Visualizador de facturas individual
- [x] Modal de token DIAN
- [x] Parser de Excel de DIAN
- [x] Tabla de facturas múltiples
- [x] Persistencia con localStorage
- [x] Exportación a Excel
- [x] Verificación proveedores ficticios
- [x] Design responsivo

### 🔄 En Progreso

- [ ] Automatización DIAN (bloqueado por anti-bot)
- [ ] Subida de archivos ZIP
- [ ] Persistencia Firebase

### 📝 Pendiente

- [ ] Paginación de tabla (actualmente muestra todas)
- [ ] Filtros de búsqueda (proveedor, fecha, monto)
- [ ] Sorting de columnas
- [ ] Detalle de factura en modal (al hacer clic en fila)
- [ ] Integración con Siigo
- [ ] Notificaciones de nuevas facturas
- [ ] Reportes avanzados
- [ ] Multi-empresa
- [ ] Roles de usuario

---

## 🔧 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Modo desarrollo
npm run dev -- -p 5000

# Build producción
npm run build

# Ejecutar producción
npm start

# Linter
npm run lint
```

---

## 📦 Dependencias Principales

```json
{
  "dependencies": {
    "next": "14.2.5",
    "react": "^18",
    "typescript": "^5",
    "firebase": "^10.13.2",
    "firebase-admin": "^12.6.0",
    "xml2js": "^0.6.2",
    "xlsx": "^0.18.5",
    "adm-zip": "^0.5.16",
    "puppeteer": "^23.9.0",
    "axios": "^1.7.7",
    "lucide-react": "^0.462.0",
    "@radix-ui/react-*": "^1.1.2",
    "tailwindcss": "^3.4.1"
  }
}
```

---

## 🎨 Características de Diseño

### Paleta de Colores
- **Primario:** Blue-600 (DIAN sync, acciones)
- **Secundario:** Slate (backgrounds, borders)
- **Success:** Green-600 (facturas recibidas, confirmaciones)
- **Warning:** Yellow-600 (pendientes)
- **Error:** Red-600 (proveedores ficticios, errores)

### Componentes UI
- Cards con sombras sutiles
- Alerts con iconos (Info, Success, Warning, Error)
- Modals centrados con overlay
- Buttons con estados hover y disabled
- Tables responsivas con hover rows
- Badges de estado con colores semánticos

---

## 🔐 Variables de Entorno Necesarias

```env
# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (JSON del service account)
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=
```

---

## 📍 Rutas y Páginas

| Ruta | Descripción | Estado |
|------|-------------|--------|
| `/` | Dashboard principal | ✅ |
| `/proveedores/documentos` | Gestión de facturas | ✅ |
| `/configuracion` | Configuración general | 🔄 |
| `/api/dian/sync` | Endpoint sincronización | ✅ |

---

## 🎯 Próximos Pasos Recomendados

1. **Implementar subida de ZIP manual** para resolver el bloqueo de Puppeteer
2. **Conectar persistencia Firebase** para guardar facturas
3. **Agregar paginación** a la tabla (100+ registros)
4. **Implementar búsqueda/filtros** en la tabla
5. **Re-habilitar Firebase Admin** (resolver conflictos de dependencias)
6. **Agregar autenticación real** con Firebase Auth
7. **Explorar APIs oficiales DIAN** (si existen) en lugar de scraping

---

## 💡 Notas Técnicas Importantes

### Parser XML UBL 2.1
- Soporta `Invoice` y `AttachedDocument` como raíz
- Maneja namespaces `cbc:`, `cac:`, `sts:`, `ext:`
- Extrae retenciones complejas (Fuente, IVA, ICA)
- Compatible con formato DIAN Colombia

### Excel DIAN Format
- Contiene múltiples hojas
- Hoja principal: "Hoja1" o similar
- Headers en fila 1
- Columna "Grupo" para filtrar "Recibidos"
- 90+ columnas de metadatos

### LocalStorage Strategy
- Key: `'dianInvoices'`
- Formato: JSON string de `ParsedInvoice[]`
- Restauración automática en `useEffect`
- Guardado automático al cambiar `dianInvoices`

---

## 🆘 Ayuda Necesaria

**Problema Principal:** Bypass de detección anti-bot de DIAN

**Opciones a Explorar:**
1. Usar proxies residenciales
2. Implementar delays aleatorios más largos
3. Simular movimientos de mouse
4. Investigar si DIAN tiene API oficial
5. Explorar selenium-stealth o puppeteer-extra-plugin-stealth
6. Considerar arquitectura de microservicio separado para Puppeteer
7. Alternativa: Manual upload + procesamiento automático

**Preguntas para Resolver:**
- ¿Existe API oficial de DIAN para descargar facturas programáticamente?
- ¿Cómo logra Payana automatizar esto?
- ¿Es viable login programático con certificado digital?

---

Este documento resume el estado actual del proyecto **Studio** a fecha de **Diciembre 2024**.
