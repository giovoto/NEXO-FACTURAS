
'use server';

import 'server-only';

type SiigoAuth = {
  access_token: string;
  expires_in: number; // in seconds
  token_type: string;
};

let cachedToken: { token: string; exp: number } | null = null;

async function getToken(forceRefresh: boolean = false): Promise<string> {
  const { SIIGO_USERNAME, SIIGO_ACCESS_KEY } = process.env;

  if (!SIIGO_USERNAME || !SIIGO_ACCESS_KEY) {
    throw new Error('Las credenciales de Siigo (SIIGO_USERNAME, SIIGO_ACCESS_KEY) no están configuradas.');
  }

  if (!forceRefresh && cachedToken && cachedToken.exp > Date.now() + 60_000) {
    console.log('[Siigo Client] Reusing cached auth token.');
    return cachedToken.token;
  }
  
  console.log('[Siigo Client] Requesting new auth token from Siigo...');

  const url = `${process.env.SIIGO_AUTH_URL || 'https://api.siigo.com/auth'}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: SIIGO_USERNAME,
      access_key: SIIGO_ACCESS_KEY,
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    cachedToken = null;
    throw new Error(`Error de autenticación con Siigo (${res.status}): ${text}`);
  }
  
  const data = (await res.json()) as SiigoAuth;
  
  cachedToken = { 
    token: data.access_token, 
    exp: Date.now() + (data.expires_in * 1000) 
  };
  
  console.log('[Siigo Client] New auth token obtained and cached successfully.');
  return cachedToken.token;
}

export async function siigoFetch<T>(path: string, init: RequestInit = {}, retry: boolean = true): Promise<T> {
  const base = process.env.SIIGO_BASE_URL || 'https://api.siigo.com';
  const token = await getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: { ...headers, ...(init.headers || {}) },
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 401 && retry) {
        console.warn('[Siigo Fetch] Unauthorized (401). Forcing token refresh and retrying once.');
        await getToken(true); // Force refresh
        return await siigoFetch(path, init, false); // Retry without allowing further retries
      }
      
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      const errorMessage = errorData?.Errors?.[0]?.Message || errorData.message || JSON.stringify(errorData);
      throw new Error(`Error en la API de Siigo para la ruta ${path} (${res.status}): ${errorMessage}`);
    }

    if (res.status === 204) {
      return {} as T;
    }
    
    return res.json() as Promise<T>;

  } catch (error) {
     if (error instanceof Error) {
        console.error(`[Siigo Fetch] Failed request to ${path}:`, error.message);
        throw error;
     }
     console.error(`[Siigo Fetch] Unknown error during request to ${path}`);
     throw new Error('Ocurrió un error desconocido durante la solicitud a Siigo.');
  }
}
