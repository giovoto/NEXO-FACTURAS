# Módulo de Automatización DIAN - (Payana-like Flow)

Este documento detalla la implementación técnica del módulo automatizado para sincronizar facturas electrónicas desde la DIAN, integrado en la arquitectura de **Studio**.

## 🏗️ Arquitectura del Sistema

El sistema sigue un flujo lineal orquestado por la API Route `/api/dian/sync`:

```mermaid
graph TD
    A[CronJob / Usuario] -->|POST /api/dian/sync| B(API Orchestrator)
    B -->|Check Body| C{Tiene TokenUrl?}
    C -->|NO| D[Email Service]
    D -->|IMAP Search| E[Extraer Token Link]
    E -->|TokenUrl| F[DIAN Scraper]
    C -->|SI| F
    F -->|Puppeteer/Fetch| G[Descargar ZIP]
    G -->|AdmZip| H[Procesar Excel]
    H -->|Parsers| I[Normalizar Datos]
    I -->|Array Invoices| J[Firestore Service]
    J -->|Batch Write| K[(Firebase Firestore)]
```

---

## 🚀 Componentes Implementados

### 1. Email Service (`src/services/email-service.ts`)
**Función:** Conectar a una cuenta de correo (Gmail/Outlook) via IMAP, buscar correos de la DIAN y extraer el enlace de autologin ("Token").
**Tecnologías:** `imapflow`, `mailparser`.
**Uso:**
```typescript
const emailService = new DianEmailService({ host: 'imap.gmail.com', ... });
const token = await emailService.getLatestDianToken();
```

### 2. Firestore Sync Service (`src/services/firestore-service.ts`)
**Función:** Guardar lotes de facturas en Firestore, evitando duplicados mediante IDs determinísticos (`NIT_NumeroFactura`).
**Estructura de Datos:**
```
/companies/{companyId}/invoices/{invoiceId}
{
    id: "FE-123",
    supplierTaxId: "900123456",
    total: 100000,
    metadata: { estado: "Aprobado" },
    syncedAt: Timestamp
}
```

### 3. API Orchestrator (`src/app/api/dian/sync/route.ts`)
**Función:** Punto de entrada que conecta todos los servicios.
**Lógica:**
1. Recibe petición POST (puede incluir config de email).
2. Si no hay token manual, busca en el email.
3. Invoca al Scraper (actualmente usa archivo local por bloqueo anti-bot, listo para switch a Puppeteer).
4. Guarda resultados en Firestore.
5. Registra log de auditoría.

---

## ⚙️ Configuración para Producción

### Variables de Entorno (.env)
```bash
# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# Email Config (para el bot de lectura)
DIAN_EMAIL_HOST=imap.gmail.com
DIAN_EMAIL_USER=facturas@tuempresa.com
DIAN_EMAIL_PASS=app-password-here
```

### Configuración del CRON (Vercel Cron / GitHub Actions)
Para ejecutar cada noche a las 2 AM:

**Endpoint:** `POST https://tudominio.com/api/dian/sync`
**Body:**
```json
{
  "empresaId": "empresa-123",
  "emailConfig": {
    "host": "imap.gmail.com",
    "user": "env_var_user",
    "pass": "env_var_pass"
  }
}
```

---

## 🔒 Seguridad y Buenas Prácticas

1.  **IDs Únicos:** Se generan IDs compuestos (`NIT_Numero`) para prevenir duplicación de facturas al sincronizar múltiples veces.
2.  **Batch Writes:** Firestore permite hasta 500 operaciones por batch. El servicio maneja esto automáticamente.
3.  **Logs de Auditoría:** Cada sincronización deja un registro en `companies/{id}/sync_logs` con el resultado y cantidad de documentos.
4.  **Manejo de Errores:** El pipeline es robusto; si falla el email, no intenta el scraper. Si falla el scraper, no escribe en BD.

---

## ⚠️ Estado Actual del Scraper

Debido a las protecciones anti-bot de la DIAN, el componente **Puppeteer** (`scrapeDianDocuments`) está configurado actualmente para procesar el archivo ZIP descargado manualmente y ubicado en la carpeta del proyecto.

**Para uso real:**
1. El usuario reenvía correo a la cuenta del bot (o el bot lee su cuenta).
2. El sistema extrae el token.
3. (Pendiente Bypass) El sistema descarga el ZIP.
4. El sistema procesa y guarda.
