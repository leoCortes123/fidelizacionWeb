import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAdminCustomers } from './hooks';
import { formatCOP, formatDateBogota, formatPoints } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
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

const PAGE_SIZE = 15;

export function CustomersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState('points');
  const [direction, setDirection] = useState('desc');
  const customers = useAdminCustomers(search, page, PAGE_SIZE, sort, direction);

  const total = customers.data?.[0]?.total_count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(0);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Clientes"
        description="Consulta saldo, compras y valor acumulado. Ordenados por puntos de mayor a menor."
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar por nombre o correo"
                className="pl-9"
                aria-label="Buscar cliente"
              />
            </div>
            <Button type="submit">Buscar</Button>
            {search && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                  setPage(0);
                }}
              >
                Limpiar
              </Button>
            )}
          </form>

          <div className="flex flex-wrap items-end gap-3">
            <div className="w-full space-y-1 sm:w-56">
              <Label htmlFor="sort">Ordenar por</Label>
              <Select
                value={sort}
                onValueChange={(value) => {
                  setSort(value);
                  setPage(0);
                }}
              >
                <SelectTrigger id="sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Saldo de puntos</SelectItem>
                  <SelectItem value="created_at">Fecha de registro</SelectItem>
                  <SelectItem value="name">Nombre</SelectItem>
                  <SelectItem value="email">Correo</SelectItem>
                  <SelectItem value="purchases">Número de compras</SelectItem>
                  <SelectItem value="total_spent">Valor acumulado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
                setPage(0);
              }}
            >
              <ArrowDownUp aria-hidden="true" />
              {direction === 'asc' ? 'Ascendente' : 'Descendente'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {customers.isLoading ? (
        <ListSkeleton rows={5} />
      ) : customers.isError ? (
        <ErrorState error={customers.error} onRetry={() => void customers.refetch()} />
      ) : !customers.data || customers.data.length === 0 ? (
        <EmptyState
          title="Sin clientes para mostrar"
          description={
            search
              ? 'No encontramos coincidencias. Prueba con otro nombre o correo.'
              : 'Los clientes aparecen cuando inician sesión por primera vez.'
          }
          icon={Users}
        />
      ) : (
        <>
          {/* Móvil: tarjetas táctiles */}
          <div className="space-y-3 md:hidden">
            {customers.data.map((customer) => (
              <Card key={customer.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {customer.full_name || 'Sin nombre'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {customer.email}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-2xl font-extrabold text-primary">
                        {customer.points_balance}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        puntos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {customer.purchase_count} compras ·{' '}
                      {formatCOP(customer.total_spent)}
                    </span>
                    <span>{formatDateBogota(customer.created_at)}</span>
                  </div>
                  <Button asChild className="w-full" size="sm">
                    <Link to={`/admin/customers/${customer.id}`}>
                      <Sparkles aria-hidden="true" />
                      Ver detalle y canjear
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Escritorio: tabla */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Compras</TableHead>
                    <TableHead>Acumulado</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="text-right" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.data.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <p className="font-semibold">
                          {customer.full_name || 'Sin nombre'}
                        </p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPoints(customer.points_balance)}
                      </TableCell>
                      <TableCell>{customer.purchase_count}</TableCell>
                      <TableCell>{formatCOP(customer.total_spent)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateBogota(customer.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/customers/${customer.id}`}>Ver detalle</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {total > PAGE_SIZE && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            {total} clientes · página {page + 1} de {pageCount}
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
    </div>
  );
}
