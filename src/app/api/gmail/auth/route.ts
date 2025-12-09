
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET } = process.env;
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
    return NextResponse.json({ error: 'Google API credentials are not configured.' }, { status: 500 });
  }

  // Determine the redirect URI based on the environment
  const host = req.headers.get('host');
  const protocol = host?.startsWith('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/gmail/callback`;

  const oAuth2Client = new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    redirectUri
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', // Essential to get a refresh token
    prompt: 'consent',     // Ensures the user is prompted for consent every time
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
  });

  return NextResponse.redirect(authUrl);
}
