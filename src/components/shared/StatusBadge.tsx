import { Badge } from '@/components/ui/badge';
import type {
  PurchaseStatus,
  RedemptionRequestStatus,
  RedemptionStatus,
} from '@/types';

const purchaseLabels: Record<
  PurchaseStatus,
  { label: string; variant: 'warning' | 'success' | 'muted' | 'destructive' }
> = {
  pending_claim: { label: 'Pendiente', variant: 'warning' },
  claimed: { label: 'Reclamada', variant: 'success' },
  expired: { label: 'Expirada', variant: 'muted' },
  cancelled: { label: 'Cancelada', variant: 'destructive' },
};

const redemptionLabels: Record<
  RedemptionStatus,
  { label: string; variant: 'warning' | 'success' | 'muted' | 'destructive' }
> = {
  pending_delivery: { label: 'Pendiente de entrega', variant: 'warning' },
  redeemed: { label: 'Entregado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'muted' },
};

export function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
  const config = purchaseLabels[status] ?? {
    label: status,
    variant: 'muted' as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function RedemptionStatusBadge({ status }: { status: RedemptionStatus }) {
  const config = redemptionLabels[status] ?? {
    label: status,
    variant: 'muted' as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

const requestLabels: Record<
  RedemptionRequestStatus,
  { label: string; variant: 'warning' | 'success' | 'muted' | 'destructive' | 'secondary' | 'outline' }
> = {
  pending: { label: 'Pendiente de validar', variant: 'warning' },
  approved: { label: 'Aprobado', variant: 'secondary' },
  delivered: { label: 'Entregado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'muted' },
  expired: { label: 'Vencido', variant: 'muted' },
};

export function RedemptionRequestStatusBadge({
  status,
}: {
  status: RedemptionRequestStatus;
}) {
  const config = requestLabels[status] ?? {
    label: status,
    variant: 'muted' as const,
  };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
