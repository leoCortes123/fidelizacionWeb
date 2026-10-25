import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  useBusinessMemberships,
  useCreateBusinessMembership,
  useSearchProfiles,
  useUpdateBusinessMembership,
  useBusinesses,
} from '@/features/loyalty/hooks';
import { useBusinessContext } from '@/features/loyalty/businessContext';
import { errorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState, ErrorState, ListSkeleton, LoadingScreen } from '@/components/shared/States';
import type { BusinessRole, ProfileLookup } from '@/types';

const roleLabels: Record<BusinessRole, string> = {
  admin: 'Administrador',
  encargado: 'Encargado',
  cliente: 'Cliente',
};

export function MembersPage() {
  const businesses = useBusinesses();
  const { selectedBusiness, setSelectedBusiness } = useBusinessContext();
  const navigate = useNavigate();

  const memberships = useBusinessMemberships(selectedBusiness?.id ?? '');
  const updateMembership = useUpdateBusinessMembership();
  const createMembership = useCreateBusinessMembership();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<ProfileLookup | null>(null);
  const [role, setRole] = useState<'encargado' | 'cliente'>('encargado');
  const [canApprove, setCanApprove] = useState(false);
  const profiles = useSearchProfiles(selectedBusiness?.id ?? '', search);

  if (businesses.isLoading) return <ListSkeleton rows={3} />;
  if (businesses.isError) {
    return <ErrorState error={businesses.error} onRetry={() => void businesses.refetch()} />;
  }

  const list = businesses.data ?? [];

  if (list.length > 1 && !selectedBusiness) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Selecciona un negocio" description="Elige el negocio para gestionar miembros." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((business) => (
            <Card key={business.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Users className="mx-auto size-12 text-primary mb-3" aria-hidden="true" />
                <h3 className="font-semibold">{business.name}</h3>
                <p className="text-xs text-muted-foreground">{business.slug}</p>
                <Button
                  key={business.id}
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedBusiness(business);
                    navigate('/admin/members');
                  }}
                >
                  Seleccionar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const current = selectedBusiness ?? list[0];
  if (!current) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Sin negocios" description="No tienes negocios asignados." />
        <EmptyState title="Sin negocios" description="Registra un negocio para continuar." icon={Users} />
      </div>
    );
  }

  const membershipsData = memberships.data ?? [];

  if (memberships.isLoading) return <LoadingScreen label="Cargando miembros…" />;
  if (memberships.isError) {
    return <ErrorState error={memberships.error} onRetry={() => void memberships.refetch()} />;
  }

  async function toggleApproval(member: (typeof membershipsData)[number], canApproveValue: boolean) {
    try {
      await updateMembership.mutateAsync({
        businessId: current.id,
        userId: member.user_id,
        canApproveRedemptions: canApproveValue,
      });
      toast.success(
        canApproveValue
          ? 'Permiso de aprobación activado.'
          : 'Permiso de aprobación desactivado.',
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function openDialog() {
    setSearch('');
    setSelectedProfile(null);
    setRole('encargado');
    setCanApprove(false);
    setDialogOpen(true);
  }

  function closeDialog(open: boolean) {
    if (!open) {
      setDialogOpen(false);
      setSelectedProfile(null);
      setSearch('');
    }
  }

  async function addMember(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedProfile) {
      toast.error('Busca y selecciona una persona.');
      return;
    }
    try {
      await createMembership.mutateAsync({
        businessId: current.id,
        userId: selectedProfile.user_id,
        role,
        canApproveRedemptions: role === 'encargado' ? canApprove : false,
      });
      toast.success(`${selectedProfile.full_name} se unió como ${roleLabels[role].toLowerCase()}.`);
      setDialogOpen(false);
      setSelectedProfile(null);
      setSearch('');
      void memberships.refetch();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const searchResults = profiles.data ?? [];
  const canSubmitSearch = search.trim().length >= 2;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Miembros — ${current.name}`}
        description="Administra encargados, clientes y sus permisos de redención."
        actions={
          <Button onClick={openDialog}>
            <Plus aria-hidden="true" />
            Añadir miembro
          </Button>
        }
      />

      {membershipsData.length === 0 ? (
        <EmptyState
          title="Sin miembros"
          description="Aún no hay miembros asignados a este negocio."
          icon={Users}
          action={
            <Button variant="outline" onClick={openDialog}>
              Añadir miembro
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {membershipsData.map((member) => (
            <Card key={member.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-secondary text-secondary-foreground">
                  {(member.full_name || member.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{member.full_name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{roleLabels[member.role]}</Badge>
                {member.role === 'encargado' && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={member.can_approve_redemptions}
                      onChange={() =>
                        toggleApproval(member, !member.can_approve_redemptions)
                      }
                      className="size-4 rounded border-input"
                    />
                    Puede aprobar redenciones
                  </label>
                )}
                {member.role === 'admin' && (
                  <Badge variant="destructive">Administrador</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        El permiso <strong>Puede aprobar redenciones</strong> solo aplica a
        encargados. Los administradores siempre pueden aprobar. El sistema impide
        dejar un negocio sin administrador.
      </p>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Añadir miembro</DialogTitle>
            <DialogDescription>
              Busca por nombre o correo. La persona debe tener una cuenta creada.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={addMember} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="member-search">Buscar persona</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="member-search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setSelectedProfile(null);
                  }}
                  placeholder="correo@ejemplo.com o nombre"
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Escribe al menos 2 caracteres.
              </p>
            </div>

            {canSubmitSearch && (
              <div className="max-h-56 overflow-y-auto rounded-lg border">
                {profiles.isLoading ? (
                  <p className="p-3 text-sm text-muted-foreground">Buscando…</p>
                ) : profiles.isError ? (
                  <p className="p-3 text-sm text-destructive" role="alert">
                    {errorMessage(profiles.error)}
                  </p>
                ) : searchResults.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">
                    No encontramos cuentas con “{search.trim()}”.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {searchResults.map((profile) => (
                      <li
                        key={profile.user_id}
                        className="flex items-center justify-between gap-3 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {profile.full_name || 'Sin nombre'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {profile.email}
                          </p>
                        </div>
                        {profile.already_member ? (
                          <Badge variant="muted">Ya es miembro</Badge>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedProfile(profile)}
                          >
                            <UserPlus aria-hidden="true" />
                            Elegir
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {selectedProfile && (
              <div className="space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div>
                  <p className="text-sm font-semibold">{selectedProfile.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedProfile.email}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="member-role">Rol en el negocio</Label>
                    <Select
                      value={role}
                      onValueChange={(value) => {
                        setRole(value as 'encargado' | 'cliente');
                        if (value === 'cliente') setCanApprove(false);
                      }}
                    >
                      <SelectTrigger id="member-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="encargado">Encargado</SelectItem>
                        <SelectItem value="cliente">Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {role === 'encargado' && (
                    <label className="flex items-start gap-2 self-end text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={canApprove}
                        onChange={(event) => setCanApprove(event.target.checked)}
                        className="mt-0.5 size-4 rounded border-input"
                      />
                      Puede aprobar redenciones
                    </label>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Los administradores solo pueden nombrarse desde el negocio creador.
                  Si la persona ya tiene una membresía, aparecerá como “Ya es miembro”.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => closeDialog(false)}
                disabled={createMembership.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={createMembership.isPending}
                disabled={!selectedProfile}
              >
                Añadir miembro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
