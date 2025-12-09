'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                    </div>
                    <CardTitle>¡Ups! Algo salió mal</CardTitle>
                    <CardDescription>
                        Ha ocurrido un error inesperado al cargar la aplicación.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        Recargar página
                    </Button>
                    <Button onClick={() => reset()}>
                        Intentar de nuevo
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
