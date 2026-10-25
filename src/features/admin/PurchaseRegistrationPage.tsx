import { useRef, useState } from 'react';
import {
  BadgeCheck,
  ReceiptText,
  Search,
  Undo2,
  UserRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useLoyaltyProgram,
  useRegisterPurchase,
  useRevertPurchase,
  useSearchProfiles,
} from '@/features/loyalty/hooks';
import { errorMessage } from '@/lib/errors';
import { formatCOP, formatNumber, parseCopInput } from '@/lib/format';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingScreen } from '@/components/shared/States';
import { BusinessGate } from './BusinessGate';
import type {
  Business,
  ProfileLookup,
  PurchaseRegisterResult,
} from '@/types';

function newIdempotencyKey(): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return random.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64).padEnd(8, '0');
}

export function PurchaseRegistrationPage() {
  return (
    <BusinessGate
      title="Registrar compra"
      description="Acredita puntos a un cliente afiliado sin usar códigos QR."
      icon={ReceiptText}
      emptyDescription="Registra un negocio para acreditar compras a tus clientes."
    >
      {(business) => <PurchaseRegistrationSection key={business.id} business={business} />}
    </BusinessGate>
  );
}

interface RegistrationResult {
  result: PurchaseRegisterResult;
  customer: ProfileLookup;
  amountCop: number;
}

function PurchaseRegistrationSection({ business }: { business: Business }) {
  const program = useLoyaltyProgram(business.id);
  const register = useRegisterPurchase();
  const revert = useRevertPurchase();

  const [query, setQuery] = useState('');
  const [customer, setCustomer] = useState<ProfileLookup | null>(null);
  const [amount, setAmount] = useState('');
  const [eligible, setEligible] = useState('');
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [revertOpen, setRevertOpen] = useState(false);
  const [reason, setReason] = useState('');
  const keyRef = useRef<string | null>(null);

  const search = useSearchProfiles(business.id, query);

  const amountCop = parseCopInput(amount);
  const eligibleCop =
    eligible.trim() === '' ? amountCop : parseCopInput(eligible);
  const copPerPoint = program.data?.cop_per_point_unit ?? null;
  const preview =
    eligibleCop !== null && copPerPoint && copPerPoint > 0
      ? Math.floor(eligibleCop / copPerPoint)
      : null;

  if (program.isLoading) return <LoadingScreen label="Cargando el programa…" />;
  if (program.isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No pudimos cargar el programa de puntos</AlertTitle>
        <AlertDescription>{errorMessage(program.error)}</AlertDescription>
      </Alert>
    );
  }

  const programActive = program.data?.is_active === true;

  function currentKey(): string {
    if (!keyRef.current) keyRef.current = newIdempotencyKey();
    return keyRef.current;
  }

  function validationError(): string | null {
    if (!customer) return 'Elige el cliente que realizó la compra.';
    if (!programActive) return 'Activa el programa de puntos antes de acreditar compras.';
    if (amountCop === null || amountCop <= 0) return 'Introduce un importe mayor que cero.';
    if (eligibleCop === null || eligibleCop < 0) {
      return 'El importe elegible no es válido.';
    }
    if (eligibleCop > amountCop) {
      return 'El importe elegible no puede superar el importe de la compra.';
    }
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const problem = validationError();
    if (problem) {
      toast.error(problem);
      return;
    }

    try {
      const response = await register.mutateAsync({
        businessId: business.id,
        customerId: customer!.user_id,
        amountCop: amountCop!,
        eligibleAmountCop: eligibleCop!,
        idempotencyKey: currentKey(),
      });

      setResult({ result: response, customer: customer!, amountCop: amountCop! });
      keyRef.current = null;
      setAmount('');
      setEligible('');
      setQuery('');
      setCustomer(null);

      if (response.duplicate) {
        toast.info(response.message ?? 'La compra ya había sido registrada.');
      } else {
        toast.success(
          `Se acreditaron ${formatNumber(response.points_earned)} puntos a ${customer!.full_name || customer!.email}.`,
        );
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleRevert() {
    if (!result?.result.purchase_event_id) return;
    try {
      const response = await revert.mutateAsync({
        businessId: business.id,
        customerId: result.customer.user_id,
        eventId: result.result.purchase_event_id,
        reason: reason.trim(),
      });
      toast.success(
        response.duplicate
          ? response.message ?? 'La compra ya estaba revertida.'
          : `Reverso aplicado: se quitaron ${formatNumber(response.points_reversed)} puntos.`,
      );
      setRevertOpen(false);
      setReason('');
      setResult(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Registrar compra — ${business.name}`}
        description="Acredita puntos de una compra presencial. La operación queda en la auditoría del negocio."
      />

      {!programActive && (
        <Alert variant="warning">
          <AlertTitle>El programa de puntos está inactivo</AlertTitle>
          <AlertDescription>
            Actívalo en Configuración → Programa antes de acreditar compras.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Datos de la compra</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="purchase-customer-search">Cliente</Label>
                {customer ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {customer.full_name || 'Sin nombre'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {customer.email}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCustomer(null)}
                    >
                      <X aria-hidden="true" />
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search
                        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        id="purchase-customer-search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Busca por nombre o correo (mínimo 2 letras)"
                        className="pl-9"
                        autoComplete="off"
                      />
                    </div>
                    {query.trim().length >= 2 && (
                      <div className="max-h-64 overflow-y-auto rounded-lg border">
                        {search.isFetching ? (
                          <p className="p-3 text-sm text-muted-foreground">Buscando…</p>
                        ) : search.isError ? (
                          <p className="p-3 text-sm text-destructive">
                            {errorMessage(search.error)}
                          </p>
                        ) : !search.data || search.data.length === 0 ? (
                          <p className="p-3 text-sm text-muted-foreground">
                            No encontramos clientes con ese nombre o correo.
                          </p>
                        ) : (
                          search.data.map((profile) => (
                            <button
                              key={profile.user_id}
                              type="button"
                              disabled={!profile.already_member}
                              onClick={() => {
                                setCustomer(profile);
                                setQuery('');
                              }}
                              className="flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left last:border-b-0 enabled:hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold">
                                  {profile.full_name || 'Sin nombre'}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {profile.email}
                                </span>
                              </span>
                              <Badge variant={profile.already_member ? 'success' : 'muted'}>
                                {profile.already_member ? 'Afiliado' : 'No afiliado'}
                              </Badge>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="purchase-amount">Importe de la compra (COP)</Label>
                  <Input
                    id="purchase-amount"
                    inputMode="numeric"
                    placeholder="15.500"
                    value={amount}
                    onChange={(event) => {
                      setAmount(event.target.value);
                      setEligible('');
                    }}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {amountCop !== null
                      ? formatCOP(amountCop)
                      : 'Total pagado por el cliente.'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase-eligible">Importe elegible (opcional)</Label>
                  <Input
                    id="purchase-eligible"
                    inputMode="numeric"
                    placeholder="Igual al importe"
                    value={eligible}
                    onChange={(event) => setEligible(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Déjalo vacío para usar el importe completo.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Puntos estimados
                </p>
                <p className="font-display text-3xl font-extrabold text-primary">
                  {preview === null ? '—' : formatNumber(preview)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {copPerPoint
                    ? `1 punto por cada ${formatCOP(copPerPoint)} elegibles.`
                    : 'Configura el programa para calcular puntos.'}
                </p>
              </div>

              <Button
                type="submit"
                disabled={!programActive || register.isPending}
                loading={register.isPending}
              >
                <BadgeCheck aria-hidden="true" />
                Acreditar puntos
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {result ? (
            <Card>
              <CardHeader>
                <CardTitle>Compra registrada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {result.customer.full_name || result.customer.email}
                  </p>
                  <p className="text-sm">
                    Compra de {formatCOP(result.amountCop)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="font-display text-2xl font-extrabold text-primary">
                      +{formatNumber(result.result.points_earned)}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      puntos
                    </p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="font-display text-2xl font-extrabold">
                      {formatNumber(result.result.balance)}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      saldo actual
                    </p>
                  </div>
                </div>
                {result.result.duplicate && (
                  <Alert variant="info">
                    <AlertDescription>
                      {result.result.message ?? 'La compra ya estaba registrada.'}
                    </AlertDescription>
                  </Alert>
                )}
                {!result.result.duplicate && result.result.purchase_event_id && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setRevertOpen(true)}
                  >
                    <Undo2 aria-hidden="true" />
                    Reversar esta compra
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <UserRound className="size-10 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  Busca al cliente, introduce el importe y confirma. El resultado
                  aparecerá aquí con el saldo actualizado.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={revertOpen} onOpenChange={setRevertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reversar compra</DialogTitle>
            <DialogDescription>
              Se quitarán {formatNumber(result?.result.points_earned ?? 0)} puntos del
              saldo del cliente. La operación queda auditada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="revert-reason">Motivo</Label>
            <Textarea
              id="revert-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={300}
              placeholder="Cobro duplicado, devolución, error de digitación…"
            />
            <p className="text-xs text-muted-foreground">
              Opcional. Máximo 300 caracteres.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRevertOpen(false)}
              disabled={revert.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleRevert()}
              loading={revert.isPending}
            >
              Reversar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
