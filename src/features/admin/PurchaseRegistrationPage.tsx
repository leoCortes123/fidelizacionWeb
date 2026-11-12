import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  CalendarClock,
  Copy,
  Download,
  ImageIcon,
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
} from "lucide-react";
import { toast } from "sonner";
import { useLoyaltyProgram, useProducts } from "@/features/loyalty/hooks";
import {
  useBusinessPurchases,
  useCreatePurchaseQr,
  type PurchaseItemInput,
} from "@/features/purchases/hooks";
import { claimUrl } from "@/lib/config";
import { errorMessage } from "@/lib/errors";
import { useFormDraft } from "@/lib/useFormDraft";
import {
  formatCOP,
  formatCopInput,
  formatDateTimeBogota,
  formatPoints,
  parseCopInput,
} from "@/lib/format";
import type { Business, Product, PurchaseQrCreateResult } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { Field } from "@/components/shared/Field";
import { PurchaseStatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/States";
import { BusinessGate } from "./BusinessGate";

const RECENT_PAGE_SIZE = 5;

type ComposerMode = "manual" | "catalog";

interface PurchaseDraft {
  mode: ComposerMode;
  amountText: string;
  quantities: Record<string, number>;
}

const EMPTY_DRAFT: PurchaseDraft = {
  mode: "manual",
  amountText: "",
  quantities: {},
};

export function PurchaseRegistrationPage() {
  return (
    <BusinessGate
      title="Registrar venta"
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
  const recent = useBusinessPurchases(business.id, 0, RECENT_PAGE_SIZE, "");

  const draft = useFormDraft<PurchaseDraft>({
    key: `admin:purchase:${business.id}`,
    storage: "session",
    version: 2,
  });
  const initial = draft.read() ?? EMPTY_DRAFT;
  const [mode, setMode] = useState<ComposerMode>(initial.mode);
  const [amountText, setAmountText] = useState(initial.amountText);
  const [quantities, setQuantities] = useState<Record<string, number>>(initial.quantities);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [draftQuantities, setDraftQuantities] = useState<Record<string, number>>(
    initial.quantities,
  );
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseQrCreateResult | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const qrRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (amountText.trim() || Object.keys(quantities).length > 0) {
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
      `${product.name} ${product.description ?? ""}`.toLowerCase().includes(term),
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

  const catalogTotal = selectedProducts.reduce((sum, item) => sum + item.lineTotal, 0);

  const draftCatalogTotal = useMemo(
    () =>
      (products.data ?? []).reduce((sum, product) => {
        const quantity = draftQuantities[product.id] ?? 0;
        return sum + product.price_cop * quantity;
      }, 0),
    [draftQuantities, products.data],
  );

  const effectiveAmount = mode === "catalog" ? catalogTotal : amount;
  const preview = useMemo(() => {
    if (!effectiveAmount || effectiveAmount <= 0 || copPerPoint <= 0) return null;
    return Math.min(Math.floor(effectiveAmount / copPerPoint), 1_000_000);
  }, [copPerPoint, effectiveAmount]);

  const programActive = program.data?.is_active === true;

  function openCatalogPicker() {
    setDraftQuantities({ ...quantities });
    setSearch("");
    setCatalogOpen(true);
  }

  function changeMode(next: string) {
    const nextMode = next as ComposerMode;
    if (nextMode === "manual" && selectedProducts.length > 0) {
      setAmountText(formatCopInput(String(catalogTotal)));
      setQuantities({});
      toast.info("Pasaste a valor manual: se descartaron los productos elegidos.");
    }
    setMode(nextMode);
    setError(null);
    if (nextMode === "catalog") {
      openCatalogPicker();
    }
  }

  function setDraftQuantity(productId: string, quantity: number) {
    setDraftQuantities((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[productId];
      else next[productId] = Math.min(quantity, 99);
      return next;
    });
  }

  function confirmCatalogSelection() {
    setQuantities(draftQuantities);
    setCatalogOpen(false);
    setError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!programActive) {
      setError("Activa el programa de loopoints antes de generar ventas.");
      return;
    }
    if (mode === "catalog") {
      if (selectedProducts.length === 0) {
        setError("Elige al menos un producto de la carta.");
        return;
      }
      if (catalogTotal <= 0) {
        setError("El total de la venta debe ser mayor que cero.");
        return;
      }
    } else if (!amount || amount <= 0) {
      setError("Introduce un importe mayor que cero.");
      return;
    }

    const items: PurchaseItemInput[] =
      mode === "catalog"
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
          setQrOpen(true);
          setAmountText("");
          setQuantities({});
          draft.clear();
          toast.success("QR generado. Muéstralo al cliente para que sume sus loopoints.");
        },
        onError: (mutationError) => setError(errorMessage(mutationError)),
      },
    );
  }

  function handleNewPurchase() {
    setQrOpen(false);
    setResult(null);
    setError(null);
  }

  async function copyClaimUrl() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(claimUrl(result.token));
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  }

  function downloadQr() {
    if (!qrRef.current || !result) return;
    const link = document.createElement("a");
    link.download = `qr-compra-${result.purchase_id.slice(0, 8)}.png`;
    link.href = qrRef.current.toDataURL("image/png");
    link.click();
  }

  if (program.isLoading) {
    return <ListSkeleton rows={3} />;
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      <PageHeader
        title="Registrar venta"
        description="Elige el valor manual o los productos de la carta. El cliente confirma desde su teléfono y recibe los loopoints."
      />

      {!programActive && (
        <Alert variant="warning">
          <AlertTitle>El programa de loopoints está inactivo</AlertTitle>
          <AlertDescription>
            Actívalo en Mi perfil → Programa antes de generar ventas con QR.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ReceiptText className="size-4 text-muted-foreground" aria-hidden="true" />
            Nueva venta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={changeMode}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual" className="min-w-0 truncate px-2 sm:px-3.5">
                Valor manual
              </TabsTrigger>
              <TabsTrigger
                value="catalog"
                onClick={() => {
                  if (mode === "catalog") openCatalogPicker();
                }}
                className="min-w-0 truncate px-2 sm:px-3.5"
              >
                <ListOrdered className="mr-1.5 size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">Elegir de la carta</span>
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
                      : "Total pagado por el cliente."
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
                {selectedProducts.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Productos seleccionados
                      </p>
                      <Button type="button" variant="outline" size="sm" onClick={openCatalogPicker}>
                        <ListOrdered aria-hidden="true" />
                        Editar selección
                      </Button>
                    </div>

                    <div className="border bg-card">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="w-16 text-center">Cant.</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedProducts.map((item) => (
                            <TableRow key={item.product.id}>
                              <TableCell className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 font-medium">
                                  <span className="break-words">{item.product.name}</span>
                                  {item.product.kind === "combo" && (
                                    <Badge variant="secondary">Combo</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground tabular-nums">
                                  {formatCOP(item.product.price_cop)} c/u
                                </p>
                              </TableCell>
                              <TableCell className="text-center font-semibold tabular-nums">
                                {item.quantity}
                              </TableCell>
                              <TableCell className="text-right font-semibold tabular-nums">
                                {formatCOP(item.lineTotal)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell colSpan={2} className="font-bold">
                              Total
                            </TableCell>
                            <TableCell
                              data-testid="catalog-total"
                              className="text-right font-bold tabular-nums"
                            >
                              {formatCOP(catalogTotal)}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-none border border-dashed bg-muted/20 p-5 text-center">
                    <p className="text-sm text-muted-foreground">
                      Aún no has seleccionado productos o combos de la carta.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={openCatalogPicker}
                    >
                      <ListOrdered aria-hidden="true" />
                      Abrir carta
                    </Button>
                  </div>
                )}
              </TabsContent>

              {preview !== null && (
                <div className="flex items-center justify-between rounded-none bg-secondary/60 p-4">
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
                El cliente escanea el QR con la cámara de su teléfono. El código vence en{" "}
                {program.data?.qr_expiry_hours ?? 24} horas y solo puede reclamarse una vez.
              </p>
            </form>
          </Tabs>
        </CardContent>
      </Card>

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
                      {formatDateTimeBogota(purchase.created_at)} ·{" "}
                      {purchase.customer_name ?? "Sin reclamar"}
                      {purchase.items_count ? ` · ${purchase.items_count} ítem(s)` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {purchase.points_awarded > 0 ? formatPoints(purchase.points_awarded) : ""}
                    </span>
                    <PurchaseStatusBadge status={purchase.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={catalogOpen} onOpenChange={setCatalogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Elegir de la carta</DialogTitle>
            <DialogDescription>
              Selecciona los productos o combos y ajusta las cantidades para la venta.
            </DialogDescription>
          </DialogHeader>

          {products.isLoading ? (
            <ListSkeleton rows={3} />
          ) : products.isError ? (
            <ErrorState error={products.error} onRetry={() => void products.refetch()} />
          ) : (products.data ?? []).length === 0 ? (
            <EmptyState
              title="La carta está vacía"
              description="Añade productos o combos en Carta para vender con detalle."
              icon={ListOrdered}
              className="border-0 bg-transparent py-6"
              action={
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/products">Ir a la carta</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar producto o combo"
                  className="pl-8"
                  aria-label="Buscar en la carta"
                />
              </div>

              {catalog.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No encontramos productos que coincidan con tu búsqueda.
                </p>
              ) : (
                <ul className="max-h-[46dvh] space-y-2.5 overflow-y-auto pr-1">
                  {catalog.map((product) => (
                    <ProductPickerCard
                      key={product.id}
                      product={product}
                      quantity={draftQuantities[product.id] ?? 0}
                      onQuantity={(quantity) => setDraftQuantity(product.id, quantity)}
                    />
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-between border-t pt-3 text-sm font-bold">
                <span>Total seleccionado</span>
                <span className="tabular-nums">{formatCOP(draftCatalogTotal)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCatalogOpen(false)}>
              Cancelar
            </Button>
            {(products.data ?? []).length > 0 && (
              <Button type="button" onClick={confirmCatalogSelection}>
                Aceptar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={qrOpen && Boolean(result)}
        onOpenChange={(open) => {
          if (!open) handleNewPurchase();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR de la venta</DialogTitle>
            <DialogDescription>
              Muestra este código al cliente para que sume sus loopoints.
            </DialogDescription>
          </DialogHeader>

          {result && (
            <div className="print-area space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl font-extrabold">
                    {formatCOP(result.amount_cop)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTimeBogota(result.expires_at)} · vence en{" "}
                    {program.data?.qr_expiry_hours ?? 24} h
                  </p>
                </div>
                <PurchaseStatusBadge status="pending_claim" />
              </div>

              {result.items && result.items.length > 0 && (
                <ul className="space-y-1 rounded-none bg-muted/40 p-3 text-xs">
                  {result.items.map((item, index) => (
                    <li
                      key={item.id || `${item.name}-${index}`}
                      className="flex justify-between gap-2"
                    >
                      <span className="min-w-0 break-words">
                        {item.quantity} × {item.name}
                        {item.is_combo && item.combo_detail.length > 0
                          ? ` (${item.combo_detail
                              .map((component) => `${component.quantity} ${component.name}`)
                              .join(", ")})`
                          : ""}
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {formatCOP(item.line_total_cop)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex justify-center rounded-none bg-muted/40 p-4">
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductPickerCard({
  product,
  quantity,
  onQuantity,
}: {
  product: Product;
  quantity: number;
  onQuantity: (quantity: number) => void;
}) {
  return (
    <li>
      <Card variant="tinted" className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-start gap-3 p-3.5">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden border border-primary/20 bg-background/80 dark:border-primary/30 dark:bg-card/80">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="size-full object-cover"
                />
              ) : (
                <ImageIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="min-w-0 break-words font-semibold leading-snug">{product.name}</p>
                {product.kind === "combo" && (
                  <Badge variant="secondary" className="shrink-0">
                    Combo
                  </Badge>
                )}
              </div>
              {product.kind === "combo" && product.combo_items.length > 0 && (
                <p className="break-words text-xs text-muted-foreground">
                  {product.combo_items.map((item) => `${item.quantity} × ${item.name}`).join(" · ")}
                </p>
              )}
              {product.description && (
                <p className="line-clamp-2 break-words text-xs text-muted-foreground">
                  {product.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-primary/15 bg-primary/[0.06] px-3.5 py-2 dark:border-primary/25 dark:bg-primary/[0.14]">
            <p className="text-sm font-semibold tabular-nums">{formatCOP(product.price_cop)}</p>
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
                className="w-7 text-center text-sm font-bold tabular-nums"
                aria-label={`Cantidad de ${product.name}`}
              >
                {quantity}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Añadir ${product.name}`}
                disabled={quantity >= 99}
                onClick={() => onQuantity(quantity + 1)}
              >
                <Plus aria-hidden="true" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
