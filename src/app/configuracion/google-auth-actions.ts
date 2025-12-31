
'use server';

import 'server-only';
import { getAuthenticatedUser, db } from '@/lib/firebase-admin';
// import { google } from 'googleapis'; // Temporarily disabled
import { revalidatePath } from 'next/cache';

const getUserDoc = (userId: string) => db.collection('users').doc(userId);

/**
 * Checks if a valid Google refresh token exists for the user.
 */
export async function getAuthStatusAction(idToken: string): Promise<{ isConnected: boolean }> {
    try {
        const user = await getAuthenticatedUser(idToken);
        const doc = await getUserDoc(user.uid).get();
        const isConnected = !!doc.data()?.googleRefreshToken;
        return { isConnected };
    } catch (error) {
        console.error("Error checking auth status:", error);
        return { isConnected: false };
    }
}

/**
 * Saves the Google OAuth2 refresh token to the user's document in Firestore.
 */
export async function saveRefreshTokenAction(idToken: string, authCode: string): Promise<{ success: boolean; error?: string }> {
    // Temporarily disabled due to googleapis dependency issues
    return { success: false, error: 'Google OAuth temporarily disabled' };

    /* const user = await getAuthenticatedUser(idToken);

    const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET } = process.env;
    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
        const errorMessage = 'Google API credentials are not configured on the server.';
        console.error('[Auth Action] Error:', errorMessage);
        return { success: false, error: errorMessage };
    }

    const redirectUri = process.env.NODE_ENV === 'production'
        ? `https://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'app.nexo.co'}/api/gmail/callback`
        : 'http://localhost:3000/api/gmail/callback';

    const oAuth2Client = new google.auth.OAuth2(
        GMAIL_CLIENT_ID,
        GMAIL_CLIENT_SECRET,
        redirectUri
    );

    try {
        const { tokens } = await oAuth2Client.getToken(authCode);
        if (!tokens.refresh_token) {
            throw new Error('No refresh token was provided by Google. Ensure you are requesting offline access with prompt: "consent".');
        }

        await getUserDoc(user.uid).set({
            googleRefreshToken: tokens.refresh_token,
        }, { merge: true });

        console.log(`[Auth Action] Successfully saved refresh token for user ${user.uid}`);
        revalidatePath('/configuracion');
        return { success: true };

    } catch (error: any) {
        console.error(`[Auth Action] Error exchanging auth code for token for user ${user.uid}:`, error);
        return { success: false, error: `Failed to get refresh token: ${error.message}` };
    } */
}
