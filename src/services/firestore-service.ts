import * as admin from 'firebase-admin';
import { ParsedInvoice } from './xml-service';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
            // Or use service account path if env vars are confusing in local dev
            // credential: admin.credential.cert(require('path/to/serviceAccountKey.json')) 
        });
    } catch (error) {
        console.error('Firebase Admin Init Error:', error);
    }
}

const db = admin.firestore();

export class FirestoreInvoiceService {

    /**
     * Saves a batch of invoices to Firestore.
     * Uses batch writes for efficiency and atomicity.
     * Checks for existing documents to avoid overwriting if needed (or merges).
     */
    async saveInvoicesBatch(invoices: ParsedInvoice[], companyId: string): Promise<{ saved: number, errors: number }> {
        if (!invoices.length) return { saved: 0, errors: 0 };

        const batch = db.batch();
        let operationCount = 0;
        let savedCount = 0;

        for (const invoice of invoices) {
            if (!invoice.id) continue;

            // Generate a unique ID: supplierNIT_invoiceNumber
            // Clean characters to ensure valid firestore ID
            const safeId = `${invoice.supplierTaxId || 'unknown'}_${invoice.metadata?.number || invoice.id}`.replace(/[^a-zA-Z0-9_-]/g, '_');

            const docRef = db.collection('companies')
                .doc(companyId)
                .collection('invoices')
                .doc(safeId);

            // Use set with merge: true to update existing fields but keep others
            batch.set(docRef, {
                ...invoice,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                // Add a createdAt if it doesn't exist (trickier with set merge, usually simpler to just overwrite or read first)
                // For sync, usually overwriting with latest official data is fine.
                syncedAt: admin.firestore.FieldValue.serverTimestamp(),
                source: 'dian-sync'
            }, { merge: true });

            operationCount++;
            savedCount++;

            // batches are limited to 500 ops
            if (operationCount >= 450) {
                await batch.commit();
                operationCount = 0;
            }
        }

        if (operationCount > 0) {
            await batch.commit();
        }

        console.log(`💾 Saved ${savedCount} invoices to Firestore for company ${companyId}`);
        return { saved: savedCount, errors: 0 };
    }

    /**
     * Log the synchronization attempt
     */
    async logSyncAttempt(companyId: string, status: 'success' | 'error' | 'partial', message: string, count: number) {
        await db.collection('companies')
            .doc(companyId)
            .collection('sync_logs')
            .add({
                date: admin.firestore.FieldValue.serverTimestamp(),
                status,
                message,
                invoicesProcessed: count
            });
    }
}
