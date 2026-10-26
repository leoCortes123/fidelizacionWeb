import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rpc } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import type {
  BusinessPurchase,
  ClaimResult,
  PurchaseQrCreateResult,
  PurchaseQrPreview,
  PurchaseStatus,
} from '@/types';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,100}$/;

/** Datos públicos del QR. Se consultan antes de iniciar sesión. */
export function usePurchaseQrPreview(token: string) {
  return useQuery({
    queryKey: queryKeys.purchaseQrPreview(token),
    queryFn: () =>
      rpc<PurchaseQrPreview>('purchase_qr_preview', { p_token: token }),
    enabled: TOKEN_PATTERN.test(token),
    retry: false,
  });
}

/** Genera la venta pendiente y su token. Solo admin/encargado. */
export function useCreatePurchaseQr(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amountCop: number) =>
      rpc<PurchaseQrCreateResult>('purchase_qr_create', {
        p_business_id: businessId,
        p_amount_cop: amountCop,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['business-purchases', businessId],
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auditLog });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessAuditLogPrefix(businessId),
      });
    },
  });
}

/** El cliente confirma el QR y recibe los loopoints en su cuenta. */
export function useClaimPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) =>
      rpc<ClaimResult>('purchase_qr_claim', { p_token: token }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.rewards });
      void queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.businesses });
      void queryClient.invalidateQueries({ queryKey: queryKeys.myRedemptions });
      void queryClient.invalidateQueries({ queryKey: ['my-loyalty-redemptions'] });
    },
  });
}

/** Historial de ventas del negocio (con filtro por estado). */
export function useBusinessPurchases(
  businessId: string,
  page: number,
  pageSize: number,
  status: string,
) {
  return useQuery({
    queryKey: queryKeys.businessPurchases(businessId, page, status),
    queryFn: () =>
      rpc<BusinessPurchase[]>('business_purchases_list', {
        p_business_id: businessId,
        p_limit: pageSize,
        p_offset: page * pageSize,
        p_status: (status || null) as PurchaseStatus | null,
      }),
    enabled: Boolean(businessId),
  });
}

export function useCancelBusinessPurchase(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { purchaseId: string; reason: string }) =>
      rpc<{ purchase_id: string; status: string }>('purchase_qr_cancel', {
        p_business_id: businessId,
        p_purchase_id: params.purchaseId,
        p_reason: params.reason,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['business-purchases', businessId],
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.businessAuditLogPrefix(businessId),
      });
    },
  });
}
