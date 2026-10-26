import { QRCodeCanvas } from 'qrcode.react';
import { AlertTriangle, Clock, Copy, Link2, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTimeBogota, formatRedemptionCode } from '@/lib/format';
import { redemptionScanUrl } from '@/lib/config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCountdown } from './useCountdown';

interface RedemptionQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rewardName: string;
  code: string;
  token: string | null;
  expiresAt: string | null;
  businessName?: string;
  onReissue?: () => void;
  reissuing?: boolean;
}

export function RedemptionQrDialog({
  open,
  onOpenChange,
  rewardName,
  code,
  token,
  expiresAt,
  businessName,
  onReissue,
  reissuing = false,
}: RedemptionQrDialogProps) {
  const countdown = useCountdown(expiresAt);
  const expired = Boolean(expiresAt) && countdown.expired;
  const usable = Boolean(token) && !expired;
  const scanUrl = token ? redemptionScanUrl(token) : '';

  async function copyToken() {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      toast.success('Código copiado.');
    } catch {
      toast.error('No se pudo copiar el código. Selecciónalo manualmente.');
    }
  }

  async function copyScanUrl() {
    if (!scanUrl) return;
    try {
      await navigator.clipboard.writeText(scanUrl);
      toast.success('Enlace copiado.');
    } catch {
      toast.error('No se pudo copiar el enlace.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tu código QR</DialogTitle>
          <DialogDescription>
            Muestra este código al encargado de {businessName ?? 'el negocio'} para
            recibir <strong>{rewardName}</strong>. El encargado lo escanea y confirma
            la entrega desde Loopoint. No contiene datos personales.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border bg-muted/40 p-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Referencia del canje
            </p>
            <p className="font-mono text-lg font-bold tracking-widest">
              {formatRedemptionCode(code)}
            </p>
          </div>

          {usable && token ? (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <QRCodeCanvas
                  value={scanUrl}
                  size={220}
                  marginSize={2}
                  level="M"
                  aria-label="Código QR de la redención"
                />
              </div>
              <div
                className={cn(
                  'flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                  countdown.remainingMs < 60 * 60 * 1000
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-100 text-emerald-800',
                )}
                role="timer"
                aria-live="polite"
              >
                <Clock className="size-3.5" aria-hidden="true" />
                {expired ? 'QR vencido' : `Vence en ${countdown.label}`}
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Válido hasta {formatDateTimeBogota(expiresAt)}.
              </p>

              <div className="w-full space-y-2 rounded-xl border bg-muted/30 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Código manual de respaldo
                </p>
                <p className="break-all rounded-lg bg-background px-2 py-1.5 font-mono text-[11px] leading-relaxed">
                  {token}
                </p>
                <p className="break-all text-[11px] text-muted-foreground">
                  {scanUrl}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void copyToken()}
                  >
                    <Copy aria-hidden="true" />
                    Copiar código
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void copyScanUrl()}
                  >
                    <Link2 aria-hidden="true" />
                    Copiar enlace
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <p>
                  {expired
                    ? 'Este QR ya venció. Reemite uno nuevo para poder entregar la recompensa.'
                    : 'El QR no está disponible en este dispositivo o pestaña. Puedes reemitirlo si la solicitud sigue pendiente.'}
                </p>
              </div>
              {onReissue && (
                <Button
                  type="button"
                  onClick={onReissue}
                  loading={reissuing}
                  className="w-full"
                >
                  <RefreshCw aria-hidden="true" />
                  {expired ? 'Reemitir QR' : 'Recuperar QR'}
                </Button>
              )}
            </div>
          )}

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            El QR solo lleva un token aleatorio; no incluye correo, nombre ni saldo.
            Al confirmar la entrega, el token deja de ser válido.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
