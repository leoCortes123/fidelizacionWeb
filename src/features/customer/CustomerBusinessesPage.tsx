import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Gift,
  Link2,
  Sparkles,
  Store,
  TicketCheck,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { useCustomerBusinessesSummary } from '@/features/loyalty/hooks';
import { formatLoopoints } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, CardSkeleton } from '@/components/shared/States';
import { FrequencyBadge } from '@/components/shared/StatusBadge';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Extrae el slug de un enlace de invitación o de un código pegado. */
export function parseInvitationSlug(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  const fromLink = raw.match(/\/join\/([^/?#\s]+)/i);
  const candidate = (fromLink?.[1] ?? raw).trim().toLowerCase();
  return SLUG_PATTERN.test(candidate) ? candidate : null;
}

export function CustomerBusinessesPage() {
  const { displayName } = useAuth();
  const summary = useCustomerBusinessesSummary();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState('');
  const [invitationError, setInvitationError] = useState<string | null>(null);

  const firstName = displayName.split(' ')[0] || 'hola';
  const rows = summary.data ?? [];
  const total = rows.reduce((sum, row) => sum + row.balance, 0);
  const ready = rows.reduce((sum, row) => sum + row.ready_rewards, 0);

  function openInvitation(event: React.FormEvent) {
    event.preventDefault();
    const slug = parseInvitationSlug(invitation);
    if (!slug) {
      setInvitationError(
        'Pega el enlace de invitación o el código del negocio (por ejemplo, mi-negocio).',
      );
      return;
    }
    setInvitationError(null);
    navigate(`/join/${slug}`);
  }

  if (summary.isLoading) {
    return (
      <div className="space-y-5">
        <CardSkeleton className="h-36" />
        <div className="grid gap-4 sm:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (summary.isError) {
    return (
      <ErrorState
        error={summary.error}
        onRetry={() => void summary.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`¡Hola, ${firstName}!`}
        description="Tus loopoints, recompensas y negocios en un solo lugar."
      />

      {rows.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="Aún no participas en ningún negocio"
            description="Escanea el QR de invitación del negocio o abre su enlace para empezar a sumar loopoints."
            icon={Building2}
          />
          <Card className="mx-auto max-w-md">
            <CardContent className="space-y-3 p-5">
              <div className="space-y-1">
                <Label htmlFor="invitation-link">
                  Enlace o código del negocio
                </Label>
                <p className="text-xs text-muted-foreground">
                  Ejemplo: https://loopoint.app/join/mi-negocio
                </p>
              </div>
              <form onSubmit={openInvitation} className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="invitation-link"
                  value={invitation}
                  onChange={(event) => {
                    setInvitation(event.target.value);
                    setInvitationError(null);
                  }}
                  placeholder="mi-negocio"
                  aria-invalid={invitationError ? true : undefined}
                  aria-describedby={
                    invitationError ? 'invitation-link-error' : undefined
                  }
                />
                <Button type="submit" className="shrink-0">
                  <Link2 aria-hidden="true" />
                  Abrir invitación
                </Button>
              </form>
              {invitationError && (
                <p
                  id="invitation-link-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {invitationError}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-0 bg-foreground text-background">
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-background/60">
                  Loopoints totales
                </p>
                <p
                  data-testid="total-points-balance"
                  className="mt-1 break-all font-display text-4xl font-extrabold text-amber-300"
                >
                  {total}
                </p>
                <p className="text-xs text-background/70">
                  {formatLoopoints(total)} en {rows.length}{' '}
                  {rows.length === 1 ? 'negocio' : 'negocios'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex h-full items-center gap-3 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-2xl font-extrabold">{ready}</p>
                  <p className="text-xs text-muted-foreground">
                    {ready === 1
                      ? 'recompensa por reclamar'
                      : 'recompensas por reclamar'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex h-full items-center gap-3 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                  <TicketCheck className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-2xl font-extrabold">
                    {rows.reduce((sum, row) => sum + row.pending_redemptions, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    canjes en curso
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <section className="space-y-3" aria-labelledby="businesses-title">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2
                  id="businesses-title"
                  className="font-display text-xl font-extrabold"
                >
                  Mis negocios
                </h2>
                <p className="text-sm text-muted-foreground">
                  Elige un negocio para ver su saldo, recompensas y movimientos.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="shrink-0">
                <Link to="/customer/purchases">
                  <Store aria-hidden="true" />
                  Compras
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((row) => (
                <Link
                  key={row.business_id}
                  to={`/customer/business/${row.business_id}`}
                  className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Card
                    className={cn(
                      'h-full transition-shadow group-hover:shadow-md',
                      row.ready_rewards > 0
                        ? 'border-emerald-300 dark:border-emerald-800'
                        : undefined,
                    )}
                  >
                    <CardContent className="flex h-full flex-col gap-4 p-5">
                      <div className="flex items-start gap-3">
                        <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary text-secondary-foreground">
                          {row.logo_url ? (
                            <img
                              src={row.logo_url}
                              alt={`Logo de ${row.name}`}
                              className="size-full object-cover"
                            />
                          ) : (
                            <Building2 className="size-5" aria-hidden="true" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-bold leading-tight">
                            {row.name}
                          </h3>
                          <p className="truncate text-xs text-muted-foreground">
                            @{row.slug}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            <FrequencyBadge
                              isFrequent={row.is_frequent}
                              isActive={row.is_frequent_active}
                            />
                            {!row.loyalty_active && (
                              <Badge variant="muted">Programa inactivo</Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto flex items-end justify-between gap-3">
                        <div>
                          <p className="font-display text-4xl font-extrabold leading-none">
                            {row.balance}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            loopoints disponibles
                          </p>
                        </div>
                        {row.ready_rewards > 0 ? (
                          <Badge variant="success" className="shrink-0">
                            <Gift className="mr-1 size-3.5" aria-hidden="true" />
                            {row.ready_rewards}{' '}
                            {row.ready_rewards === 1 ? 'lista' : 'listas'}
                          </Badge>
                        ) : row.pending_redemptions > 0 ? (
                          <Badge variant="secondary" className="shrink-0">
                            {row.pending_redemptions} en curso
                          </Badge>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                        <span>
                          {row.last_purchase_at
                            ? 'Última compra registrada'
                            : 'Sin compras todavía'}
                        </span>
                        <ArrowRight
                          className="size-4 transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <Card className="border-dashed bg-secondary/30">
            <CardContent className="space-y-2 p-5 text-sm">
              <p className="font-semibold">¿Quieres sumar otro negocio?</p>
              <p className="text-muted-foreground">
                Pide en caja el enlace de invitación o escanea su QR. Tus
                loopoints de cada negocio se mantienen separados y siempre
                disponibles aquí.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
