import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import {
  CalendarClock,
  Copy,
  Download,
  ListOrdered,
  Minus,
  Plus,
  PlusCircle,
  Printer,
  QrCode,
  ReceiptText,
  ScanLine,
  Search,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLoyaltyProgram, useProducts } from '@/features/loyalty/hooks';
import {
  useBusinessPurchases,
  useCreatePurchaseQr,
  type PurchaseItemInput,
} from '@/features/purchases/hooks';
import { claimUrl } from '@/lib/config';
import { errorMessage } from '@/lib/errors';
import { useFormDraft } from '@/lib/useFormDraft';
import {
  formatCOP,
  formatCopInput,
  formatDateTimeBogota,
  formatPoints,
  parseCopInput,
} from '@/lib/format';
import type { Business, Product, PurchaseQrCreateResult } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { Field } from '@/components/shared/Field';
import { PurchaseStatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState, ListSkeleton } from '@/components/shared/States';
import { BusinessGate } from './BusinessGate';

const RECENT_PAGE_SIZE = 5;

type ComposerMode = 'manual' | 'catalog';

interface PurchaseDraft {
  mode: ComposerMode;
  amountText: string;
  quantities: Record<string, number>;
}

const EMPTY_DRAFT: PurchaseDraft = {
  mode: 'manual',
  amountText: '',
  quantities: {},
};

export function PurchaseRegistrationPage() {
  return (
    <BusinessGate
      title="Registrar compra"
      description="Genera un QR con el valor de la venta para que el cliente sume sus loopoints."
      icon={QrCode}
      emptyDescription="Registra un negocio para generar ventas con QR."
    >
      {(business) => <PurchaseQrSection key={business.id} business={business} />}
    </BusinessGate>
  );
}

function PurchaseQrSection({ business }: { business: Business }) {
  const program = useLoyaltyProgram(business.id);
  const products = useProducts(business.id, true);
  const createPurchase = useCreatePurchaseQr(business.id);
  const recent = useBusinessPurchases(business.id, 0, RECENT_PAGE_SIZE, '');

  const draft = useFormDraft<PurchaseDraft>({
    key: `admin:purchase:${business.id}`,
    storage: 'session',
    version: 2,
  });
  const initial = draft.read() ?? EMPTY_DRAFT;
  const [mode, setMode] = useState<ComposerMode>(initial.mode);
  const [amountText, setAmountText] = useState(initial.amountText);
  const [quantities, setQuantities] = useState<Record<string, number>>(
    initial.quantities,
  );
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseQrCreateResult | null>(null);
  const qrRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (
      amountText.trim() ||
      Object.keys(quantities).length > 0 ||
      mode !== 'manual'
    ) {
      draft.save({ mode, amountText, quantities });
    } else {
      draft.clear();
    }
  }, [amountText, draft.clear, draft.save, mode, quantities]);

  const amount = parseCopInput(amountText);
  const copPerPoint = program.data?.cop_per_point_unit ?? 0;

  const catalog = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = products.data ?? [];
    if (!term) return rows;
    return rows.filter((product) =>
      `${product.name} ${product.description ?? ''}`
        .toLowerCase()
        .includes(term),
    );
  }, [products.data, search]);

  const selectedProducts = useMemo(
    () =>
      (products.data ?? [])
        .filter((product) => (quantities[product.id] ?? 0) > 0)
        .map((product) => ({
          product,
          quantity: quantities[product.id] ?? 0,
          lineTotal: product.price_cop * (quantities[product.id] ?? 0),
        })),
    [products.data, quantities],
  );

  const catalogTotal = selectedProducts.reduce(
    (sum, item) => sum + item.lineTotal,
    0,
  );

  const effectiveAmount = mode === 'catalog' ? catalogTotal : amount;
  const preview = useMemo(() => {
    if (!effectiveAmount || effectiveAmount <= 0 || copPerPoint <= 0) return null;
    return Math.min(Math.floor(effectiveAmount / copPerPoint), 1_000_000);
  }, [copPerPoint, effectiveAmount]);

  const programActive = program.data?.is_active === true;

  function changeMode(next: string) {
    const nextMode = next as ComposerMode;
    if (nextMode === 'manual' && selectedProducts.length > 0) {
      setAmountText(formatCopInput(String(catalogTotal)));
      setQuantities({});
      toast.info('Pasaste a valor manual: se descartaron los productos elegidos.');
    }
    setMode(nextMode);
    setError(null);
  }

  function setQuantity(productId: string, quantity: number) {
    setQuantities((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[productId];
      else next[productId] = Math.min(quantity, 99);
      return next;
    });
    setError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!programActive) {
      setError('Activa el programa de loopoints antes de generar ventas.');
      return;
    }
    if (mode === 'catalog') {
      if (selectedProducts.length === 0) {
        setError('Elige al menos un producto de la carta.');
        return;
      }
      if (catalogTotal <= 0) {
        setError('El total de la venta debe ser mayor que cero.');
        return;
      }
    } else if (!amount || amount <= 0) {
      setError('Introduce un importe mayor que cero.');
      return;
    }

    const items: PurchaseItemInput[] =
      mode === 'catalog'
        ? selectedProducts.map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
          }))
        : [];

    createPurchase.mutate(
      { amountCop: effectiveAmount ?? 0, items },
      {
        onSuccess: (data) => {
          setResult(data);
          setAmountText('');
          setQuantities({});
          draft.clear();
          toast.success(
            'QR generado. Muéstralo al cliente para que sume sus loopoints.',
          );
        },
        onError: (mutationError) => setError(errorMessage(mutationError)),
      },
    );
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
        description="Elige el valor manual o los productos de la carta. El cliente confirma desde su teléfono y recibe los loopoints."
      />

      {!programActive && (
        <Alert variant="warning">
          <AlertTitle>El programa de loopoints está inactivo</AlertTitle>
          <AlertDescription>
            Actívalo en Configuración → Programa antes de generar ventas con QR.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ReceiptText className="size-4 text-muted-foreground" aria-hidden="true" />
              Nueva venta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={changeMode}>
              <TabsList>
                <TabsTrigger value="manual">Valor manual</TabsTrigger>
                <TabsTrigger value="catalog">
                  <ListOrdered className="mr-1.5 size-4" aria-hidden="true" />
                  Elegir de la carta
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
                <TabsContent value="manual" className="mt-0 space-y-4">
                  <Field
                    id="purchase-amount"
                    label="Importe de la compra (COP)"
                    hint={
                      amount !== null && amount > 0
                        ? formatCOP(amount)
                        : 'Total pagado por el cliente.'
                    }
                    help="Escribe el valor total de la venta. El cliente verá los loopoints estimados antes de confirmar."
                  >
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
                  </Field>
                </TabsContent>

                <TabsContent value="catalog" className="mt-0 space-y-3">
                  {products.isLoading ? (
                    <ListSkeleton rows={3} />
                  ) : (products.data ?? []).length === 0 ? (
                    <EmptyState
                      title="La carta está vacía"
                      description="Añade productos o combos en Configuración → Carta para vender con detalle."
                      icon={ListOrdered}
                      className="border-0 bg-transparent py-6"
                      action={
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/admin/config?tab=carta">Ir a la carta</Link>
                        </Button>
                      }
                    />
                  ) : (
                    <>
                      <div className="relative">
                        <Search
                          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                          aria-hidden="true"
                        />
                        <Input
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Buscar producto o combo"
                          className="pl-9"
                          aria-label="Buscar en la carta"
                        />
                      </div>

                      <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {catalog.map((product) => (
                          <ProductPickerRow
                            key={product.id}
                            product={product}
                            quantity={quantities[product.id] ?? 0}
                            onQuantity={(quantity) => setQuantity(product.id, quantity)}
                          />
                        ))}
                      </ul>

                      {selectedProducts.length > 0 && (
                        <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
                          {selectedProducts.map((item) => (
                            <div
                              key={item.product.id}
                              className="flex items-baseline justify-between gap-2 text-sm"
                            >
                              <span className="min-w-0 truncate">
                                {item.quantity} × {item.product.name}
                              </span>
                              <span className="shrink-0 font-semibold tabular-nums">
                                {formatCOP(item.lineTotal)}
                              </span>
                            </div>
                          ))}
                          <div className="flex items-baseline justify-between gap-2 border-t pt-2 text-sm font-bold">
                            <span>Total</span>
                            <span data-testid="catalog-total">
                              {formatCOP(catalogTotal)}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                {preview !== null && (
                  <div className="flex items-center justify-between rounded-lg bg-secondary/60 p-4">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Sparkles className="size-4 text-primary" aria-hidden="true" />
                      Loopoints para el cliente
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
            </Tabs>
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

                {result.items && result.items.length > 0 && (
                  <ul className="space-y-1 rounded-lg bg-muted/40 p-3 text-xs">
                    {result.items.map((item) => (
                      <li
                        key={`${item.name}-${item.quantity}`}
                        className="flex justify-between gap-2"
                      >
                        <span className="min-w-0 truncate">
                          {item.quantity} × {item.name}
                          {item.is_combo && item.combo_detail.length > 0
                            ? ` (${item.combo_detail
                                .map((component) => `${component.quantity} ${component.name}`)
                                .join(', ')})`
                            : ''}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {formatCOP(item.line_total_cop)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

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
                  <p className="text-sm font-semibold">Escanéalo para sumar loopoints</p>
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
                      Introduce el valor de la venta o elige productos de la carta
                      y genera el QR. El cliente lo escanea, confirma la compra y
                      recibe los loopoints.
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
                  <div className="min-w-0">
                    <p className="font-semibold">{formatCOP(purchase.amount_cop)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDateTimeBogota(purchase.created_at)} ·{' '}
                      {purchase.customer_name ?? 'Sin reclamar'}
                      {purchase.items_count
                        ? ` · ${purchase.items_count} ítem(s)`
                        : ''}
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

function ProductPickerRow({
  product,
  quantity,
  onQuantity,
}: {
  product: Product;
  quantity: number;
  onQuantity: (quantity: number) => void;
}) {
  return (
    <li className="rounded-xl border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold">
            <span className="truncate">{product.name}</span>
            {product.kind === 'combo' && <Badge variant="secondary">Combo</Badge>}
          </p>
          {product.kind === 'combo' && product.combo_items.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {product.combo_items
                .map((item) => `${item.quantity} × ${item.name}`)
                .join(' · ')}
            </p>
          )}
          {product.description && (
            <p className="truncate text-xs text-muted-foreground">
              {product.description}
            </p>
          )}
          <p className="mt-1 text-sm font-semibold tabular-nums">
            {formatCOP(product.price_cop)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Quitar ${product.name}`}
            disabled={quantity === 0}
            onClick={() => onQuantity(quantity - 1)}
          >
            <Minus aria-hidden="true" />
          </Button>
          <span
            className="w-6 text-center text-sm font-bold tabular-nums"
            aria-label={`Cantidad de ${product.name}`}
          >
            {quantity}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Añadir ${product.name}`}
            onClick={() => onQuantity(quantity + 1)}
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
      </div>
    </li>
  );
}
