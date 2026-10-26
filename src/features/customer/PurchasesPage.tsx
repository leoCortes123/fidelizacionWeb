import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ReceiptText, Store } from 'lucide-react';
import { useBusinessContext } from '@/features/loyalty/businessContext';
import { useMyPurchasesPage } from '@/features/purchases/hooks';
import { PurchaseDetailDialog } from '@/features/purchases/PurchaseDetailDialog';
import { useProgramSettings } from '@/features/points/hooks';
import { formatCOP, formatDateBogota } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/shared/States';

export function PurchasesPage() {
  const [page, setPage] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [businessFilter, setBusinessFilter] = useState('');
  const { businesses } = useBusinessContext();
  const settings = useProgramSettings();
  const pageSize = settings.data?.history_page_size ?? 10;
  const purchases = useMyPurchasesPage(businessFilter, page, pageSize);
  const total = purchases.data?.[0]?.total_count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const businessLabel =
    businesses.find((business) => business.id === businessFilter)?.name ?? null;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Mis compras"
        description={
          businessLabel
            ? `Compras acreditadas en ${businessLabel}.`
            : 'Historial global de compras acreditadas y los loopoints ganados.'
        }
      />

      {businesses.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Filtrar por negocio
          </span>
          <Select
            value={businessFilter || 'all'}
            onValueChange={(value) => {
              setBusinessFilter(value === 'all' ? '' : value);
              setPage(0);
            }}
          >
            <SelectTrigger
              className="w-full sm:w-64"
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
        <EmptyState
          title="Sin compras todavía"
          description="Cuando reclames el QR de tu primera compra, aparecerá aquí."
          icon={ReceiptText}
          action={
            <Button asChild>
              <Link to="/customer">Volver al inicio</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3 sm:hidden">
            {purchases.data.map((purchase) => (
              <Card key={purchase.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate font-semibold">
                        <Store className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        {purchase.business_name}
                      </p>
                      <p className="font-display text-xl font-extrabold">
                        {formatCOP(purchase.amount_cop)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateBogota(purchase.claimed_at ?? purchase.created_at)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-xl font-extrabold text-emerald-700">
                        +{purchase.points_awarded}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        loopoints
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {purchase.items_count > 0
                        ? `${purchase.items_count} producto(s)`
                        : 'Sin detalle de productos'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDetailId(purchase.id)}
                    >
                      Ver detalle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hidden sm:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Negocio</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Ítems</TableHead>
                    <TableHead className="text-right">Loopoints</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.data.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        <p className="font-medium">{purchase.business_name}</p>
                        <p className="text-xs text-muted-foreground">
                          @{purchase.business_slug}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateBogota(purchase.claimed_at ?? purchase.created_at)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCOP(purchase.amount_cop)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {purchase.items_count > 0 ? purchase.items_count : '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-700">
                        +{purchase.points_awarded}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailId(purchase.id)}
                        >
                          Ver detalle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {total > pageSize && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            {total} compras · página {page + 1} de {pageCount}
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
        mode="customer"
      />
    </div>
  );
}
