import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, PackageCheck, RefreshCw, TicketCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  useApproveRedemption,
  useBusinesses,
  useCancelRedemption,
  useDeliverRedemption,
  useLoyaltyRedemptions,
} from '@/features/loyalty/hooks';
import { useBusinessContext } from '@/features/loyalty/businessContext';
import { errorMessage } from '@/lib/errors';
import { formatDateTimeBogota, formatPoints } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, ListSkeleton, LoadingScreen } from '@/components/shared/States';
import { RedemptionRequestStatusBadge } from '@/components/shared/StatusBadge';
import type { Business, LoyaltyRedemptionWithCustomer } from '@/types';

type ActionKind = 'approve' | 'reject' | 'deliver' | 'cancel';

const statusOptions: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobados' },
  { value: 'delivered', label: 'Entregados' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: 'expired', label: 'Vencidos' },
];

const actionCopy: Record<
  ActionKind,
  { title: string; confirm: string; description: string; destructive: boolean }
> = {
  approve: {
    title: 'Aprobar solicitud',
    confirm: 'Aprobar',
    description:
      'Se validará el canje y el cliente podrá recibir la recompensa. Confirma la entrega después de darla.',
    destructive: false,
  },
  reject: {
    title: 'Rechazar solicitud',
    confirm: 'Rechazar y devolver loopoints',
    description:
      'Se cancelará la solicitud y los loopoints reservados volverán al saldo del cliente.',
    destructive: true,
  },
  deliver: {
    title: 'Confirmar entrega',
    confirm: 'Confirmar entrega',
    description:
      'Marca la recompensa como entregada. Los loopoints quedan consumidos definitivamente.',
    destructive: false,
  },
  cancel: {
    title: 'Cancelar solicitud',
    confirm: 'Cancelar y devolver loopoints',
    description:
      'Solo para solicitudes pendientes. Los loopoints reservados volverán al cliente.',
    destructive: true,
  },
};

export function RedemptionsPage() {
  const businesses = useBusinesses();
  const { selectedBusiness, setSelectedBusiness } = useBusinessContext();
  const navigate = useNavigate();

  if (businesses.isLoading) return <ListSkeleton rows={3} />;
  if (businesses.isError) {
    return <ErrorState error={businesses.error} onRetry={() => void businesses.refetch()} />;
  }

  const list = businesses.data ?? [];

  if (list.length > 1 && !selectedBusiness) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Selecciona un negocio"
          description="Elige el negocio cuyas solicitudes deseas atender."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((business) => (
            <Card key={business.id} className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-6 text-center">
                <TicketCheck className="mx-auto mb-3 size-12 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{business.name}</h3>
                <p className="text-xs text-muted-foreground">{business.slug}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => {
                    setSelectedBusiness(business);
                    navigate('/admin/redemptions');
                  }}
                >
                  Seleccionar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const current = selectedBusiness ?? list[0];
  if (!current) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Sin negocios" description="No tienes negocios asignados." />
        <EmptyState
          title="Sin negocios"
          description="Registra un negocio para atender sus solicitudes."
          icon={TicketCheck}
        />
      </div>
    );
  }

  return <RedemptionsSection key={current.id} business={current} />;
}

function RedemptionsSection({ business }: { business: Business }) {
  const { selectedRole, canApproveRedemptions } = useBusinessContext();
  const canAct =
    selectedRole === 'admin' || (selectedRole === 'encargado' && canApproveRedemptions);
  const canCancel = selectedRole === 'admin';

  const [statusFilter, setStatusFilter] = useState('all');
  const redemptions = useLoyaltyRedemptions(
    business.id,
    statusFilter === 'all' ? '' : statusFilter,
  );
  const approveRedemption = useApproveRedemption();
  const deliverRedemption = useDeliverRedemption();
  const cancelRedemption = useCancelRedemption();

  const [action, setAction] = useState<{
    kind: ActionKind;
    redemption: LoyaltyRedemptionWithCustomer;
  } | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (redemptions.isLoading) return <LoadingScreen label="Cargando solicitudes…" />;
  if (redemptions.isError) {
    return (
      <ErrorState error={redemptions.error} onRetry={() => void redemptions.refetch()} />
    );
  }

  const rows = redemptions.data ?? [];

  function openAction(kind: ActionKind, redemption: LoyaltyRedemptionWithCustomer) {
    setAction({ kind, redemption });
    setReason('');
  }

  async function runAction() {
    if (!action) return;
    const { kind, redemption } = action;

    if (kind === 'cancel' && reason.trim().length < 3) {
      toast.error('Escribe un motivo de al menos 3 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      if (kind === 'deliver') {
        await deliverRedemption.mutateAsync({
          businessId: business.id,
          redemptionId: redemption.id,
        });
        toast.success('Entrega confirmada. Loopoints consumidos.');
      } else if (kind === 'cancel') {
        await cancelRedemption.mutateAsync({
          businessId: business.id,
          redemptionId: redemption.id,
          reason: reason.trim(),
        });
        toast.success('Solicitud cancelada y loopoints devueltos.');
      } else {
        await approveRedemption.mutateAsync({
          businessId: business.id,
          redemptionId: redemption.id,
          approve: kind === 'approve',
        });
        toast.success(
          kind === 'approve'
            ? 'Solicitud aprobada. Confirma la entrega al cliente.'
            : 'Solicitud rechazada y loopoints devueltos.',
        );
      }
      setAction(null);
      setReason('');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  const copy = action ? actionCopy[action.kind] : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Solicitudes — ${business.name}`}
        description="Valida, aprueba, entrega o cancela los canjes solicitados por tus clientes."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44" aria-label="Filtrar por estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => void redemptions.refetch()}
              aria-label="Actualizar solicitudes"
            >
              <RefreshCw aria-hidden="true" />
            </Button>
          </div>
        }
      />

      {!canAct && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Tu rol en este negocio es <strong>{selectedRole ?? 'sin rol'}</strong>
          {selectedRole === 'encargado' ? ' y no tienes permiso de aprobación' : ''}.
          Puedes consultar las solicitudes, pero solo un administrador o un encargado
          autorizado puede aprobarlas y entregarlas.
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="Sin solicitudes"
          description={
            statusFilter === 'all'
              ? 'Todavía no hay canjes solicitados en este negocio.'
              : 'No hay solicitudes con ese estado.'
          }
          icon={TicketCheck}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3">Cliente</th>
                <th scope="col" className="px-4 py-3">Recompensa</th>
                <th scope="col" className="px-4 py-3 text-right">Loopoints</th>
                <th scope="col" className="px-4 py-3">Fecha</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((redemption) => (
                <tr key={redemption.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{redemption.customer_email}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {redemption.code}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{redemption.reward_name}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      {redemption.reward_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatPoints(redemption.points_spent)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDateTimeBogota(redemption.created_at)}
                    {redemption.delivered_at && (
                      <span className="block text-emerald-700">
                        Entregado {formatDateTimeBogota(redemption.delivered_at)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <RedemptionRequestStatusBadge status={redemption.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {redemption.status === 'pending' && canAct && (
                        <>
                          <Button size="sm" onClick={() => openAction('approve', redemption)}>
                            <Check aria-hidden="true" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAction('reject', redemption)}
                          >
                            <X aria-hidden="true" />
                            Rechazar
                          </Button>
                        </>
                      )}
                      {redemption.status === 'pending' && canCancel && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openAction('cancel', redemption)}
                        >
                          Cancelar
                        </Button>
                      )}
                      {redemption.status === 'approved' && canAct && (
                        <Button
                          size="sm"
                          onClick={() => openAction('deliver', redemption)}
                        >
                          <PackageCheck aria-hidden="true" />
                          Confirmar entrega
                        </Button>
                      )}
                      {redemption.status === 'cancelled' && (
                        <span className="text-xs text-muted-foreground">
                          Loopoints devueltos
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Aprobar consume el token QR: el cliente ya no podrá reutilizarlo. Cancelar o
        rechazar devuelve los loopoints reservados. Cada paso queda en la auditoría.
      </p>

      <Dialog
        open={action !== null}
        onOpenChange={(open) => {
          if (!open && !submitting) {
            setAction(null);
            setReason('');
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
                  {' '}
                  <strong>{action.redemption.reward_name}</strong> ·{' '}
                  {formatPoints(action.redemption.points_spent)} ·{' '}
                  {action.redemption.customer_email}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {action?.kind === 'cancel' && (
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
                Se guarda en la auditoría junto con los loopoints devueltos.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setAction(null);
                setReason('');
              }}
              disabled={submitting}
            >
              Volver
            </Button>
            <Button
              type="button"
              variant={copy?.destructive ? 'destructive' : 'default'}
              onClick={() => void runAction()}
              loading={submitting}
            >
              {copy?.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
