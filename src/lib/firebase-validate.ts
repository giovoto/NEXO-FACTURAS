/**
 * Valida que el projectId del cliente (NEXT_PUBLIC_FIREBASE_PROJECT_ID)
 * y el del service account (FIREBASE_SERVICE_ACCOUNT) coincidan.
 */

export function validateFirebaseConfig() {
  try {
    const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const adminConfig = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
    const adminProjectId = adminConfig.project_id;

    if (!clientProjectId || !adminProjectId) {
      console.warn("⚠️ No se encontró NEXT_PUBLIC_FIREBASE_PROJECT_ID o project_id en el service account.");
      return;
    }

    if (clientProjectId !== adminProjectId) {
      throw new Error(
        `❌ Inconsistencia en projectId detectada:
        - Cliente (NEXT_PUBLIC_FIREBASE_PROJECT_ID): ${clientProjectId}
        - Service Account (project_id): ${adminProjectId}
        Asegúrate de usar credenciales del mismo proyecto.`
      );
    }

    console.log(`✅ Configuración Firebase consistente (projectId: ${clientProjectId})`);
  } catch (err: any) {
    console.error("Error validando configuración Firebase:", err.message);
    throw err; // Detiene la app si hay una inconsistencia
  }
}
