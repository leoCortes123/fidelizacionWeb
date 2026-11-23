import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Download, PlusCircle, Printer } from "lucide-react";
import { toast } from "sonner";
import { claimUrl } from "@/lib/config";
import { formatCOP, formatFriendlyDatePartsBogota, formatPoints } from "@/lib/format";
import type { PurchaseQrCreateResult } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PurchaseStatusBadge } from "@/components/shared/StatusBadge";

interface PurchaseQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: PurchaseQrCreateResult | null;
  title?: string;
  description?: string;
  expiryHours?: number;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
}

export function PurchaseQrDialog({
  open,
  onOpenChange,
  result,
  title = "QR de la venta",
  description = "Muestra este código al cliente para que sume sus monedas.",
  expiryHours,
  primaryActionLabel = "Cerrar",
  onPrimaryAction,
}: PurchaseQrDialogProps) {
  const qrRef = useRef<HTMLCanvasElement | null>(null);

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

  const expiresParts = result ? formatFriendlyDatePartsBogota(result.expires_at) : null;

  return (
    <Dialog open={open && Boolean(result)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {result && expiresParts && (
          <div className="print-area space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-2xl font-extrabold">
                  {formatCOP(result.amount_cop)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Vence {expiresParts.dayLabel} · {expiresParts.timeLabel}
                  {expiryHours ? ` (${expiryHours} h)` : ""}
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
                    <span className="shrink-0 tabular-nums">{formatCOP(item.line_total_cop)}</span>
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
              <p className="text-sm font-semibold">Escanéalo para sumar monedas</p>
              <p className="text-xs text-muted-foreground">
                {formatPoints(result.points_preview)} estimadas
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
              <Button type="button" variant="ghost" onClick={() => void copyClaimUrl()}>
                <Copy aria-hidden="true" />
                Copiar enlace
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (onPrimaryAction) {
                    onPrimaryAction();
                  } else {
                    onOpenChange(false);
                  }
                }}
              >
                {primaryActionLabel === "Nueva venta" && <PlusCircle aria-hidden="true" />}
                {primaryActionLabel}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
