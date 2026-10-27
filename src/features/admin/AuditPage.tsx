import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  FileJson,
  Search,
  X,
} from 'lucide-react';
import { useBusinessAuditLog } from '@/features/loyalty/hooks';
import { formatDateBogota, formatDateTimeBogota, formatNumber } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { BusinessGate } from './BusinessGate';
import {
  AUDIT_CATEGORIES,
  AUDIT_SEVERITY_STYLES,
  auditOperationsByCategory,
  auditSubject,
  describeAudit,
  getAuditEntityLabel,
  getAuditLabel,
} from './auditLabels';
import type { Business, BusinessAuditFilters, BusinessAuditLog } from '@/types';

const PAGE_SIZE = 25;

interface FilterForm {
  operation: string;
  actor: string;
  from: string;
  to: string;
  search: string;
}

const EMPTY_FORM: FilterForm = {
  operation: '',
  actor: '',
  from: '',
  to: '',
  search: '',
};

export function AuditPage() {
  return (
    <BusinessGate
      title="Auditoría"
      description="Elige el negocio cuya auditoría deseas consultar."
      icon={ClipboardList}
      emptyDescription="Registra un negocio para consultar sus operaciones auditadas."
    >
      {(business) => <AuditSection key={business.id} business={business} />}
    </BusinessGate>
  );
}

function AuditSection({ business }: { business: Business }) {
  const [form, setForm] = useState<FilterForm>(EMPTY_FORM);
  const [appliedForm, setAppliedForm] = useState<FilterForm>(EMPTY_FORM);
  const [filters, setFilters] = useState<BusinessAuditFilters>({});
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<BusinessAuditLog | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const log = useBusinessAuditLog(
    business.id,
    filters,
    PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const total = log.data?.[0]?.total_count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = Boolean(
    filters.operation ||
      filters.actor ||
      filters.from ||
      filters.to ||
      filters.search,
  );
  const activeChips = buildFilterChips(appliedForm);

  function applyForm(next: FilterForm) {
    setForm(next);
    setAppliedForm(next);
    setFilters(toFilters(next));
    setPage(0);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (form.from && form.to && form.from > form.to) {
      setFormError('La fecha “Desde” no puede ser posterior a “Hasta”.');
      return;
    }
    setFormError(null);
    applyForm(form);
  }

  function removeFilter(key: keyof FilterForm) {
    const next = { ...appliedForm, [key]: '' };
    setFormError(null);
    applyForm(next);
  }

  function clearAll() {
    setFormError(null);
    setForm(EMPTY_FORM);
    setAppliedForm(EMPTY_FORM);
    setFilters({});
    setPage(0);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Auditoría — ${business.name}`}
        description="Compras, canjes, campañas y cambios de configuración explicados en lenguaje claro."
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="audit-search">Buscar</Label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="audit-search"
                    value={form.search}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        search: event.target.value,
                      }))
                    }
                    placeholder="Recompensa, cliente, motivo…"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="audit-operation">Tipo de operación</Label>
                <Select
                  value={form.operation || 'all'}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      operation: value === 'all' ? '' : value,
                    }))
                  }
                >
                  <SelectTrigger id="audit-operation">
                    <SelectValue placeholder="Todas las operaciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las operaciones</SelectItem>
                    {AUDIT_CATEGORIES.map((category) => (
                      <SelectGroup key={category.id}>
                        <SelectLabel>{category.label}</SelectLabel>
                        <SelectItem value={category.prefix}>
                          Todas: {category.label.toLowerCase()}
                        </SelectItem>
                        {auditOperationsByCategory(category.id).map((operation) => (
                          <SelectItem key={operation} value={operation}>
                            {getAuditLabel(operation).label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="audit-actor">Actor</Label>
                <Input
                  id="audit-actor"
                  value={form.actor}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      actor: event.target.value,
                    }))
                  }
                  placeholder="Nombre o correo"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="audit-from">Desde</Label>
                  <Input
                    id="audit-from"
                    type="date"
                    value={form.from}
                    max={form.to || undefined}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        from: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="audit-to">Hasta</Label>
                  <Input
                    id="audit-to"
                    type="date"
                    value={form.to}
                    min={form.from || undefined}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        to: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit">
                <Search aria-hidden="true" />
                Aplicar filtros
              </Button>
              {hasFilters && (
                <Button type="button" variant="ghost" onClick={clearAll}>
                  <X aria-hidden="true" />
                  Limpiar
                </Button>
              )}
              {formError && (
                <p className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              )}
            </div>
          </form>

          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t pt-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Filtros activos
              </span>
              {activeChips.map((chip) => (
                <Badge
                  key={chip.key}
                  variant="secondary"
                  className="gap-1 font-normal"
                >
                  {chip.label}
                  <button
                    type="button"
                    className="rounded-full p-0.5 hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => removeFilter(chip.key)}
                    aria-label={`Quitar filtro ${chip.label}`}
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {log.isLoading ? (
        <ListSkeleton rows={5} />
      ) : log.isError ? (
        <ErrorState error={log.error} onRetry={() => void log.refetch()} />
      ) : !log.data || log.data.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'Sin resultados' : 'Aún no hay operaciones'}
          description={
            hasFilters
              ? 'No hay operaciones que coincidan con los filtros. Prueba con otro rango de fechas o límpialos.'
              : 'Cuando registres compras, canjes, campañas o cambios de configuración aparecerán aquí.'
          }
          icon={ClipboardList}
          action={
            hasFilters ? (
              <Button variant="outline" onClick={clearAll}>
                Limpiar filtros
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Móvil: tarjetas legibles */}
          <div className="space-y-3 md:hidden" data-testid="audit-cards">
            {log.data.map((entry) => (
              <AuditCard
                key={entry.id}
                entry={entry}
                onDetail={() => setDetail(entry)}
              />
            ))}
          </div>

          {/* Escritorio: tabla */}
          <Card className="hidden md:block" data-testid="audit-table">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Qué pasó</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {log.data.map((entry) => (
                    <AuditTableRow
                      key={entry.id}
                      entry={entry}
                      onDetail={() => setDetail(entry)}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            {formatNumber(total)} {total === 1 ? 'operación' : 'operaciones'} ·
            página {page + 1} de {pageCount}
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

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {detail && (
            <AuditDetail key={detail.id} entry={detail} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AuditTableRow({
  entry,
  onDetail,
}: {
  entry: BusinessAuditLog;
  onDetail: () => void;
}) {
  const label = getAuditLabel(entry.operation);
  const Icon = label.icon;
  const styles = AUDIT_SEVERITY_STYLES[label.severity];

  return (
    <TableRow>
      <TableCell className="max-w-md">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 grid size-9 shrink-0 place-items-center rounded-full',
              styles.icon,
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{label.label}</p>
            <p className="truncate text-xs text-muted-foreground">
              {auditSubject(entry)}
            </p>
            <Badge variant="outline" className="mt-1 text-[10px] font-normal">
              {getAuditEntityLabel(entry.entity_type)}
            </Badge>
          </div>
        </div>
      </TableCell>
      <TableCell className="max-w-[14rem]">
        <p className="truncate text-sm font-medium">
          {entry.actor_name || entry.actor_email || 'Sistema'}
        </p>
        {entry.actor_name && entry.actor_email && (
          <p className="truncate text-xs text-muted-foreground">
            {entry.actor_email}
          </p>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
        {formatDateTimeBogota(entry.created_at)}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDetail}
          aria-label={`Ver detalle de ${label.label}`}
        >
          <Eye aria-hidden="true" />
          Ver
        </Button>
      </TableCell>
    </TableRow>
  );
}

function AuditCard({
  entry,
  onDetail,
}: {
  entry: BusinessAuditLog;
  onDetail: () => void;
}) {
  const label = getAuditLabel(entry.operation);
  const Icon = label.icon;
  const styles = AUDIT_SEVERITY_STYLES[label.severity];

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-full',
              styles.icon,
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">{label.label}</p>
            <p className="text-xs text-muted-foreground">{auditSubject(entry)}</p>
            <Badge variant="outline" className="mt-1 text-[10px] font-normal">
              {getAuditEntityLabel(entry.entity_type)}
            </Badge>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 text-xs text-muted-foreground">
          <span className="min-w-0">
            <span className="block truncate font-medium text-foreground">
              {entry.actor_name || entry.actor_email || 'Sistema'}
            </span>
            {formatDateTimeBogota(entry.created_at)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onDetail}
            aria-label={`Ver detalle de ${label.label}`}
          >
            <Eye aria-hidden="true" />
            Ver detalle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AuditDetail({ entry }: { entry: BusinessAuditLog }) {
  const [showJson, setShowJson] = useState(false);
  const label = getAuditLabel(entry.operation);
  const Icon = label.icon;
  const styles = AUDIT_SEVERITY_STYLES[label.severity];
  const description = describeAudit(entry);

  return (
    <>
      <DialogHeader>
        <div className="flex items-start gap-3 pr-6">
          <span
            className={cn(
              'grid size-10 shrink-0 place-items-center rounded-full',
              styles.icon,
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <DialogTitle>{label.label}</DialogTitle>
            <DialogDescription>{label.description}</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid gap-3 rounded-xl border bg-muted/30 p-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Actor
            </p>
            <p className="font-medium">
              {entry.actor_name || entry.actor_email || 'Sistema'}
            </p>
            {entry.actor_name && entry.actor_email && (
              <p className="break-all text-xs text-muted-foreground">
                {entry.actor_email}
              </p>
            )}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Fecha
            </p>
            <p className="font-medium">{formatDateTimeBogota(entry.created_at)}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Entidad
            </p>
            <p className="font-medium">{getAuditEntityLabel(entry.entity_type)}</p>
          </div>
        </div>

        <div className="rounded-xl border p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Resumen
          </p>
          <p className="font-medium">{auditSubject(entry)}</p>
        </div>

        {description.fields.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Detalle
            </p>
            <dl className="grid gap-2 sm:grid-cols-2">
              {description.fields.map((field) => (
                <div
                  key={`${field.label}-${field.value}`}
                  className="rounded-lg border p-2.5"
                >
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {field.label}
                  </dt>
                  <dd className="break-words text-sm font-medium">{field.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {description.changes.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cambios
            </p>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campo</TableHead>
                    <TableHead>Antes</TableHead>
                    <TableHead>Ahora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {description.changes.map((change) => (
                    <TableRow key={change.label}>
                      <TableCell className="font-medium">{change.label}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {change.before}
                      </TableCell>
                      <TableCell>{change.after}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {description.fields.length === 0 && description.changes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Esta operación no guardó datos adicionales.
          </p>
        )}

        <div className="flex flex-col gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => setShowJson((current) => !current)}
            aria-expanded={showJson}
          >
            <FileJson aria-hidden="true" />
            {showJson ? 'Ocultar JSON' : 'Ver JSON'}
          </Button>
          {showJson && (
            <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/40 p-3 text-xs">
              {JSON.stringify(
                {
                  operation: entry.operation,
                  entity_type: entry.entity_type,
                  entity_id: entry.entity_id,
                  metadata: entry.metadata,
                },
                null,
                2,
              )}
            </pre>
          )}
        </div>
      </div>
    </>
  );
}

function toFilters(form: FilterForm): BusinessAuditFilters {
  return {
    operation: form.operation || undefined,
    actor: form.actor.trim() || undefined,
    from: startOfBogotaDay(form.from),
    to: startOfNextBogotaDay(form.to),
    search: form.search.trim() || undefined,
  };
}

function startOfBogotaDay(date: string): string | undefined {
  return date ? new Date(`${date}T00:00:00-05:00`).toISOString() : undefined;
}

function startOfNextBogotaDay(date: string): string | undefined {
  if (!date) return undefined;
  const value = new Date(`${date}T00:00:00-05:00`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString();
}

function buildFilterChips(
  form: FilterForm,
): Array<{ key: keyof FilterForm; label: string }> {
  const chips: Array<{ key: keyof FilterForm; label: string }> = [];

  if (form.operation) {
    const category = AUDIT_CATEGORIES.find(
      (item) => item.prefix === form.operation,
    );
    chips.push({
      key: 'operation',
      label: category
        ? `Tipo: ${category.label}`
        : `Tipo: ${getAuditLabel(form.operation).label}`,
    });
  }
  if (form.actor.trim()) {
    chips.push({ key: 'actor', label: `Actor: ${form.actor.trim()}` });
  }
  if (form.from) {
    chips.push({
      key: 'from',
      label: `Desde: ${formatDateBogota(startOfBogotaDay(form.from))}`,
    });
  }
  if (form.to) {
    chips.push({
      key: 'to',
      label: `Hasta: ${formatDateBogota(startOfBogotaDay(form.to))}`,
    });
  }
  if (form.search.trim()) {
    chips.push({ key: 'search', label: `Texto: “${form.search.trim()}”` });
  }

  return chips;
}
