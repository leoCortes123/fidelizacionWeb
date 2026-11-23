import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, TicketCheck } from "lucide-react";
import { useBusinesses, useLoyaltyRedemptions } from "@/features/loyalty/hooks";
import { useBusinessContext } from "@/features/loyalty/businessContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState, ListSkeleton, LoadingScreen } from "@/components/shared/States";
import { RedemptionsTable } from "./RedemptionsTable";
import type { Business } from "@/types";

const statusOptions: Array<{ value: string; label: string }> = [
  { value: "all", label: "Todos los estados" },
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobados" },
  { value: "delivered", label: "Entregados" },
  { value: "cancelled", label: "Cancelados" },
  { value: "expired", label: "Vencidos" },
];

export function RedemptionsPage() {
  const businesses = useBusinesses();
  const { selectedBusiness, setSelectedBusiness } = useBusinessContext();
  const navigate = useNavigate();

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
          description="Elige el negocio cuyas solicitudes deseas atender."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((business) => (
            <Card key={business.id} className="lp-card-interactive cursor-pointer">
              <CardContent className="p-[var(--lp-pad-card)] text-center">
                <TicketCheck className="mx-auto mb-3 size-12 text-primary" aria-hidden="true" />
                <h3 className="font-semibold">{business.name}</h3>
                <p className="text-xs text-muted-foreground">{business.slug}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => {
                    setSelectedBusiness(business);
                    navigate("/admin/redemptions");
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
          description="Registra un negocio para atender sus solicitudes."
          icon={TicketCheck}
        />
      </div>
    );
  }

  return <RedemptionsSection key={current.id} business={current} />;
}

function RedemptionsSection({ business }: { business: Business }) {
  const { selectedRole, canApproveRedemptions } = useBusinessContext();
  const canAct =
    selectedRole === "admin" || (selectedRole === "encargado" && canApproveRedemptions);
  const canCancel = selectedRole === "admin";

  const [statusFilter, setStatusFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const redemptions = useLoyaltyRedemptions(
    business.id,
    statusFilter === "all" ? "" : statusFilter,
    originFilter === "all" ? "" : originFilter,
  );

  if (redemptions.isLoading) return <LoadingScreen label="Cargando solicitudes…" />;
  if (redemptions.isError) {
    return <ErrorState error={redemptions.error} onRetry={() => void redemptions.refetch()} />;
  }

  const rows = redemptions.data ?? [];

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      <PageHeader
        title="Solicitudes"
        description="Valida, aprueba, entrega o cancela los canjes solicitados por tus clientes."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44" aria-label="Filtrar por estado">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={originFilter} onValueChange={setOriginFilter}>
              <SelectTrigger className="w-44" aria-label="Filtrar por origen">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los orígenes</SelectItem>
                <SelectItem value="manual">Solicitud manual</SelectItem>
                <SelectItem value="qr_scan">QR escaneado</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => void redemptions.refetch()}
              aria-label="Actualizar solicitudes"
            >
              <RefreshCw aria-hidden="true" />
            </Button>
          </div>
        }
      />

      {!canAct && (
        <div className="lp-tip-box rounded-none p-4 text-sm">
          Tu rol en este negocio es <strong>{selectedRole ?? "sin rol"}</strong>
          {selectedRole === "encargado" ? " y no tienes permiso de aprobación" : ""}. Puedes
          consultar las solicitudes, pero solo un administrador o un encargado autorizado puede
          aprobarlas y entregarlas.
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          title="Sin solicitudes"
          description={
            statusFilter === "all" && originFilter === "all"
              ? "Todavía no hay canjes solicitados en este negocio."
              : "No hay solicitudes con esos filtros."
          }
          icon={TicketCheck}
        />
      ) : (
        <RedemptionsTable
          businessId={business.id}
          rows={rows}
          showCustomerColumn
          canAct={canAct}
          canCancel={canCancel}
        />
      )}

      <p className="px-4 text-xs text-muted-foreground sm:px-0">
        Aprobar consume el token QR: el cliente ya no podrá reutilizarlo. Si el QR se escanea desde{" "}
        <span className="font-mono">/scan</span>, la entrega se confirma en un solo paso y la
        solicitud aparece como “QR escaneado”. Cancelar o rechazar devuelve las monedas reservadas.
        Cada paso queda en la auditoría.
      </p>
    </div>
  );
}
