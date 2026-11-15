import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Gift, TicketCheck } from "lucide-react";
import { useMyLoyaltyRedemptions } from "@/features/loyalty/hooks";
import { useBusinessContext } from "@/features/loyalty/businessContext";
import { formatDateTimeBogota, formatPoints } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/States";
import { RedemptionRequestStatusBadge } from "@/components/shared/StatusBadge";
import type { MyLoyaltyRedemption } from "@/types";

export function RedemptionsPage() {
  const redemptions = useMyLoyaltyRedemptions();
  const { businesses } = useBusinessContext();

  const [businessFilter, setBusinessFilter] = useState("");
  const [detail, setDetail] = useState<MyLoyaltyRedemption | null>(null);

  const rows = (redemptions.data ?? []).filter(
    (redemption) => !businessFilter || redemption.business_id === businessFilter,
  );

  return (
    <section className="space-y-4 animate-fade-in" aria-label="Mis canjes">
      <div className="pixel-box p-4 sm:p-5">
        <span className="pixel-title block text-[10px] text-[var(--red)]">HISTORIAL · CANJES</span>
        <h1 className="mt-1 font-display text-xl font-bold text-[var(--ink)]">Mis canjes</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Solicitudes de recompensa en todos tus negocios y su estado actual.
        </p>
      </div>

      {businesses.length > 1 && (
        <div className="pixel-box flex flex-wrap items-center justify-between gap-3 p-3.5">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
            Filtrar por negocio
          </span>
          <Select
            value={businessFilter || "all"}
            onValueChange={(value) => setBusinessFilter(value === "all" ? "" : value)}
          >
            <SelectTrigger
              className="w-full border-[3px] border-[var(--border-color)] bg-[var(--input-bg)] font-mono text-xs font-bold sm:w-64"
              aria-label="Filtrar canjes por negocio"
            >
              <SelectValue placeholder="Todos los negocios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los negocios</SelectItem>
              {businesses.map((business) => (
                <SelectItem key={business.id} value={business.id}>
                  {business.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {redemptions.isLoading ? (
        <ListSkeleton rows={3} />
      ) : redemptions.isError ? (
        <ErrorState error={redemptions.error} onRetry={() => void redemptions.refetch()} />
      ) : !redemptions.data || redemptions.data.length === 0 ? (
        <div className="pixel-box p-4">
          <EmptyState
            title="Aún no has solicitado recompensas"
            description="Cuando tengas loopoints suficientes, solicita una recompensa y aquí verás su estado."
            icon={Gift}
            className="border-0 bg-transparent py-6"
            action={
              <Link to="/customer" className="pixel-btn pixel-btn-dark">
                Ver mis negocios
              </Link>
            }
          />
        </div>
      ) : rows.length === 0 ? (
        <div className="pixel-box p-4">
          <EmptyState
            title="Sin canjes en este negocio"
            description="Prueba con otro negocio o revisa todos tus canjes."
            icon={Gift}
            className="border-0 bg-transparent py-6"
            action={
              <button
                type="button"
                className="pixel-btn pixel-btn-secondary"
                onClick={() => setBusinessFilter("")}
              >
                Ver todos
              </button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((redemption) => {
            const pending = redemption.status === "pending";

            return (
              <article
                key={redemption.id}
                className="pixel-box flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex items-start gap-3.5">
                  <span className="grid size-12 shrink-0 place-items-center overflow-hidden border-[3px] border-[var(--border-color)] bg-[var(--paper-deep)] text-[var(--ink)] shadow-[2px_2px_0_var(--shadow-color)]">
                    {redemption.reward_image_url ? (
                      <img
                        src={redemption.reward_image_url}
                        alt={redemption.reward_name}
                        className="size-full object-cover"
                      />
                    ) : redemption.business_logo_url ? (
                      <img
                        src={redemption.business_logo_url}
                        alt={`Logo de ${redemption.business_name}`}
                        className="size-full object-cover"
                      />
                    ) : (
                      <TicketCheck className="size-5" aria-hidden="true" />
                    )}
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-base font-bold text-[var(--ink)]">
                        {redemption.reward_name}
                      </h2>
                      <RedemptionRequestStatusBadge status={redemption.status} />
                      <span className="inline-flex items-center border-2 border-[var(--border-color)] bg-[var(--paper-deep)] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--ink)]">
                        <Building2 className="mr-1 size-3" aria-hidden="true" />
                        {redemption.business_name}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-[var(--text-muted)]">
                      {formatPoints(redemption.points_spent)} ·{" "}
                      {formatDateTimeBogota(redemption.created_at)}
                      {redemption.business_slug ? ` · @${redemption.business_slug}` : ""}
                    </p>

                    {pending && (
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        Tu solicitud está pendiente. El encargado la revisará y aprobará en caja.
                      </p>
                    )}
                    {redemption.status === "approved" && (
                      <p className="text-xs text-sky-800 dark:text-sky-300">
                        El encargado ya aprobó tu canje. Acércate a caja para confirmar la entrega.
                      </p>
                    )}
                    {redemption.status === "delivered" && redemption.delivered_at && (
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        Entregado el {formatDateTimeBogota(redemption.delivered_at)}
                      </p>
                    )}
                    {(redemption.status === "cancelled" || redemption.status === "expired") && (
                      <p className="text-xs text-[var(--text-muted)]">
                        {redemption.cancelled_at
                          ? `Cancelado el ${formatDateTimeBogota(redemption.cancelled_at)} · loopoints devueltos`
                          : "Sin canje efectivo · loopoints devueltos"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t-2 border-dashed border-[var(--border)] pt-3 sm:justify-end sm:border-t-0 sm:pt-0">
                  <p className="pixel-title mr-auto text-sm text-[var(--red)] sm:mr-2">
                    −{redemption.points_spent}
                  </p>
                  <button
                    type="button"
                    className="pixel-btn pixel-btn-secondary py-1.5 text-[11px]"
                    onClick={() => setDetail(redemption)}
                  >
                    Ver detalle
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={detail !== null} onOpenChange={() => setDetail(null)}>
        <DialogContent className="border-[3px] border-[var(--border-color)] bg-[var(--cream)] shadow-[6px_6px_0_var(--shadow-color)]">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              {detail?.reward_name}
            </DialogTitle>
            <DialogDescription>
              Canje en {detail?.business_name}
              {detail?.business_slug ? ` (@${detail.business_slug})` : ""}.
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="font-mono text-xs font-bold uppercase text-[var(--text-muted)]">
                Estado
              </dt>
              <dd>
                <RedemptionRequestStatusBadge status={detail.status} />
              </dd>
              <dt className="font-mono text-xs font-bold uppercase text-[var(--text-muted)]">
                Loopoints
              </dt>
              <dd className="font-mono font-bold">{formatPoints(detail.points_spent)}</dd>
              <dt className="font-mono text-xs font-bold uppercase text-[var(--text-muted)]">
                Código
              </dt>
              <dd className="min-w-0 break-all font-mono text-xs">{detail.code}</dd>
              <dt className="font-mono text-xs font-bold uppercase text-[var(--text-muted)]">
                Solicitado
              </dt>
              <dd>{formatDateTimeBogota(detail.created_at)}</dd>
              {detail.approved_at && (
                <>
                  <dt className="font-mono text-xs font-bold uppercase text-[var(--text-muted)]">
                    Aprobado
                  </dt>
                  <dd>{formatDateTimeBogota(detail.approved_at)}</dd>
                </>
              )}
              {detail.delivered_at && (
                <>
                  <dt className="font-mono text-xs font-bold uppercase text-[var(--text-muted)]">
                    Entregado
                  </dt>
                  <dd>{formatDateTimeBogota(detail.delivered_at)}</dd>
                </>
              )}
              {detail.cancelled_at && (
                <>
                  <dt className="font-mono text-xs font-bold uppercase text-[var(--text-muted)]">
                    Cancelado
                  </dt>
                  <dd>{formatDateTimeBogota(detail.cancelled_at)}</dd>
                </>
              )}
            </dl>
          )}
          <DialogFooter>
            <button
              type="button"
              className="pixel-btn pixel-btn-secondary"
              onClick={() => setDetail(null)}
            >
              Cerrar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
