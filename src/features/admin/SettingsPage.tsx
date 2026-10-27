import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  Gift,
  History,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminRewards,
  useAdminSettings,
  useAuditLog,
  useConfigHistory,
  useExpirePoints,
  useUpdateSettings,
  useUpsertReward,
} from './hooks';
import { errorMessage } from '@/lib/errors';
import { formatDateTimeBogota } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useFormDraft } from '@/lib/useFormDraft';
import {
  AUDIT_SEVERITY_STYLES,
  auditSubject,
  getAuditEntityLabel,
  getAuditLabel,
} from './auditLabels';
import type { AdminReward } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, LoadingScreen } from '@/components/shared/States';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface SettingsFormState {
  cop_per_point_unit: string;
  min_purchase_amount: string;
  max_points_per_purchase: string;
  qr_expiry_hours: string;
  points_expiry_days: string;
  history_page_size: string;
}

interface RewardFormState {
  name: string;
  description: string;
  points_cost: string;
  image_url: string;
  is_active: boolean;
}

const emptyReward: RewardFormState = {
  name: '',
  description: '',
  points_cost: '',
  image_url: '',
  is_active: true,
};

export function SettingsPage() {
  const settings = useAdminSettings();
  const updateSettings = useUpdateSettings();
  const rewards = useAdminRewards();
  const upsertReward = useUpsertReward();
  const audit = useAuditLog();
  const configHistory = useConfigHistory();
  const expirePoints = useExpirePoints();
  const draft = useFormDraft<SettingsFormState>({ key: 'admin:settings' });
  const [form, setForm] = useState<SettingsFormState | null>(null);
  const [formDirty, setFormDirty] = useState(false);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<AdminReward | null>(null);
  const [rewardForm, setRewardForm] = useState<RewardFormState>(emptyReward);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [expireOpen, setExpireOpen] = useState(false);

  useEffect(() => {
    if (!settings.data) return;
    setForm(
      draft.read() ?? {
        cop_per_point_unit: String(settings.data.cop_per_point_unit),
        min_purchase_amount: String(settings.data.min_purchase_amount),
        max_points_per_purchase: String(settings.data.max_points_per_purchase),
        qr_expiry_hours: String(settings.data.qr_expiry_hours),
        points_expiry_days:
          settings.data.points_expiry_days === null
            ? ''
            : String(settings.data.points_expiry_days),
        history_page_size: String(settings.data.history_page_size),
      },
    );
  }, [draft.read, settings.data]);

  useEffect(() => {
    if (formDirty && form) draft.save(form);
  }, [draft.save, form, formDirty]);

  function updateField(field: keyof SettingsFormState, value: string) {
    setFormDirty(true);
    setForm((current) => (current ? { ...current, [field]: value } : current));
  }

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    const payload = {
      cop_per_point_unit: Number(form.cop_per_point_unit),
      min_purchase_amount: Number(form.min_purchase_amount),
      max_points_per_purchase: Number(form.max_points_per_purchase),
      qr_expiry_hours: Number(form.qr_expiry_hours),
      history_page_size: Number(form.history_page_size),
      points_expiry_days:
        form.points_expiry_days.trim() === ''
          ? null
          : Number(form.points_expiry_days),
    };
    try {
      await updateSettings.mutateAsync(payload);
      setFormDirty(false);
      draft.clear();
      toast.success('Configuración actualizada');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function openCreateReward() {
    setEditingReward(null);
    setRewardForm(emptyReward);
    setRewardError(null);
    setRewardDialogOpen(true);
  }

  function openEditReward(reward: AdminReward) {
    setEditingReward(reward);
    setRewardForm({
      name: reward.name,
      description: reward.description,
      points_cost: String(reward.points_cost),
      image_url: reward.image_url ?? '',
      is_active: reward.is_active,
    });
    setRewardError(null);
    setRewardDialogOpen(true);
  }

  async function saveReward(event: React.FormEvent) {
    event.preventDefault();
    setRewardError(null);
    const pointsCost = Number(rewardForm.points_cost);
    if (rewardForm.name.trim().length < 2) {
      setRewardError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (!Number.isFinite(pointsCost) || pointsCost <= 0) {
      setRewardError('El costo en loopoints debe ser mayor que cero.');
      return;
    }
    try {
      await upsertReward.mutateAsync({
        id: editingReward?.id ?? null,
        name: rewardForm.name.trim(),
        description: rewardForm.description.trim(),
        pointsCost,
        imageUrl: rewardForm.image_url.trim() || null,
        isActive: rewardForm.is_active,
      });
      toast.success(editingReward ? 'Recompensa actualizada' : 'Recompensa creada');
      setRewardDialogOpen(false);
    } catch (error) {
      setRewardError(errorMessage(error));
    }
  }

  async function toggleReward(reward: AdminReward) {
    try {
      await upsertReward.mutateAsync({
        id: reward.id,
        name: reward.name,
        description: reward.description,
        pointsCost: reward.points_cost,
        imageUrl: reward.image_url,
        isActive: !reward.is_active,
      });
      toast.success(
        reward.is_active ? 'Recompensa desactivada' : 'Recompensa activada',
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function runExpire() {
    try {
      const result = await expirePoints.mutateAsync();
      toast.success(
        `Vencimiento aplicado: ${result.points_expired} loopoints en ${result.credits_expired} créditos.`,
      );
      setExpireOpen(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  if (settings.isLoading) return <LoadingScreen label="Cargando configuración…" />;
  if (settings.isError) {
    return (
      <ErrorState
        error={settings.error}
        onRetry={() => void settings.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Configuración"
        description="Reglas de acumulación, catálogo y auditoría. Los usuarios y roles se gestionan directamente en la base de datos."
      />

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="size-4 text-muted-foreground" aria-hidden="true" />
              Reglas del programa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {form ? (
              <form onSubmit={saveSettings} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cop_per_point_unit">COP por loopoint</Label>
                    <Input
                      id="cop_per_point_unit"
                      type="number"
                      min={100}
                      max={1000000}
                      value={form.cop_per_point_unit}
                      onChange={(event) =>
                        updateField('cop_per_point_unit', event.target.value)
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      1000 = 1 loopoint por cada $1.000 completos.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_purchase_amount">Compra mínima (COP)</Label>
                    <Input
                      id="min_purchase_amount"
                      type="number"
                      min={0}
                      max={50000000}
                      value={form.min_purchase_amount}
                      onChange={(event) =>
                        updateField('min_purchase_amount', event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_points_per_purchase">
                      Máximo de loopoints por compra
                    </Label>
                    <Input
                      id="max_points_per_purchase"
                      type="number"
                      min={1}
                      max={1000000}
                      value={form.max_points_per_purchase}
                      onChange={(event) =>
                        updateField('max_points_per_purchase', event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qr_expiry_hours">Vigencia del QR (horas)</Label>
                    <Input
                      id="qr_expiry_hours"
                      type="number"
                      min={1}
                      max={168}
                      value={form.qr_expiry_hours}
                      onChange={(event) =>
                        updateField('qr_expiry_hours', event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points_expiry_days">
                      Vencimiento de loopoints (días)
                    </Label>
                    <Input
                      id="points_expiry_days"
                      type="number"
                      min={1}
                      max={3650}
                      placeholder="Sin vencimiento"
                      value={form.points_expiry_days}
                      onChange={(event) =>
                        updateField('points_expiry_days', event.target.value)
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Vacío = los loopoints no vencen automáticamente.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="history_page_size">
                      Tamaño del historial del cliente
                    </Label>
                    <Input
                      id="history_page_size"
                      type="number"
                      min={1}
                      max={100}
                      value={form.history_page_size}
                      onChange={(event) =>
                        updateField('history_page_size', event.target.value)
                      }
                    />
                  </div>
                </div>

                <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                  Los cambios aplican solo a compras nuevas. Las compras ya
                  generadas conservan las reglas con las que fueron creadas.
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button type="submit" loading={updateSettings.isPending}>
                    <Save aria-hidden="true" />
                    Guardar configuración
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setExpireOpen(true)}
                    disabled={
                      settings.data?.points_expiry_days === null ||
                      expirePoints.isPending
                    }
                  >
                    <RefreshCw aria-hidden="true" />
                    Ejecutar vencimiento
                  </Button>
                </div>

                {settings.data?.updated_at && (
                  <p className="text-xs text-muted-foreground">
                    Última actualización:{' '}
                    {formatDateTimeBogota(settings.data.updated_at)}
                    {settings.data.updated_by_email
                      ? ` · ${settings.data.updated_by_email}`
                      : ''}
                  </p>
                )}
              </form>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="size-4 text-muted-foreground" aria-hidden="true" />
              Catálogo de recompensas
            </CardTitle>
            <Button size="sm" onClick={openCreateReward}>
              <Plus aria-hidden="true" />
              Nueva
            </Button>
          </CardHeader>
          <CardContent>
            {rewards.isLoading ? (
              <LoadingScreen label="Cargando recompensas…" />
            ) : rewards.isError ? (
              <ErrorState error={rewards.error} onRetry={() => void rewards.refetch()} />
            ) : !rewards.data || rewards.data.length === 0 ? (
              <EmptyState
                title="Sin recompensas"
                description="Crea la primera recompensa del catálogo."
                icon={Gift}
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <ul className="divide-y">
                {rewards.data.map((reward) => (
                  <li
                    key={reward.id}
                    className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{reward.name}</p>
                        <Badge variant={reward.is_active ? 'success' : 'muted'}>
                          {reward.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {reward.points_cost} loopoints · {reward.times_redeemed} canjes
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditReward(reward)}
                        aria-label={`Editar ${reward.name}`}
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void toggleReward(reward)}
                        aria-label={
                          reward.is_active
                            ? `Desactivar ${reward.name}`
                            : `Activar ${reward.name}`
                        }
                      >
                        {reward.is_active ? (
                          <Trash2 aria-hidden="true" />
                        ) : (
                          <BadgeCheck aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4 text-muted-foreground" aria-hidden="true" />
              Auditoría reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {audit.isLoading ? (
              <LoadingScreen label="Cargando auditoría…" />
            ) : audit.isError ? (
              <ErrorState error={audit.error} onRetry={() => void audit.refetch()} />
            ) : !audit.data || audit.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin eventos registrados.</p>
            ) : (
              <ul className="space-y-3">
                {audit.data.slice(0, 15).map((entry) => {
                  const label = getAuditLabel(entry.operation);
                  const Icon = label.icon;
                  return (
                    <li key={entry.id} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-2 text-sm font-semibold">
                          <span
                            className={cn(
                              'grid size-6 shrink-0 place-items-center rounded-full',
                              AUDIT_SEVERITY_STYLES[label.severity].icon,
                            )}
                          >
                            <Icon className="size-3.5" aria-hidden="true" />
                          </span>
                          {label.label}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTimeBogota(entry.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {auditSubject({
                          operation: entry.operation,
                          metadata: entry.metadata,
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.actor_email ?? 'Sistema'} ·{' '}
                        {getAuditEntityLabel(entry.entity_type)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4 text-muted-foreground" aria-hidden="true" />
              Historial de configuración
            </CardTitle>
          </CardHeader>
          <CardContent>
            {configHistory.isLoading ? (
              <LoadingScreen label="Cargando historial…" />
            ) : configHistory.isError ? (
              <ErrorState
                error={configHistory.error}
                onRetry={() => void configHistory.refetch()}
              />
            ) : !configHistory.data || configHistory.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cambios registrados.</p>
            ) : (
              <ul className="space-y-3">
                {configHistory.data.map((entry) => (
                  <li key={entry.id} className="border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {entry.changed_by_email ?? 'Sistema'}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTimeBogota(entry.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 break-words text-xs text-muted-foreground">
                      Antes: {JSON.stringify(entry.before_value).slice(0, 140)}…
                    </p>
                    <p className="break-words text-xs text-muted-foreground">
                      Después: {JSON.stringify(entry.after_value).slice(0, 140)}…
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={rewardDialogOpen} onOpenChange={setRewardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReward ? 'Editar recompensa' : 'Nueva recompensa'}
            </DialogTitle>
            <DialogDescription>
              El costo se descuenta del saldo del cliente dentro de una transacción.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveReward} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reward-name">Nombre</Label>
              <Input
                id="reward-name"
                value={rewardForm.name}
                onChange={(event) =>
                  setRewardForm((current) => ({ ...current, name: event.target.value }))
                }
                required
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward-description">Descripción</Label>
              <Textarea
                id="reward-description"
                value={rewardForm.description}
                onChange={(event) =>
                  setRewardForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                maxLength={500}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="reward-cost">Costo en loopoints</Label>
                <Input
                  id="reward-cost"
                  type="number"
                  min={1}
                  value={rewardForm.points_cost}
                  onChange={(event) =>
                    setRewardForm((current) => ({
                      ...current,
                      points_cost: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward-image">Imagen (URL opcional)</Label>
                <Input
                  id="reward-image"
                  type="url"
                  placeholder="https://…"
                  value={rewardForm.image_url}
                  onChange={(event) =>
                    setRewardForm((current) => ({
                      ...current,
                      image_url: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={rewardForm.is_active}
                onChange={(event) =>
                  setRewardForm((current) => ({
                    ...current,
                    is_active: event.target.checked,
                  }))
                }
                className="size-4 rounded border-input"
              />
              Disponible en el catálogo
            </label>

            {rewardError && (
              <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {rewardError}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRewardDialogOpen(false)}
                disabled={upsertReward.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={upsertReward.isPending}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={expireOpen}
        onOpenChange={setExpireOpen}
        title="Ejecutar vencimiento de loopoints"
        description="Se descontarán los créditos más antiguos que superen los días configurados, hasta donde el saldo actual lo permita. La operación es idempotente."
        confirmLabel="Aplicar vencimiento"
        loading={expirePoints.isPending}
        onConfirm={runExpire}
      />
    </div>
  );
}
