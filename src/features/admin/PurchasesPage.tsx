import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  QrCode,
  ReceiptText,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useBusinessPurchases, useRegeneratePurchaseQr } from "@/features/purchases/hooks";
import {
  effectivePurchaseStatus,
  formatCOP,
  formatFriendlyDatePartsBogota,
  formatPoints,
} from "@/lib/format";
import { errorMessage } from "@/lib/errors";
import type { Business, BusinessPurchase, PurchaseQrCreateResult } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { PurchaseStatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/States";
import { BusinessGate } from "./BusinessGate";
import { PurchaseDetailDialog } from "@/features/purchases/PurchaseDetailDialog";
import { PurchaseQrDialog } from "@/features/purchases/PurchaseQrDialog";

const PAGE_SIZE = 15;

export function PurchasesPage() {
  return (
    <BusinessGate
      title="Ventas"
      description="Historial de ventas con QR del negocio."
      icon={ReceiptText}
      emptyDescription="Registra un negocio para ver sus ventas."
    >
      {(business) => <PurchasesSection key={business.id} business={business} />}
    </BusinessGate>
  );
}

function PurchasesSection({ business }: { business: Business }) {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("all");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const purchases = useBusinessPurchases(
    business.id,
    page,
    PAGE_SIZE,
    status === "all" ? "" : status,
  );
  const regenerateQr = useRegeneratePurchaseQr(business.id);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [regeneratedQr, setRegeneratedQr] = useState<PurchaseQrCreateResult | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const sortedRows = useMemo(() => {
    const rows = purchases.data ?? [];
    return [...rows].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "desc" ? -diff : diff;
    });
  }, [purchases.data, sortDir]);

  const total = purchases.data?.[0]?.total_count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleRegenerate(purchase: BusinessPurchase) {
    setRegeneratingId(purchase.id);
    try {
      const qr = await regenerateQr.mutateAsync(purchase.id);
      setRegeneratedQr(qr);
      toast.success("QR regenerado. El código anterior dejó de ser válido.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setRegeneratingId(null);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      <PageHeader
        title="Ventas"
        description="Cada venta genera un QR con tiempo limitado para que el cliente reclame sus monedas. Mientras los puntos estén pendientes puedes regenerar el QR."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm">
              <Link to="/admin/purchases/new">
                <PlusCircle aria-hidden="true" />
                Nueva venta
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={() => setSortDir((prev) => (prev === "desc" ? "asc" : "desc"))}
            >
              {sortDir === "desc" ? (
                <ArrowDown className="size-3.5" aria-hidden="true" />
              ) : (
                <ArrowUp className="size-3.5" aria-hidden="true" />
              )}
              {sortDir === "desc" ? "Más recientes" : "Más antiguas"}
            </Button>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por estado de puntos">
                <SelectValue placeholder="Estado puntos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending_claim">Pendientes</SelectItem>
                <SelectItem value="claimed">Reclamados</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {purchases.isLoading ? (
        <ListSkeleton rows={5} />
      ) : purchases.isError ? (
        <ErrorState error={purchases.error} onRetry={() => void purchases.refetch()} />
      ) : sortedRows.length === 0 ? (
        <EmptyState
          title="Sin ventas en este filtro"
          description="Genera una venta nueva o cambia el filtro de estado."
          icon={QrCode}
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {sortedRows.map((purchase) => {
              const effStatus = effectivePurchaseStatus(purchase.status, purchase.expires_at);
              const created = formatFriendlyDatePartsBogota(purchase.created_at);
              const expires = formatFriendlyDatePartsBogota(purchase.expires_at);
              const isPending = effStatus === "pending_claim";

              return (
                <Card key={purchase.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display text-xl font-extrabold">
                          {formatCOP(purchase.amount_cop)}
                        </p>
                        <div className="mt-0.5 flex items-baseline gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {created.dayLabel}
                          </span>
                          <span className="font-mono text-xs font-bold tabular-nums text-[var(--lp-accent-link)]">
                            {created.timeLabel}
                          </span>
                        </div>
                        {isPending && (
                          <p className="text-[11px] text-muted-foreground">
                            QR vence {expires.dayLabel} · {expires.timeLabel}
                          </p>
                        )}
                      </div>
                      <PurchaseStatusBadge status={effStatus} />
                    </div>
                    <p className="text-sm">
                      {purchase.customer_name ? (
                        <>
                          <span className="font-medium">{purchase.customer_name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {purchase.customer_email}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin reclamar</span>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {purchase.points_awarded > 0
                          ? formatPoints(purchase.points_awarded)
                          : "Sin monedas aún"}
                        {purchase.items_count
                          ? ` · ${purchase.items_count} ítem(s)`
                          : " · sin detalle"}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setDetailId(purchase.id)}>
                          Ver detalle
                        </Button>
                        {isPending && (
                          <Button
                            variant="outline"
                            size="sm"
                            loading={regeneratingId === purchase.id}
                            disabled={regeneratingId !== null}
                            onClick={() => void handleRegenerate(purchase)}
                          >
                            <RefreshCw aria-hidden="true" />
                            Regenerar QR
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div
                tabIndex={0}
                role="region"
                aria-label="Tabla de ventas"
                className="overflow-x-auto focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--lp-focus-ring)]"
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead aria-sort={sortDir === "desc" ? "descending" : "ascending"}>
                        <button
                          type="button"
                          onClick={() => setSortDir((prev) => (prev === "desc" ? "asc" : "desc"))}
                          className="inline-flex cursor-pointer items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wide hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring)]"
                        >
                          Fecha
                          {sortDir === "desc" ? (
                            <ArrowDown className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowUp className="size-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>Importe</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Estado puntos</TableHead>
                      <TableHead>Monedas</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRows.map((purchase) => {
                      const effStatus = effectivePurchaseStatus(
                        purchase.status,
                        purchase.expires_at,
                      );
                      const created = formatFriendlyDatePartsBogota(purchase.created_at);
                      const expires = formatFriendlyDatePartsBogota(purchase.expires_at);
                      const isPending = effStatus === "pending_claim";

                      return (
                        <TableRow key={purchase.id}>
                          <TableCell>
                            <div className="space-y-0.5">
                              <div className="flex flex-wrap items-baseline gap-2">
                                <span className="font-semibold text-foreground">
                                  {created.dayLabel}
                                </span>
                                <span className="font-mono text-sm font-bold tabular-nums text-[var(--lp-accent-link)]">
                                  {created.timeLabel}
                                </span>
                              </div>
                              {isPending && (
                                <p className="text-[11px] text-muted-foreground">
                                  QR vence {expires.dayLabel} · {expires.timeLabel}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold tabular-nums">
                            {formatCOP(purchase.amount_cop)}
                          </TableCell>
                          <TableCell>
                            {purchase.customer_name ? (
                              <>
                                <p className="font-medium">{purchase.customer_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {purchase.customer_email}
                                </p>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sin reclamar</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <PurchaseStatusBadge status={effStatus} />
                          </TableCell>
                          <TableCell>
                            <p className="tabular-nums">{purchase.points_awarded}</p>
                            <p className="text-xs text-muted-foreground">
                              {purchase.items_count
                                ? `${purchase.items_count} ítem(s)`
                                : "Sin detalle"}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDetailId(purchase.id)}
                              >
                                Ver detalle
                              </Button>
                              {isPending && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  loading={regeneratingId === purchase.id}
                                  disabled={regeneratingId !== null}
                                  onClick={() => void handleRegenerate(purchase)}
                                >
                                  <RefreshCw aria-hidden="true" />
                                  Regenerar QR
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {total > PAGE_SIZE && (
        <div className="flex flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-0">
          <p className="text-sm text-muted-foreground">
            {total} ventas · página {page + 1} de {pageCount}
          </p>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              <ChevronLeft aria-hidden="true" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              disabled={page + 1 >= pageCount}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      <PurchaseDetailDialog
        open={Boolean(detailId)}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        purchaseId={detailId}
        businessId={business.id}
        onRegenerated={(qr) => {
          setDetailId(null);
          setRegeneratedQr(qr);
        }}
      />

      <PurchaseQrDialog
        open={Boolean(regeneratedQr)}
        onOpenChange={(open) => {
          if (!open) setRegeneratedQr(null);
        }}
        result={regeneratedQr}
        title="QR de venta regenerado"
        description="El código anterior quedó invalidado. Muestra este nuevo QR antes de que venza el tiempo."
      />
    </div>
  );
}
