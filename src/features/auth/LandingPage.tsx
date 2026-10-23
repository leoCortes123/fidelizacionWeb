import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Gift, QrCode, Sparkles, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { Brand } from '@/components/shared/Brand';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from './AuthProvider';
import { brandTagline, defaultPathForRoles, isSupabaseConfigured } from '@/lib/config';
import { errorMessage } from '@/lib/errors';

const steps = [
  {
    icon: QrCode,
    title: 'Compra y escanea',
    text: 'El cajero registra tu compra y te muestra un QR único. Escanéalo con tu teléfono.',
  },
  {
    icon: Sparkles,
    title: 'Suma puntos',
    text: 'Cada $1.000 COP completos se convierten en 1 punto. Los puntos se acreditan al reclamar.',
  },
  {
    icon: Gift,
    title: 'Canjea antojos',
    text: 'Cuando tengas puntos, pide tu recompensa en caja. El equipo la aplica y descuenta tus puntos.',
  },
];

export function LandingPage() {
  const { session, roles, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleLogin() {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 no-print">
        <Brand />
        <div className="flex items-center gap-2">
          {session ? (
            <Button onClick={() => navigate(defaultPathForRoles(roles))}>
              Ir a mi cuenta
              <ArrowRight aria-hidden="true" />
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link to="/login?next=/admin">
                  <UsersRound aria-hidden="true" />
                  Soy administrador
                </Link>
              </Button>
              <Button variant="outline" onClick={handleLogin}>
                Entrar
              </Button>
            </>
          )}
        </div>
      </header>

      <section className="hero-glow border-y">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.1fr_0.9fr] md:py-20">
          <div className="space-y-6">
            <Badge variant="secondary" className="px-3 py-1">
              Programa de fidelización
            </Badge>
            <div className="space-y-3">
              <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
                Cada compra cuenta.
                <span className="block text-primary">Cada punto sabe mejor.</span>
              </h1>
              <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
                {brandTagline}. Acumula puntos con tus compras, revisa tu saldo y
                pide tus recompensas desde el teléfono.
              </p>
            </div>

            {!isSupabaseConfigured && (
              <Alert variant="warning" className="max-w-xl">
                <AlertTitle>Falta configurar Supabase</AlertTitle>
                <AlertDescription>
                  Copia <code>.env.example</code> a <code>.env</code> y define
                  <code> VITE_SUPABASE_URL</code> y
                  <code> VITE_SUPABASE_ANON_KEY</code> para activar el inicio de
                  sesión y los datos reales.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              {session ? (
                <Button size="lg" onClick={() => navigate(defaultPathForRoles(roles))}>
                  Ver mis puntos
                  <ArrowRight aria-hidden="true" />
                </Button>
              ) : (
                <Button size="lg" onClick={handleLogin}>
                  Entrar con Google
                  <ArrowRight aria-hidden="true" />
                </Button>
              )}
              <Button size="lg" variant="outline" asChild>
                <Link to="/login?next=/admin">Acceso de administración</Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Sin tarjetas físicas. Tu cuenta de Google protege tus puntos y tu
              historial.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-4 -rotate-3 rounded-[2rem] bg-amber-200/60" aria-hidden="true" />
            <Card className="relative rotate-1 overflow-hidden border-2 border-foreground/10 shadow-xl">
              <div className="flex items-center justify-between border-b bg-foreground px-5 py-3 text-background">
                <span className="font-display text-sm font-bold">Tarjeta de puntos</span>
                <span aria-hidden="true">⭐</span>
              </div>
              <CardContent className="space-y-5 p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Saldo
                  </p>
                  <p className="font-display text-5xl font-extrabold text-primary">
                    128
                  </p>
                  <p className="text-sm text-muted-foreground">puntos disponibles</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Próxima recompensa</span>
                    <span>Gringa</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-[82%] rounded-full bg-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Te faltan 12 puntos para tu gringa.
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/60 p-3 text-xs font-medium text-secondary-foreground">
                  Ejemplo ilustrativo. Tus puntos reales aparecen al iniciar sesión.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 max-w-2xl space-y-2">
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
            Así de fácil
          </h2>
          <p className="text-muted-foreground">
            Sin filas extra ni registros en caja: escaneas, confirmas y listo.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="h-full">
                <CardContent className="space-y-3 p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-display text-3xl font-extrabold text-muted-foreground/30">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <footer className="border-t bg-card/50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Brand compact />
          <p>Identidad provisional configurable · COP · America/Bogota</p>
        </div>
      </footer>
    </div>
  );
}
