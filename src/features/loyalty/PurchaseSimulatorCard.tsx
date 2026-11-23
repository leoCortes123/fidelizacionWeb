import { useState } from "react";
import { Calculator, Coins, Gift, Sparkles, TrendingUp } from "lucide-react";
import { FIXED_POINTS_PER_THOUSAND } from "@/features/loyalty/programEconomics";
import {
  formatCOP,
  formatCopInput,
  formatNumber,
  formatPointValueCOP,
  parseCopInput,
} from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const QUICK_AMOUNTS = [10000, 25000, 50000, 100000];

export interface PurchaseSimulatorCardProps {
  copPerPoint: number;
  pointsPerThousand?: number;
  avgTicket?: number | null;
  firstPurchaseBonusPoints?: number;
  recurrenceBonusPoints?: number;
}

export function PurchaseSimulatorCard({
  copPerPoint,
  pointsPerThousand = FIXED_POINTS_PER_THOUSAND,
  avgTicket = null,
  firstPurchaseBonusPoints = 0,
  recurrenceBonusPoints = 0,
}: PurchaseSimulatorCardProps) {
  const [amountText, setAmountText] = useState("50.000");
  const [includeFirstBonus, setIncludeFirstBonus] = useState(false);
  const [includeRecurrenceBonus, setIncludeRecurrenceBonus] = useState(false);

  const amount = parseCopInput(amountText) ?? 0;
  const safeCopPerPoint = Number.isInteger(copPerPoint) && copPerPoint > 0 ? copPerPoint : 0;
  const safePointsPerThousand =
    Number.isInteger(pointsPerThousand) && pointsPerThousand > 0
      ? pointsPerThousand
      : FIXED_POINTS_PER_THOUSAND;
  const pointValueCop = 1000 / safePointsPerThousand;

  const baseCoins = safeCopPerPoint > 0 && amount > 0 ? Math.floor(amount / safeCopPerPoint) : 0;
  const extraFirst =
    includeFirstBonus && firstPurchaseBonusPoints > 0 ? firstPurchaseBonusPoints : 0;
  const extraRecurrence =
    includeRecurrenceBonus && recurrenceBonusPoints > 0 ? recurrenceBonusPoints : 0;
  const totalCoins = baseCoins + extraFirst + extraRecurrence;
  const rewardValueCop = Math.round(totalCoins * pointValueCop);
  const effectiveReturnPct = amount > 0 ? ((rewardValueCop / amount) * 100).toFixed(1) : "0.0";
  const purchasesForThousand =
    totalCoins > 0 ? Math.ceil(safePointsPerThousand / totalCoins) : null;
  const avgTicketCoins =
    avgTicket && avgTicket > 0 && safeCopPerPoint > 0
      ? Math.floor(avgTicket / safeCopPerPoint)
      : null;

  return (
    <Card>
      <CardHeader className="pb-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="grid size-7 shrink-0 place-items-center border-2 border-[var(--lp-ink)] bg-[var(--lp-gold)] text-[#16262e]">
              <Calculator className="size-4" aria-hidden="true" />
            </span>
            Simulador de compra
          </CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            1 moneda = {formatPointValueCOP(pointValueCop)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Prueba cualquier valor de compra para ver cuántas monedas acumula un cliente y cuánto
          representan en premios con la configuración actual.
        </p>

        <div className="space-y-2.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full space-y-1.5 sm:max-w-xs">
              <Label htmlFor="simulator-purchase-amount">Valor de compra simulada (COP)</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                  $
                </span>
                <Input
                  id="simulator-purchase-amount"
                  inputMode="numeric"
                  value={amountText}
                  onChange={(event) => setAmountText(formatCopInput(event.target.value))}
                  placeholder="50.000"
                  className="pl-7 font-mono text-base font-bold"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Montos rápidos">
              {QUICK_AMOUNTS.map((preset) => {
                const active = amount === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setAmountText(formatCopInput(String(preset)))}
                    className={cn(
                      "min-h-9 cursor-pointer rounded-none border-2 border-[var(--lp-ink)] px-2.5 py-1 font-mono text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring)]",
                      active
                        ? "bg-[var(--lp-gold)] text-[#16262e] shadow-[var(--lp-shadow-sm)]"
                        : "bg-card text-foreground hover:bg-[var(--lp-tip-bg)]",
                    )}
                  >
                    {formatCOP(preset)}
                  </button>
                );
              })}
              {avgTicket !== null && avgTicket > 0 && (
                <button
                  type="button"
                  aria-pressed={amount === avgTicket}
                  onClick={() => setAmountText(formatCopInput(String(avgTicket)))}
                  className={cn(
                    "min-h-9 cursor-pointer rounded-none border-2 border-[var(--lp-ink)] px-2.5 py-1 font-mono text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring)]",
                    amount === avgTicket
                      ? "bg-[var(--lp-gold)] text-[#16262e] shadow-[var(--lp-shadow-sm)]"
                      : "bg-[var(--lp-info-bg)] text-[var(--lp-accent-link)] hover:bg-[var(--lp-tip-bg)]",
                  )}
                >
                  Ticket promedio ({formatCOP(avgTicket)})
                </button>
              )}
            </div>
          </div>

          {(firstPurchaseBonusPoints > 0 || recurrenceBonusPoints > 0) && (
            <div className="flex flex-wrap gap-3 pt-1">
              {firstPurchaseBonusPoints > 0 && (
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={includeFirstBonus}
                    onChange={(event) => setIncludeFirstBonus(event.target.checked)}
                    className="size-4 cursor-pointer rounded-none border-input accent-primary"
                  />
                  Incluir bono primera compra (+{formatNumber(firstPurchaseBonusPoints)} monedas)
                </label>
              )}
              {recurrenceBonusPoints > 0 && (
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={includeRecurrenceBonus}
                    onChange={(event) => setIncludeRecurrenceBonus(event.target.checked)}
                    className="size-4 cursor-pointer rounded-none border-input accent-primary"
                  />
                  Incluir bono recurrencia (+{formatNumber(recurrenceBonusPoints)} monedas)
                </label>
              )}
            </div>
          )}
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lp-subpanel">
            <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-muted-foreground">
              <span>Monedas ganadas</span>
              <Coins className="size-3.5 text-[var(--lp-accent-link)]" aria-hidden="true" />
            </div>
            <p
              data-testid="simulator-coins"
              className="mt-1 font-display text-2xl font-extrabold tabular-nums text-primary"
            >
              +{formatNumber(totalCoins)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {extraFirst + extraRecurrence > 0
                ? `${formatNumber(baseCoins)} base + ${formatNumber(extraFirst + extraRecurrence)} bono`
                : safeCopPerPoint > 0
                  ? `1 moneda / ${formatCOP(safeCopPerPoint)}`
                  : "Define la tasa"}
            </p>
          </div>

          <div className="lp-subpanel">
            <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-muted-foreground">
              <span>Equivalente en premios</span>
              <Gift className="size-3.5 text-[var(--lp-green-text)]" aria-hidden="true" />
            </div>
            <p
              data-testid="simulator-reward-value"
              className="mt-1 font-display text-2xl font-extrabold tabular-nums"
            >
              {formatCOP(rewardValueCop)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {formatNumber(safePointsPerThousand)} monedas = $1.000
            </p>
          </div>

          <div className="lp-subpanel">
            <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-muted-foreground">
              <span>Retorno en la compra</span>
              <TrendingUp className="size-3.5 text-[var(--lp-accent-link)]" aria-hidden="true" />
            </div>
            <p
              data-testid="simulator-return-pct"
              className="mt-1 font-display text-2xl font-extrabold tabular-nums"
            >
              {effectiveReturnPct} %
            </p>
            <p className="text-[11px] text-muted-foreground">Sobre {formatCOP(amount)}</p>
          </div>

          <div className="lp-subpanel">
            <div className="flex items-center justify-between gap-1 text-[11px] font-medium text-muted-foreground">
              <span>Meta de $1.000</span>
              <Sparkles className="size-3.5 text-[var(--lp-gold-ink)]" aria-hidden="true" />
            </div>
            <p className="mt-1 font-display text-xl font-extrabold tabular-nums">
              {purchasesForThousand === null
                ? "—"
                : purchasesForThousand <= 1
                  ? "En esta compra"
                  : `${formatNumber(purchasesForThousand)} compras`}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Para juntar {formatNumber(safePointsPerThousand)} monedas
            </p>
          </div>
        </div>

        <div className="lp-tip-box rounded-none p-3 text-xs leading-relaxed">
          <p>
            <strong>Resumen:</strong> con una compra de <strong>{formatCOP(amount)}</strong>, el
            cliente gana <strong>{formatNumber(totalCoins)} moneda(s)</strong>, que equivalen a{" "}
            <strong>{formatCOP(rewardValueCop)}</strong> en recompensas ({effectiveReturnPct} % de
            retorno).
          </p>
          {avgTicket !== null && avgTicketCoins !== null && (
            <p className="mt-1 text-muted-foreground">
              En tu ticket promedio ({formatCOP(avgTicket)}), el cliente sumaría{" "}
              <strong>{formatNumber(avgTicketCoins)} moneda(s)</strong> por visita.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
