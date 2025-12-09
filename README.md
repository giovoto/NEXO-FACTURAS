# Nexo - Gestión Inteligente de Facturas

Este es un proyecto Next.js que utiliza Firebase para la autenticación y base de datos, y ShadCN/UI con Tailwind CSS para la interfaz de usuario.

## Empezando

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```
2.  **Configurar variables de entorno**:
    Crea un archivo `.env` en la raíz del proyecto y añade las credenciales de Firebase y otras API necesarias (Siigo, Google Cloud).
3.  **Ejecutar la aplicación**:
    ```bash
    npm run dev
    ```

---

## Análisis de Seguridad y Recomendaciones

Esta sección documenta el estado actual de la seguridad de la aplicación y las recomendaciones para fortalecerla.

### Fortalezas Actuales

1.  **Arquitectura Basada en Server Actions**:
    *   **Lógica en el Servidor**: La mayoría de las operaciones de negocio (consultas a base de datos, llamadas a APIs externas) se ejecutan exclusivamente en el servidor a través de Server Actions de Next.js. Esto evita la exposición de lógica sensible y credenciales en el lado del cliente.
    *   **Protección CSRF**: Las Server Actions de Next.js tienen protección incorporada contra ataques de Falsificación de Solicitudes en Sitios Cruzados (CSRF), lo que añade una capa de seguridad automática a todos los formularios y acciones.

2.  **Autenticación y Autorización Centralizada**:
    *   **Verificación de Token**: Todas las Server Actions protegidas utilizan la función `getAuthenticatedUser` de `src/lib/firebase-admin.ts`. Esta función verifica el token de ID de Firebase en cada solicitud, asegurando que solo usuarios autenticados y con sesiones válidas puedan ejecutar operaciones.
    *   **Gestión de Roles**: El sistema utiliza Custom Claims de Firebase para gestionar roles (`superadmin`, `user`). La lógica de asignación se encuentra centralizada en la Server Action `onUserCreateAction`, y las rutas protegidas (como `/admin/users`) verifican el rol del usuario.

3.  **Gestión de Secretos**:
    *   **Variables de Entorno y Secretos**: Las claves de API y credenciales de servicios (Firebase Admin, Siigo, Google Cloud) se gestionan a través de variables de entorno y secretos inyectados por App Hosting, como se define en `apphosting.yaml`. No se almacenan claves sensibles en el código fuente.

### Puntos de Mejora y Recomendaciones

1.  **Seguridad del Webhook de Notificaciones Push de Gmail**:
    *   **Vulnerabilidad**: El endpoint `/api/gmail/push/route.ts` es público para poder recibir notificaciones de Google Pub/Sub. Un actor malicioso podría intentar enviar peticiones POST a esta URL para sobrecargar el servicio.
    *   **Recomendación**: Aunque el impacto es bajo (ya que el endpoint no procesa datos del cuerpo de la solicitud sin validación), se recomienda añadir una capa de seguridad. Una estrategia común es incluir un token secreto en la URL del webhook al configurarlo en Google Cloud y verificar ese token en cada solicitud entrante.

2.  **Autorización Granular en Server Actions**:
    *   **Vulnerabilidad**: Actualmente, la mayoría de las Server Actions solo verifican si el usuario está autenticado, pero no si tiene el rol adecuado para realizar la acción (ej. un usuario normal podría, teóricamente, llamar a una acción destinada a un administrador si no se protege adecuadamente).
    *   **Recomendación**: Implementar comprobaciones de rol dentro de las Server Actions críticas. Por ejemplo, antes de ejecutar la lógica de `deleteWarehouseAction`, se debería verificar si el `caller.role` es `admin` o `superadmin`.

3.  **Validación Estricta de Entradas (Input Validation)**:
    *   **Vulnerabilidad**: Las Server Actions reciben datos del cliente (ej. IDs, formularios). Si estos datos no se validan correctamente en el servidor, podrían ser explotados para realizar operaciones no deseadas.
    *   **Recomendación**: Utilizar una librería como `zod` para definir esquemas de validación para los argumentos de todas las Server Actions. Esto asegura que los datos tengan el tipo, formato y estructura esperados antes de ser procesados.
---
