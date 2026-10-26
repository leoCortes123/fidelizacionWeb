import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ReceiptText } from 'lucide-react';
import { useMyPurchases, useProgramSettings } from '@/features/points/hooks';
import { formatCOP, formatDateBogota } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  const settings = useProgramSettings();
  const pageSize = settings.data?.history_page_size ?? 10;
  const purchases = useMyPurchases(pageSize, page * pageSize);
  const total = purchases.data?.[0]?.total_count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Mis compras"
        description="Historial de compras acreditadas y los loopoints ganados en cada una."
      />

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
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-display text-xl font-extrabold">
                      {formatCOP(purchase.amount_cop)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateBogota(purchase.claimed_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-extrabold text-emerald-700">
                      +{purchase.points_awarded}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      loopoints
                    </p>
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
                    <TableHead>Fecha</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead className="text-right">Loopoints ganados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.data.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        <p className="font-medium">
                          {formatDateBogota(purchase.claimed_at)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Compra acreditada
                        </p>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCOP(purchase.amount_cop)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-700">
                        +{purchase.points_awarded}
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
    </div>
  );
}
