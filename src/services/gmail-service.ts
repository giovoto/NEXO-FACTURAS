
'use server';

import 'server-only';
import { google } from 'googleapis';
import { supabase } from '@/lib/supabase';
import { parseInvoiceZip } from './zip-service';
import type { ExtractInvoiceDataOutput } from '@/lib/types';

type Gmail = ReturnType<typeof google.gmail>;

/**
 * Creates an authenticated Gmail API client for a specific user by fetching their refresh token from Supabase.
 */
async function getGmailClient(refreshToken: string): Promise<Gmail> {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET } = process.env;

  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
    throw new Error('Google API credentials are not configured on the server.');
  }
  if (!refreshToken) {
    throw new Error('GMAIL_REFRESH_TOKEN is not set for this user. Please connect your Google account in Settings.');
  }

  const oAuth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET
  );
  oAuth2Client.setCredentials({ refresh_token: refreshToken });

  return google.gmail({ version: 'v1', auth: oAuth2Client });
}


/**
 * Processes recent unread emails, downloads attachments, extracts invoice data, and marks emails as read.
 * @returns An array of extracted invoice data.
 */
export async function processRecentEmails(refreshToken: string): Promise<ExtractInvoiceDataOutput[]> {
  const gmail = await getGmailClient(refreshToken);

  // Smart filter: look for unread emails in the last 7 days with zip or xml attachments.
  const query = 'has:attachment filename:(zip OR xml) is:unread newer_than:7d';

  const listResponse = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 10,
  });

  if (!listResponse.data.messages) {
    console.log(`[Gmail Service] No new emails with invoices found for user ${userId} using query: "${query}"`);
    return [];
  }

  console.log(`[Gmail Service] Found ${listResponse.data.messages.length} potential emails for user ${userId}.`);
  const allInvoiceData: ExtractInvoiceDataOutput[] = [];

  for (const messageHeader of listResponse.data.messages) {
    if (!messageHeader.id) continue;

    try {
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
            const parsedItems = await parseInvoiceZip(fileBuffer);
            const xmlItem = parsedItems.find(item => item.type === 'xml' && item.parsed);

            if (xmlItem && xmlItem.parsed) {
              const inv = xmlItem.parsed;
              const invoiceData: ExtractInvoiceDataOutput = {
                invoiceNumber: inv.metadata?.number || inv.id || 'N/A',
                invoiceDate: inv.issueDate || new Date().toISOString().split('T')[0],
                supplierName: inv.supplierName || 'N/A',
                supplierId: inv.supplierTaxId || 'N/A',
                totalAmount: inv.total || 0,
                vatAmount: inv.taxes || 0,
                categoria: 'Correo Electrónico',
                fechaVencimiento: inv.issueDate || new Date().toISOString().split('T')[0],
              };
              allInvoiceData.push(invoiceData);
            }
          }
        }
      }

      // Mark email as read after successful processing
      await gmail.users.messages.modify({
        userId: 'me',
        id: messageHeader.id,
        requestBody: { removeLabelIds: ['UNREAD'] }
      });
      console.log(`[Gmail Service] Successfully processed and marked message ${messageHeader.id} as read.`);

    } catch (error) {
      console.error(`[Gmail Service] Failed to process message ${messageHeader.id}`, error);
      // Continue to the next message even if one fails
    }
  }

  return allInvoiceData;
}
