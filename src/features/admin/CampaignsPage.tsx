import { useMemo, useState } from "react";
import { CalendarClock, Megaphone, Pencil, Plus, Power, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useDeleteLoyaltyCampaign,
  useLoyaltyCampaigns,
  useUpsertLoyaltyCampaign,
} from "@/features/loyalty/hooks";
import { parseProgramInteger } from "@/features/loyalty/programEconomics";
import { errorMessage } from "@/lib/errors";
import { formatCOP, formatDateTimeBogota, formatNumber, parseCopInput } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Field } from "@/components/shared/Field";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/shared/States";
import { BusinessGate } from "@/features/admin/BusinessGate";
import type { Business, LoyaltyCampaign } from "@/types";

interface CampaignFormState {
  name: string;
  description: string;
  useMultiplier: boolean;
  multiplier: string;
  useBonusPoints: boolean;
  bonusPoints: string;
  useMinPurchase: boolean;
  minPurchase: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

type CampaignErrors = Partial<Record<keyof CampaignFormState, string>>;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function toLocalInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function nowLocalInput(): string {
  return toLocalInput(new Date().toISOString());
}

function emptyForm(): CampaignFormState {
  return {
    name: "",
    description: "",
    useMultiplier: true,
    multiplier: "2",
    useBonusPoints: false,
    bonusPoints: "0",
    useMinPurchase: false,
    minPurchase: "0",
    validFrom: nowLocalInput(),
    validUntil: "",
    isActive: true,
  };
}

function formFromCampaign(campaign: LoyaltyCampaign): CampaignFormState {
  return {
    name: campaign.name,
    description: campaign.description,
    useMultiplier: campaign.multiplier > 1,
    multiplier: String(campaign.multiplier),
    useBonusPoints: campaign.bonus_points > 0,
    bonusPoints: String(campaign.bonus_points),
    useMinPurchase: campaign.min_purchase_amount > 0,
    minPurchase: String(campaign.min_purchase_amount),
    validFrom: toLocalInput(campaign.valid_from),
    validUntil: toLocalInput(campaign.valid_until),
    isActive: campaign.is_active,
  };
}

export function CampaignsPage() {
  return (
    <BusinessGate
      title="Campañas"
      description="Elige el negocio cuyas campañas de monedas deseas administrar."
      icon={Megaphone}
      emptyDescription="Registra un negocio para crear campañas de monedas."
    >
      {(business) => <CampaignsSection key={business.id} business={business} />}
    </BusinessGate>
  );
}

function CampaignsSection({ business }: { business: Business }) {
  const campaigns = useLoyaltyCampaigns(business.id, false);
  const upsertCampaign = useUpsertLoyaltyCampaign();
  const deleteCampaign = useDeleteLoyaltyCampaign();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LoyaltyCampaign | null>(null);
  const [form, setForm] = useState<CampaignFormState>(emptyForm);
  const [errors, setErrors] = useState<CampaignErrors>({});
  const [deleteTarget, setDeleteTarget] = useState<LoyaltyCampaign | null>(null);

  const rows = useMemo(() => campaigns.data ?? [], [campaigns.data]);

  if (campaigns.isLoading) return <ListSkeleton rows={4} />;
  if (campaigns.isError) {
    return <ErrorState error={campaigns.error} onRetry={() => void campaigns.refetch()} />;
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(campaign: LoyaltyCampaign) {
    setEditing(campaign);
    setForm(formFromCampaign(campaign));
    setErrors({});
    setDialogOpen(true);
  }

  function update<K extends keyof CampaignFormState>(key: K, value: CampaignFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validate(): { payload?: Parameters<typeof upsertCampaign.mutateAsync>[0] } {
    const nextErrors: CampaignErrors = {};
    const name = form.name.trim();
    const multiplier = form.useMultiplier ? Number(form.multiplier.replace(",", ".")) : 1;
    const bonusPoints = form.useBonusPoints ? parseProgramInteger(form.bonusPoints) : 0;
    const parsedMinPurchase = form.useMinPurchase ? parseCopInput(form.minPurchase) : 0;
    const minPurchase = parsedMinPurchase ?? 0;
    const validFrom = fromLocalInput(form.validFrom);
    const validUntil = fromLocalInput(form.validUntil);

    if (name.length < 2 || name.length > 120) {
      nextErrors.name = "El nombre debe tener entre 2 y 120 caracteres.";
    }
    if (form.useMultiplier && (!Number.isFinite(multiplier) || multiplier < 1 || multiplier > 10)) {
      nextErrors.multiplier = "El multiplicador debe estar entre 1 y 10.";
    }
    if (
      form.useBonusPoints &&
      (!Number.isInteger(bonusPoints) || bonusPoints < 0 || bonusPoints > 1_000_000)
    ) {
      nextErrors.bonusPoints = "El bono debe ser un entero entre 0 y 1.000.000.";
    }
    if (form.useMinPurchase && (parsedMinPurchase === null || parsedMinPurchase < 0)) {
      nextErrors.minPurchase = "Indica un monto válido de compra mínima (0 o mayor).";
    }
    if (!validFrom) {
      nextErrors.validFrom = "Indica la fecha de inicio.";
    }
    if (form.validUntil && !validUntil) {
      nextErrors.validUntil = "La fecha de fin no es válida.";
    }
    if (validFrom && validUntil && validUntil <= validFrom) {
      nextErrors.validUntil = "La fecha de fin debe ser posterior al inicio.";
    }

    if (Object.keys(nextErrors).length > 0 || !validFrom) {
      setErrors(nextErrors);
      toast.error("Revisa los datos de la campaña.");
      return {};
    }

    return {
      payload: {
        businessId: business.id,
        id: editing?.id ?? null,
        name,
        description: form.description.trim(),
        multiplier,
        bonusPoints,
        minPurchaseAmount: minPurchase,
        validFrom,
        validUntil,
        isActive: form.isActive,
      },
    };
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const { payload } = validate();
    if (!payload) return;

    try {
      await upsertCampaign.mutateAsync(payload);
      toast.success(editing ? "Campaña actualizada" : "Campaña creada");
      setDialogOpen(false);
      setEditing(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function toggle(campaign: LoyaltyCampaign) {
    try {
      await upsertCampaign.mutateAsync({
        businessId: business.id,
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        multiplier: campaign.multiplier,
        bonusPoints: campaign.bonus_points,
        minPurchaseAmount: campaign.min_purchase_amount,
        validFrom: campaign.valid_from,
        validUntil: campaign.valid_until,
        isActive: !campaign.is_active,
      });
      toast.success(campaign.is_active ? "Campaña desactivada" : "Campaña activada");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function remove() {
    if (!deleteTarget) return;
    try {
      await deleteCampaign.mutateAsync({
        businessId: business.id,
        campaignId: deleteTarget.id,
      });
      toast.success("Campaña eliminada");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function statusBadge(campaign: LoyaltyCampaign) {
    if (!campaign.is_active) return <Badge variant="muted">Inactiva</Badge>;
    if (campaign.is_current) return <Badge variant="success">En vigencia</Badge>;
    return <Badge variant="warning">Fuera de vigencia</Badge>;
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      <PageHeader
        title="Campañas"
        description="Multiplica las monedas de compra o añade un bono durante una vigencia."
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden="true" />
            Nueva campaña
          </Button>
        }
      />

      <Card className="mx-4 sm:mx-0">
        <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            En cada compra se aplica la campaña vigente con mayor beneficio. Las monedas resultantes
            quedan registradas con la regla{" "}
            <code className="rounded-none bg-muted px-1 py-0.5 text-xs">v1+campaign:…</code> en el
            movimiento y en la auditoría.
          </p>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin campañas"
          description="Crea una campaña para duplicar monedas o sumar un bono en fechas concretas."
          icon={Megaphone}
          action={
            <Button variant="outline" onClick={openCreate}>
              Crear campaña
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3 px-4 sm:px-0 md:hidden" data-testid="campaigns-cards">
            {rows.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                statusBadge={statusBadge(campaign)}
                onSelect={() => openEdit(campaign)}
                onToggle={() => void toggle(campaign)}
                onDelete={() => setDeleteTarget(campaign)}
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-none border-2 border-[var(--lp-ink)] bg-card shadow-[var(--lp-shadow-lg)] md:block">
            <table className="w-full text-sm">
              <thead className="border-b-[3px] border-[var(--lp-ink)] bg-[var(--lp-surface-elevated-deep)] text-left font-mono text-xs font-bold uppercase tracking-wide text-[var(--lp-gold)]">
                <tr>
                  <th scope="col" className="h-9 px-3">
                    Campaña
                  </th>
                  <th scope="col" className="h-9 px-3">
                    Beneficio
                  </th>
                  <th scope="col" className="h-9 px-3 text-right">
                    Compra mínima
                  </th>
                  <th scope="col" className="h-9 px-3">
                    Vigencia
                  </th>
                  <th scope="col" className="h-9 px-3">
                    Estado
                  </th>
                  <th scope="col" className="h-9 px-3 text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[var(--lp-paper-deep)]">
                {rows.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="transition-colors hover:bg-[var(--lp-row-hover)]"
                  >
                    <td className="px-3 py-2">
                      <p className="font-semibold">{campaign.name}</p>
                      {campaign.description && (
                        <p className="text-xs text-muted-foreground">{campaign.description}</p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <p className="font-medium">x{campaign.multiplier}</p>
                      {campaign.bonus_points > 0 && (
                        <p className="text-xs text-muted-foreground">
                          +{formatNumber(campaign.bonus_points)} monedas
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {campaign.min_purchase_amount > 0
                        ? formatCOP(campaign.min_purchase_amount)
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      <p>Desde {formatDateTimeBogota(campaign.valid_from)}</p>
                      <p>
                        {campaign.valid_until
                          ? `Hasta ${formatDateTimeBogota(campaign.valid_until)}`
                          : "Sin fecha de fin"}
                      </p>
                    </td>
                    <td className="px-3 py-2">{statusBadge(campaign)}</td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(campaign)}
                          aria-label={`Editar ${campaign.name}`}
                        >
                          <Pencil aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => void toggle(campaign)}
                          aria-label={
                            campaign.is_active
                              ? `Desactivar ${campaign.name}`
                              : `Activar ${campaign.name}`
                          }
                        >
                          <Power aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(campaign)}
                          aria-label={`Eliminar ${campaign.name}`}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="flex items-center gap-2 px-4 text-xs text-muted-foreground sm:px-0">
        <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
        Las fechas se guardan en UTC y se muestran en hora de Bogotá.
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Detalle de la campaña" : "Nueva campaña"}</DialogTitle>
            <DialogDescription>
              Combina las reglas que necesites: si activas varias opciones, se acumulan entre sí
              dentro de la vigencia definida.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="min-w-0 space-y-3.5" noValidate>
            <Field id="campaign-name" label="Nombre de la campaña" error={errors.name}>
              <Input
                id="campaign-name"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                maxLength={120}
                placeholder="Ej.: Doble moneda en fin de semana"
                aria-invalid={Boolean(errors.name)}
              />
            </Field>

            <Field id="campaign-description" label="Descripción (opcional)">
              <Textarea
                id="campaign-description"
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Explica brevemente qué beneficio recibe el cliente"
              />
            </Field>

            <div className="lp-subpanel space-y-2.5">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-wide text-foreground">
                  Beneficios y condiciones (acumulables)
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Marca las opciones que quieras activar. Si activas multiplicador y bono, primero
                  se multiplican las monedas base y luego se suma el bono extra.
                </p>
              </div>

              {/* Multiplicador */}
              <div className="space-y-1 border-2 border-[var(--lp-ink)] bg-card p-2.5">
                <div className="flex items-center gap-3">
                  <input
                    id="campaign-use-multiplier"
                    type="checkbox"
                    aria-label="Habilitar multiplicador de monedas"
                    checked={form.useMultiplier}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setForm((current) => ({
                        ...current,
                        useMultiplier: checked,
                        multiplier:
                          checked && (!current.multiplier || Number(current.multiplier) <= 1)
                            ? "2"
                            : current.multiplier,
                      }));
                      setErrors((current) => ({ ...current, multiplier: undefined }));
                    }}
                    className="size-4 shrink-0 cursor-pointer rounded-none border-input accent-primary"
                  />
                  <label
                    htmlFor="campaign-multiplier"
                    className="min-w-0 flex-1 cursor-pointer text-sm leading-tight"
                  >
                    <span className="block font-semibold">Multiplicar monedas de la compra</span>
                    <span className="block text-[11px] text-muted-foreground">
                      Ej.: 2 duplica las monedas base (entre 1 y 10).
                    </span>
                  </label>
                  <Input
                    id="campaign-multiplier"
                    inputMode="decimal"
                    disabled={!form.useMultiplier}
                    value={form.multiplier}
                    onChange={(event) => update("multiplier", event.target.value)}
                    aria-invalid={Boolean(errors.multiplier)}
                    className="w-24 shrink-0 text-right font-mono font-bold"
                  />
                </div>
                {errors.multiplier && (
                  <p className="pl-7 text-xs font-semibold text-destructive" role="alert">
                    {errors.multiplier}
                  </p>
                )}
              </div>

              {/* Bono de monedas */}
              <div className="space-y-1 border-2 border-[var(--lp-ink)] bg-card p-2.5">
                <div className="flex items-center gap-3">
                  <input
                    id="campaign-use-bonus"
                    type="checkbox"
                    aria-label="Habilitar bono fijo de monedas"
                    checked={form.useBonusPoints}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setForm((current) => ({
                        ...current,
                        useBonusPoints: checked,
                        bonusPoints:
                          checked && (!current.bonusPoints || Number(current.bonusPoints) <= 0)
                            ? "10"
                            : current.bonusPoints,
                      }));
                      setErrors((current) => ({ ...current, bonusPoints: undefined }));
                    }}
                    className="size-4 shrink-0 cursor-pointer rounded-none border-input accent-primary"
                  />
                  <label
                    htmlFor="campaign-bonus"
                    className="min-w-0 flex-1 cursor-pointer text-sm leading-tight"
                  >
                    <span className="block font-semibold">Sumar bono fijo de monedas</span>
                    <span className="block text-[11px] text-muted-foreground">
                      Monedas extra que se suman al final de la compra.
                    </span>
                  </label>
                  <Input
                    id="campaign-bonus"
                    inputMode="numeric"
                    disabled={!form.useBonusPoints}
                    value={form.bonusPoints}
                    onChange={(event) => update("bonusPoints", event.target.value)}
                    aria-invalid={Boolean(errors.bonusPoints)}
                    className="w-24 shrink-0 text-right font-mono font-bold"
                  />
                </div>
                {errors.bonusPoints && (
                  <p className="pl-7 text-xs font-semibold text-destructive" role="alert">
                    {errors.bonusPoints}
                  </p>
                )}
              </div>

              {/* Compra mínima */}
              <div className="space-y-1 border-2 border-[var(--lp-ink)] bg-card p-2.5">
                <div className="flex items-center gap-3">
                  <input
                    id="campaign-use-min-purchase"
                    type="checkbox"
                    aria-label="Habilitar compra mínima"
                    checked={form.useMinPurchase}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setForm((current) => ({
                        ...current,
                        useMinPurchase: checked,
                        minPurchase:
                          checked &&
                          (!current.minPurchase || (parseCopInput(current.minPurchase) ?? 0) <= 0)
                            ? "20000"
                            : current.minPurchase,
                      }));
                      setErrors((current) => ({ ...current, minPurchase: undefined }));
                    }}
                    className="size-4 shrink-0 cursor-pointer rounded-none border-input accent-primary"
                  />
                  <label
                    htmlFor="campaign-min-purchase"
                    className="min-w-0 flex-1 cursor-pointer text-sm leading-tight"
                  >
                    <span className="block font-semibold">Exigir compra mínima (COP)</span>
                    <span className="block text-[11px] text-muted-foreground">
                      Solo aplica si la venta iguala o supera este monto.
                    </span>
                  </label>
                  <Input
                    id="campaign-min-purchase"
                    inputMode="numeric"
                    placeholder="0"
                    disabled={!form.useMinPurchase}
                    value={form.minPurchase}
                    onChange={(event) => update("minPurchase", event.target.value)}
                    aria-invalid={Boolean(errors.minPurchase)}
                    className="w-28 shrink-0 text-right font-mono font-bold"
                  />
                </div>
                {errors.minPurchase && (
                  <p className="pl-7 text-xs font-semibold text-destructive" role="alert">
                    {errors.minPurchase}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field id="campaign-from" label="Fecha de inicio" error={errors.validFrom}>
                <Input
                  id="campaign-from"
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(event) => update("validFrom", event.target.value)}
                  aria-invalid={Boolean(errors.validFrom)}
                />
              </Field>
              <Field id="campaign-until" label="Fecha de fin (opcional)" error={errors.validUntil}>
                <Input
                  id="campaign-until"
                  type="datetime-local"
                  value={form.validUntil}
                  onChange={(event) => update("validUntil", event.target.value)}
                  aria-invalid={Boolean(errors.validUntil)}
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => update("isActive", event.target.checked)}
                className="size-4 cursor-pointer rounded-none border-input accent-primary"
              />
              Campaña activa
            </label>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={upsertCampaign.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={upsertCampaign.isPending}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar campaña"
        description={
          deleteTarget
            ? `Se eliminará “${deleteTarget.name}”. El historial de monedas ya acreditado no cambia.`
            : undefined
        }
        confirmLabel="Eliminar"
        destructive
        loading={deleteCampaign.isPending}
        onConfirm={remove}
      />
    </div>
  );
}

/**
 * Tarjeta móvil de campaña inspirada en la carta: destaca multiplicador, bono,
 * compra mínima, vigencia y estado con acceso directo al detalle y acciones.
 */
function CampaignCard({
  campaign,
  statusBadge,
  onSelect,
  onToggle,
  onDelete,
}: {
  campaign: LoyaltyCampaign;
  statusBadge: React.ReactNode;
  onSelect: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <Card variant="tinted" className="overflow-hidden">
      <CardContent className="p-0">
        <button
          type="button"
          onClick={onSelect}
          aria-label={`Ver detalle de ${campaign.name}`}
          className="flex w-full min-w-0 items-start gap-3 p-3.5 text-left transition-colors hover:bg-[var(--lp-row-hover)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-[var(--lp-focus-ring)]"
        >
          <div className="flex size-14 shrink-0 items-center justify-center border-2 border-[var(--lp-ink)] bg-card text-primary">
            <Megaphone className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 break-words font-semibold leading-snug">{campaign.name}</p>
              <span className="shrink-0 whitespace-nowrap font-semibold tabular-nums text-primary">
                x{campaign.multiplier}
              </span>
            </div>
            <p className="line-clamp-2 break-words text-xs text-muted-foreground">
              {campaign.description?.trim() ? campaign.description : "Sin descripción"}
            </p>
            <div className="space-y-0.5 text-xs text-muted-foreground">
              <p>
                Compra mínima:{" "}
                <span className="font-medium text-foreground">
                  {campaign.min_purchase_amount > 0
                    ? formatCOP(campaign.min_purchase_amount)
                    : "Sin mínimo"}
                </span>
              </p>
              <p>Desde {formatDateTimeBogota(campaign.valid_from)}</p>
              <p>
                {campaign.valid_until
                  ? `Hasta ${formatDateTimeBogota(campaign.valid_until)}`
                  : "Sin fecha de fin"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {statusBadge}
              {campaign.bonus_points > 0 && (
                <Badge variant="secondary">+{formatNumber(campaign.bonus_points)} monedas</Badge>
              )}
            </div>
          </div>
        </button>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[var(--lp-ink)] bg-[var(--lp-paper-deep)] px-3.5 py-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggle}
            aria-label={
              campaign.is_active ? `Desactivar ${campaign.name}` : `Activar ${campaign.name}`
            }
          >
            <Power aria-hidden="true" />
            {campaign.is_active ? "Desactivar" : "Activar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Eliminar ${campaign.name}`}
          >
            <Trash2 aria-hidden="true" />
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
