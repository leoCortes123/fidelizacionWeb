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
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminPurchases, useCreatePurchase } from './hooks';
import { useProgramSettings } from '@/features/points/hooks';
import { claimUrl } from '@/lib/config';
import { errorMessage } from '@/lib/errors';
import {
  formatCOP,
  formatCopInput,
  formatDateTimeBogota,
  formatPoints,
  parseCopInput,
  pointsPreview,
} from '@/lib/format';
import type { CreatePurchaseResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PageHeader } from '@/components/shared/PageHeader';
import { PurchaseStatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState, ListSkeleton } from '@/components/shared/States';

export function QrPage() {
  const settings = useProgramSettings();
  const createPurchase = useCreatePurchase();
  const recent = useAdminPurchases(0, 8, '');
  const [amountText, setAmountText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatePurchaseResult | null>(null);
  const qrRef = useRef<HTMLCanvasElement | null>(null);

  const amount = parseCopInput(amountText);
  const minAmount = settings.data?.min_purchase_amount ?? 0;
  const preview = useMemo(() => {
    if (!settings.data || amount === null) return 0;
    return pointsPreview(
      amount,
      settings.data.cop_per_point_unit,
      settings.data.max_points_per_purchase,
    );
  }, [amount, settings.data]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!amount || amount <= 0) {
      setError('Introduce un importe mayor que cero.');
      return;
    }
    if (amount < minAmount) {
      setError(`La compra mínima configurada es ${formatCOP(minAmount)}.`);
      return;
    }
    createPurchase.mutate(amount, {
      onSuccess: (data) => {
        setResult(data);
        setAmountText('');
        toast.success('QR generado. El cliente puede escanearlo.');
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Generar QR"
        description="Ingresa el valor de la compra y muestra el QR al cliente para que sume sus puntos."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="size-4 text-muted-foreground" aria-hidden="true" />
              Valor de la compra
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Importe en pesos colombianos</Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="amount"
                    name="amount"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="15.500"
                    className="h-14 pl-7 text-xl font-bold"
                    value={amountText}
                    onChange={(event) => {
                      setAmountText(formatCopInput(event.target.value));
                      setError(null);
                    }}
                    aria-describedby="amount-help"
                  />
                </div>
                <p id="amount-help" className="text-xs text-muted-foreground">
                  Compra mínima: {formatCOP(minAmount)} · Regla actual:{' '}
                  {settings.data
                    ? `1 punto por cada ${formatCOP(settings.data.cop_per_point_unit)}`
                    : 'cargando…'}
                </p>
              </div>

              {amount !== null && amount > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-secondary/60 p-4">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="size-4 text-primary" aria-hidden="true" />
                    Puntos para el cliente
                  </span>
                  <span className="font-display text-2xl font-extrabold text-primary">
                    +{preview}
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
                disabled={settings.isLoading}
              >
                <QrCode aria-hidden="true" />
                Generar QR
              </Button>

              <p className="text-xs text-muted-foreground">
                El QR vence en {settings.data?.qr_expiry_hours ?? 24} horas y solo
                puede reclamarse una vez. No incluye el importe ni los puntos.
              </p>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">QR de reclamación</CardTitle>
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
                      {settings.data?.qr_expiry_hours ?? 24} h
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
                    +{result.points_preview} puntos estimados
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
                    Nuevo QR
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
                      Ingresa el valor y genera el QR. El cliente lo escanea con la
                      cámara de su teléfono.
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
          <CardTitle className="text-base">Últimas compras</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/purchases">Ver todas</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.isLoading ? (
            <ListSkeleton rows={3} />
          ) : !recent.data || recent.data.length === 0 ? (
            <EmptyState
              title="Todavía no hay compras"
              description="La primera compra que generes aparecerá en esta lista."
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
