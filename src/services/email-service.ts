import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

/**
 * Service to handle email interactions for DIAN synchronization
 * Connects via IMAP to find emails from DIAN and extract the auth token
 */

interface EmailConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
}

export class DianEmailService {
    private client: ImapFlow;

    constructor(config: EmailConfig) {
        this.client = new ImapFlow({
            host: config.host,
            port: config.port,
            secure: true,
            auth: {
                user: config.user,
                pass: config.pass
            },
            logger: false
        });
    }

    /**
     * Connects to the email server and searches for the latest DIAN token email
     * @returns The extracted token URL or null if not found
     */
    async getLatestDianToken(): Promise<string | null> {
        try {
            await this.client.connect();
            console.log('📧 Connected to IMAP server');

            // Open Inbox
            const lock = await this.client.getMailboxLock('INBOX');

            try {
                // Search for emails from DIAN with "token" or "acceso" in subject
                // Ideally we search for unseen messages or from the last 24h
                const messages = [];

                // Search query: FROM "dian" AND SUBJECT "token" (adjust as needed based on actual DIAN emails)
                // Note: DIAN emails usually come from "Servicios Informáticos Electrónicos"
                for await (const message of this.client.fetch({
                    from: 'dian.gov.co', // Broad search, better to be specific if known
                    // unseen: true // Option: only look at new emails
                }, {
                    source: true,
                    envelope: true
                })) {
                    messages.push(message);
                    // We only need the latest one really
                    if (messages.length > 5) break;
                }

                if (messages.length === 0) {
                    console.log('⚠️ No DIAN emails found');
                    return null;
                }

                // Sort by date descending (newest first)
                messages.sort((a, b) => b.envelope.date.getTime() - a.envelope.date.getTime());
                const latestMessage = messages[0];

                console.log(`📩 Processing latest email from: ${latestMessage.envelope.date}`);

                // Parse the email content
                const parsed = await simpleParser(latestMessage.source);
                const html = parsed.html || parsed.textAsHtml || '';
                const text = parsed.text || '';

                // Extract URL using Regex
                // Pattern matches the typical DIAN auth token header/link
                // Example: https://catalogo-vpfe.dian.gov.co/User/AuthToken?pk=...
                const urlRegex = /https:\/\/catalogo-vpfe\.dian\.gov\.co\/User\/AuthToken\?[^"'\s<>]+/g;
                const matches = html.match(urlRegex) || text.match(urlRegex);

                if (matches && matches.length > 0) {
                    const tokenUrl = matches[0];
                    console.log('✅ Found DIAN Token URL:', tokenUrl);
                    return tokenUrl;
                } else {
                    console.warn('⚠️ Token URL not found in email content');
                    return null;
                }

            } finally {
                lock.release();
            }

        } catch (error) {
            console.error('❌ Email Service Error:', error);
            return null;
        } finally {
            await this.client.logout();
        }
    }
}
