# Guía de Configuración de Variables de Entorno

## ⚠️ Problema Actual

El servidor necesita configurar las variables de entorno de Firebase para funcionar correctamente.

**Error actual:**
```
Failed to initialize Firebase Admin SDK: La variable de entorno FIREBASE_SERVICE_ACCOUNT 
no está definida o está vacía.
```

## 🔧 Solución Rápida

### Paso 1: Obtener Service Account de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona el proyecto `facturascan-kt84f`
3. Ve a **Project Settings** (⚙️) > **Service Accounts**
4. Haz clic en **Generate New Private Key**
5. Se descargará un archivo JSON (ej: `facturascan-kt84f-xxxxx.json`)

### Paso 2: Configurar `.env.local`

Crea o edita el archivo `.env.local` en la raíz del proyecto:

```bash
# En la raíz del proyecto (e:/0DESARROLLO/studio/)
# Crea el archivo .env.local
```

**Contenido del archivo `.env.local`:**

```env
FIREBASE_PROJECT_ID=facturascan-kt84f

# IMPORTANTE: Pega el JSON completo del Service Account en una sola línea
# El JSON debe estar entre comillas dobles si tiene espacios
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"facturascan-kt84f",...}

# Variables del cliente Firebase (obtener de Firebase Console > Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=facturascan-kt84f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=facturascan-kt84f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=facturascan-kt84f.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:xxxxx
```

### Paso 3: Convertir JSON a una línea (IMPORTANTE)

El JSON del Service Account debe estar en **una sola línea** sin saltos de línea:

**❌ Incorrecto:**
```json
{
  "type": "service_account",
  "project_id": "facturascan-kt84f",
  ...
}
```

**✅ Correcto:**
```json
{"type":"service_account","project_id":"facturascan-kt84f",...}
```

**Herramienta para convertir:** Usa un editor de texto o este comando PowerShell:
```powershell
# Convertir el JSON a una línea
$json = Get-Content "ruta/al/archivo.json" | ConvertFrom-Json | ConvertTo-Json -Compress
Write-Output $json
```

### Paso 4: Reiniciar el servidor

Después de configurar `.env.local`:

```bash
npm run dev
```

## 📋 Variables Opcionales (Para funcionalidad completa)

### API Siigo (Para facturación electrónica)
```env
SIIGO_USERNAME=tu_username
SIIGO_ACCESS_KEY=tu_access_key
```

### Google Cloud (Para OAuth y Gmail)
```env
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
```

## ✅ Verificación

Después de configurar, deberías ver en la consola:
```
Initializing Firebase Admin for project: facturascan-kt84f
✓ Ready in 2s
```

Sin errores de Firebase.

## 🚨 Notas de Seguridad

- **NUNCA** commits `.env.local` a Git (ya está en `.gitignore`)
- Guarda una copia segura del Service Account JSON
- No compartas las credenciales públicamente
- El archivo `.env.local.example` es solo una plantilla (sin datos reales)

## 🔍 Archivos de Referencia

He creado:
- `.env.local.example` - Plantilla con la estructura esperada

Revisa estos archivos para ver el formato correcto.
