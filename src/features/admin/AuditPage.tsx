import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileJson,
  Search,
} from 'lucide-react';
import { useBusinessAuditLog } from '@/features/loyalty/hooks';
import { formatDateTimeBogota } from '@/lib/format';
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
import type { Business, BusinessAuditLog } from '@/types';

const PAGE_SIZE = 25;

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
  const [operationInput, setOperationInput] = useState('');
  const [operation, setOperation] = useState('');
  const [page, setPage] = useState(0);
  const [detail, setDetail] = useState<BusinessAuditLog | null>(null);

  const log = useBusinessAuditLog(
    business.id,
    operation,
    PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const total = log.data?.[0]?.total_count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function applyFilter(event: React.FormEvent) {
    event.preventDefault();
    setOperation(operationInput.trim());
    setPage(0);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Auditoría — ${business.name}`}
        description="Quién registró compras, canjeó recompensas o cambió la configuración."
      />

      <Card>
        <CardContent className="p-4">
          <form onSubmit={applyFilter} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={operationInput}
                onChange={(event) => setOperationInput(event.target.value)}
                placeholder="Filtrar por operación (p. ej. purchase.registered)"
                className="pl-9"
                aria-label="Filtrar por operación"
              />
            </div>
            <Button type="submit">Filtrar</Button>
            {operation && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOperation('');
                  setOperationInput('');
                  setPage(0);
                }}
              >
                Limpiar
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {log.isLoading ? (
        <ListSkeleton rows={5} />
      ) : log.isError ? (
        <ErrorState error={log.error} onRetry={() => void log.refetch()} />
      ) : !log.data || log.data.length === 0 ? (
        <EmptyState
          title="Sin operaciones registradas"
          description={
            operation
              ? `No hay operaciones que coincidan con “${operation}”.`
              : 'Las compras, canjes y cambios de configuración aparecerán aquí.'
          }
          icon={ClipboardList}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Operación</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Entidad</TableHead>
                <TableHead className="text-right">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {log.data.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDateTimeBogota(entry.created_at)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-[11px]">
                      {entry.operation}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.actor_email ?? 'Sistema'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {entry.entity_type}
                    </span>
                    {entry.entity_id && (
                      <span className="ml-2 font-mono text-[11px]">
                        {entry.entity_id.slice(0, 8)}…
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetail(entry)}
                      aria-label={`Ver detalle de ${entry.operation}`}
                    >
                      <FileJson aria-hidden="true" />
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            {total} operaciones · página {page + 1} de {pageCount}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detail?.operation}</DialogTitle>
            <DialogDescription>
              {detail
                ? `${formatDateTimeBogota(detail.created_at)} · ${detail.actor_email ?? 'Sistema'}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Entidad
                  </p>
                  <p className="font-mono text-xs">{detail.entity_type}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Identificador
                  </p>
                  <p className="break-all font-mono text-xs">
                    {detail.entity_id ?? '—'}
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Metadata
                </p>
                <pre className="max-h-80 overflow-auto rounded-lg border bg-muted/40 p-3 text-xs">
                  {JSON.stringify(detail.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
