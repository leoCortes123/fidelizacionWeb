import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Gift,
  PackageCheck,
  QrCode,
  ReceiptText,
  RefreshCw,
  TicketCheck,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useRedeemRedemptionByToken,
  useRedemptionScanContext,
} from '@/features/loyalty/hooks';
import { useCountdown } from '@/features/loyalty/useCountdown';
import { usePortalTheme } from '@/components/theme/ThemeProvider';
import { Brand } from '@/components/shared/Brand';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingScreen } from '@/components/shared/States';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { errorMessage } from '@/lib/errors';
import { formatDateTimeBogota, formatPoints } from '@/lib/format';
import type { RedemptionRedeemResult, RedemptionScanContext } from '@/types';

/**
 * Pantalla que abre el QR de canje (`/scan/:token`). El negocio y los permisos
 * los resuelve el servidor a partir del token: la URL no lleva `business_id`.
 */
export function ScanRedemptionPage() {
  usePortalTheme('admin');
  const { token = '' } = useParams<{ token: string }>();
  const context = useRedemptionScanContext(token);
  const [result, setResult] = useState<RedemptionRedeemResult | null>(null);

  let content: React.ReactNode;

  if (result) {
    content = <ScanSuccess result={result} />;
  } else if (context.isLoading) {
    content = <LoadingScreen label="Validando el código QR…" />;
  } else if (context.isError || !context.data) {
    content = (
      <ManualTokenCard
        title="No pudimos validar este QR"
        description={errorMessage(context.error)}
        onRetry={() => void context.refetch()}
      />
    );
  } else {
    content = (
      <ScanDetails
        key={token}
        token={token}
        data={context.data}
        onRedeemed={setResult}
        onRefresh={() => void context.refetch()}
      />
    );
  }

  return (
    <ScanLayout>
      {content}
    </ScanLayout>
  );
}

function ScanDetails({
  token,
  data,
  onRedeemed,
  onRefresh,
}: {
  token: string;
  data: RedemptionScanContext;
  onRedeemed: (result: RedemptionRedeemResult) => void;
  onRefresh: () => void;
}) {
  const redeem = useRedeemRedemptionByToken();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const countdown = useCountdown(data.expires_at);
  const expired = countdown.expired;
  const canRedeem = data.can_redeem && !expired && !redeem.isPending;
  const reasonCopy = scanReasonCopy(data.reason, data.status, data.approved_at);

  const businessHome = data.role === 'admin' ? '/admin/dashboard' : '/encargado';

  async function confirmDelivery() {
    try {
      const redeemed = await redeem.mutateAsync({ token });
      setConfirmOpen(false);
      toast.success('Entrega confirmada. Loopoints consumidos.');
      onRedeemed(redeemed);
    } catch (error) {
      setConfirmOpen(false);
      toast.error(errorMessage(error));
      onRefresh();
    }
  }

  return (
    <>
      <div className="space-y-5">
        <PageHeader
          title="Confirmar canje"
          description="Revisa la recompensa y el cliente antes de entregar."
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link to={businessHome}>
                <ArrowLeft aria-hidden="true" />
                Mi panel
              </Link>
            </Button>
          }
        />

        <Card>
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              {data.business_logo_url ? (
                <img
                  src={data.business_logo_url}
                  alt=""
                  className="size-12 rounded-xl border object-cover"
                />
              ) : (
                <span className="grid size-12 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                  <QrCode className="size-6" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Negocio
                </p>
                <p className="truncate font-bold">{data.business_name}</p>
              </div>
              <Badge variant="outline" className="ml-auto shrink-0 font-mono">
                {data.code}
              </Badge>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Gift className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Recompensa
                  </p>
                  <p className="text-lg font-extrabold leading-tight">
                    {data.reward_name}
                  </p>
                  <p className="mt-1 text-sm">
                    <strong className="tabular-nums">
                      {formatPoints(data.points_spent)}
                    </strong>{' '}
                    loopoints
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <User className="size-3.5" aria-hidden="true" />
                  Cliente
                </p>
                <p className="mt-1 font-semibold">
                  {data.customer_nickname
                    ? `@${data.customer_nickname}`
                    : 'Cliente afiliado'}
                </p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden="true" />
                  Vigencia del QR
                </p>
                <p className="mt-1 font-semibold" role="timer" aria-live="polite">
                  {expired ? 'QR vencido' : `Vence en ${countdown.label}`}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDateTimeBogota(data.expires_at)}
                </p>
              </div>
            </div>

            {reasonCopy && (
              <div
                className={
                  reasonCopy.tone === 'warning'
                    ? 'flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950'
                    : 'flex items-start gap-2 rounded-xl border bg-muted/40 p-3 text-sm'
                }
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">{reasonCopy.title}</p>
                  <p className="text-xs">{reasonCopy.description}</p>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              disabled={!canRedeem}
              onClick={() => setConfirmOpen(true)}
            >
              <PackageCheck aria-hidden="true" />
              Confirmar entrega
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Al confirmar se consumen los loopoints y el QR deja de ser válido.
            </p>
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Entregar esta recompensa?</DialogTitle>
            <DialogDescription>
              Entrega <strong>{data.reward_name}</strong> a{' '}
              {data.customer_nickname ? `@${data.customer_nickname}` : 'el cliente'} y
              confirma para consumir {formatPoints(data.points_spent)} loopoints.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={redeem.isPending}
            >
              Volver
            </Button>
            <Button
              onClick={() => void confirmDelivery()}
              loading={redeem.isPending}
            >
              <CheckCircle2 aria-hidden="true" />
              Confirmar entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ScanSuccess({ result }: { result: RedemptionRedeemResult }) {
  const registerPurchasePath =
    result.role === 'admin' ? '/admin/purchases/new' : '/encargado/venta';
  const requestsPath =
    result.role === 'admin' ? '/admin/redemptions' : '/encargado';
  const businessHome = result.role === 'admin' ? '/admin/dashboard' : '/encargado';

  return (
    <Card className="animate-fade-in overflow-hidden">
      <div className="bg-emerald-500/10 px-6 py-8 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500 text-white shadow-lg">
          <CheckCircle2 className="size-9" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold">Entrega confirmada</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          El canje quedó registrado y los loopoints fueron consumidos.
        </p>
      </div>
      <CardContent className="space-y-4 p-6">
        <dl className="space-y-2 rounded-xl border bg-muted/30 p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Recompensa</dt>
            <dd className="text-right font-semibold">{result.reward_name}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Cliente</dt>
            <dd className="text-right font-semibold">
              {result.customer_nickname ? `@${result.customer_nickname}` : 'Cliente'}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Loopoints</dt>
            <dd className="text-right font-semibold tabular-nums">
              −{formatPoints(result.points_spent)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Referencia</dt>
            <dd className="font-mono text-xs">{result.code}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Entregado</dt>
            <dd className="text-right text-xs">
              {formatDateTimeBogota(result.delivered_at)}
            </dd>
          </div>
        </dl>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild>
            <Link to={registerPurchasePath}>
              <ReceiptText aria-hidden="true" />
              Registrar compra
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={requestsPath}>
              <TicketCheck aria-hidden="true" />
              Ver solicitudes
            </Link>
          </Button>
        </div>
        <Button variant="ghost" className="w-full" asChild>
          <Link to={businessHome}>
            <ArrowLeft aria-hidden="true" />
            Volver a mi panel
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function scanReasonCopy(
  reason: string | null,
  status: string,
  approvedAt: string | null,
): { title: string; description: string; tone: 'warning' | 'info' } | null {
  switch (reason) {
    case 'redemption_already_delivered':
      return {
        title: 'Este canje ya fue entregado',
        description: 'El token quedó consumido. No es necesario volver a confirmarlo.',
        tone: 'info',
      };
    case 'redemption_cancelled':
      return {
        title: 'Este canje fue cancelado',
        description: 'Los loopoints reservados fueron devueltos al cliente.',
        tone: 'info',
      };
    case 'redemption_expired':
      return {
        title: 'Este canje expiró',
        description: 'El cliente debe solicitarlo de nuevo si aún tiene saldo.',
        tone: 'warning',
      };
    case 'token_expired':
      return {
        title: 'El QR venció',
        description:
          'Pide al cliente que reemita el código desde “Mis canjes” antes de entregar.',
        tone: 'warning',
      };
    case 'token_already_consumed':
      return {
        title: 'Este QR ya fue utilizado',
        description: 'No puede reutilizarse. Verifica la solicitud en el listado.',
        tone: 'warning',
      };
    case 'redemption_not_pending':
      return {
        title:
          status === 'approved'
            ? 'La solicitud ya está aprobada'
            : 'Solicitud no disponible',
        description:
          status === 'approved'
            ? `Ya fue aprobada${
                approvedAt ? ` el ${formatDateTimeBogota(approvedAt)}` : ''
              }. Confirma la entrega desde Solicitudes.`
            : 'Revisa el estado de la solicitud en el listado del negocio.',
        tone: 'warning',
      };
    default:
      return reason
        ? { title: 'No se puede entregar', description: reason, tone: 'warning' }
        : null;
  }
}

function ManualTokenCard({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry: () => void;
}) {
  const navigate = useNavigate();
  const [manual, setManual] = useState('');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const value = manual.trim();
    if (!value) return;
    navigate(`/scan/${encodeURIComponent(value)}`);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-6" aria-hidden="true" />
            </span>
            <h1 className="mt-3 text-xl font-extrabold">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground" role="alert">
              {description}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={onRetry}>
              <RefreshCw aria-hidden="true" />
              Reintentar
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/">
                <ArrowLeft aria-hidden="true" />
                Ir a mi panel
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-6">
          <p className="text-sm font-semibold">¿Tienes el código manual?</p>
          <form onSubmit={submit} className="space-y-2">
            <Label htmlFor="manual-token" className="sr-only">
              Código manual del canje
            </Label>
            <Input
              id="manual-token"
              value={manual}
              onChange={(event) => setManual(event.target.value)}
              placeholder="Pega el código que muestra el cliente"
              autoComplete="off"
              spellCheck={false}
            />
            <Button type="submit" className="w-full" disabled={!manual.trim()}>
              Validar código
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ScanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Brand compact linkTo="/" />
          <Badge variant="secondary" className="gap-1">
            <QrCode className="size-3.5" aria-hidden="true" />
            Escaneo de canje
          </Badge>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}
