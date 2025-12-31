import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { LogProvider } from '@/lib/logger.tsx';
import { AuthProvider } from '@/components/auth-provider';

export const metadata: Metadata = {
  title: 'Nexo',
  description: 'Gestión inteligente de facturas y documentos con Nexo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen w-full bg-background font-sans antialiased'
        )}
      >
        <ThemeProvider>
          <LogProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
