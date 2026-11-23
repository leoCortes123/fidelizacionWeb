import { useState } from "react";
import { Check, Gift, PackageCheck, ScanLine, TicketCheck, X } from "lucide-react";
import { toast } from "sonner";
import {
  useApproveRedemption,
  useCancelRedemption,
  useDeliverRedemption,
} from "@/features/loyalty/hooks";
import { errorMessage } from "@/lib/errors";
import { formatDateTimeBogota, formatPoints } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntityAvatar } from "@/components/shared/EntityAvatar";
import { HelpHint } from "@/components/shared/HelpHint";
import { RedemptionRequestStatusBadge } from "@/components/shared/StatusBadge";
import type { LoyaltyRedemptionWithCustomer } from "@/types";

type ActionKind = "approve" | "reject" | "deliver" | "cancel";

const rewardTypeLabels: Record<string, string> = {
  free_product: "Producto gratis",
  fixed_discount: "Descuento fijo",
  percentage_discount: "Descuento %",
  configurable_benefit: "Beneficio",
};

const actionCopy: Record<
  ActionKind,
  { title: string; confirm: string; description: string; destructive: boolean }
> = {
  approve: {
    title: "Aprobar solicitud",
    confirm: "Aprobar",
    description:
      "Se validará el canje y el cliente podrá recibir la recompensa. Confirma la entrega después de darla.",
    destructive: false,
  },
  reject: {
    title: "Rechazar solicitud",
    confirm: "Rechazar y devolver monedas",
    description:
      "Se cancelará la solicitud y las monedas reservadas volverán al saldo del cliente.",
    destructive: true,
  },
  deliver: {
    title: "Confirmar entrega",
    confirm: "Confirmar entrega",
    description:
      "Marca la recompensa como entregada. Las monedas quedan consumidas definitivamente.",
    destructive: false,
  },
  cancel: {
    title: "Cancelar solicitud",
    confirm: "Cancelar y devolver monedas",
    description: "Solo para solicitudes pendientes. Las monedas reservadas volverán al cliente.",
    destructive: true,
  },
};

export interface RedemptionsTableProps {
  businessId: string;
  rows: LoyaltyRedemptionWithCustomer[];
  canAct: boolean;
  canCancel: boolean;
  showCustomerColumn?: boolean;
  onActionComplete?: () => void;
}

export function RedemptionsTable({
  businessId,
  rows,
  canAct,
  canCancel,
  showCustomerColumn = true,
  onActionComplete,
}: RedemptionsTableProps) {
  const approveRedemption = useApproveRedemption();
  const deliverRedemption = useDeliverRedemption();
  const cancelRedemption = useCancelRedemption();

  const [action, setAction] = useState<{
    kind: ActionKind;
    redemption: LoyaltyRedemptionWithCustomer;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function openAction(kind: ActionKind, redemption: LoyaltyRedemptionWithCustomer) {
    setAction({ kind, redemption });
    setReason("");
  }

  async function runAction() {
    if (!action) return;
    const { kind, redemption } = action;

    if (kind === "cancel" && reason.trim().length < 3) {
      toast.error("Escribe un motivo de al menos 3 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      if (kind === "deliver") {
        await deliverRedemption.mutateAsync({
          businessId,
          redemptionId: redemption.id,
        });
        toast.success("Entrega confirmada. Monedas consumidas.");
      } else if (kind === "cancel") {
        await cancelRedemption.mutateAsync({
          businessId,
          redemptionId: redemption.id,
          reason: reason.trim(),
        });
        toast.success("Solicitud cancelada y monedas devueltas.");
      } else {
        await approveRedemption.mutateAsync({
          businessId,
          redemptionId: redemption.id,
          approve: kind === "approve",
        });
        toast.success(
          kind === "approve"
            ? "Solicitud aprobada. Confirma la entrega al cliente."
            : "Solicitud rechazada y monedas devueltas.",
        );
      }
      setAction(null);
      setReason("");
      onActionComplete?.();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  const copy = action ? actionCopy[action.kind] : null;

  return (
    <>
      <div
        tabIndex={0}
        role="region"
        aria-label="Tabla de solicitudes de canje"
        className="overflow-x-auto rounded-none border-2 border-[var(--lp-ink)] bg-card shadow-[var(--lp-shadow-lg)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring)]"
      >
        <table className="w-full text-sm">
          <thead className="border-b-[3px] border-[var(--lp-ink)] bg-[var(--lp-surface-elevated-deep)] text-left font-mono text-xs font-bold uppercase tracking-wide text-[var(--lp-gold)]">
            <tr>
              {showCustomerColumn && (
                <th scope="col" className="h-9 px-3">
                  Cliente
                </th>
              )}
              <th scope="col" className="h-9 px-3">
                Recompensa
              </th>
              <th scope="col" className="h-9 px-3 text-right">
                Monedas
              </th>
              <th scope="col" className="h-9 px-3">
                Origen
              </th>
              <th scope="col" className="h-9 px-3">
                Fecha
              </th>
              <th scope="col" className="h-9 px-3">
                Estado
              </th>
              <th scope="col" className="h-9 px-3 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-[var(--lp-paper-deep)]">
            {rows.map((redemption) => (
              <tr key={redemption.id} className="transition-colors hover:bg-[var(--lp-row-hover)]">
                {showCustomerColumn && (
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <EntityAvatar
                        src={redemption.customer_avatar_url}
                        alt={redemption.customer_nickname || redemption.customer_email}
                        fallbackText={redemption.customer_nickname || redemption.customer_email}
                        sizeClassName="size-8"
                      />
                      <div className="min-w-0">
                        <p className="font-medium">
                          {redemption.customer_nickname
                            ? `@${redemption.customer_nickname}`
                            : redemption.customer_email}
                        </p>
                        <p className="text-xs text-muted-foreground">{redemption.customer_email}</p>
                        <p className="font-mono text-xs text-muted-foreground">{redemption.code}</p>
                      </div>
                    </div>
                  </td>
                )}
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <EntityAvatar
                      src={redemption.reward_image_url}
                      alt={redemption.reward_name}
                      icon={Gift}
                      sizeClassName="size-8"
                      roundedClassName="rounded-none"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold">{redemption.reward_name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">
                          {rewardTypeLabels[redemption.reward_type] ?? redemption.reward_type}
                        </Badge>
                        {!showCustomerColumn && redemption.code && (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {redemption.code}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatPoints(redemption.points_spent)}
                </td>
                <td className="px-3 py-2">
                  <OriginBadge origin={redemption.origin} />
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {formatDateTimeBogota(redemption.created_at)}
                  {redemption.delivered_at && (
                    <span className="block text-[var(--lp-green-text)]">
                      Entregado {formatDateTimeBogota(redemption.delivered_at)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <RedemptionRequestStatusBadge status={redemption.status} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap justify-end gap-2">
                    {redemption.status === "pending" && canAct && (
                      <>
                        <Button size="sm" onClick={() => openAction("approve", redemption)}>
                          <Check aria-hidden="true" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAction("reject", redemption)}
                        >
                          <X aria-hidden="true" />
                          Rechazar
                        </Button>
                      </>
                    )}
                    {redemption.status === "pending" && canCancel && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openAction("cancel", redemption)}
                      >
                        Cancelar
                      </Button>
                    )}
                    {redemption.status === "approved" && canAct && (
                      <Button size="sm" onClick={() => openAction("deliver", redemption)}>
                        <PackageCheck aria-hidden="true" />
                        Confirmar entrega
                      </Button>
                    )}
                    {redemption.status === "delivered" && (
                      <span className="text-xs text-muted-foreground">Entregado</span>
                    )}
                    {redemption.status === "cancelled" && (
                      <span className="text-xs text-muted-foreground">Monedas devueltas</span>
                    )}
                    {redemption.status === "expired" && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>No disponible</span>
                        <HelpHint
                          label="Por qué no se puede aprobar esta solicitud vencida"
                          text="Esta solicitud venció y no es posible aprobarla. Las monedas reservadas fueron devueltas al cliente."
                        />
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={action !== null}
        onOpenChange={(open) => {
          if (!open && !submitting) {
            setAction(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{copy?.title}</DialogTitle>
            <DialogDescription>
              {copy?.description}
              {action && (
                <>
                  {" "}
                  <strong>{action.redemption.reward_name}</strong> ·{" "}
                  {formatPoints(action.redemption.points_spent)} ·{" "}
                  {action.redemption.customer_email}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {action?.kind === "cancel" && (
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Motivo de la cancelación</Label>
              <Textarea
                id="cancel-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={300}
                placeholder="Ej.: el cliente no se presentó"
              />
              <p className="text-xs text-muted-foreground">
                Se guarda en la auditoría junto con las monedas devueltas.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAction(null);
                setReason("");
              }}
              disabled={submitting}
            >
              Volver
            </Button>
            <Button
              type="button"
              variant={copy?.destructive ? "destructive" : "default"}
              onClick={() => void runAction()}
              loading={submitting}
            >
              {copy?.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * El origen lo fija el servidor: `qr_scan` cuando el negocio escaneó el QR y
 * entregó en el mismo acto; `manual` cuando se aprobó desde este listado.
 */
function OriginBadge({ origin }: { origin: string }) {
  if (origin === "qr_scan") {
    return (
      <Badge variant="secondary" className="gap-1 whitespace-nowrap">
        <ScanLine className="size-3" aria-hidden="true" />
        QR escaneado
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 whitespace-nowrap">
      <TicketCheck className="size-3" aria-hidden="true" />
      Solicitud
    </Badge>
  );
}
