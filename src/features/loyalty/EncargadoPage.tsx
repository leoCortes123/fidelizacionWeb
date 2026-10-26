import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  CreditCard,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  Scan,
  ShieldAlert,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useApproveRedemption,
  useBusinesses,
  useDeliverRedemption,
  useLoyaltyRedemptions,
  useValidateRedemptionToken,
} from '@/features/loyalty/hooks';
import { useBusinessContext } from '@/features/loyalty/businessContext';
import { errorMessage } from '@/lib/errors';
import { formatDateTimeBogota, formatPoints } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/shared/States';
import { RedemptionRequestStatusBadge } from '@/components/shared/StatusBadge';
import { useCountdown } from '@/features/loyalty/useCountdown';
import type { Business, LoyaltyRedemptionWithCustomer } from '@/types';

interface ValidatedRedemption {
  redemption_id: string;
  reward_name: string;
  points_spent: number;
  expires_at: string;
  status: 'pending' | 'approved';
}

export function EncargadoPage() {
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
          description="Elige el negocio para atender redenciones."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((business) => (
            <Card key={business.id} className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="p-6 text-center">
                <Scan className="mx-auto mb-3 size-12 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{business.name}</h3>
                <p className="text-xs text-muted-foreground">{business.slug}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => {
                    setSelectedBusiness(business);
                    navigate('/encargado');
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
          description="Regístrate en un negocio para atender sus redenciones."
          icon={Scan}
        />
      </div>
    );
  }

  return <EncargadoSection key={current.id} business={current} />;
}

function EncargadoSection({ business }: { business: Business }) {
  const { selectedRole, canApproveRedemptions } = useBusinessContext();
  const navigate = useNavigate();
  const canAct =
    selectedRole === 'admin' || (selectedRole === 'encargado' && canApproveRedemptions);

  const validateToken = useValidateRedemptionToken();
  const approveRedemption = useApproveRedemption();
  const deliverRedemption = useDeliverRedemption();
  const pending = useLoyaltyRedemptions(business.id, 'pending');
  const approved = useLoyaltyRedemptions(business.id, 'approved');

  const [token, setToken] = useState('');
  const [validated, setValidated] = useState<ValidatedRedemption | null>(null);
  const [deliveryTarget, setDeliveryTarget] =
    useState<LoyaltyRedemptionWithCustomer | null>(null);
  const [delivering, setDelivering] = useState(false);

  const countdown = useCountdown(validated?.expires_at);
  const qrExpired = Boolean(validated) && countdown.expired;

  if (!canAct) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title={`Atención de redenciones — ${business.name}`}
          description="Valida y entrega las recompensas solicitadas por los clientes."
        />
        <Card className="mx-auto max-w-lg">
          <CardContent className="space-y-3 p-6 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-amber-100 text-amber-900">
              <ShieldAlert className="size-6" aria-hidden="true" />
            </span>
            <h3 className="text-lg font-bold">Sin permiso de aprobación</h3>
            <p className="text-sm text-muted-foreground">
              Tu rol en este negocio es <strong>{selectedRole ?? 'sin rol'}</strong>.
              Pide a un administrador que active el permiso “Puede aprobar
              redenciones” para tu cuenta.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pending.isLoading || approved.isLoading) {
    return <ListSkeleton rows={3} />;
  }
  if (pending.isError || approved.isError) {
    return (
      <ErrorState
        error={pending.error ?? approved.error}
        onRetry={() => {
          void pending.refetch();
          void approved.refetch();
        }}
      />
    );
  }

  const pendingRows = pending.data ?? [];
  const approvedRows = approved.data ?? [];

  async function handleValidate(event: React.FormEvent) {
    event.preventDefault();
    if (!token.trim()) return;
    try {
      const result = await validateToken.mutateAsync({
        businessId: business.id,
        token: token.trim(),
      });
      setValidated({
        redemption_id: result.redemption_id,
        reward_name: result.reward_name,
        points_spent: result.points_spent,
        expires_at: result.expires_at,
        status: 'pending',
      });
      toast.success('Token válido. Revisa la recompensa antes de aprobar.');
    } catch (error) {
      setValidated(null);
      toast.error(errorMessage(error));
    }
  }

  async function handleApprove(approve: boolean) {
    if (!validated) return;
    try {
      await approveRedemption.mutateAsync({
        businessId: business.id,
        redemptionId: validated.redemption_id,
        approve,
      });
      if (approve) {
        setValidated({ ...validated, status: 'approved' });
        toast.success('Redención aprobada. Confirma la entrega al cliente.');
      } else {
        setValidated(null);
        setToken('');
        toast.success('Redención rechazada. Los loopoints fueron devueltos.');
      }
      void pending.refetch();
      void approved.refetch();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function confirmDelivery(redemptionId: string) {
    setDelivering(true);
    try {
      await deliverRedemption.mutateAsync({
        businessId: business.id,
        redemptionId,
      });
      toast.success('Entrega confirmada. Loopoints consumidos.', {
        action: {
          label: 'Registrar compra',
          onClick: () => navigate('/encargado/venta'),
        },
      });
      if (validated?.redemption_id === redemptionId) {
        setValidated(null);
        setToken('');
      }
      setDeliveryTarget(null);
      void pending.refetch();
      void approved.refetch();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setDelivering(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Atención de redenciones — ${business.name}`}
        description="Escanea el QR del cliente, apruébalo y confirma la entrega."
        actions={
          <Button asChild>
            <Link to="/encargado/venta">
              <ReceiptText aria-hidden="true" />
              Registrar compra
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scan className="size-4 text-muted-foreground" aria-hidden="true" />
              Validar código QR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleValidate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qr-token">Código manual del QR</Label>
                <Input
                  id="qr-token"
                  name="token"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="Pega el código si la cámara no abre la pantalla"
                  required
                />
              </div>
              <Button
                type="submit"
                loading={validateToken.isPending}
                className="w-full"
              >
                Validar token
              </Button>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              Al escanear con la cámara se abre la pantalla de confirmación del canje.
              Si no es posible, pega aquí el código aleatorio. Nunca incluye datos
              personales ni saldos, y deja de ser válido al confirmar la entrega.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pendientes de aprobar</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingRows.length === 0 ? (
              <EmptyState
                title="Sin pendientes"
                description="No hay redenciones esperando aprobación."
                icon={CreditCard}
                className="border-0 bg-transparent py-4"
              />
            ) : (
              <ul className="divide-y">
                {pendingRows.map((redemption) => (
                  <li key={redemption.id} className="space-y-1 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{redemption.reward_name}</p>
                      <RedemptionRequestStatusBadge status={redemption.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {redemption.customer_email} ·{' '}
                      {formatPoints(redemption.points_spent)} ·{' '}
                      {formatDateTimeBogota(redemption.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageCheck className="size-4 text-muted-foreground" aria-hidden="true" />
            Aprobadas pendientes de entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          {approvedRows.length === 0 ? (
            <EmptyState
              title="Nada por entregar"
              description="Las redenciones aprobadas aparecerán aquí hasta confirmar la entrega."
              icon={PackageCheck}
              className="border-0 bg-transparent py-4"
            />
          ) : (
            <ul className="divide-y">
              {approvedRows.map((redemption) => (
                <li
                  key={redemption.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">{redemption.reward_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {redemption.customer_email} ·{' '}
                      {formatPoints(redemption.points_spent)} · aprobado{' '}
                      {formatDateTimeBogota(redemption.approved_at)}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setDeliveryTarget(redemption)}>
                    <PackageCheck aria-hidden="true" />
                    Confirmar entrega
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={validated !== null}
        onOpenChange={(open) => {
          if (!open) {
            setValidated(null);
            setToken('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {validated?.status === 'approved' ? 'Redención aprobada' : 'Validar redención'}
            </DialogTitle>
            <DialogDescription>
              {validated?.status === 'approved' ? (
                <>
                  Entrega <strong>{validated.reward_name}</strong> al cliente y confirma
                  para consumir {formatPoints(validated.points_spent)}.
                </>
              ) : (
                <>
                  El cliente solicita canjear <strong>{validated?.reward_name}</strong>{' '}
                  por {formatPoints(validated?.points_spent ?? 0)}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {validated?.status === 'pending' && (
            <div
              className={
                qrExpired
                  ? 'flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'
                  : 'flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-sm'
              }
            >
              {qrExpired ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              ) : (
                <RefreshCw className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <p>
                {qrExpired
                  ? 'El QR venció. Pide al cliente que lo reemita desde “Mis canjes” antes de aprobar.'
                  : `El QR vence en ${countdown.label} (${formatDateTimeBogota(
                      validated?.expires_at,
                    )}).`}
              </p>
            </div>
          )}

          <DialogFooter>
            {validated?.status === 'pending' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => void handleApprove(false)}
                  disabled={approveRedemption.isPending || delivering}
                >
                  <X aria-hidden="true" />
                  Rechazar
                </Button>
                <Button
                  onClick={() => void handleApprove(true)}
                  loading={approveRedemption.isPending}
                  disabled={qrExpired}
                >
                  <Check aria-hidden="true" />
                  Aprobar
                </Button>
              </>
            ) : (
              <Button
                onClick={() => void confirmDelivery(validated!.redemption_id)}
                loading={delivering}
              >
                <PackageCheck aria-hidden="true" />
                Confirmar entrega
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deliveryTarget !== null}
        onOpenChange={(open) => {
          if (!open && !delivering) setDeliveryTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar entrega</DialogTitle>
            <DialogDescription>
              ¿Entregaste <strong>{deliveryTarget?.reward_name}</strong> a{' '}
              {deliveryTarget?.customer_email}? Los{' '}
              {formatPoints(deliveryTarget?.points_spent ?? 0)} quedarán consumidos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeliveryTarget(null)}
              disabled={delivering}
            >
              Volver
            </Button>
            <Button
              onClick={() => void confirmDelivery(deliveryTarget!.id)}
              loading={delivering}
            >
              <PackageCheck aria-hidden="true" />
              Confirmar entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <RefreshCw className="size-4" aria-hidden="true" />
        Cada paso (validar, aprobar, entregar) queda registrado en la auditoría del
        negocio con el responsable.
      </p>
    </div>
  );
}
