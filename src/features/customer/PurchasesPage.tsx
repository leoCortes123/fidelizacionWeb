import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ReceiptText, Store } from "lucide-react";
import { useBusinessContext } from "@/features/loyalty/businessContext";
import { useMyPurchasesPage } from "@/features/purchases/hooks";
import { PurchaseDetailDialog } from "@/features/purchases/PurchaseDetailDialog";
import { useProgramSettings } from "@/features/points/hooks";
import { formatCOP, formatDateBogota } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/States";

export function PurchasesPage() {
  const [page, setPage] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [businessFilter, setBusinessFilter] = useState("");
  const { businesses } = useBusinessContext();
  const settings = useProgramSettings();
  const pageSize = settings.data?.history_page_size ?? 10;
  const purchases = useMyPurchasesPage(businessFilter, page, pageSize);
  const total = purchases.data?.[0]?.total_count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const businessLabel = businesses.find((business) => business.id === businessFilter)?.name ?? null;

  return (
    <section className="space-y-4 animate-fade-in" aria-label="Mis compras">
      <div className="pixel-box p-4 sm:p-5">
        <span className="pixel-title block text-[10px] text-[var(--red)]">HISTORIAL · COMPRAS</span>
        <h1 className="mt-1 font-display text-xl font-bold text-[var(--ink)]">Mis compras</h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {businessLabel
            ? `Compras acreditadas en ${businessLabel}.`
            : "Historial global de compras acreditadas y los loopoints ganados."}
        </p>
      </div>

      {businesses.length > 1 && (
        <div className="pixel-box flex flex-wrap items-center justify-between gap-3 p-3.5">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
            Filtrar por negocio
          </span>
          <Select
            value={businessFilter || "all"}
            onValueChange={(value) => {
              setBusinessFilter(value === "all" ? "" : value);
              setPage(0);
            }}
          >
            <SelectTrigger
              className="w-full border-[3px] border-[var(--border-color)] bg-[var(--input-bg)] font-mono text-xs font-bold sm:w-64"
              aria-label="Filtrar compras por negocio"
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

      {purchases.isLoading ? (
        <ListSkeleton rows={4} />
      ) : purchases.isError ? (
        <ErrorState error={purchases.error} onRetry={() => void purchases.refetch()} />
      ) : !purchases.data || purchases.data.length === 0 ? (
        <div className="pixel-box p-4">
          <EmptyState
            title="Sin compras todavía"
            description="Cuando reclames el QR de tu primera compra, aparecerá aquí."
            icon={ReceiptText}
            className="border-0 bg-transparent py-6"
            action={
              <Link to="/customer" className="pixel-btn pixel-btn-dark">
                Volver al inicio
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="space-y-3 sm:hidden">
            {purchases.data.map((purchase) => (
              <article key={purchase.id} className="pixel-box space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate font-mono text-xs font-bold uppercase text-[var(--ink)]">
                      <Store className="size-3.5 shrink-0 text-[var(--red)]" aria-hidden="true" />
                      {purchase.business_name}
                    </p>
                    <p className="mt-1 font-display text-xl font-extrabold text-[var(--ink)]">
                      {formatCOP(purchase.amount_cop)}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      {formatDateBogota(purchase.claimed_at ?? purchase.created_at)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="item-badge-xp inline-block">
                      +{purchase.points_awarded} PTS
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 border-t-2 border-dashed border-[var(--border)] pt-2.5 text-xs text-[var(--text-muted)]">
                  <span>
                    {purchase.items_count > 0
                      ? `${purchase.items_count} producto(s)`
                      : "Sin detalle de productos"}
                  </span>
                  <button
                    type="button"
                    className="pixel-btn pixel-btn-secondary py-1.5 text-[11px]"
                    onClick={() => setDetailId(purchase.id)}
                  >
                    Ver detalle
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="pixel-box hidden overflow-hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow className="border-b-[3px] border-[var(--border-color)] bg-[var(--paper-deep)] hover:bg-[var(--paper-deep)]">
                  <TableHead className="font-mono text-[11px] font-bold uppercase text-[var(--ink)]">
                    Negocio
                  </TableHead>
                  <TableHead className="font-mono text-[11px] font-bold uppercase text-[var(--ink)]">
                    Fecha
                  </TableHead>
                  <TableHead className="font-mono text-[11px] font-bold uppercase text-[var(--ink)]">
                    Importe
                  </TableHead>
                  <TableHead className="font-mono text-[11px] font-bold uppercase text-[var(--ink)]">
                    Ítems
                  </TableHead>
                  <TableHead className="text-right font-mono text-[11px] font-bold uppercase text-[var(--ink)]">
                    Loopoints
                  </TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.data.map((purchase) => (
                  <TableRow
                    key={purchase.id}
                    className="border-b-2 border-dashed border-[var(--border)]"
                  >
                    <TableCell>
                      <p className="font-bold text-[var(--ink)]">{purchase.business_name}</p>
                      <p className="font-mono text-xs text-[var(--text-muted)]">
                        @{purchase.business_slug}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-[var(--text-muted)]">
                      {formatDateBogota(purchase.claimed_at ?? purchase.created_at)}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-[var(--ink)]">
                      {formatCOP(purchase.amount_cop)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {purchase.items_count > 0 ? purchase.items_count : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="item-badge-xp">+{purchase.points_awarded}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        className="pixel-btn pixel-btn-secondary py-1.5 text-[11px]"
                        onClick={() => setDetailId(purchase.id)}
                      >
                        Ver detalle
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {total > pageSize && (
        <div className="pixel-box flex flex-col items-center justify-between gap-3 p-3.5 sm:flex-row">
          <p className="font-mono text-xs font-bold text-[var(--text-muted)]">
            {total} compras · página {page + 1} de {pageCount}
          </p>
          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              className="pixel-btn pixel-btn-secondary flex-1 py-1.5 text-[11px] sm:flex-none"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              <ChevronLeft className="size-3.5" aria-hidden="true" />
              Anterior
            </button>
            <button
              type="button"
              className="pixel-btn pixel-btn-secondary flex-1 py-1.5 text-[11px] sm:flex-none"
              disabled={page + 1 >= pageCount}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
              <ChevronRight className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <PurchaseDetailDialog
        open={Boolean(detailId)}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        purchaseId={detailId}
        mode="customer"
      />
    </section>
  );
}
