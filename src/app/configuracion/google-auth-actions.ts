
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
