'use client';

import { Button } from '@/components/ui/button';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                    <h2 className="text-2xl font-bold">Algo salió mal gravemente (Global Error)</h2>
                    <p className="text-gray-500">{error.message}</p>
                    <Button onClick={() => reset()}>Intentar de nuevo</Button>
                </div>
            </body>
        </html>
    );
}
