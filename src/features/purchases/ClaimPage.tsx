import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CircleAlert,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Brand } from "@/components/shared/Brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FullPageLoader } from "@/components/shared/States";
import { useAuth } from "@/features/auth/AuthProvider";
import { persistBusinessSelection } from "@/features/loyalty/businessContext";
import { useClaimPurchase, usePurchaseQrPreview } from "./hooks";
import { errorMessage } from "@/lib/errors";
import { formatCOP, formatNumber, formatPoints } from "@/lib/format";
import { clearPendingClaim, rememberPendingClaim } from "@/lib/pendingClaim";
import { cn } from "@/lib/utils";
import type { ClaimResult } from "@/types";

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,100}$/;

export function ClaimPage() {
  const { token = "" } = useParams();
  const { session, user, loading, signInWithGoogle } = useAuth();
  const preview = usePurchaseQrPreview(token);
  const claim = useClaimPurchase();
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const tokenLooksValid = TOKEN_PATTERN.test(token);
  const claimPath = `/claim/${token}`;
  const loginNext = encodeURIComponent(claimPath);

  // Solo recordamos el QR mientras esté pendiente y el usuario aún no haya iniciado sesión.
  // Si el QR es inválido, falló la consulta, ya no está pendiente o ya hay sesión, se limpia.
  useEffect(() => {
    if (!tokenLooksValid || preview.isError || Boolean(session)) {
      clearPendingClaim();
      return;
    }
    if (!preview.data) return;
    if (preview.data.status === "pending_claim") {
      rememberPendingClaim(token);
    } else {
      clearPendingClaim();
    }
  }, [token, tokenLooksValid, preview.data, preview.isError, session]);

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
        toast.success(`¡Sumaste ${formatPoints(data.points_awarded)}!`);
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
            <span className="mx-auto grid size-14 place-items-center rounded-none border-2 border-[var(--lp-ink)] bg-[var(--lp-danger-bg)] text-[var(--lp-danger-text)] shadow-[var(--lp-shadow-sm)]">
              <CircleAlert className="size-7" aria-hidden="true" />
            </span>
            <h1 className="font-display text-2xl font-extrabold">Enlace de compra inválido</h1>
            <p className="text-sm text-muted-foreground">
              El código del QR no tiene el formato esperado. Pide en caja que generen una venta
              nueva.
            </p>
            <Button asChild>
              <Link to="/customer">Ir a mis monedas</Link>
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
            <span className="mx-auto grid size-14 place-items-center rounded-none border-2 border-[var(--lp-ink)] bg-[var(--lp-danger-bg)] text-[var(--lp-danger-text)] shadow-[var(--lp-shadow-sm)]">
              <CircleAlert className="size-7" aria-hidden="true" />
            </span>
            <h1 className="font-display text-2xl font-extrabold">No pudimos abrir este QR</h1>
            <p className="text-sm text-muted-foreground">
              {preview.isError
                ? errorMessage(preview.error)
                : "El código no existe o el enlace está incompleto."}
            </p>
            <Button asChild variant="outline">
              <Link to="/customer">Ir a mis monedas</Link>
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
          <div className="border-b-[3px] border-[var(--lp-ink)] bg-[var(--lp-surface-elevated-deep)] px-6 py-8 text-center text-[var(--lp-surface-elevated-text)]">
            <span className="mx-auto grid size-14 place-items-center rounded-none border-2 border-[var(--lp-ink)] bg-[var(--lp-gold)] text-[#16262e] shadow-[3px_3px_0_var(--lp-ink)]">
              <BadgeCheck className="size-8" aria-hidden="true" />
            </span>
            <h1 className="mt-3 font-display text-2xl font-extrabold [text-shadow:2px_2px_0_#16262e]">
              ¡Monedas acreditadas!
            </h1>
            <p className="mt-1 text-sm text-[var(--lp-surface-elevated-soft)]">
              Tu compra en {result.business_name} ya está asociada a tu cuenta.
            </p>
          </div>
          <CardContent className="space-y-4 p-4 sm:space-y-5 sm:p-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-none border-2 border-[var(--lp-ink)] bg-[var(--lp-paper-deep)] p-4 text-center">
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Compra
                </p>
                <p className="mt-1 font-display text-xl font-extrabold">
                  {formatCOP(result.amount_cop)}
                </p>
              </div>
              <div className="rounded-none border-2 border-[var(--lp-ink)] bg-[var(--lp-tip-bg)] p-4 text-center">
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Monedas sumadas
                </p>
                <p className="mt-1 font-display text-xl font-extrabold text-[var(--lp-accent-link)]">
                  +{formatPoints(result.points_awarded)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-none border-2 border-[var(--lp-ink)] bg-card p-4 shadow-[3px_3px_0_var(--lp-ink)]">
              <span className="text-sm text-muted-foreground">Nuevo saldo</span>
              <span className="font-display text-xl font-extrabold">
                {formatPoints(result.balance)}
              </span>
            </div>
            <Button asChild size="lg" className="w-full">
              <Link to={`/customer/business/${result.business_id}`}>
                Ir a mis monedas
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </ClaimLayout>
    );
  }

  if (data.status !== "pending_claim") {
    const messages = {
      claimed: "Este QR ya fue reclamado. Si eras tú, entra a tu cuenta para ver las monedas.",
      expired: "Este QR venció. Pide en caja que generen una venta nueva para sumar las monedas.",
      cancelled: "Esta venta fue cancelada, así que sus monedas ya no están disponibles.",
    } as const;
    return (
      <ClaimLayout>
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-none border-2 border-[var(--lp-ink)] bg-[var(--lp-paper-deep)] text-foreground shadow-[var(--lp-shadow-sm)]">
              <QrCode className="size-7" aria-hidden="true" />
            </span>
            <h1 className="font-display text-2xl font-extrabold">
              {data.status === "claimed" ? "QR ya reclamado" : "QR no disponible"}
            </h1>
            <p className="text-sm text-muted-foreground">{messages[data.status]}</p>
            <Button asChild className="w-full">
              <Link
                to={session ? `/customer/business/${data.business_id}` : `/login?next=${loginNext}`}
              >
                {session ? "Ir a mis monedas" : "Entrar a mi cuenta"}
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
        <CardContent className="space-y-4 p-4 sm:space-y-5 sm:p-6">
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-none border-2 border-[var(--lp-ink)] bg-[var(--lp-gold)] text-[#16262e] shadow-[3px_3px_0_var(--lp-ink)]">
              <Building2 className="size-7" aria-hidden="true" />
            </span>
            <p className="mt-3 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Compra en
            </p>
            <h1 className="font-display text-2xl font-extrabold">{data.business_name}</h1>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-none border-2 border-[var(--lp-ink)] bg-[var(--lp-paper-deep)] p-4 text-center">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Importe
              </p>
              <p className="mt-1 font-display text-xl font-extrabold">
                {formatCOP(data.amount_cop)}
              </p>
            </div>
            <div className="rounded-none border-2 border-[var(--lp-ink)] bg-[var(--lp-tip-bg)] p-4 text-center">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Monedas
              </p>
              <p className="mt-1 font-display text-xl font-extrabold text-[var(--lp-accent-link)]">
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
                  Si aún no tienes cuenta, créala con Google o con tu correo en segundos.
                  Conservaremos este QR hasta que confirmes.
                </AlertDescription>
              </Alert>

              <Button size="lg" className="w-full" onClick={handleGoogle} loading={signingIn}>
                <UserPlus aria-hidden="true" />
                Continuar con Google
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to={`/login?next=${loginNext}&mode=register`}>Crear cuenta con correo</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to={`/login?next=${loginNext}`}>Ya tengo cuenta</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-none border border-dashed bg-muted/40 p-4 text-sm">
                <p className="font-semibold">¿Qué pasará al confirmar?</p>
                <ul className="mt-2 space-y-1.5 text-muted-foreground">
                  <li className="flex gap-2">
                    <Sparkles
                      className="mt-0.5 size-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    Las monedas se suman a tu cuenta en {data.business_name}.
                  </li>
                  <li className="flex gap-2">
                    <ShieldCheck
                      className="mt-0.5 size-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    El importe y las monedas los calcula el servidor.
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

              <Button size="lg" className="w-full" onClick={handleClaim} loading={claim.isPending}>
                Confirmar y sumar monedas
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to={`/customer/business/${data.business_id}`}>Ahora no</Link>
              </Button>
            </>
          )}

          <p className="text-center text-xs text-muted-foreground">
            El QR vence el{" "}
            {new Date(data.expires_at).toLocaleString("es-CO", {
              timeZone: "America/Bogota",
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
    <div className="hero-glow min-h-screen px-0 py-5 sm:px-4 sm:py-12">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 sm:gap-6">
        <div className="flex justify-center px-4 sm:px-0">
          <Brand />
        </div>
        {children}
        <p className={cn("px-4 text-center text-xs text-muted-foreground sm:px-0")}>
          Tus datos se usan solo para el programa de monedas del negocio.
        </p>
      </div>
    </div>
  );
}
