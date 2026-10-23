import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  QrCode,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Brand } from '@/components/shared/Brand';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FullPageLoader } from '@/components/shared/States';
import { useAuth } from '@/features/auth/AuthProvider';
import { useClaimPurchase } from './hooks';
import { errorMessage } from '@/lib/errors';
import { formatCOP, formatPoints } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ClaimResult } from '@/types';

const PENDING_KEY = 'tacos-pending-claim-token';

export function ClaimPage() {
  const { token = '' } = useParams();
  const { session, loading, signInWithGoogle } = useAuth();
  const claim = useClaimPurchase();
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const tokenLooksValid = useMemo(
    () => /^[A-Za-z0-9_-]{20,100}$/.test(token),
    [token],
  );

  useEffect(() => {
    if (!tokenLooksValid) return;
    try {
      sessionStorage.setItem(PENDING_KEY, token);
    } catch {
      // Si el navegador bloquea storage, el parámetro next del OAuth conserva el token.
    }
  }, [token, tokenLooksValid]);

  async function handleLogin() {
    setSigningIn(true);
    try {
      await signInWithGoogle(`/claim/${token}`);
    } catch (loginError) {
      setSigningIn(false);
      toast.error(errorMessage(loginError));
    }
  }

  function handleClaim() {
    setError(null);
    claim.mutate(token, {
      onSuccess: (data) => {
        setResult(data);
        try {
          sessionStorage.removeItem(PENDING_KEY);
        } catch {
          // Ignorado.
        }
        toast.success(`¡Sumaste ${data.points_awarded} puntos!`);
      },
      onError: (claimError) => {
        setError(errorMessage(claimError));
      },
    });
  }

  if (loading) return <FullPageLoader label="Verificando tu sesión…" />;

  return (
    <div className="hero-glow min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <div className="flex justify-center">
          <Brand />
        </div>

        {!tokenLooksValid ? (
          <Card>
            <CardContent className="space-y-4 p-6 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
                <CircleAlert className="size-7" aria-hidden="true" />
              </span>
              <h1 className="font-display text-2xl font-extrabold">
                Enlace de compra inválido
              </h1>
              <p className="text-sm text-muted-foreground">
                El código del QR no tiene el formato esperado. Pide al cajero que
                genere una compra nueva.
              </p>
              <Button asChild>
                <Link to="/customer">Ir a mis puntos</Link>
              </Button>
            </CardContent>
          </Card>
        ) : result ? (
          <Card className="overflow-hidden">
            <div className="bg-primary px-6 py-8 text-center text-primary-foreground">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary-foreground/15">
                <BadgeCheck className="size-8" aria-hidden="true" />
              </span>
              <h1 className="mt-3 font-display text-2xl font-extrabold">
                ¡Compra asociada!
              </h1>
              <p className="mt-1 text-sm text-primary-foreground/80">
                Tus puntos ya están disponibles.
              </p>
            </div>
            <CardContent className="space-y-5 p-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Compra
                  </p>
                  <p className="mt-1 font-display text-xl font-extrabold">
                    {formatCOP(result.amount_cop)}
                  </p>
                </div>
                <div className="rounded-xl bg-secondary p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground/70">
                    Puntos sumados
                  </p>
                  <p className="mt-1 font-display text-xl font-extrabold text-primary">
                    +{result.points_awarded}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                <span className="text-sm text-muted-foreground">Nuevo saldo</span>
                <span className="font-display text-xl font-extrabold">
                  {formatPoints(result.balance)}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <Button asChild size="lg">
                  <Link to="/customer">
                    Ver mi panel
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link to="/customer">Explorar recompensas</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-5 p-6">
              <div className="text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-secondary text-secondary-foreground">
                  <QrCode className="size-7" aria-hidden="true" />
                </span>
                <h1 className="mt-3 font-display text-2xl font-extrabold">
                  Asocia tu compra
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Confirma que esta compra es tuya para acreditar los puntos en tu
                  cuenta.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>No pudimos acreditar la compra</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!session ? (
                <>
                  <Alert variant="info">
                    <ShieldCheck aria-hidden="true" />
                    <AlertTitle>Necesitas iniciar sesión</AlertTitle>
                    <AlertDescription>
                      Usa tu cuenta de Google o tu correo. Conservaremos este QR mientras te
                      autenticas; no tendrás que escanearlo de nuevo.
                    </AlertDescription>
                  </Alert>
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleLogin}
                    loading={signingIn}
                  >
                    Iniciar sesión con Google
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/login?next=${encodeURIComponent(`/claim/${token}`)}`}>
                      Entrar con correo
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-dashed bg-muted/40 p-4 text-sm">
                    <p className="font-semibold">¿Qué pasará al confirmar?</p>
                    <ul className="mt-2 space-y-1.5 text-muted-foreground">
                      <li className="flex gap-2">
                        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                        La compra se asociará únicamente a tu cuenta.
                      </li>
                      <li className="flex gap-2">
                        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                        El monto y los puntos los calcula el servidor.
                      </li>
                      <li className="flex gap-2">
                        <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                        No se puede reclamar dos veces.
                      </li>
                    </ul>
                  </div>

                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleClaim}
                    loading={claim.isPending}
                  >
                    Confirmar y sumar puntos
                  </Button>
                  <Button asChild variant="ghost" className="w-full">
                    <Link to="/customer">Ahora no</Link>
                  </Button>
                </>
              )}

              <p className="text-center text-xs text-muted-foreground">
                El QR vence según la configuración del local. Si ya expiró, pide
                uno nuevo en caja.
              </p>
            </CardContent>
          </Card>
        )}

        <p className={cn('text-center text-xs text-muted-foreground')}>
          Identidad provisional · Tus datos se usan solo para el programa de puntos.
        </p>
      </div>
    </div>
  );
}
