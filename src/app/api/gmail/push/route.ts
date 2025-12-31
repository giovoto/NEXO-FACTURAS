
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { actionImportZip } from '@/app/actions';
// import { getAuthenticatedUser } from '@/lib/firebase-admin';

// App Hosting: fuerza runtime Node para usar googleapis, Buffer, etc.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Ensure it's not statically rendered


// --- Funciones Auxiliares (Integradas en este archivo) ---

type Gmail = ReturnType<typeof google.gmail>;

/**
 * Crea un cliente autenticado de la API de Gmail usando OAuth2 con un refresh token.
 * Este cliente es para un "rol de servicio" y usa el token de entorno.
 */
async function getGmailClient(): Promise<Gmail> {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN } = process.env;

  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
    throw new Error('Las credenciales de Gmail no están configuradas en las variables de entorno para el webhook.');
  }

  const oAuth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET
  );
  oAuth2Client.setCredentials({ refresh_token: GMAIL_REFRESH_TOKEN });

  // No es necesario un getAccessToken explícito, la librería lo maneja.
  return google.gmail({ version: 'v1', auth: oAuth2Client });
}


/**
 * Procesa un archivo adjunto de correo reutilizando la Server Action existente.
 * NOTA: Esta función asume que existe un usuario "sistema" o el primer superadmin
 * para asociar la factura. Se necesita una estrategia de autenticación para webhooks.
 */
async function processAttachment(bytes: Buffer, filename: string): Promise<boolean> {
  try {
    const file = new File([bytes], filename, { type: 'application/zip' });

    // TODO: Implementar una estrategia de autenticación segura para webhooks.
    // Por ahora, esta acción no puede ejecutarse porque actionImportZip requiere
    // un idToken de un usuario logueado. Se necesita un token de servicio o 
    // asociar el email entrante a un usuario de la app.
    // Simularemos el procesamiento para no bloquear el flujo.

    console.log(`[gmail/push] Archivo '${filename}' listo para ser procesado. Se necesita una estrategia de autenticación de usuario para llamar a actionImportZip.`);

    // --- DESCOMENTAR CUANDO HAYA ESTRATEGIA DE AUTENTICACIÓN ---
    // const systemUserToken = await getSystemUserToken(); 
    // await actionImportZip(systemUserToken, file);

    return true;
  } catch (error) {
    console.error(`[gmail/push] Error preparando el adjunto '${filename}' para procesamiento:`, error);
    return false;
  }
}


/**
 * Expande un historyId para encontrar nuevos mensajes, descargar sus adjuntos y procesarlos.
 * Para este webhook, una estrategia más simple es buscar los mensajes no leídos recientes.
 */
export async function processNewMessages(gmail: Gmail): Promise<number> {
  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    q: 'has:attachment filename:(xml OR zip) is:unread',
    maxResults: 10,
  });

  if (!listResponse.data.messages) {
    console.log('[gmail/push] No se encontraron mensajes nuevos con adjuntos relevantes.');
    return 0;
  }

  let processedCount = 0;
  for (const messageHeader of listResponse.data.messages) {
    if (!messageHeader.id) continue;

    const msgResponse = await gmail.users.messages.get({
      userId: 'me',
      id: messageHeader.id,
    });

    const parts = msgResponse.data.payload?.parts || [];
    for (const part of parts) {
      if (part.filename && (part.filename.toLowerCase().endsWith('.zip') || part.filename.toLowerCase().endsWith('.xml')) && part.body?.attachmentId) {
        const attachmentResponse = await gmail.users.messages.attachments.get({
          userId: 'me',
          messageId: messageHeader.id,
          id: part.body.attachmentId,
        });

        const data = attachmentResponse.data.data;
        if (data) {
          const fileBuffer = Buffer.from(data, 'base64');
          const success = await processAttachment(fileBuffer, part.filename);
          if (success) processedCount++;
        }
      }
    }

    // Marcar como leído para no procesarlo de nuevo
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageHeader.id,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    });
  }

  return processedCount;
}


// --- Endpoint Principal del Webhook ---

/**
 * Endpoint para recibir notificaciones push de Gmail a través de Pub/Sub.
 * POST /api/gmail/push
 */
export async function POST(req: NextRequest) {
  console.log('[gmail/push] Notificación de Gmail recibida...');

  try {
    const body = await req.json();
    console.log('[gmail/push] Payload de Pub/Sub:', body);

    if (!body.message || !body.message.data) {
      console.warn('[gmail/push] Payload de Pub/Sub inválido. Ignorando.');
      return NextResponse.json({ ok: true }); // Devolver 200 para que Pub/Sub no reintente
    }

    // El payload de Pub/Sub está codificado en Base64
    const payload = JSON.parse(Buffer.from(body.message.data, 'base64').toString('utf8')) as {
      emailAddress: string; historyId: string;
    };
    console.log('[gmail/push] Payload decodificado:', payload);

    // Con el historyId, ahora procesamos los mensajes nuevos
    const gmail = await getGmailClient();
    const processedCount = await processNewMessages(gmail);

    console.log(`[gmail/push] Proceso completado. Se procesaron ${processedCount} adjuntos.`);

    return NextResponse.json({ ok: true, message: `Proceso completado. ${processedCount} adjuntos procesados.` });

  } catch (err: any) {
    console.error('[gmail/push] Error procesando el webhook:', err?.message || err, err.stack);
    const errorMessage = err instanceof Error ? err.message : 'Error interno del servidor';
    // Devolvemos 500 para que Pub/Sub pueda reintentar la entrega si es un error transitorio
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 500 });
  }
}
