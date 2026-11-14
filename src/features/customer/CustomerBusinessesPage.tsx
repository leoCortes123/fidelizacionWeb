import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Coins,
  Gift,
  Link2,
  Sparkles,
  Store,
  TicketCheck,
} from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  useCustomerBusinessesClosestRewards,
  useCustomerBusinessesSummary,
} from "@/features/loyalty/hooks";
import { formatLoopoints, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, CardSkeleton } from "@/components/shared/States";
import { FrequencyBadge } from "@/components/shared/StatusBadge";
import { PlayerCard } from "./PlayerCard";

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
  const { displayName, user } = useAuth();
  const summary = useCustomerBusinessesSummary();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState("");
  const [invitationError, setInvitationError] = useState<string | null>(null);

  const firstName = displayName.trim().split(/\s+/)[0] ?? "";
  const rows = summary.data ?? [];
  const closest = useCustomerBusinessesClosestRewards(rows, user?.id ?? "");
  const total = rows.reduce((sum, row) => sum + row.balance, 0);
  const ready = rows.reduce((sum, row) => sum + row.ready_rewards, 0);
  const pendingTotal = rows.reduce((sum, row) => sum + row.pending_redemptions, 0);

  function openInvitation(event: React.FormEvent) {
    event.preventDefault();
    const slug = parseInvitationSlug(invitation);
    if (!slug) {
      setInvitationError(
        "Pega el enlace de invitación o el código del negocio (por ejemplo, mi-negocio).",
      );
      return;
    }
    setInvitationError(null);
    navigate(`/join/${slug}`);
  }

  if (summary.isLoading) {
    return (
      <div className="space-y-5">
        <CardSkeleton className="h-44" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (summary.isError) {
    return <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="space-y-2">
        <span className="retro-kicker">
          <span className="text-[var(--gold)]" aria-hidden="true">
            ★
          </span>
          TU BILLETERA DE PUNTOS
        </span>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-4xl">
          {firstName ? `¡Hola, ${firstName}!` : "¡Hola!"}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
          Tus loopoints, recompensas más cercanas y negocios afiliados en un solo lugar.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="space-y-5">
          <EmptyState
            title="Aún no participas en ningún negocio"
            description="Escanea el QR de invitación del negocio o abre su enlace para empezar a sumar loopoints."
            icon={Building2}
            className="retro-card"
          />
          <div className="retro-card mx-auto max-w-md p-4 sm:p-5">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="invitation-link" className="font-mono text-xs font-bold uppercase">
                  Enlace o código del negocio
                </Label>
                <p className="font-mono text-xs text-[var(--ink-soft)]">
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
                  className="border-2 border-[var(--line)] bg-[var(--paper)] text-[var(--ink)]"
                  aria-invalid={invitationError ? true : undefined}
                  aria-describedby={invitationError ? "invitation-link-error" : undefined}
                />
                <Button
                  type="submit"
                  className="retro-btn retro-btn-dark shrink-0 border-2 border-[var(--line)]"
                >
                  <Link2 aria-hidden="true" />
                  Abrir invitación
                </Button>
              </form>
              {invitationError && (
                <p id="invitation-link-error" role="alert" className="text-xs font-semibold text-[var(--red)]">
                  {invitationError}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Hero Arcade: Resumen + Player Card con recompensas más cercanas */}
          <section
            aria-label="Resumen y recompensas más cercanas"
            className="grid gap-6 lg:grid-cols-12 lg:items-start"
          >
            <div className="space-y-3 lg:col-span-5">
              <div className="retro-card retro-card-dark p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ffd166]">
                    Loopoints totales
                  </p>
                  <Coins className="size-4 text-[#ffd166]" aria-hidden="true" />
                </div>
                <p
                  data-testid="total-points-balance"
                  className="mt-2 break-all font-pixel text-3xl leading-tight text-[#ffd166] sm:text-4xl"
                >
                  {formatNumber(total)}
                </p>
                <p className="mt-2 font-mono text-xs text-[#eadec5]">
                  {formatLoopoints(total)} en {rows.length}{" "}
                  {rows.length === 1 ? "negocio" : "negocios"}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="retro-stat-chip">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 shrink-0 place-items-center border-2 border-[var(--line)] bg-[#34d399] text-[#1e1c1a]">
                      <Sparkles className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <span className="retro-stat-key">Listas</span>
                      <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                        {ready === 1 ? "recompensa por reclamar" : "recompensas por reclamar"}
                      </p>
                    </div>
                  </div>
                  <strong className="font-pixel text-lg text-[var(--ink)]">{ready}</strong>
                </div>

                <div className="retro-stat-chip">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-9 shrink-0 place-items-center border-2 border-[var(--line)] bg-[#22d3ee] text-[#1e1c1a]">
                      <TicketCheck className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <span className="retro-stat-key">Canjes</span>
                      <p className="mt-0.5 text-xs text-[var(--ink-muted)]">canjes en curso</p>
                    </div>
                  </div>
                  <strong className="font-pixel text-lg text-[var(--ink)]">{pendingTotal}</strong>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <Link to="/customer/purchases" className="retro-btn retro-btn-light flex-1 text-xs">
                  <Store className="size-3.5" aria-hidden="true" />
                  Compras
                </Link>
                <Link
                  to="/customer/redemptions"
                  className="retro-btn retro-btn-light flex-1 text-xs"
                >
                  <TicketCheck className="size-3.5" aria-hidden="true" />
                  Mis canjes
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <PlayerCard items={closest.items} />
            </div>
          </section>

          {/* Lista de negocios del cliente */}
          <section className="space-y-4" aria-labelledby="businesses-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2
                  id="businesses-title"
                  className="font-display text-2xl font-bold tracking-tight text-[var(--ink)]"
                >
                  Mis negocios
                </h2>
                <p className="text-sm text-[var(--ink-muted)]">
                  Selecciona o navega con Tab a un negocio para ver su historial, puntos y canjear
                  recompensas.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((row) => {
                const info = closest.byBusinessId.get(row.business_id);
                const nextReward = info?.nextReward;
                const progressPct = info?.progressPct ?? 0;

                return (
                  <Link
                    key={row.business_id}
                    to={`/customer/business/${row.business_id}`}
                    className="group block focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--blue)]"
                  >
                    <article
                      className={cn(
                        "retro-card retro-card-interactive flex h-full flex-col gap-4 p-4 sm:p-5",
                        row.ready_rewards > 0 && "retro-card-alt",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid size-12 shrink-0 place-items-center overflow-hidden border-2 border-[var(--line)] bg-[var(--paper-deep)] text-[var(--ink)]">
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
                          <h3 className="truncate font-bold leading-tight text-[var(--ink)]">
                            {row.name}
                          </h3>
                          <p className="truncate font-mono text-xs text-[var(--ink-soft)]">
                            @{row.slug}
                          </p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
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

                      <div className="mt-auto space-y-2.5">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <p className="font-pixel text-2xl leading-none text-[var(--red)]">
                              {row.balance}
                            </p>
                            <p className="mt-1.5 font-mono text-[11px] uppercase text-[var(--ink-soft)]">
                              loopoints disponibles
                            </p>
                          </div>
                          {row.ready_rewards > 0 ? (
                            <span className="inline-flex shrink-0 items-center gap-1 border-2 border-[var(--line)] bg-[#34d399] px-2 py-1 font-mono text-[11px] font-bold text-[#1e1c1a]">
                              <Gift className="size-3.5" aria-hidden="true" />
                              {row.ready_rewards} {row.ready_rewards === 1 ? "lista" : "listas"}
                            </span>
                          ) : row.pending_redemptions > 0 ? (
                            <span className="inline-flex shrink-0 items-center border-2 border-[var(--line)] bg-[#ffd166] px-2 py-1 font-mono text-[11px] font-bold text-[#1e1c1a]">
                              {row.pending_redemptions} en curso
                            </span>
                          ) : null}
                        </div>

                        {nextReward && (
                          <div className="space-y-1 border-t-2 border-dashed border-[var(--dash-line)] pt-2.5">
                            <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-[var(--ink-muted)]">
                              <span className="truncate font-semibold">{nextReward.name}</span>
                              <span className="shrink-0 font-bold">{progressPct}%</span>
                            </div>
                            <div className="retro-progress retro-progress-sm" aria-hidden="true">
                              <span style={{ width: `${progressPct}%` }} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t-2 border-[var(--dash-line)] pt-3 font-mono text-xs text-[var(--ink-soft)]">
                        <span>
                          {row.last_purchase_at
                            ? "Última compra registrada"
                            : "Sin compras todavía"}
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold text-[var(--ink)] group-hover:text-[var(--red)]">
                          Entrar
                          <ArrowRight
                            className="size-3.5 transition-transform group-hover:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </span>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </section>

          <div className="retro-card retro-card-muted border-dashed p-4 text-sm sm:p-5">
            <p className="font-bold text-[var(--ink)]">¿Quieres sumar otro negocio?</p>
            <p className="mt-1 text-[var(--ink-muted)]">
              Pide en caja el enlace de invitación o escanea su QR. Tus loopoints de cada negocio se
              mantienen separados y siempre disponibles aquí.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
