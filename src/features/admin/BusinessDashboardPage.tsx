import { Link, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Users,
  CreditCard,
  AlertTriangle,
  Copy,
  TrendingUp,
  Building2,
  LayoutGrid,
  Package,
  QrCode,
  Rocket,
  Settings2,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBusinesses, useLoyaltyProgram } from '@/features/loyalty/hooks';
import { useBusinessContext } from '@/features/loyalty/businessContext';
import { publicAppUrl } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, ListSkeleton } from '@/components/shared/States';

export function BusinessDashboardPage() {
  const businesses = useBusinesses();
  const { selectedBusiness, setSelectedBusiness } = useBusinessContext();
  const navigate = useNavigate();
  const activeBusinessId = selectedBusiness?.id ?? businesses.data?.[0]?.id ?? '';
  const program = useLoyaltyProgram(activeBusinessId);
  const programUnconfigured =
    !program.data ||
    program.data.id === '00000000-0000-0000-0000-000000000000' ||
    !program.data.configured_at;

  if (businesses.isLoading) return <ListSkeleton rows={3} />;
  if (businesses.isError) {
    return <ErrorState error={businesses.error} onRetry={() => void businesses.refetch()} />;
  }

  const list = businesses.data ?? [];

  // Selector de negocio (cabecera)
  if (list.length > 1 && !selectedBusiness) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Selecciona un negocio"
          description="Elige el negocio que deseas administrar."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((business) => (
            <Card
              key={business.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-primary"
              onClick={() => {
                setSelectedBusiness(business);
                navigate(`/admin/dashboard?business=${business.id}`);
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Building2 className="size-8 text-primary" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold">{business.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {business.slug} · {business.timezone}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Haz clic para entrar al panel de este negocio.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const current = selectedBusiness ?? list[0];
  const joinUrl = current
    ? `${publicAppUrl()}/join/${encodeURIComponent(current.slug)}`
    : '';
  if (!current) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Sin negocios" description="No tienes negocios asignados." />
        <EmptyState
          title="Sin negocios"
          description="Regístrate como administrador o solicita acceso a un negocio existente."
          icon={Building2}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Panel — ${current.name}`}
        description={
          current.slug + ' · Zona horaria: ' + current.timezone
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {!program.data?.is_active && (
              <Button asChild size="sm">
                <Link to="/admin/onboarding">
                  <Rocket aria-hidden="true" />
                  Completar configuración
                </Link>
              </Button>
            )}
            <Badge variant="secondary">
              {current.role === 'admin'
                ? 'Administrador'
                : current.role === 'encargado'
                  ? 'Encargado'
                  : 'Cliente'}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setSelectedBusiness(null)}>
              Cambiar negocio
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de loopoints emitidos</CardTitle>
            <CreditCard className="text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-extrabold">—</p>
            <p className="text-xs text-muted-foreground">Saldo acumulado de clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redenciones pendientes</CardTitle>
            <AlertTriangle className="text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-extrabold">—</p>
            <p className="text-xs text-muted-foreground">Esperando aprobación o entrega</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto comprometido</CardTitle>
            <TrendingUp className="text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-extrabold">—</p>
            <p className="text-xs text-muted-foreground">Del presupuesto mensual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes activos</CardTitle>
            <Users className="text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-3xl font-extrabold">—</p>
            <p className="text-xs text-muted-foreground">Con saldo en el programa</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="size-4 text-muted-foreground" aria-hidden="true" />
              Invitar clientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Comparte este enlace o QR. Quien lo abra podrá afiliarse a{' '}
              <strong>{current.name}</strong> y empezar a acumular.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={joinUrl}
                aria-label="Enlace de invitación"
                className="min-w-0 flex-1 rounded-md border border-input bg-muted/40 px-3 py-2 text-xs"
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(joinUrl)
                    .then(() => toast.success('Enlace copiado.'))
                    .catch(() => toast.error('No se pudo copiar el enlace.'));
                }}
              >
                <Copy aria-hidden="true" />
                Copiar
              </Button>
            </div>
            <div className="mx-auto w-fit rounded-xl border bg-white p-3">
              <QRCodeCanvas
                value={joinUrl}
                size={160}
                marginSize={2}
                level="M"
                aria-label="QR de invitación al negocio"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LayoutGrid className="size-4 text-muted-foreground" aria-hidden="true" />
              Accesos rápidos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" asChild>
              <Link to="/admin/purchases/new">
                <QrCode className="mr-2 size-4" aria-hidden="true" />
                Generar QR de una venta
              </Link>
            </Button>
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <span className="font-medium">Estado del programa</span>
              <Badge
                variant={
                  programUnconfigured
                    ? 'warning'
                    : program.data?.is_active
                      ? 'success'
                      : 'muted'
                }
              >
                {programUnconfigured
                  ? 'Sin configurar'
                  : program.data?.is_active
                    ? 'Activo'
                    : 'Inactivo'}
              </Badge>
            </div>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/program">
                <Settings2 className="mr-2 size-4" aria-hidden="true" />
                {programUnconfigured
                  ? 'Configurar programa de loopoints'
                  : 'Editar programa de loopoints'}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/products">
                <Package className="mr-2 size-4" aria-hidden="true" />
                Administrar la carta
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/rewards">
                <CreditCard className="mr-2 size-4" aria-hidden="true" />
                Gestionar recompensas
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/members">
                <Users className="mr-2 size-4" aria-hidden="true" />
                Gestionar encargados y miembros
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
