import { useState } from "react";
import { Package, ReceiptText, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useBusinessPurchaseDetail, useMyPurchaseDetail, useRegeneratePurchaseQr } from "./hooks";
import {
  effectivePurchaseStatus,
  formatCOP,
  formatFriendlyDatePartsBogota,
  formatPoints,
} from "@/lib/format";
import { errorMessage } from "@/lib/errors";
import type { PurchaseDetail, PurchaseQrCreateResult } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorState, LoadingScreen } from "@/components/shared/States";
import { PurchaseStatusBadge } from "@/components/shared/StatusBadge";
import { PurchaseQrDialog } from "./PurchaseQrDialog";

export function PurchaseDetailDialog({
  open,
  onOpenChange,
  purchaseId,
  businessId,
  mode = "business",
  onRegenerated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseId: string | null;
  businessId?: string;
  mode?: "business" | "customer";
  onRegenerated?: (qr: PurchaseQrCreateResult) => void;
}) {
  const businessDetail = useBusinessPurchaseDetail(
    mode === "business" ? (businessId ?? "") : "",
    mode === "business" ? purchaseId : null,
  );
  const customerDetail = useMyPurchaseDetail(mode === "customer" ? purchaseId : null);
  const query = mode === "business" ? businessDetail : customerDetail;
  const [localQr, setLocalQr] = useState<PurchaseQrCreateResult | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ReceiptText className="size-5 text-muted-foreground" aria-hidden="true" />
              Detalle de la venta
            </DialogTitle>
            <DialogDescription>
              Líneas, monedas y estado de reclamación de puntos.
            </DialogDescription>
          </DialogHeader>

          {query.isLoading ? (
            <LoadingScreen label="Cargando detalle…" />
          ) : query.isError || !query.data ? (
            <ErrorState
              error={query.error ?? new Error("No encontramos la compra.")}
              onRetry={() => void query.refetch()}
            />
          ) : (
            <PurchaseDetailBody
              detail={query.data}
              regenerateSlot={
                mode === "business" && businessId && purchaseId ? (
                  <RegeneratePurchaseButton
                    businessId={businessId}
                    purchaseId={purchaseId}
                    onSuccess={(qr) => {
                      if (onRegenerated) {
                        onRegenerated(qr);
                      } else {
                        onOpenChange(false);
                        setLocalQr(qr);
                      }
                    }}
                  />
                ) : undefined
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <PurchaseQrDialog
        open={Boolean(localQr)}
        onOpenChange={(next) => {
          if (!next) setLocalQr(null);
        }}
        result={localQr}
        title="QR de venta regenerado"
        description="El código anterior quedó invalidado. Muestra este nuevo QR antes de que venza el tiempo."
      />
    </>
  );
}

function RegeneratePurchaseButton({
  businessId,
  purchaseId,
  onSuccess,
}: {
  businessId: string;
  purchaseId: string;
  onSuccess: (qr: PurchaseQrCreateResult) => void;
}) {
  const regenerateQr = useRegeneratePurchaseQr(businessId);

  async function handleRegenerate() {
    try {
      const qr = await regenerateQr.mutateAsync(purchaseId);
      toast.success("QR regenerado. El código anterior dejó de ser válido.");
      onSuccess(qr);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      loading={regenerateQr.isPending}
      onClick={() => void handleRegenerate()}
    >
      <RefreshCw aria-hidden="true" />
      Regenerar QR
    </Button>
  );
}

export function PurchaseDetailBody({
  detail,
  regenerateSlot,
}: {
  detail: PurchaseDetail;
  regenerateSlot?: React.ReactNode;
}) {
  const { purchase, business, customer, registrar } = detail;
  const effStatus = effectivePurchaseStatus(purchase.status, purchase.expires_at);
  const created = formatFriendlyDatePartsBogota(purchase.created_at);
  const expires = formatFriendlyDatePartsBogota(purchase.expires_at);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 rounded-none border bg-muted/30 p-4">
        <div className="min-w-0">
          <p className="break-words text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {business.name}
          </p>
          <p className="font-display text-3xl font-extrabold">{formatCOP(purchase.amount_cop)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{created.dayLabel}</span> ·{" "}
            <span className="font-mono font-bold tabular-nums">{created.timeLabel}</span>
          </p>
          {effStatus === "pending_claim" && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              QR vigente hasta {expires.dayLabel} · {expires.timeLabel}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
            Estado puntos
          </span>
          <PurchaseStatusBadge status={effStatus} />
        </div>
      </div>

      {effStatus === "pending_claim" && regenerateSlot}

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="min-w-0 rounded-none border p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Package className="size-3.5" aria-hidden="true" />
            Monedas
          </p>
          <p className="mt-1 font-semibold">{formatPoints(purchase.points_awarded)}</p>
        </div>
        <div className="min-w-0 rounded-none border p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <UserRound className="size-3.5" aria-hidden="true" />
            Cliente
          </p>
          <p className="mt-1 truncate font-semibold">
            {customer ? customer.full_name || customer.nickname || customer.email : "Sin reclamar"}
          </p>
          {customer?.nickname && (
            <Badge variant="outline" className="mt-1">
              @{customer.nickname}
            </Badge>
          )}
        </div>
      </div>

      {registrar && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Registrada por {registrar.full_name || registrar.email}
        </p>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold">Productos</p>
        {detail.items.length === 0 ? (
          <p className="rounded-none border border-dashed p-4 text-center text-sm text-muted-foreground">
            Sin detalle de productos.
          </p>
        ) : (
          <ul className="divide-y rounded-none border">
            {detail.items.map((item) => (
              <li key={item.id} className="space-y-1 p-3">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="min-w-0">
                    <span className="font-semibold">{item.quantity} × </span>
                    {item.name}
                    {item.is_combo && (
                      <Badge variant="secondary" className="ml-2">
                        Combo
                      </Badge>
                    )}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatCOP(item.line_total_cop)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCOP(item.unit_price_cop)} c/u
                </p>
                {item.is_combo && item.combo_detail.length > 0 && (
                  <ul className="ml-3 space-y-0.5 text-xs text-muted-foreground">
                    {item.combo_detail.map((component) => (
                      <li key={component.product_id}>
                        · {component.quantity} × {component.name}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {detail.items.length > 0 && (
        <div className="flex items-baseline justify-between border-t pt-3 text-sm font-bold">
          <span>Total</span>
          <span>{formatCOP(purchase.amount_cop)}</span>
        </div>
      )}
    </div>
  );
}
