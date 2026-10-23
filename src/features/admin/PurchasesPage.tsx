import { useState } from 'react';
import { Ban, ChevronLeft, ChevronRight, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminPurchases, useCancelPurchase } from './hooks';
import { formatCOP, formatDateTimeBogota, formatPoints } from '@/lib/format';
import { errorMessage } from '@/lib/errors';
import type { StaffPurchase } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { PurchaseStatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/shared/States';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const PAGE_SIZE = 15;

function canCancel(purchase: StaffPurchase) {
  return purchase.status === 'pending_claim' || purchase.status === 'expired';
}

export function PurchasesPage() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('all');
  const purchases = useAdminPurchases(
    page,
    PAGE_SIZE,
    status === 'all' ? '' : status,
  );
  const cancelPurchase = useCancelPurchase();
  const [target, setTarget] = useState<StaffPurchase | null>(null);
  const [reason, setReason] = useState('');

  const total = purchases.data?.[0]?.total_count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function openCancel(purchase: StaffPurchase) {
    setTarget(purchase);
    setReason('');
  }

  async function confirmCancel() {
    if (!target) return;
    if (reason.trim().length < 3) {
      toast.error('Escribe un motivo de al menos 3 caracteres.');
      return;
    }
    try {
      await cancelPurchase.mutateAsync({
        purchaseId: target.id,
        reason: reason.trim(),
      });
      toast.success('Compra cancelada');
      setTarget(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Compras"
        description="Historial de QR generados. Puedes cancelar los pendientes o expirados."
        actions={
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por estado">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending_claim">Pendientes</SelectItem>
              <SelectItem value="claimed">Reclamadas</SelectItem>
              <SelectItem value="expired">Expiradas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {purchases.isLoading ? (
        <ListSkeleton rows={5} />
      ) : purchases.isError ? (
        <ErrorState error={purchases.error} onRetry={() => void purchases.refetch()} />
      ) : !purchases.data || purchases.data.length === 0 ? (
        <EmptyState
          title="Sin compras en este filtro"
          description="Genera un QR nuevo o cambia el filtro de estado."
          icon={ReceiptText}
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {purchases.data.map((purchase) => (
              <Card key={purchase.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-xl font-extrabold">
                        {formatCOP(purchase.amount_cop)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTimeBogota(purchase.created_at)}
                      </p>
                    </div>
                    <PurchaseStatusBadge status={purchase.status} />
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
                      <span className="text-xs text-muted-foreground">
                        Sin reclamar
                      </span>
                    )}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {purchase.points_awarded > 0
                        ? formatPoints(purchase.points_awarded)
                        : 'Sin puntos aún'}
                    </span>
                    {canCancel(purchase) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCancel(purchase)}
                      >
                        <Ban aria-hidden="true" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Importe</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Puntos</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.data.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>
                        <p className="font-medium">
                          {formatDateTimeBogota(purchase.created_at)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Vence {formatDateTimeBogota(purchase.expires_at)}
                        </p>
                      </TableCell>
                      <TableCell className="font-semibold">
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
                          <span className="text-xs text-muted-foreground">
                            Sin reclamar
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <PurchaseStatusBadge status={purchase.status} />
                      </TableCell>
                      <TableCell>{purchase.points_awarded}</TableCell>
                      <TableCell className="text-right">
                        {canCancel(purchase) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCancel(purchase)}
                          >
                            <Ban aria-hidden="true" />
                            Cancelar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {total > PAGE_SIZE && (
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

      <ConfirmDialog
        open={Boolean(target)}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
        title="Cancelar compra"
        description={
          target
            ? `La compra de ${formatCOP(target.amount_cop)} quedará cancelada y su QR no podrá reclamarse.`
            : undefined
        }
        confirmLabel="Cancelar compra"
        destructive
        loading={cancelPurchase.isPending}
        onConfirm={confirmCancel}
      >
        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Motivo</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ej.: cobro duplicado, error de digitación…"
            maxLength={300}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
