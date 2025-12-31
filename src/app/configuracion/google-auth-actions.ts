
'use server';

import 'server-only';
// Firebase removed - these functions are disabled
// TODO: Implement with Supabase if needed

/**
 * Checks if a valid Google refresh token exists for the user.
 * DISABLED - Needs Supabase implementation
 */
export async function getAuthStatusAction(): Promise<{ isConnected: boolean }> {
    return { isConnected: false };
}

/**
 * Saves the Google OAuth2 refresh token to the user's document.
 * DISABLED - Needs Supabase implementation
 */
export async function saveRefreshTokenAction(authCode: string): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: 'Google OAuth temporarily disabled - awaiting Supabase migration' };
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
