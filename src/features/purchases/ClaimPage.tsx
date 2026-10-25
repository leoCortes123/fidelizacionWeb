import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CircleAlert,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Brand } from '@/components/shared/Brand';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FullPageLoader } from '@/components/shared/States';
import { useAuth } from '@/features/auth/AuthProvider';
import { persistBusinessSelection } from '@/features/loyalty/businessContext';
import { useClaimPurchase, usePurchaseQrPreview } from './hooks';
import { errorMessage } from '@/lib/errors';
import { formatCOP, formatNumber, formatPoints } from '@/lib/format';
import { clearPendingClaim, rememberPendingClaim } from '@/lib/pendingClaim';
import { cn } from '@/lib/utils';
import type { ClaimResult } from '@/types';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,100}$/;

export function ClaimPage() {
  const { token = '' } = useParams();
  const { session, user, loading, signInWithGoogle } = useAuth();
  const preview = usePurchaseQrPreview(token);
  const claim = useClaimPurchase();
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const tokenLooksValid = TOKEN_PATTERN.test(token);
  const claimPath = `/claim/${token}`;
  const loginNext = encodeURIComponent(claimPath);

  // Respaldo para volver al QR tras crear la cuenta o confirmar el correo.
  useEffect(() => {
    if (tokenLooksValid) rememberPendingClaim(token);
  }, [token, tokenLooksValid]);

  useEffect(() => {
    if (preview.data && preview.data.status !== 'pending_claim') {
      clearPendingClaim();
    }
  }, [preview.data]);

  async function handleGoogle() {
    setSigningIn(true);
    try {
      await signInWithGoogle(claimPath);
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
        clearPendingClaim();
        persistBusinessSelection(user?.id, data.business_id);
        toast.success(`¡Sumaste ${formatPoints(data.points_awarded)} puntos!`);
      },
      onError: (claimError) => {
        setError(errorMessage(claimError));
        void preview.refetch();
      },
    });
  }

  if (loading) return <FullPageLoader label="Verificando tu sesión…" />;

  if (!tokenLooksValid) {
    return (
      <ClaimLayout>
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
              <CircleAlert className="size-7" aria-hidden="true" />
            </span>
            <h1 className="font-display text-2xl font-extrabold">
              Enlace de compra inválido
            </h1>
            <p className="text-sm text-muted-foreground">
              El código del QR no tiene el formato esperado. Pide en caja que
              generen una venta nueva.
            </p>
            <Button asChild>
              <Link to="/customer">Ir a mis puntos</Link>
            </Button>
          </CardContent>
        </Card>
      </ClaimLayout>
    );
  }

  if (preview.isLoading) {
    return <FullPageLoader label="Cargando la compra…" />;
  }

  if (preview.isError || !preview.data) {
    return (
      <ClaimLayout>
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
              <CircleAlert className="size-7" aria-hidden="true" />
            </span>
            <h1 className="font-display text-2xl font-extrabold">
              No pudimos abrir este QR
            </h1>
            <p className="text-sm text-muted-foreground">
              {preview.isError
                ? errorMessage(preview.error)
                : 'El código no existe o el enlace está incompleto.'}
            </p>
            <Button asChild variant="outline">
              <Link to="/customer">Ir a mis puntos</Link>
            </Button>
          </CardContent>
        </Card>
      </ClaimLayout>
    );
  }

  const data = preview.data;

  if (result) {
    return (
      <ClaimLayout>
        <Card className="overflow-hidden">
          <div className="bg-primary px-6 py-8 text-center text-primary-foreground">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary-foreground/15">
              <BadgeCheck className="size-8" aria-hidden="true" />
            </span>
            <h1 className="mt-3 font-display text-2xl font-extrabold">
              ¡Puntos acreditados!
            </h1>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Tu compra en {result.business_name} ya está asociada a tu cuenta.
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
                  +{formatPoints(result.points_awarded)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-card p-4">
              <span className="text-sm text-muted-foreground">Nuevo saldo</span>
              <span className="font-display text-xl font-extrabold">
                {formatPoints(result.balance)}
              </span>
            </div>
            <Button asChild size="lg" className="w-full">
              <Link to="/customer/balance">
                Ir a mis puntos
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </ClaimLayout>
    );
  }

  if (data.status !== 'pending_claim') {
    const messages = {
      claimed:
        'Este QR ya fue reclamado. Si eras tú, entra a tu cuenta para ver los puntos.',
      expired:
        'Este QR venció. Pide en caja que generen una venta nueva para sumar los puntos.',
      cancelled: 'Esta venta fue cancelada, así que sus puntos ya no están disponibles.',
    } as const;
    return (
      <ClaimLayout>
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
              <QrCode className="size-7" aria-hidden="true" />
            </span>
            <h1 className="font-display text-2xl font-extrabold">
              {data.status === 'claimed' ? 'QR ya reclamado' : 'QR no disponible'}
            </h1>
            <p className="text-sm text-muted-foreground">{messages[data.status]}</p>
            <Button asChild className="w-full">
              <Link to={session ? '/customer/balance' : `/login?next=${loginNext}`}>
                {session ? 'Ir a mis puntos' : 'Entrar a mi cuenta'}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Volver al inicio</Link>
            </Button>
          </CardContent>
        </Card>
      </ClaimLayout>
    );
  }

  return (
    <ClaimLayout>
      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-secondary text-secondary-foreground">
              <Building2 className="size-7" aria-hidden="true" />
            </span>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Compra en
            </p>
            <h1 className="font-display text-2xl font-extrabold">{data.business_name}</h1>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Importe
              </p>
              <p className="mt-1 font-display text-xl font-extrabold">
                {formatCOP(data.amount_cop)}
              </p>
            </div>
            <div className="rounded-xl bg-secondary p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground/70">
                Puntos
              </p>
              <p className="mt-1 font-display text-xl font-extrabold text-primary">
                +{formatNumber(data.points_preview)}
              </p>
            </div>
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
                <AlertTitle>Confirma la compra con tu cuenta</AlertTitle>
                <AlertDescription>
                  Si aún no tienes cuenta, créala con Google o con tu correo en
                  segundos. Conservaremos este QR hasta que confirmes.
                </AlertDescription>
              </Alert>

              <Button
                size="lg"
                className="w-full"
                onClick={handleGoogle}
                loading={signingIn}
              >
                <UserPlus aria-hidden="true" />
                Continuar con Google
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to={`/login?next=${loginNext}&mode=register`}>
                  Crear cuenta con correo
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to={`/login?next=${loginNext}`}>Ya tengo cuenta</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-dashed bg-muted/40 p-4 text-sm">
                <p className="font-semibold">¿Qué pasará al confirmar?</p>
                <ul className="mt-2 space-y-1.5 text-muted-foreground">
                  <li className="flex gap-2">
                    <Sparkles
                      className="mt-0.5 size-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    Los puntos se suman a tu cuenta en {data.business_name}.
                  </li>
                  <li className="flex gap-2">
                    <ShieldCheck
                      className="mt-0.5 size-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    El importe y los puntos los calcula el servidor.
                  </li>
                  <li className="flex gap-2">
                    <BadgeCheck
                      className="mt-0.5 size-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    Este QR solo se puede reclamar una vez.
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
                <Link to="/customer/balance">Ahora no</Link>
              </Button>
            </>
          )}

          <p className="text-center text-xs text-muted-foreground">
            El QR vence el{' '}
            {new Date(data.expires_at).toLocaleString('es-CO', {
              timeZone: 'America/Bogota',
            })}
            . Si ya expiró, pide uno nuevo en caja.
          </p>
        </CardContent>
      </Card>
    </ClaimLayout>
  );
}

function ClaimLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="hero-glow min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <div className="flex justify-center">
          <Brand />
        </div>
        {children}
        <p className={cn('text-center text-xs text-muted-foreground')}>
          Tus datos se usan solo para el programa de puntos del negocio.
        </p>
      </div>
    </div>
  );
}
