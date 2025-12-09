
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

export default function PoliticaDePrivacidadPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/20 p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="text-center">
             <div className="flex justify-center items-center gap-3 mb-2">
                 <div className="p-2 bg-primary rounded-lg">
                   <MessageSquare className="w-6 h-6 text-primary-foreground" />
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-foreground text-left">
                      Nexo
                    </h2>
                    <p className="text-sm text-muted-foreground text-left">Gestión Inteligente</p>
                 </div>
              </div>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Política de Privacidad
          </CardTitle>
          <CardDescription>Última actualización: 1 de agosto de 2024</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm text-foreground/90">
            <p>
                Bienvenido a Nexo ("nosotros", "nuestro"). Nos comprometemos a proteger tu privacidad. Esta Política de Privacidad explica cómo recopilamos, usamos, divulgamos y salvaguardamos tu información cuando utilizas nuestra aplicación.
            </p>

            <div className="space-y-2">
                <h3 className="font-semibold text-lg">1. Uso de Datos de Google y APIs de Google</h3>
                <p>
                    Nuestra aplicación utiliza las APIs de Google (Gmail y Google Drive) para proporcionar sus funcionalidades principales. Al conectar tu cuenta de Google, nos otorgas permiso para acceder a ciertos datos:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>
                        <strong>Google Gmail API (Permiso de solo lectura):</strong> Usamos este permiso para buscar en tu bandeja de entrada correos electrónicos que contengan facturas adjuntas (archivos ZIP y XML) basándonos en criterios específicos. No almacenamos el contenido de tus correos, solo extraemos la información de las facturas para procesarla.
                    </li>
                    <li>
                        <strong>Google Drive API (Permiso de creación de archivos):</strong> Usamos este permiso para crear una carpeta y una hoja de cálculo en tu Google Drive donde se almacenarán los datos extraídos de las facturas y los archivos PDF asociados. Esto te da control total y propiedad sobre tus datos.
                    </li>
                </ul>
                <p>
                    El uso que hacemos de la información recibida de las APIs de Google se adhiere a la <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Política de Datos de Usuario de los Servicios API de Google</a>, incluyendo los requisitos de Uso Limitado. La información obtenida a través de las APIs de Google no será transferida, vendida ni utilizada para fines publicitarios.
                </p>
            </div>

            <div className="space-y-2">
                <h3 className="font-semibold text-lg">2. Información que Recopilamos</h3>
                <p>
                    Podemos recopilar información sobre ti de varias maneras. La información que podemos recopilar a través de la aplicación incluye:
                </p>
                 <ul className="list-disc list-inside space-y-1 pl-4">
                    <li><strong>Datos de la cuenta de Google:</strong> Tu dirección de correo electrónico y nombre para identificarte en la aplicación.</li>
                    <li><strong>Datos de Facturas:</strong> Información extraída de los archivos XML de las facturas, como emisor, receptor, montos y fechas.</li>
                </ul>
            </div>

            <div className="space-y-2">
                <h3 className="font-semibold text-lg">3. Cómo Usamos tu Información</h3>
                 <p>
                    Utilizamos la información recopilada para:
                </p>
                 <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>Operar y mantener la aplicación.</li>
                    <li>Organizar y presentar los datos de tus facturas en tu propia hoja de cálculo de Google.</li>
                    <li>Proporcionarte soporte al cliente.</li>
                </ul>
            </div>
             <div className="space-y-2">
                <h3 className="font-semibold text-lg">4. Seguridad de tu Información</h3>
                 <p>
                    Utilizamos medidas de seguridad administrativas, técnicas y físicas para ayudar a proteger tu información personal. Toda la comunicación con las APIs de Google se realiza a través de conexiones seguras (HTTPS), y tu información se almacena directamente en tu cuenta de Google Drive, beneficiándose de las medidas de seguridad de Google.
                </p>
            </div>
             <div className="space-y-2">
                <h3 className="font-semibold text-lg">5. Contacto</h3>
                 <p>
                    Si tienes preguntas o comentarios sobre esta Política de Privacidad, por favor contáctanos a <span className="font-semibold">[tu-email-de-soporte@ejemplo.com]</span>.
                </p>
            </div>
            
            <p className="text-xs text-muted-foreground pt-4 border-t">
                <strong>Aviso Legal:</strong> Esta es una plantilla de política de privacidad y no constituye asesoramiento legal. Te recomendamos que consultes con un profesional legal para asegurarte de que tu política de privacidad cumpla con todas las leyes y regulaciones aplicables.
            </p>
        </CardContent>
        <CardFooter className="flex justify-center">
            <Link href="/login">
                <Button variant="outline">Volver a Inicio de Sesión</Button>
            </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
