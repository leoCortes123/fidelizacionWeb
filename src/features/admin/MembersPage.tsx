import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  Calendar,
  Check,
  Clock,
  Copy,
  Eye,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { EntityAvatar } from "@/components/shared/EntityAvatar";
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

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [invite, setInvite] = useState<MemberInviteCreateResult | null>(null);
  const [inviteError, setInviteError] = useState<unknown>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const inviteSeqRef = useRef(0);

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
            <Card key={business.id} className="lp-card-interactive cursor-pointer">
              <CardContent className="p-[var(--lp-pad-card)] text-center">
                <Users className="mx-auto mb-3 size-12 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{business.name}</h3>
                <p className="text-xs text-muted-foreground">{business.slug}</p>
                <Button
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
  const staffMembers = membershipsData.filter((member) => member.role !== "cliente");
  const selectedMember =
    selectedMemberId !== null
      ? (staffMembers.find((member) => member.id === selectedMemberId) ?? null)
      : null;

  if (memberships.isLoading) return <LoadingScreen label="Cargando miembros…" />;
  if (memberships.isError) {
    return <ErrorState error={memberships.error} onRetry={() => void memberships.refetch()} />;
  }

  async function toggleApproval(member: (typeof staffMembers)[number], canApproveValue: boolean) {
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

  async function requestInviteQr(allowRedemptions: boolean) {
    const seq = ++inviteSeqRef.current;
    setInvite(null);
    setInviteError(null);
    setCopiedUrl(false);
    try {
      const result = await createInvite.mutateAsync({
        businessId: current.id,
        role: "encargado",
        canApproveRedemptions: allowRedemptions,
      });
      if (seq !== inviteSeqRef.current) return;
      setInvite(result);
    } catch (error) {
      if (seq !== inviteSeqRef.current) return;
      setInviteError(error);
      toast.error(errorMessage(error));
    }
  }

  function openInviteDialog() {
    setCanApprove(false);
    setInviteDialogOpen(true);
    void requestInviteQr(false);
  }

  function closeInviteDialog(open: boolean) {
    if (!open) {
      inviteSeqRef.current += 1;
      setInviteDialogOpen(false);
      setInvite(null);
      setInviteError(null);
      setCopiedUrl(false);
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
        description="Administra el equipo del negocio (administradores y encargados) y sus permisos de redención."
        actions={
          <Button onClick={openInviteDialog}>
            <Plus aria-hidden="true" />
            Añadir miembro
          </Button>
        }
      />

      {staffMembers.length === 0 ? (
        <EmptyState
          title="Sin miembros del equipo"
          description="Aún no hay encargados o administradores asignados a este negocio."
          icon={Users}
          action={
            <Button variant="outline" onClick={openInviteDialog}>
              Añadir miembro
            </Button>
          }
        />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {staffMembers.map((member) => (
            <Card key={member.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <button
                type="button"
                onClick={() => setSelectedMemberId(member.id)}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[var(--lp-focus-ring)]"
              >
                <EntityAvatar
                  src={member.avatar_url}
                  alt={member.full_name || member.email}
                  fallbackText={member.full_name || member.email}
                  sizeClassName="size-10"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{member.full_name || "Sin nombre"}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                </div>
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                  {roleLabels[member.role]}
                </Badge>
                {member.role === "encargado" && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={member.can_approve_redemptions}
                      disabled={updateMembership.isPending}
                      onChange={() => void toggleApproval(member, !member.can_approve_redemptions)}
                      className="size-4 cursor-pointer rounded-none border-input accent-primary disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    Puede aprobar redenciones
                  </label>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMemberId(member.id)}
                >
                  <Eye aria-hidden="true" />
                  Ver detalle
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="px-4 text-xs text-muted-foreground sm:px-0">
        Los clientes se gestionan desde la pantalla de <strong>Clientes</strong>. El permiso{" "}
        <strong>Puede aprobar redenciones</strong> solo aplica a encargados; los administradores
        siempre pueden aprobar.
      </p>

      {/* Panel lateral: detalle de miembro */}
      <Dialog
        open={selectedMember !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedMemberId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserRound className="size-5 text-primary" aria-hidden="true" />
              Detalle del miembro
            </DialogTitle>
            <DialogDescription>
              Información de cuenta, rol y permisos en el negocio.
            </DialogDescription>
          </DialogHeader>

          {selectedMember && (
            <div className="space-y-4">
              <div className="lp-subpanel flex items-center gap-3">
                <EntityAvatar
                  src={selectedMember.avatar_url}
                  alt={selectedMember.full_name || selectedMember.email}
                  fallbackText={selectedMember.full_name || selectedMember.email}
                  sizeClassName="size-14"
                />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-display text-lg font-extrabold">
                      {selectedMember.full_name || "Sin nombre"}
                    </p>
                    <Badge variant={selectedMember.role === "admin" ? "default" : "secondary"}>
                      {roleLabels[selectedMember.role]}
                    </Badge>
                  </div>
                  {selectedMember.nickname && (
                    <p className="font-mono text-xs text-muted-foreground">
                      @{selectedMember.nickname}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2.5 border-2 border-[var(--lp-ink)] bg-card p-3">
                  <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
                      Correo electrónico
                    </p>
                    <p className="break-all font-medium">{selectedMember.email}</p>
                  </div>
                </div>

                {selectedMember.phone && (
                  <div className="flex items-center gap-2.5 border-2 border-[var(--lp-ink)] bg-card p-3">
                    <Phone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
                        Teléfono
                      </p>
                      <p className="font-medium">{selectedMember.phone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2.5 border-2 border-[var(--lp-ink)] bg-card p-3">
                  <Calendar className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
                      Miembro desde
                    </p>
                    <p className="font-medium">{formatDateTimeBogota(selectedMember.created_at)}</p>
                  </div>
                </div>

                <div className="border-2 border-[var(--lp-ink)] bg-card p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
                      Permisos de redención
                    </p>
                  </div>
                  {selectedMember.role === "admin" ? (
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Acceso completo como administrador. Puede aprobar, entregar y cancelar
                      solicitudes de canje.
                    </p>
                  ) : (
                    <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={selectedMember.can_approve_redemptions}
                        disabled={updateMembership.isPending}
                        onChange={() =>
                          void toggleApproval(
                            selectedMember,
                            !selectedMember.can_approve_redemptions,
                          )
                        }
                        className="size-4 cursor-pointer rounded-none border-input accent-primary disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      Puede aprobar redenciones
                    </label>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedMemberId(null)}>
                  Cerrar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Panel lateral: QR directo para añadir encargado */}
      <Dialog open={inviteDialogOpen} onOpenChange={closeInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR de invitación para encargado</DialogTitle>
            <DialogDescription>
              Pide al nuevo miembro del equipo que escanee este código QR para integrarse como
              encargado del negocio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="lp-subpanel flex cursor-pointer items-start gap-2.5 text-sm font-medium">
              <input
                type="checkbox"
                checked={canApprove}
                disabled={createInvite.isPending}
                onChange={(event) => {
                  const next = event.target.checked;
                  setCanApprove(next);
                  void requestInviteQr(next);
                }}
                className="mt-0.5 size-4 cursor-pointer rounded-none border-input accent-primary"
              />
              <span>
                Puede aprobar redenciones
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  Al cambiar esta opción se genera automáticamente un nuevo QR con el permiso
                  actualizado.
                </span>
              </span>
            </label>

            {createInvite.isPending ? (
              <LoadingScreen label="Generando código QR…" />
            ) : inviteError ? (
              <ErrorState error={inviteError} onRetry={() => void requestInviteQr(canApprove)} />
            ) : invite ? (
              <>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Badge variant="secondary">Rol: {roleLabels[invite.role]}</Badge>
                  {invite.can_approve_redemptions && (
                    <Badge variant="success">Puede aprobar canjes</Badge>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2.5">
                  <div className="rounded-none border-2 border-[var(--lp-ink)] bg-white p-3.5 shadow-[var(--lp-shadow-lg)]">
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

                <div className="lp-subpanel space-y-1.5">
                  <Label
                    htmlFor="member-invite-url"
                    className="font-mono text-xs uppercase tracking-wide"
                  >
                    Enlace de invitación
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="member-invite-url"
                      readOnly
                      value={inviteUrl}
                      aria-label="Enlace de invitación de miembro"
                      onFocus={(event) => event.currentTarget.select()}
                      className="min-w-0 flex-1 font-mono text-base sm:text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void copyInviteUrl()}
                    >
                      {copiedUrl ? (
                        <Check className="text-[var(--lp-green-text)]" aria-hidden="true" />
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
                  como encargado de {invite.business_name}.
                </p>
              </>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={createInvite.isPending}
                onClick={() => void requestInviteQr(canApprove)}
              >
                <RefreshCw aria-hidden="true" />
                Generar otro QR
              </Button>
              <Button type="button" onClick={() => closeInviteDialog(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
