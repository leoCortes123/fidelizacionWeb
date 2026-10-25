import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import {
  CalendarClock,
  Copy,
  Download,
  PlusCircle,
  Printer,
  QrCode,
  ReceiptText,
  ScanLine,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLoyaltyProgram } from '@/features/loyalty/hooks';
import {
  useBusinessPurchases,
  useCreatePurchaseQr,
} from '@/features/purchases/hooks';
import { claimUrl } from '@/lib/config';
import { errorMessage } from '@/lib/errors';
import {
  formatCOP,
  formatCopInput,
  formatDateTimeBogota,
  formatPoints,
  parseCopInput,
} from '@/lib/format';
import type { Business, PurchaseQrCreateResult } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/shared/PageHeader';
import { PurchaseStatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState, ListSkeleton } from '@/components/shared/States';
import { BusinessGate } from './BusinessGate';

const RECENT_PAGE_SIZE = 5;

export function PurchaseRegistrationPage() {
  return (
    <BusinessGate
      title="Registrar compra"
      description="Genera un QR con el valor de la venta para que el cliente sume sus puntos."
      icon={QrCode}
      emptyDescription="Registra un negocio para generar ventas con QR."
    >
      {(business) => <PurchaseQrSection key={business.id} business={business} />}
    </BusinessGate>
  );
}

function PurchaseQrSection({ business }: { business: Business }) {
  const program = useLoyaltyProgram(business.id);
  const createPurchase = useCreatePurchaseQr(business.id);
  const recent = useBusinessPurchases(business.id, 0, RECENT_PAGE_SIZE, '');

  const [amountText, setAmountText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseQrCreateResult | null>(null);
  const qrRef = useRef<HTMLCanvasElement | null>(null);

  const amount = parseCopInput(amountText);
  const copPerPoint = program.data?.cop_per_point_unit ?? 0;
  const preview = useMemo(() => {
    if (!amount || amount <= 0 || copPerPoint <= 0) return null;
    return Math.min(Math.floor(amount / copPerPoint), 1_000_000);
  }, [amount, copPerPoint]);

  const programActive = program.data?.is_active === true;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!programActive) {
      setError('Activa el programa de puntos antes de generar ventas.');
      return;
    }
    if (!amount || amount <= 0) {
      setError('Introduce un importe mayor que cero.');
      return;
    }
    createPurchase.mutate(amount, {
      onSuccess: (data) => {
        setResult(data);
        setAmountText('');
        toast.success('QR generado. Muéstralo al cliente para que sume sus puntos.');
      },
      onError: (mutationError) => setError(errorMessage(mutationError)),
    });
  }

  function handleNewPurchase() {
    setResult(null);
    setError(null);
  }

  async function copyClaimUrl() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(claimUrl(result.token));
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar el enlace.');
    }
  }

  function downloadQr() {
    if (!qrRef.current || !result) return;
    const link = document.createElement('a');
    link.download = `qr-compra-${result.purchase_id.slice(0, 8)}.png`;
    link.href = qrRef.current.toDataURL('image/png');
    link.click();
  }

  if (program.isLoading) {
    return <ListSkeleton rows={3} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Registrar compra — ${business.name}`}
        description="Introduce el valor de la venta y muestra el QR al cliente. Los puntos se acreditan cuando el cliente confirma desde su teléfono."
      />

      {!programActive && (
        <Alert variant="warning">
          <AlertTitle>El programa de puntos está inactivo</AlertTitle>
          <AlertDescription>
            Actívalo en Configuración → Programa antes de generar ventas con QR.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="size-4 text-muted-foreground" aria-hidden="true" />
              Valor de la venta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="purchase-amount">Importe de la compra (COP)</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="purchase-amount"
                    name="purchase-amount"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="15.500"
                    className="h-14 pl-7 text-xl font-bold"
                    value={amountText}
                    onChange={(event) => {
                      setAmountText(formatCopInput(event.target.value));
                      setError(null);
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {amount !== null && amount > 0
                    ? formatCOP(amount)
                    : 'Total pagado por el cliente.'}
                </p>
              </div>

              {preview !== null && (
                <div className="flex items-center justify-between rounded-lg bg-secondary/60 p-4">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="size-4 text-primary" aria-hidden="true" />
                    Puntos para el cliente
                  </span>
                  <span className="font-display text-2xl font-extrabold text-primary">
                    +{formatPoints(preview)}
                  </span>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>No se pudo generar el QR</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={createPurchase.isPending}
                disabled={!programActive}
              >
                <QrCode aria-hidden="true" />
                Generar QR de la venta
              </Button>

              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <ScanLine className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                El cliente escanea el QR con la cámara de su teléfono. El código
                vence en {program.data?.qr_expiry_hours ?? 24} horas y solo puede
                reclamarse una vez.
              </p>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">QR para el cliente</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="print-area space-y-4 rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl font-extrabold">
                      {formatCOP(result.amount_cop)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTimeBogota(result.expires_at)} · vence en{' '}
                      {program.data?.qr_expiry_hours ?? 24} h
                    </p>
                  </div>
                  <PurchaseStatusBadge status="pending_claim" />
                </div>

                <div className="flex justify-center rounded-xl bg-muted/40 p-4">
                  <QRCodeCanvas
                    ref={qrRef}
                    value={claimUrl(result.token)}
                    size={216}
                    marginSize={2}
                    level="M"
                    aria-label="Código QR para reclamar la compra"
                  />
                </div>

                <div className="text-center">
                  <p className="text-sm font-semibold">Escanéalo para sumar puntos</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPoints(result.points_preview)} estimados
                  </p>
                </div>

                <span className="sr-only" data-testid="claim-url">
                  {claimUrl(result.token)}
                </span>

                <div className="grid grid-cols-2 gap-2 no-print">
                  <Button type="button" variant="outline" onClick={downloadQr}>
                    <Download aria-hidden="true" />
                    Descargar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => window.print()}>
                    <Printer aria-hidden="true" />
                    Imprimir
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 no-print">
                  <Button type="button" variant="ghost" onClick={copyClaimUrl}>
                    <Copy aria-hidden="true" />
                    Copiar enlace
                  </Button>
                  <Button type="button" onClick={handleNewPurchase}>
                    <PlusCircle aria-hidden="true" />
                    Nueva venta
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid min-h-[22rem] place-items-center rounded-xl border border-dashed bg-muted/20 p-6 text-center">
                <div className="space-y-3">
                  <span className="mx-auto grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
                    <QrCode className="size-6" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-semibold">El QR aparecerá aquí</p>
                    <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                      Introduce el valor de la venta y genera el QR. El cliente lo
                      escanea, confirma la compra y recibe los puntos en su cuenta.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Últimas ventas</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/purchases">Ver todas</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.isLoading ? (
            <ListSkeleton rows={3} />
          ) : !recent.data || recent.data.length === 0 ? (
            <EmptyState
              title="Todavía no hay ventas"
              description="La primera venta que generes aparecerá en esta lista."
              icon={CalendarClock}
              className="border-0 bg-transparent py-8"
            />
          ) : (
            <ul className="divide-y">
              {recent.data.map((purchase) => (
                <li
                  key={purchase.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-semibold">{formatCOP(purchase.amount_cop)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTimeBogota(purchase.created_at)} ·{' '}
                      {purchase.customer_name ?? 'Sin reclamar'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {purchase.points_awarded > 0
                        ? formatPoints(purchase.points_awarded)
                        : ''}
                    </span>
                    <PurchaseStatusBadge status={purchase.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
