# Firebase Studio
# Nexo - Gestión Inteligente de Facturas
This is a NextJS starter in Firebase Studio.
Este es un proyecto Next.js que utiliza Firebase para la autenticación y base de datos, y ShadCN/UI con Tailwind CSS para la interfaz de usuario.
## Empezando
1.  **Instalar dependencias**:
    ```bash
    npm install
    ```
2.  **Configurar variables de entorno**:
    Crea un archivo `.env` en la raíz del proyecto y añade las credenciales de Firebase.
3.  **Ejecutar la aplicación**:
    ```bash
    npm run dev
    ```
---
## Estructura del Proyecto
Aquí tienes un resumen de los directorios y archivos más importantes:
```
.
├── src/
│   ├── app/
│   │   ├── (rutas)/        # Directorios para cada sección principal (ej. /agenda, /facturacion)
│   │   │   ├── page.tsx    # Componente de la página principal de la sección
│   │   │   └── actions.ts  # Server Actions específicas de esa sección
│   │   │
│   │   ├── admin/          # Páginas de administración (solo para superadmin)
│   │   ├── actions.ts      # Server Actions globales de la aplicación
│   │   ├── layout.tsx      # Layout raíz que envuelve toda la aplicación
│   │   └── page.tsx        # Página principal (Dashboard)
│   │
│   ├── components/
│   │   ├── ui/             # Componentes de UI reutilizables generados por ShadCN (Button, Card, etc.)
│   │   ├── dashboard/      # Componentes específicos para el Dashboard
│   │   ├── auth-provider.tsx # Componente crucial que gestiona el estado de autenticación del usuario y su rol
│   │   └── layout-wrapper.tsx # Contenedor de las páginas privadas con la barra lateral (Sidebar) y el encabezado (Header)
│   │
│   ├── lib/
│   │   ├── firebase.ts     # Configuración de Firebase para el lado del cliente (navegador)
│   │   ├── firebase-admin.ts # Configuración de Firebase para el lado del servidor (Server Actions)
│   │   ├── types.ts        # Definiciones de tipos y esquemas Zod para la validación de datos
│   │   └── utils.ts        # Funciones de utilidad generales (ej. `cn` para clases de Tailwind)
│   │
│   ├── services/           # Lógica de negocio y conexión con APIs externas (Siigo, DIAN, etc.)
```
