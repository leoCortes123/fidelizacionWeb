import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Clock, Copy, Plus, QrCode, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import {
  useBusinessMemberships,
  useCreateMemberInvite,
  useUpdateBusinessMembership,
  useBusinesses,
} from "@/features/loyalty/hooks";
import { useBusinessContext } from "@/features/loyalty/businessContext";
import { memberInviteUrl } from "@/lib/config";
import { errorMessage } from "@/lib/errors";
import { formatDateTimeBogota } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState, ListSkeleton, LoadingScreen } from "@/components/shared/States";
import type { BusinessRole, MemberInviteCreateResult } from "@/types";

const roleLabels: Record<BusinessRole, string> = {
  admin: "Administrador",
  encargado: "Encargado",
  cliente: "Cliente",
};

export function MembersPage() {
  const businesses = useBusinesses();
  const { selectedBusiness, setSelectedBusiness } = useBusinessContext();
  const navigate = useNavigate();

  const memberships = useBusinessMemberships(selectedBusiness?.id ?? "");
  const updateMembership = useUpdateBusinessMembership();
  const createInvite = useCreateMemberInvite();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [role, setRole] = useState<"encargado" | "cliente">("encargado");
  const [canApprove, setCanApprove] = useState(false);
  const [invite, setInvite] = useState<MemberInviteCreateResult | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (businesses.isLoading) return <ListSkeleton rows={3} />;
  if (businesses.isError) {
    return <ErrorState error={businesses.error} onRetry={() => void businesses.refetch()} />;
  }

  const list = businesses.data ?? [];

  if (list.length > 1 && !selectedBusiness) {
    return (
      <div className="space-y-4 sm:space-y-5 animate-fade-in">
        <PageHeader
          title="Selecciona un negocio"
          description="Elige el negocio para gestionar miembros."
        />
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
                    navigate("/admin/members");
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
      <div className="space-y-4 sm:space-y-5 animate-fade-in">
        <PageHeader title="Sin negocios" description="No tienes negocios asignados." />
        <EmptyState
          title="Sin negocios"
          description="Registra un negocio para continuar."
          icon={Users}
        />
      </div>
    );
  }

  const membershipsData = memberships.data ?? [];

  if (memberships.isLoading) return <LoadingScreen label="Cargando miembros…" />;
  if (memberships.isError) {
    return <ErrorState error={memberships.error} onRetry={() => void memberships.refetch()} />;
  }

  async function toggleApproval(
    member: (typeof membershipsData)[number],
    canApproveValue: boolean,
  ) {
    try {
      await updateMembership.mutateAsync({
        businessId: current.id,
        userId: member.user_id,
        canApproveRedemptions: canApproveValue,
      });
      toast.success(
        canApproveValue ? "Permiso de aprobación activado." : "Permiso de aprobación desactivado.",
      );
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function openDialog() {
    setRole("encargado");
    setCanApprove(false);
    setInvite(null);
    setCopiedUrl(false);
    setDialogOpen(true);
  }

  function closeDialog(open: boolean) {
    if (!open) {
      setDialogOpen(false);
      setInvite(null);
      setCopiedUrl(false);
    }
  }

  async function generateInviteQr(event: React.FormEvent) {
    event.preventDefault();
    try {
      const result = await createInvite.mutateAsync({
        businessId: current.id,
        role,
        canApproveRedemptions: role === "encargado" ? canApprove : false,
      });
      setInvite(result);
      setCopiedUrl(false);
      toast.success(`QR de invitación para ${roleLabels[role].toLowerCase()} generado.`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const inviteUrl = invite ? memberInviteUrl(invite.token) : "";

  async function copyInviteUrl() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedUrl(true);
      toast.success("Enlace de invitación copiado.");
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      <PageHeader
        title="Miembros"
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
        <div className="space-y-3 sm:space-y-4">
          {membershipsData.map((member) => (
            <Card key={member.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                  {(member.full_name || member.email || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{member.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{roleLabels[member.role]}</Badge>
                {member.role === "encargado" && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={member.can_approve_redemptions}
                      onChange={() => toggleApproval(member, !member.can_approve_redemptions)}
                      className="size-4 cursor-pointer rounded-none border-input accent-primary"
                    />
                    Puede aprobar redenciones
                  </label>
                )}
                {member.role === "admin" && <Badge variant="destructive">Administrador</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="px-4 text-xs text-muted-foreground sm:px-0">
        El permiso <strong>Puede aprobar redenciones</strong> solo aplica a encargados. Los
        administradores siempre pueden aprobar. El sistema impide dejar un negocio sin
        administrador.
      </p>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {invite ? "QR de invitación generado" : "Añadir miembro por QR"}
            </DialogTitle>
            <DialogDescription>
              {invite
                ? "Pide a la persona que escanee este código para registrarse o actualizar su rol automáticamente."
                : "Elige el rol que recibirá la persona al escanear el código QR de invitación."}
            </DialogDescription>
          </DialogHeader>

          {!invite ? (
            <form onSubmit={generateInviteQr} className="space-y-4" noValidate>
              <div className="space-y-4 rounded-none border border-border bg-muted/20 p-4">
                <div className="space-y-2">
                  <Label htmlFor="member-role">Rol en el negocio</Label>
                  <Select
                    value={role}
                    onValueChange={(value) => {
                      const nextRole = value as "encargado" | "cliente";
                      setRole(nextRole);
                      if (nextRole === "cliente") setCanApprove(false);
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

                {role === "encargado" && (
                  <label className="flex cursor-pointer items-start gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={canApprove}
                      onChange={(event) => setCanApprove(event.target.checked)}
                      className="mt-0.5 size-4 cursor-pointer rounded-none border-input accent-primary"
                    />
                    <span>Puede aprobar redenciones</span>
                  </label>
                )}

                <p className="text-xs leading-relaxed text-muted-foreground">
                  El código QR abre el registro ocultando la selección de cliente o administrador y
                  asigna automáticamente el rol de <strong>{roleLabels[role].toLowerCase()}</strong>
                  . Si la persona ya tiene cuenta como cliente, su rol cambiará al aceptar la
                  invitación.
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => closeDialog(false)}
                  disabled={createInvite.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={createInvite.isPending}>
                  <QrCode aria-hidden="true" />
                  Generar QR
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Badge variant="secondary">Rol: {roleLabels[invite.role]}</Badge>
                {invite.role === "encargado" && invite.can_approve_redemptions && (
                  <Badge variant="success">Puede aprobar canjes</Badge>
                )}
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="rounded-none border border-border bg-white p-4 shadow-sm">
                  <QRCodeCanvas
                    value={inviteUrl}
                    size={220}
                    marginSize={2}
                    level="M"
                    aria-label="Código QR de invitación para miembro"
                  />
                </div>
                <p className="flex items-center gap-1.5 text-center text-xs text-muted-foreground">
                  <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                  Un solo uso · vence el {formatDateTimeBogota(invite.expires_at)}
                </p>
              </div>

              <div className="space-y-2 rounded-none border bg-muted/30 p-3">
                <Label htmlFor="member-invite-url" className="text-xs uppercase tracking-wide">
                  Enlace de invitación
                </Label>
                <div className="flex gap-2">
                  <input
                    id="member-invite-url"
                    readOnly
                    value={inviteUrl}
                    aria-label="Enlace de invitación de miembro"
                    onFocus={(event) => event.currentTarget.select()}
                    className="h-9 min-w-0 flex-1 rounded-none border border-input bg-background px-2 py-1 font-mono text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void copyInviteUrl()}
                  >
                    {copiedUrl ? (
                      <Check className="text-emerald-600" aria-hidden="true" />
                    ) : (
                      <Copy aria-hidden="true" />
                    )}
                    {copiedUrl ? "Copiado" : "Copiar"}
                  </Button>
                </div>
              </div>

              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Cuando la persona complete su registro o inicie sesión desde este QR, se integrará
                como {roleLabels[invite.role].toLowerCase()} de {invite.business_name}.
              </p>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setInvite(null);
                    setCopiedUrl(false);
                  }}
                >
                  <RefreshCw aria-hidden="true" />
                  Generar otro QR
                </Button>
                <Button type="button" onClick={() => closeDialog(false)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
