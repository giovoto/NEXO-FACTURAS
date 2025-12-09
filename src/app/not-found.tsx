import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <h2 className="text-2xl font-bold">Página no encontrada</h2>
            <p>No pudimos encontrar el recurso que buscas.</p>
            <Link href="/">
                <Button>Volver al Inicio</Button>
            </Link>
        </div>
    )
}
