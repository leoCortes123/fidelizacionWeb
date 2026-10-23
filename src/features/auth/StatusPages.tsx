import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Brand } from '@/components/shared/Brand';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function UnauthorizedPage() {
  return (
    <div className="hero-glow grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-5 p-8 text-center">
          <div className="flex justify-center">
            <Brand />
          </div>
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-7" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-extrabold">Acceso restringido</h1>
            <p className="text-sm text-muted-foreground">
              Tu cuenta no tiene el rol necesario para este panel. Pide a un
              administrador que habilite tu acceso.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link to="/customer">Ir a mis puntos</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/">
                <ArrowLeft aria-hidden="true" />
                Volver al inicio
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="hero-glow grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 p-8 text-center">
          <p className="font-display text-6xl font-extrabold text-primary">404</p>
          <h1 className="font-display text-2xl font-extrabold">Página no encontrada</h1>
          <p className="text-sm text-muted-foreground">
            El enlace que buscas no existe o cambió de lugar.
          </p>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
