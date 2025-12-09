
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const error = req.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/configuracion?error=${encodeURIComponent(error)}`, req.url));
  }

  if (code) {
    // Pass the code back to the settings page to be handled by a Server Action
    return NextResponse.redirect(new URL(`/configuracion?code=${encodeURIComponent(code)}`, req.url));
  }
  
  // Fallback redirect if neither code nor error is present
  return NextResponse.redirect(new URL('/configuracion', req.url));
}
